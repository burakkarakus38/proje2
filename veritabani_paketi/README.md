# 🗄️ Veritabanı Paketi — Turkcell CodeNight 2026

Bu klasör, projenin **sadece veritabanı katmanını** içerir. Backend geliştiricisine iletmek için hazırlanmıştır.

---

## 📁 Klasör Yapısı

```
veritabani_paketi/
├── prisma/
│   ├── schema.prisma               ← Veri modelleri (User, RefreshToken, Role Enum)
│   ├── seed.ts                     ← Başlangıç test verileri (3 kullanıcı)
│   └── migrations/
│       └── 20260415194423_init_neon/
│           └── migration.sql       ← Tablolar ve ilişkileri oluşturan SQL
├── .env.example                    ← Ortam değişkenleri şablonu
├── package.json                    ← Bağımlılıklar ve komutlar
└── README.md                       ← Bu dosya
```

---

## ⚡ Kurulum Adımları

### 1. Bağımlılıkları Yükle
```bash
npm install
```

### 2. Ortam Değişkenlerini Ayarla
`.env.example` dosyasını kopyalayıp `.env` adıyla kaydet:
```bash
cp .env.example .env
```
Sonra `.env` içindeki `DATABASE_URL` satırını kendi PostgreSQL/Neon bağlantı adresinle değiştir.

### 3. Prisma Client'ı Oluştur
```bash
npm run db:generate
```

### 4. Tabloları Veritabanına Uygula
```bash
npm run db:migrate
```

### 5. (İsteğe bağlı) Test Verilerini Ekle
```bash
npm run db:seed
```

---

## 🗂️ Veri Modelleri

### User Tablosu (`users`)
| Alan | Tip | Açıklama |
|---|---|---|
| `id` | UUID | Primary Key (otomatik) |
| `email` | String | Benzersiz, giriş için kullanılır |
| `passwordHash` | String | bcrypt ile hashlenmiş şifre |
| `name` | String? | Opsiyonel ad soyad |
| `role` | Enum | `DRIVER`, `OPERATOR` veya `ADMIN` |
| `createdAt` | DateTime | Oluşturulma tarihi (otomatik) |

### RefreshToken Tablosu (`refresh_tokens`)
| Alan | Tip | Açıklama |
|---|---|---|
| `id` | UUID | Primary Key (otomatik) |
| `token` | String | JWT Refresh Token değeri |
| `userId` | String | Foreign Key → users.id (CASCADE DELETE) |
| `expiresAt` | DateTime | Token geçerlilik süresi |
| `createdAt` | DateTime | Oluşturulma tarihi (otomatik) |

### Role Enum
```
DRIVER    → Sürücü rolü
OPERATOR  → Operatör rolü
ADMIN     → Yönetici rolü
```

---

## 🔑 Test Kullanıcıları (Seed)

| Ad | E-posta | Rol | Şifre (plain) |
|---|---|---|---|
| Ali Yılmaz | ali.yilmaz@test.com | DRIVER | password123 |
| Ayşe Demir | ayse.demir@test.com | OPERATOR | password123 |
| Can Tekin | can.tekin@test.com | ADMIN | password123 |

> ⚠️ Bu şifreler **sadece test verisidir**. Production ortamında `bcrypt` ile hashlenmesi zorunludur.

---

## 📋 Kullanışlı Komutlar

| Komut | Açıklama |
|---|---|
| `npm run db:generate` | Prisma Client'ı üretir |
| `npm run db:migrate` | Yeni migrasyon oluşturur ve uygular |
| `npm run db:push` | Şemayı migration olmadan veritabanına iter |
| `npm run db:seed` | Test verilerini ekler |
| `npm run db:studio` | Prisma Studio (görsel veritabanı arayüzü) açar |
