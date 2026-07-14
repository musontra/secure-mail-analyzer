namespace SecureMailAnalyzer.Api.Models;

// Admin panelinin tek istekte aldığı istatistik paketi
public record AdminStatsResponse(
    int TotalAnalyses,
    int TodayAnalyses,
    RiskDistributionDto RiskDistribution,
    IReadOnlyList<TopSignalDto> TopSignals,
    IReadOnlyList<RecentAnalysisDto> RecentAnalyses);

// Risk seviyesi dağılımı: adetler + toplam içindeki yüzdeler
public record RiskDistributionDto(
    int Low, int Medium, int High,
    int LowPercent, int MediumPercent, int HighPercent);

// En sık görülen sinyal: yüzde = bu sinyali içeren analiz oranı
public record TopSignalDto(string Code, string Title, int Count, int Percent);

// Son analizler tablosu satırı (önizleme 60 karaktere kırpılır)
public record RecentAnalysisDto(
    Guid Id, string InputType, string Preview,
    string RiskLevel, int RiskScore, DateTime CreatedAt);

// Raw SQL sonucunu karşılayan satır tipi:
// SqlQuery eşlemesi SELECT'teki kolon takma adlarıyla yapılır
public class SignalCountRow
{
    public string Code { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public long Count { get; set; }
}
