namespace SecureMailAnalyzer.Api.Services;

// TÜM puanlar, eşikler ve sözlükler tek yerde toplanır.
// Puan/eşik ayarı yapmak için SADECE bu dosyayı değiştir.
public static class AnalysisRules
{
    // --- Kural puanları (sinyal başına sabit puan) ---
    public static class Scores
    {
        public const int LinkTextMismatch = 30;    // en güçlü phishing sinyali
        public const int BrandLookalike = 25;
        public const int PunycodeHomoglyph = 25;
        public const int SensitiveInfoRequest = 20;
        public const int SuspiciousAttachment = 20;
        public const int UrgencyLanguage = 15;
        public const int UrlShortener = 15;
        public const int SuspiciousTld = 15;
        public const int ExcessiveSubdomains = 15;
        public const int NoHttps = 10;
        public const int DomainComplexity = 10;
        public const int GenericGreeting = 10;
    }

    // --- Risk eşikleri: 0-29 low, 30-59 medium, 60+ high ---
    public const int MaxScore = 100;
    public const int MediumThreshold = 30;
    public const int HighThreshold = 60;

    public static string GetRiskLevel(int score) =>
        score >= HighThreshold ? "high" :
        score >= MediumThreshold ? "medium" : "low";

    // --- Yapısal kural eşikleri ---
    public const int MaxSubdomainCount = 2;        // 3+ alt alan adı tetikler
    public const int MaxHostLength = 40;           // bundan uzun host şüpheli
    public const double MaxDigitHyphenRatio = 0.2; // host'ta %20+ rakam/tire şüpheli

    // --- Metin kuralı sözlükleri (küçük harf; genişletilebilir) ---
    public static readonly string[] UrgencyKeywords =
    {
        // Türkçe
        "hemen", "acil", "acele", "derhal", "son 24 saat", "son gün",
        "bugün sona", "askıya alın", "kapatılacak", "kısıtlan",
        "en kısa sürede", "süreniz doluyor", "yasal işlem",
        // İngilizce
        "urgent", "immediately", "right away", "account suspended",
        "verify now", "act now", "final notice", "last chance", "within 24 hours"
    };

    public static readonly string[] SensitiveInfoKeywords =
    {
        // Türkçe
        "şifre", "parola", "kart numara", "kredi kartı", "cvv", "cvc",
        "tc kimlik", "kimlik numara", "iban", "doğrulama kodu",
        "sms kodu", "pin kod", "güvenlik sorusu",
        // İngilizce
        "password", "credit card", "card number", "ssn", "social security",
        "verification code", "one-time password", "otp code"
    };

    public static readonly string[] GenericGreetings =
    {
        "sayın müşterimiz", "değerli müşterimiz", "değerli kullanıcı",
        "sayın kullanıcı", "sevgili kullanıcı", "sevgili müşteri",
        "dear customer", "dear user", "dear member", "valued customer"
    };

    // --- Link kuralı listeleri ---
    public static readonly HashSet<string> UrlShortenerHosts = new()
    {
        "bit.ly", "tinyurl.com", "goo.gl", "t.co", "is.gd", "ow.ly",
        "cutt.ly", "rebrand.ly", "tiny.cc", "buff.ly", "rb.gy", "shorturl.at"
    };

    public static readonly string[] SuspiciousTlds =
    {
        ".xyz", ".top", ".click", ".tk", ".ml", ".ga", ".cf", ".gq", ".buzz", ".icu"
    };

    // İki parçalı TLD'ler: "garanti.com.tr" gibi adreslerde kayıtlı alan adını
    // doğru bulmak için gerekir (com.tr'nin tamamı uzantıdır)
    public static readonly HashSet<string> CompoundTlds = new()
    {
        "com.tr", "net.tr", "org.tr", "gov.tr", "edu.tr", "k12.tr", "bel.tr",
        "co.uk", "org.uk", "ac.uk", "com.au", "com.br"
    };

    // Marka adı -> resmi alan adları. Marka geçen ama resmi olmayan domain tetiklenir.
    public static readonly Dictionary<string, string[]> BrandOfficialDomains = new()
    {
        ["garanti"] = new[] { "garanti.com.tr", "garantibbva.com.tr" },
        ["ziraat"] = new[] { "ziraatbank.com.tr" },
        ["akbank"] = new[] { "akbank.com", "akbank.com.tr" },
        ["isbank"] = new[] { "isbank.com.tr" },
        ["yapikredi"] = new[] { "yapikredi.com.tr" },
        ["paypal"] = new[] { "paypal.com" },
        ["amazon"] = new[] { "amazon.com", "amazon.com.tr" },
        ["netflix"] = new[] { "netflix.com" },
        ["google"] = new[] { "google.com", "google.com.tr" },
        ["microsoft"] = new[] { "microsoft.com" },
        ["apple"] = new[] { "apple.com" }
    };
}
