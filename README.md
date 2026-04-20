# Pablo Artisan Coffee — Digital Menu

A full-featured digital menu system for a specialty coffee shop. Customers scan a QR code to browse the menu; the owner manages categories and products through a secure admin panel.

## Features

- Mobile-friendly menu with category filtering
- Product image uploads (MinIO object storage)
- JWT-based authentication with TOTP 2FA (Google Authenticator)
- AES-256-GCM encrypted TOTP secrets
- Brute-force protection via rate limiting
- One-command deployment with Docker Compose

## Tech Stack

| Layer    | Technology                               |
| -------- | ---------------------------------------- |
| Frontend | React 18, TypeScript, Tailwind CSS, Vite |
| Backend  | NestJS, TypeORM                          |
| Database | PostgreSQL 16                            |
| Storage  | MinIO                                    |
| Auth     | JWT + TOTP (AES-256-GCM)                 |

## Getting Started

### Requirements

- Docker & Docker Compose

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/pablo-menu.git
cd pablo-menu

# 2. Set up environment variables
cp .env.example .env
```

Open `.env` and update the following values:

| Variable              | Description                                               |
| --------------------- | --------------------------------------------------------- |
| `POSTGRES_PASSWORD`   | Strong database password                                  |
| `JWT_SECRET`          | Random string, min 32 characters                          |
| `TOTP_ENCRYPTION_KEY` | 64-char hex string — generate with `openssl rand -hex 32` |
| `ADMIN_EMAIL`         | Admin login email                                         |
| `ADMIN_PASSWORD`      | Admin password                                            |
| `MINIO_SECRET_KEY`    | MinIO password                                            |
| `VITE_API_URL`        | Public URL of the backend                                 |
| `VITE_MINIO_URL`      | Public URL of MinIO                                       |

```bash
# 3. Start all services
docker compose up -d --build
```

### URLs

| Service       | Address                   |
| ------------- | ------------------------- |
| Customer Menu | http://localhost          |
| Admin Panel   | http://localhost/pb-admin |
| MinIO Console | http://localhost:9001     |

## Project Structure

```
pablo-menu/
├── frontend/           # React + Vite app
│   └── src/
│       ├── pages/      # MenuPage, LoginPage, AdminPage
│       └── components/
├── backend/            # NestJS REST API
│   └── src/
│       ├── auth/       # JWT, TOTP, bcrypt
│       ├── categories/
│       ├── products/
│       ├── upload/     # MinIO integration
│       ├── health/     # GET /api/health
│       └── database/   # TypeORM migrations
└── docker-compose.yml
```

## Production Notes

- Put Nginx with Let's Encrypt or Nginx Proxy Manager in front for HTTPS
- Close the MinIO console port (9001) from public access
- Never commit the `.env` file
