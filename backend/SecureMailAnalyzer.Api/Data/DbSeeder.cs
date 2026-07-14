using Microsoft.EntityFrameworkCore;
using SecureMailAnalyzer.Api.Models;

namespace SecureMailAnalyzer.Api.Data;

// Açılışta demo hesapları oluşturur (yoksa).
// NOT: Şifrelerin koda yazılması SADECE eğitim projesi olduğu için kabul
// edilebilir; gerçek ortamda seed şifreleri ortam değişkeninden gelir veya
// ilk girişte zorunlu değiştirme akışı kurulur.
public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext db)
    {
        await AddUserIfMissingAsync(db, "admin@securelytix.com", "Admin123!", "admin");
        await AddUserIfMissingAsync(db, "demo@securelytix.com", "Demo1234!", "user");
        await db.SaveChangesAsync();
    }

    private static async Task AddUserIfMissingAsync(
        AppDbContext db, string email, string password, string role)
    {
        if (await db.Users.AnyAsync(u => u.Email == email)) return;

        db.Users.Add(new User
        {
            Id = Guid.NewGuid(),
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
            Role = role,
            CreatedAt = DateTime.UtcNow,
        });
    }
}
