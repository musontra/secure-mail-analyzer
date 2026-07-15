# Kubernetes Kurulumu (Docker Desktop K8s / Minikube)

Securelytix'i yerel bir Kubernetes cluster'ında çalıştırma adımları.

## Ön koşul: cluster
- **Docker Desktop:** Settings > Kubernetes > "Enable Kubernetes" işaretleyin.
- **Minikube:** `minikube start` (imajlar için `minikube image load ...` gerekir).

`kubectl get nodes` ile cluster'ın hazır olduğunu doğrulayın.

## 1. İmajları yerel build et
Cluster, yerel Docker imajlarını kullanır (imagePullPolicy: IfNotPresent):

```bash
docker build -t securelytix-backend:local ./backend
docker build -t securelytix-frontend:local ./frontend
# Minikube kullanıyorsanız ayrıca:
# minikube image load securelytix-backend:local
# minikube image load securelytix-frontend:local
```

## 2. Secret'ı oluştur (repoya girmez)
Şablondan kopyalayıp gerçek değerleri doldurun:

```bash
cp k8s/secret.example.yaml k8s/secret.yaml
# k8s/secret.yaml içindeki BURAYA_... alanlarını doldurun:
#   POSTGRES_PASSWORD, GEMINI_API_KEY, JWT_SECRET
```

## 3. Uygula (sıra önemli: namespace önce)
```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/postgres.yaml
kubectl apply -f k8s/backend.yaml
kubectl apply -f k8s/frontend.yaml
```

## 4. Doğrula
```bash
kubectl get pods -n securelytix       # hepsi Running/Ready olmalı
kubectl get svc -n securelytix
kubectl logs -n securelytix deploy/backend | grep -i migrat   # otomatik migration
```

## 5. Eriş
Tarayıcıdan: **http://localhost**

Frontend Service'i `type: LoadBalancer`; Docker Desktop dış IP atayıp localhost'a
bağlar. (NodePort denendi: Docker Desktop'ın kind tabanlı cluster'ı node portlarını
host'a map etmediği için localhost:30080 çalışmıyor. Minikube'de Service'i
`type: NodePort` yapıp `minikube service frontend -n securelytix` kullanın.)
Demo hesapları: `admin@securelytix.com / Admin123!`, `demo@securelytix.com / Demo1234!`

## 6. Kalıcılık testi
Postgres pod'unu silin; StatefulSet yeniden oluşturur, PVC sayesinde veri kalır:
```bash
kubectl delete pod -n securelytix postgres-0
kubectl get pods -n securelytix -w    # postgres-0 tekrar Running olur, veriler durur
```

## Temizlik
```bash
kubectl delete namespace securelytix   # tüm kaynaklar gider
# PVC namespace ile silinir; veriyi de silmek istemiyorsanız PVC'yi ayrı yönetin
```

## Not: Migration stratejisi ve çok replikalı seed
Migration, backend açılışında otomatik `Migrate()` + retry ile koşar (Adım 10).
2 replika ile K8s'te bu yaklaşım denendi ve şu gözlendi:

- **Migration güvenli:** EF, migration'ları PostgreSQL advisory lock ile korur;
  iki replika aynı anda başlasa da migration'lar bir kez uygulanır
  (`__EFMigrationsHistory` tablosu takip eder).
- **Seed yarışı gerçekleşti:** İki replika aynı anda demo hesaplarını eklemeye
  çalışınca `23505 duplicate key value violates unique constraint "IX_users_email"`
  hatası bir pod'u çökertti (K8s restart edip toparladı). `DbSeeder` artık bu
  unique çakışmasını "diğer replika oluşturmuş" diye yutuyor; sıfırdan kurulumda
  restart sayısı 0.

**init-container / Job alternatifi:** Migration+seed'i ayrı bir Job'a veya
init-container'a taşımak, bu yarışı tasarımdan silerdi (tek yerde, tek kez koşar)
ve uygulama pod'larının açılışını hızlandırırdı. Mevcut yaklaşım korundu çünkü:
(1) eğitim projesinde tek komutla (`kubectl apply`) çalışan basit bir akış
isteniyor, (2) EF'in advisory lock'u migration tarafını zaten güvenli kılıyor,
(3) seed yarışı idempotent hale getirilerek kapatıldı. Üretimde tercih
edilecek yol Job/init-container'dır: migration'ın uygulama sürümünden bağımsız,
denetlenebilir ve tek seferlik koşması istenir.
