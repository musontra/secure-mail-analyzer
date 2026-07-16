# Proje: Mail ve Link Güvenlik Analiz Platformu (secure-mail-analyzer)

Eğitim amaçlı phishing/oltalama farkındalık platformu. Kullanıcı e-posta
içeriği veya link girer, sistem analiz edip düşük/orta/yüksek risk seviyesi
ve nedenlerini gösterir. Staj bireysel projesi.

## Teknoloji kararları (sabit, değiştirme)
- Backend: .NET 8 Web API + EF Core
- Frontend: React (Vite) + Tailwind
- DB: PostgreSQL
- Container: Docker + docker-compose
- Orkestrasyon: Kubernetes (Minikube)
- Sonra eklenecek: Claude API (LLM analizi), JWT auth, GitHub Actions
- Redis KULLANILMAYACAK

## Mimari kararlar
- Analiz motoru hibrit: önce kural tabanlı sinyaller (deterministik,
  sinyal başına puan), sonra LLM katmanı. LLM çökerse kural tabanlı
  mod tek başına çalışabilmeli.
- Girilen URL'lere sunucudan asla HTTP isteği atma (SSRF riski).
  Sadece statik analiz.
- DB: analyses tablosunda detected_signals JSONB olarak tutulacak
  (admin istatistikleri GROUP BY ile çıkacak).

## Çalışma kuralları (ÖNEMLİ)
- Ben öğrenme amaçlı ilerliyorum. SADECE senden istenen adımı yap,
  sonraki adımlara geçme, istenmeyen dosya oluşturma.
- Her adım sonunda: (1) oluşturduğun/değiştirdiğin her dosyanın ne işe
  yaradığını 1-2 cümleyle Türkçe açıkla (kısa tut), (2) öğrenmem gereken
  1-2 temel kavramı belirt.
- Her adımın sonunda değişiklikleri conventional commits formatında
  Türkçe mesajla commit'le ve push'la (feat:/fix:/chore:/docs:).
  Adım başına tek commit.
- Kod içi yorumlar ve kullanıcıya görünen tüm metinler Türkçe,
  değişken/fonksiyon isimleri İngilizce.

## Repo yapısı (hedef)
secure-mail-analyzer/
  backend/  frontend/  k8s/  docs/
  docker-compose.yml  README.md
(Not: şema EF Core Code-First migration'larıyla yönetiliyor, ayrı
 database/ klasörüne gerek yok — migration'lar backend/.../Migrations/ altında.)
