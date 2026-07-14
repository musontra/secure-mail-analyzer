using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SecureMailAnalyzer.Api.Data;
using SecureMailAnalyzer.Api.Models;
using SecureMailAnalyzer.Api.Services;

// .env dosyasını yükle (repo kökünde aranır; GEMINI_API_KEY gibi sırlar burada durur)
DotNetEnv.Env.TraversePath().Load();

// Uygulamanın kurulum aşaması: servis kayıtları burada yapılır
var builder = WebApplication.CreateBuilder(args);

// Swagger/OpenAPI için gerekli servisler (endpoint keşfi + doküman üretimi)
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// AppDbContext'i DI'a kaydet; bağlantı bilgisi appsettings'ten okunur
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Analiz motoru: durum tutmaz (stateless), bu yüzden tek örnek (singleton) yeterli
builder.Services.AddSingleton<IAnalysisEngine, RuleBasedAnalysisEngine>();

// LLM katmanı (Gemini): 8sn zaman aşımı; hata durumunda kural motoru tek başına çalışır
builder.Services.AddHttpClient<ILlmAnalysisService, GeminiAnalysisService>(client =>
    client.Timeout = TimeSpan.FromSeconds(8));

// JWT doğrulama: imza anahtarı .env'den, issuer/audience appsettings'ten.
// Anahtar eksikse uygulama açılmaz (fail fast) — sırlar açılışta doğrulanır.
var jwtSecret = builder.Configuration["JWT_SECRET"]
    ?? throw new InvalidOperationException("JWT_SECRET tanımlı değil (.env dosyasına ekleyin).");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            // Gelen her token'da şunlar denetlenir: imza, sürenin geçmemiş
            // olması ve token'ın bu uygulama için üretilmiş olması
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ValidateLifetime = true,
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidateAudience = true,
            ValidAudience = builder.Configuration["Jwt:Audience"],
        };
    });
builder.Services.AddAuthorization();
builder.Services.AddSingleton<JwtTokenService>();

// CORS: tarayıcının Vite dev server'ından (5173) API'ye (5105) istek atmasına izin ver
const string devCorsPolicy = "DevFrontend";
builder.Services.AddCors(options =>
    options.AddPolicy(devCorsPolicy, policy =>
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod()));

// Kayıtlı servislerle uygulamayı inşa et
var app = builder.Build();

// Açılışta demo hesapları oluştur (yoksa)
using (var scope = app.Services.CreateScope())
{
    var seedDb = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await DbSeeder.SeedAsync(seedDb);
}

// Swagger ve CORS izni sadece geliştirme ortamında açık olsun
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
    app.UseCors(devCorsPolicy);
}

// SIRA ÖNEMLİ: önce kimlik doğrulama (token'dan "kimsin?" çıkarılır),
// sonra yetkilendirme ("bunu yapabilir misin?" kararı kimliğe bakar)
app.UseAuthentication();
app.UseAuthorization();

// --- Auth endpoint'leri (anonim erişilebilir) ---

// Kayıt: e-posta + şifre alır, "user" rolüyle hesap açar
app.MapPost("/api/auth/register", async (RegisterRequest request, AppDbContext db) =>
{
    var email = request.Email?.Trim().ToLowerInvariant() ?? string.Empty;

    if (!System.Text.RegularExpressions.Regex.IsMatch(email, @"^[^@\s]+@[^@\s]+\.[^@\s]+$"))
    {
        return Results.BadRequest(new { error = "Geçerli bir e-posta adresi girin." });
    }

    if (string.IsNullOrEmpty(request.Password) || request.Password.Length < 8)
    {
        return Results.BadRequest(new { error = "Şifre en az 8 karakter olmalıdır." });
    }

    if (await db.Users.AnyAsync(u => u.Email == email))
    {
        return Results.BadRequest(new { error = "Bu e-posta adresi zaten kayıtlı." });
    }

    db.Users.Add(new User
    {
        Id = Guid.NewGuid(),
        Email = email,
        PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password), // düz metin asla saklanmaz
        Role = "user",
        CreatedAt = DateTime.UtcNow
    });
    await db.SaveChangesAsync();

    return Results.Ok(new { message = "Kayıt başarılı. Giriş yapabilirsiniz." });
})
.WithName("Register")
.WithOpenApi();

// Giriş: doğruysa 8 saatlik JWT döner
app.MapPost("/api/auth/login", async (LoginRequest request, AppDbContext db, JwtTokenService tokens) =>
{
    var email = request.Email?.Trim().ToLowerInvariant() ?? string.Empty;
    var user = await db.Users.FirstOrDefaultAsync(u => u.Email == email);

    // Genel mesaj: e-posta mı şifre mi yanlış SÖYLENMEZ (user enumeration önlemi)
    if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password ?? string.Empty, user.PasswordHash))
    {
        return Results.Json(new { error = "E-posta veya şifre hatalı." }, statusCode: 401);
    }

    return Results.Ok(new AuthResponse(tokens.CreateToken(user), user.Email, user.Role));
})
.WithName("Login")
.WithOpenApi();

// Sağlık kontrolü: API ayakta mı diye bakmak için kullanılır
app.MapGet("/health", () => Results.Ok(new
{
    status = "ok",
    timestamp = DateTime.UtcNow
}))
.WithName("HealthCheck")
.WithOpenApi();

// Yeni analiz kaydı oluşturur: önce kural motoru, sonra LLM katmanı (giriş zorunlu)
app.MapPost("/api/analyses", async (CreateAnalysisRequest request, ClaimsPrincipal principal,
    IAnalysisEngine engine, ILlmAnalysisService llmService, AppDbContext db) =>
{
    // Sınır noktasında girdi doğrulama: dış veriye asla güvenme
    if (request.InputType is not ("email" or "link"))
    {
        return Results.BadRequest(new { error = "inputType 'email' veya 'link' olmalıdır." });
    }

    if (string.IsNullOrWhiteSpace(request.InputContent))
    {
        return Results.BadRequest(new { error = "inputContent boş olamaz." });
    }

    // 1) Kural motoru (salt statik analiz, dışarıya istek atılmaz)
    var content = request.InputContent.Trim();
    var result = engine.Analyze(request.InputType, content);

    // 2) LLM katmanı: hata/timeout'ta null döner, analiz kesilmez
    var llmResult = await llmService.AnalyzeAsync(request.InputType, content, result);

    // 3) Skor birleştirme: kural skoru tabandır. LLM seviyesi kuralınkinden
    //    YÜKSEKSE seviye bir kademe yükselir; LLM düşük derse sonuç DÜŞMEZ
    //    (LLM, deterministik bulguları iptal edemez).
    var finalLevel = result.RiskLevel;
    var signals = result.Signals.ToList();
    if (llmResult is not null
        && AnalysisRules.GetRiskRank(llmResult.LlmRiskAssessment) > AnalysisRules.GetRiskRank(result.RiskLevel))
    {
        finalLevel = AnalysisRules.ElevateOneStep(result.RiskLevel);
        signals.Add(new DetectedSignal(
            "llm_risk_elevated",
            "Yapay zeka riski yükseltti",
            "Yapay zeka değerlendirmesi, kural motorunun bulduğundan daha yüksek bir risk " +
            "öngördü. İhtiyatlılık ilkesi gereği risk seviyesi bir kademe yükseltildi.",
            0,
            null));
    }

    var analysis = new Analysis
    {
        Id = Guid.NewGuid(),
        InputType = request.InputType,
        InputContent = content,
        RiskLevel = finalLevel,
        RiskScore = result.RiskScore,
        DetectedSignals = AnalysisResponse.SerializeSignals(signals),
        CreatedAt = DateTime.UtcNow,
        LlmAssessment = llmResult?.LlmRiskAssessment,
        EducationalExplanation = llmResult?.EducationalExplanation,
        // Kayıt, token'daki kullanıcıya yazılır
        UserId = Guid.Parse(principal.FindFirstValue(ClaimTypes.NameIdentifier)!)
    };

    db.Analyses.Add(analysis);
    await db.SaveChangesAsync();

    // 201 Created + oluşturulan kaydın adresi ve kendisi (sinyaller gerçek dizi olarak)
    return Results.Created($"/api/analyses/{analysis.Id}", AnalysisResponse.FromEntity(analysis));
})
.WithName("CreateAnalysis")
.WithOpenApi()
.RequireAuthorization();

// Admin istatistikleri: tüm sayımlar DB tarafında yapılır (satırlar C#'a taşınmaz)
app.MapGet("/api/admin/stats", async (AppDbContext db) =>
{
    var total = await db.Analyses.CountAsync();

    // Bugün = UTC günün başlangıcı (CreatedAt UTC saklanıyor)
    var todayStart = DateTime.UtcNow.Date;
    var today = await db.Analyses.CountAsync(a => a.CreatedAt >= todayStart);

    // GroupBy -> SQL'de "GROUP BY risk_level" olarak çalışır
    var levelCounts = await db.Analyses
        .GroupBy(a => a.RiskLevel)
        .Select(g => new { Level = g.Key, Count = g.Count() })
        .ToDictionaryAsync(x => x.Level, x => x.Count);

    var low = levelCounts.GetValueOrDefault("low");
    var medium = levelCounts.GetValueOrDefault("medium");
    var high = levelCounts.GetValueOrDefault("high");

    // Boş DB'de sıfıra bölme olmaması için total kontrolü
    int PercentOf(int count) => total == 0 ? 0 : (int)Math.Round(count * 100.0 / total);

    // JSONB sinyal sayımı: jsonb_array_elements her kaydın detected_signals
    // dizisini satırlara açar, code bazında gruplanır. Title veriden alınır
    // (MIN = herhangi biri; aynı code'un title'ı hep aynı). Eski "{}" (obje)
    // kayıtları jsonb_typeof filtresiyle atlanır, yoksa sorgu hata verir.
    // EF LINQ, JSONB dizisini satırlara açmayı ifade edemediği için raw SQL tercih edildi.
    var signalRows = await db.Database.SqlQuery<SignalCountRow>($"""
        SELECT signal->>'code' AS "Code",
               MIN(signal->>'title') AS "Title",
               COUNT(*) AS "Count"
        FROM analyses,
             jsonb_array_elements(detected_signals) AS signal
        WHERE jsonb_typeof(detected_signals) = 'array'
        GROUP BY signal->>'code'
        ORDER BY COUNT(*) DESC
        LIMIT 6
        """).ToListAsync();

    var topSignals = signalRows
        .Select(r => new TopSignalDto(r.Code, r.Title, (int)r.Count, PercentOf((int)r.Count)))
        .ToList();

    // Son 5 analiz; önizleme kırpması C# tarafında (SQL'i basit tutar)
    var recent = await db.Analyses
        .OrderByDescending(a => a.CreatedAt)
        .Take(5)
        .ToListAsync();

    var recentDtos = recent
        .Select(a => new RecentAnalysisDto(
            a.Id,
            a.InputType,
            a.InputContent.Length <= 60 ? a.InputContent : a.InputContent[..60] + "…",
            a.RiskLevel,
            a.RiskScore,
            a.CreatedAt))
        .ToList();

    return Results.Ok(new AdminStatsResponse(
        total,
        today,
        new RiskDistributionDto(low, medium, high, PercentOf(low), PercentOf(medium), PercentOf(high)),
        topSignals,
        recentDtos));
})
.WithName("GetAdminStats")
.WithOpenApi()
.RequireAuthorization(policy => policy.RequireRole("admin")); // sadece admin; aksi 403

// Tek bir analiz kaydını getirir: sadece sahibi veya admin görebilir
app.MapGet("/api/analyses/{id:guid}", async (Guid id, ClaimsPrincipal principal, AppDbContext db) =>
{
    var analysis = await db.Analyses.FindAsync(id);
    if (analysis is null)
    {
        return Results.NotFound(new { error = "Analiz kaydı bulunamadı." });
    }

    var currentUserId = Guid.Parse(principal.FindFirstValue(ClaimTypes.NameIdentifier)!);
    if (analysis.UserId != currentUserId && !principal.IsInRole("admin"))
    {
        return Results.Forbid(); // 403: kayıt başkasına ait
    }

    return Results.Ok(AnalysisResponse.FromEntity(analysis));
})
.WithName("GetAnalysisById")
.WithOpenApi()
.RequireAuthorization();

// Analiz listesi: kullanıcı SADECE kendi kayıtlarını, admin hepsini görür
app.MapGet("/api/analyses", async (ClaimsPrincipal principal, AppDbContext db) =>
{
    var query = db.Analyses.AsQueryable();

    if (!principal.IsInRole("admin"))
    {
        var currentUserId = Guid.Parse(principal.FindFirstValue(ClaimTypes.NameIdentifier)!);
        query = query.Where(a => a.UserId == currentUserId);
    }

    var analyses = await query
        .OrderByDescending(a => a.CreatedAt)
        .ToListAsync();

    return analyses.Select(AnalysisResponse.FromEntity);
})
.WithName("ListAnalyses")
.WithOpenApi()
.RequireAuthorization();

// Uygulamayı başlat ve istekleri dinlemeye başla
app.Run();
