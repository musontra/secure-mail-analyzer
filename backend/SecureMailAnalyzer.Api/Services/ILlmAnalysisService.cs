using SecureMailAnalyzer.Api.Models;

namespace SecureMailAnalyzer.Api.Services;

// LLM'in ürettiği sonuç: risk görüşü + Türkçe eğitici açıklama
public record LlmAnalysisResult(string LlmRiskAssessment, string EducationalExplanation);

// LLM analiz katmanının sözleşmesi.
// Null dönüş = LLM kullanılamadı (hata/timeout/geçersiz yanıt);
// çağıran taraf bu durumda kural tabanlı sonucu tek başına kullanır.
public interface ILlmAnalysisService
{
    Task<LlmAnalysisResult?> AnalyzeAsync(
        string inputType,
        string inputContent,
        AnalysisResult ruleResult);
}
