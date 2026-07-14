# secure-mail-analyzer

Mail ve Link Güvenlik Analiz Platformu.

> 🚧 Bu proje geliştirme aşamasındadır.

## Geliştirme ortamında çalıştırma

1. Veritabanı: `docker compose up -d` (PostgreSQL, port 5433)
2. Backend: `cd backend/SecureMailAnalyzer.Api && dotnet run` → http://localhost:5105 (Swagger: /swagger)
3. Frontend: `cd frontend && npm install && npm run dev` → http://localhost:5173

## Demo hesapları (eğitim amaçlı)

| Rol | E-posta | Şifre |
|-----|---------|-------|
| Admin | admin@securelytix.com | Admin123! |
| Kullanıcı | demo@securelytix.com | Demo1234! |
