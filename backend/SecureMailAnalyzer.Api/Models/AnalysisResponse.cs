using System.Text.Json;

namespace SecureMailAnalyzer.Api.Models;

// API yanıt modeli: entity'deki JSONB string'ini gerçek sinyal listesine çevirir
public record AnalysisResponse(
    Guid Id,
    string InputType,
    string InputContent,
    string RiskLevel,
    int RiskScore,
    IReadOnlyList<DetectedSignal> DetectedSignals,
    DateTime CreatedAt)
{
    // camelCase JSON (web varsayılanı); hem yazma hem okuma bu ayarla yapılır
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    // Sinyal listesini JSONB kolonuna yazılacak JSON string'ine çevirir
    public static string SerializeSignals(IReadOnlyList<DetectedSignal> signals) =>
        JsonSerializer.Serialize(signals, JsonOptions);

    // Veritabanı kaydını API yanıtına dönüştürür
    public static AnalysisResponse FromEntity(Analysis analysis) =>
        new(
            analysis.Id,
            analysis.InputType,
            analysis.InputContent,
            analysis.RiskLevel,
            analysis.RiskScore,
            JsonSerializer.Deserialize<List<DetectedSignal>>(analysis.DetectedSignals, JsonOptions)
                ?? new List<DetectedSignal>(),
            analysis.CreatedAt);
}
