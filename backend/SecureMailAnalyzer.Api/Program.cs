using Microsoft.EntityFrameworkCore;
using SecureMailAnalyzer.Api.Data;
using SecureMailAnalyzer.Api.Models;
using SecureMailAnalyzer.Api.Services;

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

// Kayıtlı servislerle uygulamayı inşa et
var app = builder.Build();

// Swagger arayüzü sadece geliştirme ortamında açık olsun
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Sağlık kontrolü: API ayakta mı diye bakmak için kullanılır
app.MapGet("/health", () => Results.Ok(new
{
    status = "ok",
    timestamp = DateTime.UtcNow
}))
.WithName("HealthCheck")
.WithOpenApi();

// Yeni analiz kaydı oluşturur: kural tabanlı motor gerçek skoru hesaplar
app.MapPost("/api/analyses", async (CreateAnalysisRequest request, IAnalysisEngine engine, AppDbContext db) =>
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

    // Analiz motorunu çalıştır (salt statik analiz, dışarıya istek atılmaz)
    var content = request.InputContent.Trim();
    var result = engine.Analyze(request.InputType, content);

    var analysis = new Analysis
    {
        Id = Guid.NewGuid(),
        InputType = request.InputType,
        InputContent = content,
        RiskLevel = result.RiskLevel,
        RiskScore = result.RiskScore,
        DetectedSignals = AnalysisResponse.SerializeSignals(result.Signals),
        CreatedAt = DateTime.UtcNow
    };

    db.Analyses.Add(analysis);
    await db.SaveChangesAsync();

    // 201 Created + oluşturulan kaydın adresi ve kendisi (sinyaller gerçek dizi olarak)
    return Results.Created($"/api/analyses/{analysis.Id}", AnalysisResponse.FromEntity(analysis));
})
.WithName("CreateAnalysis")
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
