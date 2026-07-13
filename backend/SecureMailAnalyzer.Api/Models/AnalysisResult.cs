namespace SecureMailAnalyzer.Api.Models;

// Analiz motorunun döndürdüğü sonuç: sinyaller + toplam skor + seviye
public record AnalysisResult(
    IReadOnlyList<DetectedSignal> Signals,
    int RiskScore,   // 0-100 arasına kırpılmış toplam puan
    string RiskLevel // "low" | "medium" | "high"
);
