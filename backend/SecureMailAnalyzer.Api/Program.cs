// Uygulamanın kurulum aşaması: servis kayıtları burada yapılır
var builder = WebApplication.CreateBuilder(args);

// Swagger/OpenAPI için gerekli servisler (endpoint keşfi + doküman üretimi)
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

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

// Uygulamayı başlat ve istekleri dinlemeye başla
app.Run();
