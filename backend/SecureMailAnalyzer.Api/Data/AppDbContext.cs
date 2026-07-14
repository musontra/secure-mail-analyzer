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

    // "users" tablosuna karşılık gelen küme
    public DbSet<User> Users => Set<User>();

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
        // LLM katmanı kolonları: LLM devre dışıyken null kalır
        analysis.Property(a => a.LlmAssessment).HasColumnName("llm_assessment");
        analysis.Property(a => a.EducationalExplanation).HasColumnName("educational_explanation");
        // Sahiplik: auth öncesi eski kayıtlar null kalır
        analysis.Property(a => a.UserId).HasColumnName("user_id");

        var user = modelBuilder.Entity<User>();
        user.ToTable("users");
        user.HasKey(u => u.Id);
        user.Property(u => u.Id).HasColumnName("id");
        user.Property(u => u.Email).HasColumnName("email").IsRequired();
        user.Property(u => u.PasswordHash).HasColumnName("password_hash").IsRequired();
        user.Property(u => u.Role).HasColumnName("role").IsRequired();
        user.Property(u => u.CreatedAt).HasColumnName("created_at");
        // Aynı e-postayla ikinci kayıt DB seviyesinde de engellenir
        user.HasIndex(u => u.Email).IsUnique();
    }
}
