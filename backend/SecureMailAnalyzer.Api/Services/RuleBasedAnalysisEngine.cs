using System.Globalization;
using System.Text.RegularExpressions;
using SecureMailAnalyzer.Api.Models;

namespace SecureMailAnalyzer.Api.Services;

// Kural tabanlı analiz motoru. LLM olmadan tek başına çalışır.
// ÖNEMLİ: URL'lere ASLA HTTP isteği atılmaz (SSRF riski) — sadece statik metin analizi.
public class RuleBasedAnalysisEngine : IAnalysisEngine
{
    // Türkçe küçük harfe çevirme için (İ/ı sorunu yüzünden invariant kullanılmaz)
    private static readonly CultureInfo TurkishCulture = new("tr-TR");

    private static readonly Regex UrlRegex =
        new(@"https?://[^\s""'<>()]+", RegexOptions.IgnoreCase | RegexOptions.Compiled);

    private static readonly Regex AnchorRegex =
        new(@"<a\s[^>]*href\s*=\s*[""']?([^""'\s>]+)[""']?[^>]*>(.*?)</a>",
            RegexOptions.IgnoreCase | RegexOptions.Singleline | RegexOptions.Compiled);

    private static readonly Regex DomainLikeRegex =
        new(@"(?:[a-z0-9-]+\.)+[a-z]{2,}", RegexOptions.IgnoreCase | RegexOptions.Compiled);

    private static readonly Regex DangerousFileRegex =
        new(@"[\w-]*\.(exe|scr|bat|cmd|js|vbs|jar|pif|msi)\b",
            RegexOptions.IgnoreCase | RegexOptions.Compiled);

    public AnalysisResult Analyze(string inputType, string inputContent)
    {
        var signals = inputType == "email"
            ? AnalyzeEmail(inputContent)
            : AnalyzeLink(inputContent);

        // Aynı kural birden fazla URL'de tetiklendiyse tek sinyal sayılır
        // (puan şişmesini önler, kullanıcıya tekrarsız liste gösterilir)
        var uniqueSignals = signals
            .GroupBy(s => s.Code)
            .Select(g => g.First())
            .ToList();

        var totalScore = Math.Clamp(uniqueSignals.Sum(s => s.Score), 0, AnalysisRules.MaxScore);
        return new AnalysisResult(uniqueSignals, totalScore, AnalysisRules.GetRiskLevel(totalScore));
    }

    // --- E-posta analizi: metin kuralları + içerikteki linklerin taranması ---
    private static List<DetectedSignal> AnalyzeEmail(string content)
    {
        var signals = new List<DetectedSignal>();
        var lowered = content.ToLower(TurkishCulture);

        AddIfTriggered(signals, CheckUrgencyLanguage(lowered));
        AddIfTriggered(signals, CheckSensitiveInfoRequest(lowered));
        AddIfTriggered(signals, CheckSuspiciousAttachment(content));
        AddIfTriggered(signals, CheckGenericGreeting(lowered));
        AddIfTriggered(signals, CheckLinkTextMismatch(content));

        // E-posta içindeki her URL, link kurallarından da geçirilir
        foreach (Match url in UrlRegex.Matches(content))
        {
            signals.AddRange(AnalyzeLink(url.Value));
        }

        return signals;
    }

    // --- Link analizi: URL üzerinde salt yapısal kontroller ---
    private static List<DetectedSignal> AnalyzeLink(string url)
    {
        var signals = new List<DetectedSignal>();
        var trimmed = url.Trim().TrimEnd('.', ',', ';', ')');

        // Şema yoksa (örn "site.xyz/giris") parse için ekle ama no_https sayma:
        // kullanıcı şemayı yazmadıysa http kullanıldığını iddia edemeyiz
        var hasExplicitScheme = trimmed.Contains("://");
        var parseTarget = hasExplicitScheme ? trimmed : $"http://{trimmed}";

        if (!Uri.TryCreate(parseTarget, UriKind.Absolute, out var uri) || string.IsNullOrEmpty(uri.Host))
        {
            return signals; // Geçersiz URL: kural uygulanamaz
        }

        // IdnHost: unicode alan adlarını punycode'a (xn--) çevirir, homoglif yakalamayı sağlar
        var host = uri.IdnHost.ToLowerInvariant();

        if (hasExplicitScheme)
        {
            AddIfTriggered(signals, CheckNoHttps(uri, trimmed));
        }
        AddIfTriggered(signals, CheckUrlShortener(host));
        AddIfTriggered(signals, CheckSuspiciousTld(host));
        AddIfTriggered(signals, CheckExcessiveSubdomains(host));
        AddIfTriggered(signals, CheckDomainComplexity(host));
        AddIfTriggered(signals, CheckPunycodeHomoglyph(host));
        AddIfTriggered(signals, CheckBrandLookalike(host));

        return signals;
    }

    // ==================== METİN KURALLARI ====================

    private static DetectedSignal? CheckUrgencyLanguage(string lowered)
    {
        var matched = FindKeywordMatches(lowered, AnalysisRules.UrgencyKeywords);
        return matched is null ? null : new DetectedSignal(
            "urgency_language",
            "Aciliyet/baskı dili",
            "'Hemen', 'son 24 saat' gibi ifadelerle panik yaratıp düşünmeden harekete " +
            "geçirmek, oltalama e-postalarının klasik taktiğidir. Meşru kurumlar " +
            "genellikle bu kadar baskıcı bir dil kullanmaz.",
            AnalysisRules.Scores.UrgencyLanguage,
            matched);
    }

    private static DetectedSignal? CheckSensitiveInfoRequest(string lowered)
    {
        var matched = FindKeywordMatches(lowered, AnalysisRules.SensitiveInfoKeywords);
        return matched is null ? null : new DetectedSignal(
            "sensitive_info_request",
            "Hassas bilgi talebi",
            "E-posta şifre, kart bilgisi veya kimlik numarası gibi hassas veriler " +
            "istiyor ya da bunlardan söz ediyor. Meşru kurumlar bu bilgileri asla " +
            "e-posta yoluyla talep etmez.",
            AnalysisRules.Scores.SensitiveInfoRequest,
            matched);
    }

    private static DetectedSignal? CheckSuspiciousAttachment(string content)
    {
        var match = DangerousFileRegex.Match(content);
        return !match.Success ? null : new DetectedSignal(
            "suspicious_attachment",
            "Şüpheli ek/dosya uzantısı",
            "Metinde .exe gibi çalıştırılabilir bir dosya uzantısı geçiyor. Bu tür " +
            "dosyalar zararlı yazılım bulaştırmak için kullanılır; tanımadığınız " +
            "kaynaktan gelen ekleri asla çalıştırmayın.",
            AnalysisRules.Scores.SuspiciousAttachment,
            match.Value);
    }

    private static DetectedSignal? CheckGenericGreeting(string lowered)
    {
        var matched = FindKeywordMatches(lowered, AnalysisRules.GenericGreetings);
        return matched is null ? null : new DetectedSignal(
            "generic_greeting",
            "Kişiselleştirilmemiş hitap",
            "'Sayın müşterimiz' gibi genel hitaplar, gönderenin adınızı bilmediğini " +
            "gösterir. Gerçek hizmet sağlayıcınız size genellikle adınızla hitap eder; " +
            "toplu oltalama e-postaları ise herkese aynı metni gönderir.",
            AnalysisRules.Scores.GenericGreeting,
            matched);
    }

    // HTML içerikte görünen adres ile href hedefi farklı domain'e gidiyorsa tetiklenir
    private static DetectedSignal? CheckLinkTextMismatch(string content)
    {
        foreach (Match anchor in AnchorRegex.Matches(content))
        {
            var href = anchor.Groups[1].Value;
            var visibleText = Regex.Replace(anchor.Groups[2].Value, "<[^>]+>", " ");

            var textDomainMatch = DomainLikeRegex.Match(visibleText);
            if (!textDomainMatch.Success) continue; // görünen metinde domain yoksa kıyas yapılamaz

            var hrefTarget = href.Contains("://") ? href : $"http://{href}";
            if (!Uri.TryCreate(hrefTarget, UriKind.Absolute, out var hrefUri)) continue;

            var hrefDomain = GetRegistrableDomain(hrefUri.IdnHost.ToLowerInvariant());
            var textDomain = GetRegistrableDomain(textDomainMatch.Value.ToLowerInvariant().TrimEnd('.'));

            if (hrefDomain != textDomain)
            {
                return new DetectedSignal(
                    "link_text_mismatch",
                    "Görünen adres ile gerçek hedef farklı",
                    "Linkte görünen adres ile tıklandığında gidilecek gerçek adres farklı " +
                    "alan adlarına ait. Bu, oltalamanın en güçlü işaretlerinden biridir: " +
                    "göz güvendiğiniz adresi görür, tıklama sizi saldırganın sitesine götürür.",
                    AnalysisRules.Scores.LinkTextMismatch,
                    $"görünen: {textDomain} → gerçek: {hrefDomain}");
            }
        }
        return null;
    }

    // ==================== LİNK KURALLARI ====================

    private static DetectedSignal? CheckNoHttps(Uri uri, string original) =>
        uri.Scheme != Uri.UriSchemeHttp ? null : new DetectedSignal(
            "no_https",
            "Şifrelenmemiş bağlantı (HTTP)",
            "Bağlantı https yerine http kullanıyor: girdiğiniz bilgiler ağ üzerinde " +
            "şifrelenmeden taşınır. Meşru kurumların giriş sayfaları her zaman HTTPS kullanır.",
            AnalysisRules.Scores.NoHttps,
            original.Length > 60 ? original[..60] + "…" : original);

    private static DetectedSignal? CheckUrlShortener(string host) =>
        !AnalysisRules.UrlShortenerHosts.Contains(host) ? null : new DetectedSignal(
            "url_shortener",
            "Kısaltılmış URL",
            "bit.ly benzeri kısaltma servisleri gerçek hedef adresi gizler. Meşru " +
            "kullanımları da vardır ama oltalama saldırılarında hedefi maskelemek " +
            "için sık tercih edilir; tıklamadan önce gerçek hedefi bilemezsiniz.",
            AnalysisRules.Scores.UrlShortener,
            host);

    private static DetectedSignal? CheckSuspiciousTld(string host)
    {
        var tld = AnalysisRules.SuspiciousTlds.FirstOrDefault(host.EndsWith);
        return tld is null ? null : new DetectedSignal(
            "suspicious_tld",
            "Şüpheli alan adı uzantısı",
            $"'{tld}' gibi ucuz/kolay alınabilen uzantılar, hızla site açıp kapatan " +
            "saldırganlar tarafından sık kullanılır. Türkiye'deki kurumsal siteler " +
            "genellikle .com.tr veya .com kullanır.",
            AnalysisRules.Scores.SuspiciousTld,
            host);
    }

    private static DetectedSignal? CheckExcessiveSubdomains(string host)
    {
        var registrableLabelCount = GetRegistrableDomain(host).Count(c => c == '.') + 1;
        var subdomainCount = host.Split('.').Length - registrableLabelCount;
        return subdomainCount <= AnalysisRules.MaxSubdomainCount ? null : new DetectedSignal(
            "excessive_subdomains",
            "Aşırı alt alan adı",
            "Adreste çok sayıda alt alan adı var. Saldırganlar 'garanti.com.tr." +
            "dogrulama.xyz' gibi adreslerle gerçek site izlenimi vermeye çalışır; " +
            "oysa asıl alan adı her zaman adresin EN SAĞINDAKİ kısımdır.",
            AnalysisRules.Scores.ExcessiveSubdomains,
            host);
    }

    private static DetectedSignal? CheckDomainComplexity(string host)
    {
        var compact = host.Replace(".", "");
        if (compact.Length == 0) return null;

        var digitHyphenCount = compact.Count(c => char.IsDigit(c) || c == '-');
        var ratio = (double)digitHyphenCount / compact.Length;

        var isComplex = host.Length > AnalysisRules.MaxHostLength
                        || ratio > AnalysisRules.MaxDigitHyphenRatio;
        return !isComplex ? null : new DetectedSignal(
            "domain_complexity",
            "Karmaşık alan adı",
            "Alan adı olağan dışı uzunlukta ya da çok sayıda rakam/tire içeriyor. " +
            "Otomatik üretilmiş oltalama alan adları genellikle böyle görünür; " +
            "meşru kurumlar kısa ve akılda kalıcı adresler kullanır.",
            AnalysisRules.Scores.DomainComplexity,
            host);
    }

    private static DetectedSignal? CheckPunycodeHomoglyph(string host) =>
        !host.Split('.').Any(label => label.StartsWith("xn--")) ? null : new DetectedSignal(
            "punycode_homoglyph",
            "Punycode alan adı (homoglif riski)",
            "Alan adı 'xn--' ile başlayan kodlanmış karakterler içeriyor. Saldırganlar " +
            "görünüşte aynı olan harflerle (örn. 'garantı' ↔ 'garanti') gerçek siteleri " +
            "taklit etmek için bu tekniği kullanır.",
            AnalysisRules.Scores.PunycodeHomoglyph,
            host);

    private static DetectedSignal? CheckBrandLookalike(string host)
    {
        var registrable = GetRegistrableDomain(host);
        foreach (var (brand, officialDomains) in AnalysisRules.BrandOfficialDomains)
        {
            if (!host.Contains(brand)) continue;
            if (officialDomains.Contains(registrable)) continue; // resmi domain, sorun yok

            return new DetectedSignal(
                "brand_lookalike",
                "Marka taklidi alan adı",
                $"Adres '{brand}' marka adını içeriyor ama markanın resmi alan adı değil. " +
                "Saldırganlar 'garanti-destek.xyz' gibi adreslerle resmi site izlenimi " +
                "verir; markanın gerçek adresini her zaman kendiniz yazarak girin.",
                AnalysisRules.Scores.BrandLookalike,
                $"{brand} → {host}");
        }
        return null;
    }

    // ==================== YARDIMCILAR ====================

    private static void AddIfTriggered(List<DetectedSignal> signals, DetectedSignal? signal)
    {
        if (signal is not null) signals.Add(signal);
    }

    // İlk 3 eşleşen anahtar kelimeyi virgülle birleştirir; eşleşme yoksa null
    private static string? FindKeywordMatches(string loweredContent, string[] keywords)
    {
        var hits = keywords.Where(loweredContent.Contains).Take(3).ToList();
        return hits.Count == 0 ? null : string.Join(", ", hits);
    }

    // Kayıtlı alan adını bulur: "a.b.garanti.com.tr" -> "garanti.com.tr",
    // "sub.example.xyz" -> "example.xyz" (compound TLD listesine bakar)
    private static string GetRegistrableDomain(string host)
    {
        var labels = host.Split('.');
        if (labels.Length < 2) return host;

        var lastTwo = $"{labels[^2]}.{labels[^1]}";
        if (labels.Length >= 3 && AnalysisRules.CompoundTlds.Contains(lastTwo))
        {
            return $"{labels[^3]}.{lastTwo}";
        }
        return lastTwo;
    }
}
