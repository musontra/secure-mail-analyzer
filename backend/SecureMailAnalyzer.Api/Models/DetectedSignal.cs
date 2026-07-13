namespace SecureMailAnalyzer.Api.Models;

// Bir kural tetiklendiğinde üretilen sinyal.
// Description kullanıcıya gösterilecek eğitici metindir: kural NEDEN tetiklendi?
public record DetectedSignal(
    string Code,        // İngilizce sabit kod, örn "urgency_language"
    string Title,       // Türkçe kısa başlık
    string Description, // Türkçe eğitici açıklama
    int Score,          // Kuralın risk puanı (AnalysisRules.Scores'tan gelir)
    string? MatchedText // Tetikleyen metin parçası (varsa)
);
