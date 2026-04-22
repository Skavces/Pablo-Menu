# Pablo Menu — Deployment

## Kurulum

```bash
cp .env.example .env
# .env dosyasındaki TÜM değerleri değiştir (şifreler, secret key'ler)
```

## .env'de mutlaka değiştir

| Değişken | Açıklama |
|---|---|
| `POSTGRES_PASSWORD` | Güçlü DB şifresi |
| `JWT_SECRET` | Min 32 karakter random string |
| `ADMIN_EMAIL` | Admin giriş e-postası |
| `ADMIN_PASSWORD` | Admin şifresi (min 8 karakter) |
| `MINIO_SECRET_KEY` | MinIO şifresi |
| `VITE_API_URL` | Backend public URL (örn: https://api.pablo.com) |
| `VITE_MINIO_URL` | MinIO public URL (örn: https://minio.pablo.com) |

## Başlatma

```bash
docker compose up -d --build
```

## Uygulama Adresleri

- **Menü**: http://localhost
- **Admin Panel**: http://localhost/pb-admin
- **MinIO Console**: http://localhost:9001

## Production'da dikkat edilmesi gerekenler

1. `docker-compose.yml`'de `synchronize: true` → `false` yap (AppModule'de `nodeEnv === production` zaten bunu yapıyor)
2. Nginx önüne SSL (Let's Encrypt / Nginx Proxy Manager) koy
3. MinIO console portunu (9001) dışa açma, sadece internal bırak
4. `.env` dosyasını git'e commit etme
