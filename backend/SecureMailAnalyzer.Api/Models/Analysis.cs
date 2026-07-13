namespace SecureMailAnalyzer.Api.Models;

// Bir analiz kaydını temsil eden entity (veritabanındaki "analyses" tablosu)
public class Analysis
{
    public Guid Id { get; set; }

    // Girdi türü: "email" veya "link"
    public string InputType { get; set; } = string.Empty;

    // Kullanıcının girdiği e-posta içeriği veya URL
    public string InputContent { get; set; } = string.Empty;

    // Risk seviyesi: "low" | "medium" | "high"
    public string RiskLevel { get; set; } = string.Empty;

    // Kural tabanlı sinyallerden hesaplanan toplam puan
    public int RiskScore { get; set; }

    // Tespit edilen sinyaller; Postgres'te JSONB kolonu olarak saklanır
    public string DetectedSignals { get; set; } = "{}";

    // Kaydın oluşturulma zamanı (UTC)
    public DateTime CreatedAt { get; set; }
}
