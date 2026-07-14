using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using SecureMailAnalyzer.Api.Models;

namespace SecureMailAnalyzer.Api.Services;

// JWT üretimi. İmzalama anahtarı .env'den gelir (JWT_SECRET);
// appsettings'te yalnızca gizli OLMAYAN issuer/audience durur.
public class JwtTokenService
{
    private const int TokenLifetimeHours = 8;

    private readonly string _secret;
    private readonly string _issuer;
    private readonly string _audience;

    public JwtTokenService(IConfiguration configuration)
    {
        // Sır açılışta doğrulanır: eksikse uygulama hiç ayağa kalkmaz (fail fast)
        _secret = configuration["JWT_SECRET"]
            ?? throw new InvalidOperationException("JWT_SECRET tanımlı değil (.env dosyasına ekleyin).");
        _issuer = configuration["Jwt:Issuer"] ?? "SecureMailAnalyzer";
        _audience = configuration["Jwt:Audience"] ?? "SecureMailAnalyzerClient";
    }

    public string CreateToken(User user)
    {
        // Token'ın taşıdığı kimlik bilgileri (payload'a yazılır, İMZALIDIR ama ŞİFRELİ DEĞİLDİR)
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()), // userId
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role),
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _issuer,
            audience: _audience,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(TokenLifetimeHours),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
