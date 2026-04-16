# 🅿️ ParkET — Akıllı Otopark Yönetim Sistemi

Turkcell CodeNight 2026 — Case 2: ParkET Akıllı Otopark

## 🏗️ Proje Yapısı

```
turkcell_proje/
├── src/                  # Backend (Express.js + TypeScript)
├── prisma/               # Prisma ORM (PostgreSQL)
├── frontend/             # Frontend (Next.js + React + Tailwind)
├── .env                  # Backend ortam değişkenleri
└── package.json          # Backend bağımlılıkları
```

**2 ayrı sunucu çalışır:**

| Sunucu   | Port   | Açıklama                  |
|----------|--------|---------------------------|
| Backend  | `3000` | Express.js REST API       |
| Frontend | `3001` | Next.js Web Arayüzü       |

---

## 🚀 Kurulum (Başka PC'de Çalıştırma)

### Ön Gereksinimler

- **Node.js** v18+ ([nodejs.org](https://nodejs.org))
- **npm** (Node.js ile birlikte gelir)
- **Git**

### 1. Repo'yu klonla

```bash
git clone https://github.com/burakkarakus38/proje2.git
cd proje2
```

### 2. Backend Kurulumu

```bash
# Backend bağımlılıklarını kur
npm install

# Prisma Client oluştur
npx prisma generate

# Veritabanı tablolarını oluştur (Neon PostgreSQL'e bağlı)
npx prisma db push
```

### 3. Frontend Kurulumu

```bash
# Frontend klasörüne geç ve bağımlılıkları kur
cd frontend
npm install
cd ..
```

### 4. Ortam Değişkenleri (.env)

Proje kök dizininde `.env` dosyası olmalı. `.env.example`'dan kopyalayıp düzenle:

```bash
cp .env.example .env
```

`.env` dosyasının içeriği:

```env
# Server
NODE_ENV=development
PORT=3000

# Database (Neon PostgreSQL — hazır bağlı)
DATABASE_URL="postgresql://neondb_owner:npg_9dpBuKbUeNc5@ep-cold-morning-al6pfqzh.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require"

# JWT
JWT_ACCESS_SECRET=your_access_token_secret_here
JWT_REFRESH_SECRET=your_refresh_token_secret_here
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:3001,http://127.0.0.1:3001
```

---

## ▶️ Çalıştırma (2 Terminal Gerekli!)

### Terminal 1 — Backend (Port 3000)

```bash
# Proje kök dizininde
npm run dev
```

Çıktı: `Server running on port 3000`

### Terminal 2 — Frontend (Port 3001)

```bash
# frontend klasöründe
cd frontend
npm run dev -- -p 3001
```

Çıktı: `Ready on http://localhost:3001`

### ✅ Hazır!

| Adres | Ne açılır |
|-------|-----------|
| http://localhost:3001 | 🌐 Web Arayüzü (Ana Sayfa) |
| http://localhost:3001/login?role=driver | 🚗 Şoför Girişi |
| http://localhost:3001/login?role=manager | 🏢 Yönetici Girişi |
| http://localhost:3000/api/v1/health | 💚 Backend Sağlık Kontrolü |
| http://localhost:3000/api-docs | 📖 Swagger API Dokümantasyonu |

---

## 📱 Paycell Mobil Ödeme Simülasyonu

Rezervasyon yapıldıktan sonra otomatik olarak Paycell ödeme sayfası açılır.

**Simülasyon Kuralları:**
- ✅ Tutar ≤ ₺1000 → Ödeme başarılı
- ❌ Tutar > ₺1000 → Limit yetersiz
- ❌ Numara "00" ile bitiyorsa → Hat kapalı

---

## 🔑 Test Hesapları

Sisteme kayıt olurken OTP doğrulama kodu backend loglarında görünür (simülasyon).

**Hızlı test için:**
1. http://localhost:3001/register?role=driver adresinden kayıt ol
2. Araç bilgilerini gir (plaka, marka, model)
3. SMS doğrulama kodunu backend terminalinden oku
4. Giriş yap ve rezervasyon oluştur

---

## 🛠️ Geliştirici Komutları

```bash
# Backend
npm run dev          # Geliştirme sunucusu (hot-reload)
npm run build        # TypeScript derleme
npm run start        # Production çalıştırma

# Prisma
npx prisma studio    # Veritabanı görsel arayüzü
npx prisma db push   # Schema değişikliklerini uygula
npx prisma generate  # Client yenile

# Frontend
cd frontend
npm run dev          # Next.js geliştirme sunucusu
npm run build        # Production build
```

---

## 📦 Teknoloji Stack

| Katman    | Teknoloji                          |
|-----------|------------------------------------|
| Backend   | Node.js, Express.js, TypeScript    |
| ORM       | Prisma                             |
| Veritabanı| PostgreSQL (Neon Cloud)            |
| Frontend  | Next.js 16, React 19, Tailwind v4  |
| Auth      | JWT (Access + Refresh Token)       |
| Ödeme     | Paycell DCB Simülasyonu            |
| Validasyon| Zod                                |
