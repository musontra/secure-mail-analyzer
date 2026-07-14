using Microsoft.EntityFrameworkCore;
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

// CORS: tarayıcının Vite dev server'ından (5173) API'ye (5105) istek atmasına izin ver
const string devCorsPolicy = "DevFrontend";
builder.Services.AddCors(options =>
    options.AddPolicy(devCorsPolicy, policy =>
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod()));

// Kayıtlı servislerle uygulamayı inşa et
var app = builder.Build();

// Swagger ve CORS izni sadece geliştirme ortamında açık olsun
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
    app.UseCors(devCorsPolicy);
}

// Sağlık kontrolü: API ayakta mı diye bakmak için kullanılır
app.MapGet("/health", () => Results.Ok(new
{
    status = "ok",
    timestamp = DateTime.UtcNow
}))
.WithName("HealthCheck")
.WithOpenApi();

// Yeni analiz kaydı oluşturur: önce kural motoru, sonra LLM katmanı
app.MapPost("/api/analyses", async (CreateAnalysisRequest request, IAnalysisEngine engine,
    ILlmAnalysisService llmService, AppDbContext db) =>
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
        EducationalExplanation = llmResult?.EducationalExplanation
    };

    db.Analyses.Add(analysis);
    await db.SaveChangesAsync();

    // 201 Created + oluşturulan kaydın adresi ve kendisi (sinyaller gerçek dizi olarak)
    return Results.Created($"/api/analyses/{analysis.Id}", AnalysisResponse.FromEntity(analysis));
})
.WithName("CreateAnalysis")
.WithOpenApi();

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
.WithOpenApi();

// Tek bir analiz kaydını getirir (sonuç sayfası ve geçmişten detay açma kullanır)
app.MapGet("/api/analyses/{id:guid}", async (Guid id, AppDbContext db) =>
{
    var analysis = await db.Analyses.FindAsync(id);
    return analysis is null
        ? Results.NotFound(new { error = "Analiz kaydı bulunamadı." })
        : Results.Ok(AnalysisResponse.FromEntity(analysis));
})
.WithName("GetAnalysisById")
.WithOpenApi();

// Tüm analiz kayıtlarını yeniden eskiye doğru listeler
app.MapGet("/api/analyses", async (AppDbContext db) =>
{
    var analyses = await db.Analyses
        .OrderByDescending(a => a.CreatedAt)
        .ToListAsync();

    return analyses.Select(AnalysisResponse.FromEntity);
})
.WithName("ListAnalyses")
.WithOpenApi();

// Uygulamayı başlat ve istekleri dinlemeye başla
app.Run();
