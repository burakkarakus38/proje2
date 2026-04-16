# ── AUTH API Endpoints Dokümantasyonu ──
# Turkcell CodeNight 2026 Backend
# Tüm endpoint'ler backend-rules.md standartlarına uygun

## Base URL
```
http://localhost:3000/api/auth
```

## ⏰ Token Süresi
- **Access Token**: 15 dakika (API isteklerinde kullanılır)
- **Refresh Token**: 7 gün (yeni access token almak için kullanılır)

---

## 1️⃣ Login Endpoint
### `POST /api/auth/login`

Kullanıcı giriş yaparak JWT token'larını alır.

#### Request Body
```json
{
  "email": "user@example.com",
  "password": "secure_password123"
}
```

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTcxMzE5NjM4MCwiZXhwIjoxNzEzMTk3MjgwfQ.XXXXX",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTcxMzE5NjM4MCwiZXhwIjoxNzE4MzgwMzgwfQ.XXXXX",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "Ahmet Yılmaz"
    }
  },
  "message": "Başarıyla giriş yapıldı.",
  "timestamp": "2026-04-15T16:33:00.000Z"
}
```

#### Error Responses
- **401 Unauthorized**: E-posta veya şifre yanlış
- **422 Unprocessable Entity**: Validasyon hatası
- **500 Internal Server Error**: Sunucu hatası

#### Curl Example
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "secure_password123"
  }'
```

---

## 2️⃣ Register Endpoint
### `POST /api/auth/register`

Yeni bir kullanıcı oluşturur ve JWT token'larını döndürür.

#### Request Body
```json
{
  "name": "Ahmet Yılmaz",
  "email": "user@example.com",
  "password": "secure_password123"
}
```

#### Validation Rules
- **name**: Minimum 2 karakter
- **email**: Geçerli e-posta formatı, sistem içinde benzersiz
- **password**: Minimum 8 karakter

#### Response (201 Created)
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "Ahmet Yılmaz",
      "createdAt": "2026-04-15T16:33:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTcxMzE5NjM4MCwiZXhwIjoxNzEzMTk3MjgwfQ.XXXXX",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTcxMzE5NjM4MCwiZXhwIjoxNzE4MzgwMzgwfQ.XXXXX"
  },
  "message": "Kullanıcı başarıyla oluşturuldu.",
  "timestamp": "2026-04-15T16:33:00.000Z"
}
```

#### Error Responses
- **409 Conflict**: E-posta zaten kayıtlı
- **422 Unprocessable Entity**: Validasyon hatası
- **500 Internal Server Error**: Sunucu hatası

#### Curl Example
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ahmet Yılmaz",
    "email": "user@example.com",
    "password": "secure_password123"
  }'
```

---

## 🔄 Refresh Token Endpoint
### `POST /api/auth/refresh-token`

Hâlâ geçerli olan Refresh Token kullanarak yeni bir Access Token alır.

#### Request Body
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTcxMzE5NjM4MCwiZXhwIjoxNzE4MzgwMzgwfQ.XXXXX"
}
```

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTcxMzE5NjM5MCwiZXhwIjoxNzEzMTk3MjkwfQ.XXXXX",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTcxMzE5NjM5MCwiZXhwIjoxNzE4MzgwMzk0fQ.XXXXX"
  },
  "message": "Token başarıyla yenilendi.",
  "timestamp": "2026-04-15T16:33:00.000Z"
}
```

#### Error Responses
- **401 Unauthorized**: Refresh Token geçersiz veya süresi dolmuş
- **422 Unprocessable Entity**: Validasyon hatası
- **500 Internal Server Error**: Sunucu hatası

#### Curl Example
```bash
curl -X POST http://localhost:3000/api/auth/refresh-token \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTcxMzE5NjM4MCwiZXhwIjoxNzE4MzgwMzgwfQ.XXXXX"
  }'
```

---

## 🚪 Logout Endpoint
### `POST /api/auth/logout`

✅ **Requires Authentication** — Geçerli bir JWT Access Token gerekmektedir.

Geçerli oturumu sonlandırır ve refresh token'ı iptal eder (revoke).

#### Request Headers
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTcxMzE5NjM4MCwiZXhwIjoxNzEzMTk3MjgwfQ.XXXXX
```

#### Request Body
```json
{}
```

#### Response (200 OK)
```json
{
  "success": true,
  "data": null,
  "message": "Başarıyla çıkış yapıldı.",
  "timestamp": "2026-04-15T16:33:00.000Z"
}
```

#### Error Responses
- **401 Unauthorized**: Token eksik, geçersiz veya süresi dolmuş
- **500 Internal Server Error**: Sunucu hatası

#### Curl Example
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTcxMzE5NjM4MCwiZXhwIjoxNzEzMTk3MjgwfQ.XXXXX" \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

## 🔐 Authorization Header Format

Korumalı endpoint'leri çağırırken Authorization header'ında Bearer token gönderiniz:

```
Authorization: Bearer {accessToken}
```

**Örnek:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## ❌ HTTP Durum Kodları

| Kod | Açıklama |
|-----|----------|
| `200` | Başarılı GET, PUT, PATCH, DELETE ve Login/Refresh Token |
| `201` | Başarılı POST (Kaynak oluşturuldu) — Register/Logout |
| `400` | Bad Request — Geçersiz istek |
| `401` | Unauthorized — Kimlik doğrulama başarısız |
| `403` | Forbidden — Yetki yetersiz |
| `404` | Not Found — Kaynak bulunamadı |
| `409` | Conflict — E-posta zaten kayıtlı |
| `422` | Unprocessable Entity — Validasyon hatası |
| `500` | Internal Server Error — Sunucu hatası |

---

## 📚 Swagger/OpenAPI Documentation

Tüm endpoint'lerin interaktif dokümantasyonu:

```
http://localhost:3000/api-docs
```

Swagger UI üzerinden endpoint'leri test edebilirsiniz.

---

## 💡 Frontend İntegrasyon Örneği

### Login Flow
```typescript
// 1. Login
const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'secure_password123'
  })
});
const { data } = await loginResponse.json();
localStorage.setItem('accessToken', data.accessToken);
localStorage.setItem('refreshToken', data.refreshToken);

// 2. API çağrısında Access Token gönder
const apiResponse = await fetch('http://localhost:3000/api/protected-endpoint', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
  }
});

// 3. Token süresi dolmuşsa, yenile
const refreshResponse = await fetch('http://localhost:3000/api/auth/refresh-token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    refreshToken: localStorage.getItem('refreshToken')
  })
});
const { data: newTokens } = await refreshResponse.json();
localStorage.setItem('accessToken', newTokens.accessToken);

// 4. Çıkış
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

## 📝 Notlar

- Tüm request'ler `application/json` content-type içerir
- Tüm response'lar backend-rules.md'de belirtilen standart formatında döner
- Şifreler client tarafından plain-text olarak **asla** saklanmamalıdır
- Access Token süresi dolduğunda Refresh Token kullanarak yeni token alınmalıdır
- HTTPS kullanılmalıdır (production ortamında)
