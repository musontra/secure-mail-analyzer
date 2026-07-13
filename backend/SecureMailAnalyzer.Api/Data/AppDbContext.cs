using Microsoft.EntityFrameworkCore;
using SecureMailAnalyzer.Api.Models;

namespace SecureMailAnalyzer.Api.Data;

// EF Core'un veritabanıyla konuşmasını sağlayan köprü sınıfı
public class AppDbContext : DbContext
{
    // Bağlantı ayarları DI üzerinden dışarıdan verilir (Program.cs'te kayıtlı)
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    // "analyses" tablosuna karşılık gelen sorgulanabilir küme
    public DbSet<Analysis> Analyses => Set<Analysis>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        var analysis = modelBuilder.Entity<Analysis>();

        // Postgres geleneğine uygun snake_case tablo ve kolon adları
        analysis.ToTable("analyses");
        analysis.HasKey(a => a.Id);
        analysis.Property(a => a.Id).HasColumnName("id");
        analysis.Property(a => a.InputType).HasColumnName("input_type").IsRequired();
        analysis.Property(a => a.InputContent).HasColumnName("input_content").HasColumnType("text").IsRequired();
        analysis.Property(a => a.RiskLevel).HasColumnName("risk_level").IsRequired();
        analysis.Property(a => a.RiskScore).HasColumnName("risk_score");
        // JSONB: Postgres'in sorgulanabilir/indekslenebilir binary JSON tipi
        // (admin istatistikleri bu kolon üzerinden GROUP BY ile çıkacak)
        analysis.Property(a => a.DetectedSignals).HasColumnName("detected_signals").HasColumnType("jsonb");
        analysis.Property(a => a.CreatedAt).HasColumnName("created_at");
    }
}
