# Örnek Mailler ve Linkler (Test Seti)

Kural tabanlı analiz motorunu test etmek için kullanılan yapay örnekler.
Hiçbiri gerçek kişi/kurum verisi içermez. Beklenen seviyeler
`Services/AnalysisRules.cs` içindeki puan ve eşiklere göre hesaplanmıştır
(0-29 low, 30-59 medium, 60+ high).

Son doğrulama: 2026-07-13 — 12/12 örnek beklenen seviyeyi verdi.

## Zararsız örnekler (beklenen: low)

### Z1 — İş maili
> Merhaba Ali Bey, yarınki toplantı 14:00 yerine 15:00 olarak güncellendi.
> Gündem dosyası ekte (toplanti-gundemi.pdf). İyi çalışmalar, Ayşe

Beklenen: **low** (0 puan, sinyal yok)

### Z2 — Arkadaş maili
> Selam Mert, cumartesi akşamı yemeğe çıkalım mı? Saat 20:00 sana uygun mu?
> Görüşürüz, Deniz

Beklenen: **low** (0 puan, sinyal yok)

### Z3 — Bülten (meşru link içerir)
> Merhaba Mert, Temmuz bültenimiz yayında. Bu ayki konumuz sürdürülebilir
> yazılım mimarileri: https://www.example.com/bulten/temmuz Keyifli okumalar dileriz.

Beklenen: **low** (0 puan; https + temiz domain sinyal üretmez)

## Şüpheli örnekler (beklenen: medium)

### S1 — Kargo bildirimi taklidi
> Sayın müşterimiz, kargonuz adres bilgisi eksik olduğu için dağıtıma
> çıkarılamıyor. Son 24 saat içinde bilgilerinizi güncellemezseniz gönderi
> iade edilecektir: http://kargo-takip-guncelle.com/form

Beklenen: **medium** (35 puan: urgency_language 15 + generic_greeting 10 + no_https 10)

### S2 — Güvenlik uyarısı taklidi
> Değerli kullanıcımız, hesabınızda olağandışı bir giriş denemesi tespit
> edildi. Şifrenizi en kısa sürede değiştirmenizi rica ederiz.

Beklenen: **medium** (45 puan: urgency 15 + sensitive_info_request 20 + generic_greeting 10)

### S3 — Ödül/çekiliş tuzağı
> Merhaba, çekilişten ödül kazandınız! Ödülünüzü almak için acele edin,
> kampanya bugün sona eriyor: https://bit.ly/odul-kampanya

Beklenen: **medium** (30 puan: urgency 15 + url_shortener 15 — tam eşikte)

## Yüksek riskli örnekler (beklenen: high)

### H1 — Banka phishing'i (marka taklidi)
> Sayın müşterimiz, Garanti internet bankacılığı hesabınız askıya alınmıştır.
> Hemen doğrulama yapmazsanız hesabınız kalıcı olarak kapatılacaktır.
> Kart numaranız ve şifrenizle giriş yapın: http://garanti-dogrulama.xyz/giris

Beklenen: **high** (95 puan: urgency 15 + sensitive 20 + generic 10 + no_https 10
+ suspicious_tld 15 + brand_lookalike 25)

### H2 — HTML link maskeleme (en güçlü sinyal)
> Değerli müşterimiz, PayPal hesabınız kısıtlandı. Acil doğrulama gerekli:
> `<a href="http://paypal-verify.top/login">https://www.paypal.com/tr/signin</a>`
> Şifrenizi girerek kimliğinizi doğrulayın.

Beklenen: **high** (100 puan — 125'ten kırpılır: link_text_mismatch 30 + brand 25
+ sensitive 20 + urgency 15 + suspicious_tld 15 + generic 10 + no_https 10)

### H3 — Zararlı ek + kimlik talebi
> Sayın müşterimiz, faturanızı görüntülemek için ekteki fatura_2026.exe
> dosyasını indirip çalıştırın. Ödemenizi hemen yapmazsanız hizmetiniz
> kesilecektir. TC kimlik numaranızı da yanıt olarak iletin.

Beklenen: **high** (65 puan: suspicious_attachment 20 + sensitive 20 + urgency 15
+ generic 10)

## Örnek linkler

| # | Link | Beklenen | Puan ve sinyaller |
|---|------|----------|-------------------|
| L1 | `https://www.microsoft.com/tr-tr/security` | **low** | 0 — resmi domain, sinyal yok |
| L2 | `http://garanti-giris.xyz` | **medium** | 50 — no_https 10 + suspicious_tld 15 + brand_lookalike 25 |
| L3 | `http://garanti.com.tr.musteri-dogrulama.xyz/giris` | **high** | 65 — no_https 10 + suspicious_tld 15 + excessive_subdomains 15 + brand_lookalike 25 |

## Not: Windows'ta curl ile Türkçe test

Türkçe içerikli payload'ı komut satırı argümanı olarak vermek karakterleri
bozar (ANSI dönüşümü). Payload'ı UTF-8 dosyaya yazıp
`curl --data-binary @dosya.json` kullanın; Swagger UI'da bu sorun yoktur.
