namespace SecureMailAnalyzer.Api.Models;

// Kullanıcı hesabı (veritabanındaki "users" tablosu)
public class User
{
    public Guid Id { get; set; }

    // Küçük harfe normalize edilmiş, benzersiz e-posta
    public string Email { get; set; } = string.Empty;

    // BCrypt hash'i; düz metin şifre ASLA saklanmaz/loglanmaz
    public string PasswordHash { get; set; } = string.Empty;

    // "user" | "admin"
    public string Role { get; set; } = "user";

    public DateTime CreatedAt { get; set; }
}
