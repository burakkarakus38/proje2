# 📚 TURKCELL CODENIGHT 2026 — TAM DOKÜMANTASYON

> Frontend, Backend, Database developer'larının ihtiyaç duyabileceği **tüm rehberler ve kaynaklar**.

---

## 🚀 İLK 30 DAKİKA (Mutlaka Oku!)

### 📖 Başlangıç Rehberleri (Sırasıyla Oku)

1. **[HIZLI_BASLANGIC.md](./HIZLI_BASLANGIC.md)** ⭐ **← BURADAN BAŞLA**
   - 30 dakikalık tam kurulum
   - Rol-based başlangıç
   - Temel komutlar
   - FAQ

2. **[TAKIM_CALISMA_REHBERI.md](./TAKIM_CALISMA_REHBERI.md)**
   - Klasör yapısı ve kimin nerede çalıştığı
   - Günlük workflow
   - Backend/Frontend/Database rolleri
   - Senkronizasyon protokolü

3. **[GIT_GITHUB_WORKFLOW.md](./GIT_GITHUB_WORKFLOW.md)**
   - Git temel komutları (adım-adım)
   - Branch stratejisi
   - Conflict çözme
   - PR nasıl açılır

4. **[TAKIM_ILETISIM_REHBERI.md](./TAKIM_ILETISIM_REHBERI.md)**
   - Frontend-Backend iletişim
   - Backend-Database iletişim
   - Slack mesaj şablonları
   - Skenariolar ve çözümler

---

## 👥 KİM NE YAPTACAK? (Rol-Based)

### ⭐ **[ROLLER_VE_SORUMLULUKLAR.md](./ROLLER_VE_SORUMLULUKLAR.md)** ← BUNU OKU!

**Bu dosyada:**
- **Backend Developer**: 5 görev (Login, Register, Refresh Token, Logout, Error Handling)
- **Frontend Developer**: 5 görev (Login page, Register page, Token refresh, Protected routes, Routing)
- **Database Developer**: 6 görev (User fields, RefreshToken model, Post model, Indexes, Seed data)

**Kod örnekleri ile her görev tam anlatılı.**

---

## 📖 STANDARTLAR VE KURALLAR

### 1. **[backend-rules.md](./backend-rules.md)** — 🔴 ZORUNLU

**HERKES OKUNMALI:**
- Kodlama standartları (Clean Code, SOLID prensipleeri)
- Layered Architecture açıklaması
- JWT + Refresh Token mekanizması
- API tasarımı (RESTful)
- Validasyon ve Hata yönetimi
- Response formatı

**Backend'iler:** Kesinlikle uygulamalı
**Frontend'iler:** Endpoint'leri anlamak için oku
**Database'ciler:** Schema kurallarını anla

### 2. **[API_QUICK_REFERENCE.md](./API_QUICK_REFERENCE.md)** — Hızlı Referans

- Endpoint tablosu
- Test komutları
- Error codes
- Token handling

### 3. **[AUTH_API_DOCS.md](./AUTH_API_DOCS.md)** — Detaylı API Doku

**Tüm Authentication Endpoint'leri:**
- POST /api/auth/login
- POST /api/auth/register
- POST /api/auth/refresh-token
- POST /api/auth/logout

**Her endpoint'te:**
- Request/Response örnekleri (JSON)
- curl komutları
- Error senaryoları
- Frontend integration örneği

---

## 🗂️ PROJE YAPISI

```
turkcell_proje/
│
├── 📄 Dokümantasyon/
│   ├── HIZLI_BASLANGIC.md           ← İLK BU
│   ├── TAKIM_CALISMA_REHBERI.md
│   ├── GIT_GITHUB_WORKFLOW.md
│   ├── TAKIM_ILETISIM_REHBERI.md
│   ├── ROLLER_VE_SORUMLULUKLAR.md   ← ADIM ADIM
│   ├── backend-rules.md              ← STANDARTLAR
│   ├── AUTH_API_DOCS.md             ← API DETAYLI
│   └── API_QUICK_REFERENCE.md       ← HIZLI REF
│
├── src/
│   ├── Config/              ← Backend: Konfigürasyon
│   │   ├── index.ts        (Env variables)
│   │   ├── database.ts      (Prisma bağlantı)
│   │   └── swagger.ts       (API docs)
│   │
│   ├── Controllers/         ← Backend: HTTP handlers
│   │   ├── authController.ts    (Login, Register, etc)
│   │   ├── healthController.ts  (Health check)
│   │   └── [other].ts
│   │
│   ├── Services/            ← Backend: Business logic
│   │   ├── authService.ts       (Auth işlemleri)
│   │   └── [other]Service.ts
│   │
│   ├── Routes/              ← Backend: Endpoint'ler
│   │   ├── authRoutes.ts        (Swagger ile dokumente)
│   │   ├── healthRoutes.ts
│   │   └── index.ts
│   │
│   ├── Middlewares/         ← Backend: Auth, Validation
│   │   ├── authMiddleware.ts    (JWT kontrol)
│   │   ├── validateRequest.ts   (Zod validation)
│   │   └── errorHandler.ts      (Global error handler)
│   │
│   ├── Schemas/             ← Backend: Zod validation
│   │   ├── auth.schema.ts
│   │   └── [other].schema.ts
│   │
│   ├── Utils/               ← Herkes: Helper functions
│   │   ├── AppError.ts           (Custom error sınıfı)
│   │   ├── bcryptUtils.ts        (Password hashing)
│   │   ├── jwtUtils.ts           (Token oluşturma)
│   │   ├── logger.ts             (Structured logging)
│   │   ├── generateTimestamp.ts
│   │   └── responseHelper.ts
│   │
│   └── Models/
│       └── index.ts         (Prisma client)
│
├── prisma/
│   ├── schema.prisma        ← DATABASE: Şema
│   └── migrations/          ← DATABASE: Geçmiş
│
├── dist/                    (Transpiled, git'e eklenmez)
├── node_modules/            (Paketler, git'e eklenmez)
│
├── .env                     ← GİZLİ (git'e eklenmez)
├── .gitignore              (Hangi dosyalar ignore edilir)
├── package.json            (Proje ayarları)
├── tsconfig.json           (TypeScript ayarları)
└── README.md               (Bu dosya)
```

---

## 🎯 İLK HAFTA TIMELINE

| Gün | Backend | Frontend | Database |
|-----|---------|----------|----------|
| Pzt | Auth Service bones | UI setup, API calls | User + RefreshToken schemas |
| Sal | Login endpoint | Login page | Password + fields ekle |
| Çrş | Register endpoint | Register page | Seed data ekle |
| Prş | Refresh + Logout | Protected routes | Indexes ekle |
| Cum | Testing, bugfix | Testing, styling | Documentation |

---

## 💻 TEMEL KOMUTLAR

```bash
# ===== KURULUM =====
git clone <repo>
npm install
cp .env.example .env
nano .env                   # Doldur

# ===== GELIŞTIRME =====
npm run build              # TypeScript derle
npm run dev                # Development sunucu başlat
npm run prisma:migrate     # Database migration
npm run prisma:studio      # Database GUI

# ===== GİT =====
git checkout -b feature/name    # Yeni branch
git add .                       # Değişiklikleri stage
git commit -m "feat: ..."       # Commit
git push origin feature/name    # GitHub'a gönder
# GitHub'da PR aç

# ===== TEST =====
curl http://localhost:3000/api/health
curl http://localhost:3000/api-docs  # Swagger UI
```

---

## 🔐 GÜVENLIK

- [ ] `.env` dosyası **asla** git'e eklenmez (`.gitignore` var)
- [ ] Şifreler **bcrypt** ile hash'lenir
- [ ] Token'lar **JWT** ile şifreli
- [ ] Stack trace'ler **asla** client'a gönderilmez
- [ ] **CORS** sadece izin verilen origin'lerde

---

## 📞 SORUN YAŞIYORUM

### "Compiler hatası var"
```bash
npm run build
# Hatayı oku, Google'a yapıştır
# Hala olmazsa: "@backend build hatası: [HATA]"
```

### "Database bağlantı hatası"
```bash
# PostgreSQL kurulu mu?
psql --version

# .env'de DATABASE_URL doğru mu?
cat .env | grep DATABASE_URL

# Eğer hala olmazsa: "@database Bağlantı hatası"
```

### "Git conflict'i"
```bash
git pull origin main
# VS Code'da conflict işaretle, seç, sil marker'ları
git add .
git commit -m "Conflict çözüldü"
```

### "Hepsi kırıldı!"
```bash
git status
git log --oneline
git reset --hard HEAD~1  # Son commit'i geri al
```

---

## 📖 OKUMA DÜZENİ

```
İLK GÜN:
1. HIZLI_BASLANGIC.md (30 dakika)
2. TAKIM_CALISMA_REHBERI.md (30 dakika)
3. GIT_GITHUB_WORKFLOW.md (30 dakika)
4. Kurulum yap, npm run dev çalıştır

İLK HAFTA:
1. backend-rules.md (ZORUNLU)
2. ROLLER_VE_SORUMLULUKLAR.md (Kendi rolün)
3. AUTH_API_DOCS.md
4. GIT_GITHUB_WORKFLOW.md (yeniden)
5. TAKIM_ILETISIM_REHBERI.md (sorun yaşarsa oku)

BAŞLANGIC ÖNCESI SOrun:
- HIZLI_BASLANGIC.md FAQ kısmı
- Bu dosya
- GitHub Issues
- Slack'te sor
```

---

## 🎓 ÖĞRENME KAYNAKLAR

```
TypeScript:
  → https://www.typescriptlang.org/docs/

Express.js:
  → https://expressjs.com/

Prisma ORM:
  → https://www.prisma.io/docs/

Zod Validation:
  → https://zod.dev/

React (Frontend):
  → https://react.dev/

Git:
  → https://git-scm.com/doc
```

---

## ✅ HER BIRI KONTROL LISTESI

- [ ] Repository'yi klonladım
- [ ] npm install yaptım
- [ ] .env doldurdum
- [ ] npm run build çalıştı (hata yok)
- [ ] npm run dev başlattım (port 3000)
- [ ] http://localhost:3000/api-docs açık
- [ ] HIZLI_BASLANGIC.md okudum
- [ ] ROLLER_VE_SORUMLULUKLAR.md'de kendi rolümü okudum
- [ ] backend-rules.md okudum
- [ ] İlk branchi açtım: git checkout -b feature/...
- [ ] Slack'teki ekibi selamladım

---

## 🤝 İLETİŞİM KANALLARI

| Kanal | Konu |
|-------|------|
| #backend | Backend geliştirme |
| #frontend | Frontend geliştirme |
| #database | Database şeması |
| #deployments | Production issues |
| #general | Genel konu |

---

## 🎉 BAŞLAMAYA HAZIRSAN

1. **[HIZLI_BASLANGIC.md](./HIZLI_BASLANGIC.md)** aç
2. Adım-adım takip et (30 dakika)
3. `npm run dev` çalıştır
4. `{ROLLER_VE_SORUMLULUKLAR.md}` **kendi rolünü** oku
5. İlk görevi yap
6. PR aç, review bekle
7. Merge → Tamamlandı! ✅

---

## 📝 NOTLAR

- Hiçbiri belirtilmemiş mi? → Slack'te sor
- Burada olmayan bir dosya mı lazım? → Yarat, PR aç
- Rehber eski mi? → Güncelle, commit et

**Happy coding! 🚀**

---

**Last Updated: April 15, 2026**
**Version: 1.0.0 (Turkcell CodeNight 2026)**
