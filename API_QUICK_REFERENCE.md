# API Quick Reference - Auth Endpoints

## 📋 Endpoint Özeti

| HTTP | Endpoint | Açıklama | Auth | Status | Doku |
|------|----------|----------|------|--------|------|
| POST | `/api/auth/login` | Giriş (E-posta + Şifre) | ❌ | ✅ | ✅ |
| POST | `/api/auth/register` | Kayıt (Yeni Kullanıcı) | ❌ | ✅ | ✅ |
| POST | `/api/auth/refresh-token` | Token Yenile | ❌ | ✅ | ✅ |
| POST | `/api/auth/logout` | Çıkış | ✅ | ✅ | ✅ |

---

## 🧪 Test Etmek İçin

### 1. Server Başlat
```bash
npm run dev
```

### 2. Swagger UI Aç
```
http://localhost:3000/api-docs
```

### 3. Health Check (Sunucu çalışıyor mu kontrol et)
```bash
curl http://localhost:3000/api/health
```

### 4. Login Test Et
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

---

## 🔐 Token'ları Kullan

### 1. Login İçin Responses
```json
✅ Login başarılı: 200
{
  "success": true,
  "data": {
    "accessToken": "...",
    "refreshToken": "...",
    "user": { "id": 1, "email": "...", "name": "..." }
  },
  "message": "Başarıyla giriş yapıldı.",
  "timestamp": "2026-04-15T16:33:00.000Z"
}

❌ Login başarısız: 401
{
  "success": false,
  "data": null,
  "message": "E-posta veya şifre yanlış.",
  "timestamp": "2026-04-15T16:33:00.000Z"
}
```

### 2. Authorization Header'ında Token Gönder
```http
Authorization: Bearer {accessToken}
```

### 3. Token Süresi Dolmuşsa Yenile
```bash
curl -X POST http://localhost:3000/api/auth/refresh-token \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "..."
  }'
```

---

## 📁 Dosya Yapısı

```
src/
├── Controllers/
│   └── authController.ts       ← Login, register, refresh, logout handler'ları
├── Services/
│   └── authService.ts          ← Business logic (TODO: implement)
├── Routes/
│   ├── authRoutes.ts           ← Swagger dokümantasyonu ile endpoint'ler
│   └── index.ts                ← Auth routes kaydedildi
├── Middlewares/
│   └── authMiddleware.ts       ← JWT token doğrulaması
└── Schemas/
    └── auth.schema.ts          ← Zod validation schema'ları
```

---

## 🚀 Frontend İçin Integration

### 1. Environment Variables (.env)
```env
REACT_APP_API_URL=http://localhost:3000/api
```

### 2. Login
```typescript
const response = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
});
const { data } = await response.json();
localStorage.setItem('accessToken', data.accessToken);
localStorage.setItem('refreshToken', data.refreshToken);
```

### 3. Protected Request
```typescript
const response = await fetch('http://localhost:3000/api/protected', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
  }
});
```

### 4. Token Yenileme
```typescript
const response = await fetch('http://localhost:3000/api/auth/refresh-token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    refreshToken: localStorage.getItem('refreshToken')
  })
});
const { data } = await response.json();
localStorage.setItem('accessToken', data.accessToken);
```

### 5. Logout
```typescript
await fetch('http://localhost:3000/api/auth/logout', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
  }
});
localStorage.removeItem('accessToken');
localStorage.removeItem('refreshToken');
```

---

## ⏱️ Token Süresi

| Token | Süre | Kullanım |
|-------|------|----------|
| Access Token | 15 dakika | API isteklerinde |
| Refresh Token | 7 gün | Yeni access token almak için |

---

## ❌ Error Codes

| Kod | Scenario |
|-----|----------|
| 200 | Başarılı GET, PUT, PATCH, DELETE, Login, Refresh |
| 201 | Başarılı POST (Register) |
| 401 | Token eksik/geçersiz, şifre yanlış |
| 422 | Validasyon hatası |
| 409 | E-posta zaten kayıtlı |
| 500 | Sunucu hatası |

---

## 📞 Support

- Backend kuralları: [backend-rules.md](./backend-rules.md)
- Detaylı doku: [AUTH_API_DOCS.md](./AUTH_API_DOCS.md)
- Swagger UI: http://localhost:3000/api-docs
