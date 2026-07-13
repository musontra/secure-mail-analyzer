using SecureMailAnalyzer.Api.Models;

namespace SecureMailAnalyzer.Api.Services;

// Analiz motorunun sözleşmesi: ileride LLM destekli motor da bu arayüzü uygulayacak,
// LLM çökerse kural tabanlı motor tek başına çalışmaya devam edecek
public interface IAnalysisEngine
{
    // inputType: "email" veya "link" (endpoint'te doğrulanmış gelir)
    AnalysisResult Analyze(string inputType, string inputContent);
}
