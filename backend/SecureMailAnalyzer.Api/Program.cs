using Microsoft.EntityFrameworkCore;
using SecureMailAnalyzer.Api.Data;
using SecureMailAnalyzer.Api.Models;

// Uygulamanın kurulum aşaması: servis kayıtları burada yapılır
var builder = WebApplication.CreateBuilder(args);

// Swagger/OpenAPI için gerekli servisler (endpoint keşfi + doküman üretimi)
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// AppDbContext'i DI'a kaydet; bağlantı bilgisi appsettings'ten okunur
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

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

// Yeni analiz kaydı oluşturur (gerçek analiz henüz yok: sabit low/0 kaydedilir)
app.MapPost("/api/analyses", async (CreateAnalysisRequest request, AppDbContext db) =>
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

    var analysis = new Analysis
    {
        Id = Guid.NewGuid(),
        InputType = request.InputType,
        InputContent = request.InputContent,
        RiskLevel = "low",   // Geçici sabit değer: analiz motoru sonraki adımda gelecek
        RiskScore = 0,
        DetectedSignals = "{}",
        CreatedAt = DateTime.UtcNow
    };

    db.Analyses.Add(analysis);
    await db.SaveChangesAsync();

    // 201 Created + oluşturulan kaydın adresi ve kendisi
    return Results.Created($"/api/analyses/{analysis.Id}", analysis);
})
.WithName("CreateAnalysis")
.WithOpenApi();

// Tüm analiz kayıtlarını yeniden eskiye doğru listeler
app.MapGet("/api/analyses", async (AppDbContext db) =>
    await db.Analyses
        .OrderByDescending(a => a.CreatedAt)
        .ToListAsync())
.WithName("ListAnalyses")
.WithOpenApi();

// Uygulamayı başlat ve istekleri dinlemeye başla
app.Run();
