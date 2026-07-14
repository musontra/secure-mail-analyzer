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
    DateTime CreatedAt,
    string? LlmAssessment,
    string? EducationalExplanation)
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
            ParseSignals(analysis.DetectedSignals),
            analysis.CreatedAt,
            analysis.LlmAssessment,
            analysis.EducationalExplanation);

    // Eski kayıtlarda kolon "{}" (boş obje) olabilir; dizi değilse boş liste döner
    private static List<DetectedSignal> ParseSignals(string json)
    {
        try
        {
            return JsonSerializer.Deserialize<List<DetectedSignal>>(json, JsonOptions)
                ?? new List<DetectedSignal>();
        }
        catch (JsonException)
        {
            return new List<DetectedSignal>();
        }
    }
}
