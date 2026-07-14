namespace SecureMailAnalyzer.Api.Models;

// POST /api/auth/register isteği
public record RegisterRequest(string? Email, string? Password);

// POST /api/auth/login isteği
public record LoginRequest(string? Email, string? Password);

// Başarılı girişin yanıtı: token + arayüzün ihtiyacı olan kimlik bilgileri
public record AuthResponse(string Token, string Email, string Role);
