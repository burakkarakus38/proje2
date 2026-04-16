# Proje Genel Bakışı

Bu belge, Turkcell CodeNight 2026 backend projesi geliştirilirken AI ajanı ve geliştiriciler tarafından uyulması gereken temel kuralları, mimari yapıyı ve kodlama standartlarını tanımlar.

## Teknoloji Yığını

*   **Platform:** Node.js
*   **Web Framework:** Express.js

## Veritabanı Katmanı

*   **Veritabanı:** PostgreSQL
*   **ORM Aracı:** Prisma

**Veritabanı Kuralları:**
*   **Veri Tutarlılığı:** Veritabanı şemaları (Models) oluşturulurken veri ilişkilerine, kısıtlamalara (constraints) ve veri tiplerinin doğruluğuna dikkat edilerek veri tutarlılığı her zaman sağlanmalıdır.
*   **İndeksleme (Indexing):** Sık sorgulanan veya aranan (where, join, order by) alanlar oluşturulurken mutlaka uygun indekslemeler (indexes) yapılmalı ve performansa özen gösterilmelidir.
*   **Asenkron Yönetim:** Tüm veritabanı bağlantıları ve sorgu işlemleri uygulamanın ana thread'ini bloklamamak adına her zaman asenkron (`async/await`) olarak yönetilmelidir.
*   **Şema Değişikliği Takibi:** Veritabanı şemasında yapılan herhangi bir güncelleme (yeni model/tablo, sütun ekleme vb.), proje içerisinde belirlenecek merkezi bir dokümanda (ve veritabanı migration'larında) mutlaka takip edilecek ve güncel tutulacaktır.

## Klasör Yapısı (Layered Architecture)

Proje, katmanlı mimari (Layered Architecture) prensiplerine uygun olarak geliştirilecektir. Bu yapı, kodun sürdürülebilirliğini, test edilebilirliğini ve modülerliğini artırır. Modüller birbirinden bağımsız yapılandırılmalıdır.

```text
src/
├── Config/       # Veritabanı bağlantıları, ortam değişkenleri ve API yapılandırmaları.
├── Controllers/  # Gelen HTTP isteklerini karşılar, gerekli servisleri çağırır ve HTTP yanıtlarını döndürür. İş mantığı içermemelidir.
├── Middlewares/  # İstek ve yanıt döngüsü arasına giren güvenlik, yetkilendirme, loglama, hata yakalama gibi ara yazılımlar.
├── Models/       # Veritabanı şemaları, veri yapıları ve ORM/ODM modelleri.
├── Routes/       # API uç noktalarını (endpoint'leri) tanımlar ve ilgili Controller fonksiyonlarına yönlendirir.
├── Services/     # İş mantığının (business logic) bulunduğu katman. Veritabanı işlemleri ve harici API çağrıları burada yapılır.
└── Utils/        # Yeniden kullanılabilir yardımcı fonksiyonlar (örn: tarih formatlama, şifreleme).
```

### Klasörlerin Amacı:
*   **Config:** Projenin dışa bağımlı konfigürasyonlarını merkezi bir yerde tutar.
*   **Controllers:** İstemciden gelen HTTP isteklerini işler, request payload'ını valide eder, `Services` katmanına aktarır ve sonucu istemciye uygun formda (Örn. JSON) geri döner. Kesinlikle veritabanı sorgusu veya iş mantığı içermez.
*   **Services:** Uygulamanın kalbidir. Core iş kuralları (business logic) sadece bu katmanda yer alır. İletişim kurduğu diğer katmanlardan (örneğin HTTP veya veritabanı spesifik detaylar) izoledir ve rahatça test edilebilir olmalıdır.
*   **Models:** Veri modelini, şemaları (Örn. Mongoose/Prisma schema) ve veri tabanı abstract'larını barındırır.
*   **Routes:** Uygulamanın dışa açılan kapıları olan URL yollarını ve HTTP metodlarını (GET, POST, vb.) yönetir, isteği uygun controller'a aktarır.
*   **Middlewares:** DRY (Don't Repeat Yourself) prensibi gereği birden fazla route'da çalışacak işlemleri (Authentication, Authorization, Validation, Error Handling) soyutlar.
*   **Utils:** Proje bağımlılığı çok az olan, her yerde kullanılabilecek saf fonksiyonları (pure functions) barındırır.

## Kodlama Standartları ve Prensipler

Kod yazılırken **her zaman** aşağıdaki prensiplere kesinlikle uyulmalıdır:

1.  **Temiz Kod (Clean Code):**
    *   Değişken, fonksiyon ve sınıf isimleri ne işe yaradığını tam olarak anlatan, açıklayıcı İngilizce kelimelerden oluşmalıdır.
    *   Fonksiyonlar tek bir işi yapmalı ve mümkün olduğunca kısa olmalıdır.
    *   Sihirli kelimeler/sayılar (magic strings/numbers) kullanılmamalı, `const` ve `enum` gibi yapılarla isimlendirilerek kod tekrar engellenmelidir.
    *   Kod kendi kendini açıklamalıdır; sadece nedeninin (why) karmaşık olduğu ("ne" işe yaradığı değil) durumlarda açıklayıcı yorum satırları eklenmelidir.

2.  **SOLID Kuralları:**
    *   **Single Responsibility Principle (SRP):** Her sınıfın, fonksiyonun veya dosyanın değişmek için tek bir nedeni olmalıdır.
    *   **Open/Closed Principle (OCP):** Kod (sınıflar, modüller) gelişime açık, ancak değişikliğe kapalı olmalıdır. Yeni bir özellik eklendiğinde mevcut çalışır kod değiştirilmemeli, üzerine yenisi eklenmelidir.
    *   **Liskov Substitution Principle (LSP):** Alt sınıftan türetilen nesneler üst sınıfların yerine geçebilmeli ve aynı davranışı sorunsuz sergilemelidir.
    *   **Interface Segregation Principle (ISP):** Kullanılmayan metodlar arayüzlerde/sınıflarda yer almamalıdır. Mümkün olduğunca özelleşmiş küçük arayüzler kullanılmalıdır.
    *   **Dependency Inversion Principle (DIP):** Üst seviye modüller, alt seviye modüllere doğrudan bağlı olmamalıdır; her ikisi de soyutlamalara (abstractions/interfaces) bağlı olmalı, bağımlılıklar dışarıdan enjekte (Dependency Injection) edilmelidir.

## Güvenlik ve Kimlik Doğrulama

Sistemin güvenliği için zorunlu **JWT + Refresh Token** mekanizması kullanılacaktır. Bu akış hatasız ve sağlam kurgulanmalıdır.

*   **Şifreleme (Hashing):** Kullanıcı şifreleri veritabanına doğrudan (plain-text) kaydedilmemeli, mutlaka **`bcrypt`** gibi güçlü bir algoritma ile şifrelenerek saklanmalıdır.
*   **Access Token:** API ile iletişim kurarken kullanılacak ana jetondur. Güvenliği artırmak adına kısa süreli olarak (örn: **15 dakika**) oluşturulmalıdır.
*   **Refresh Token:** Access Token süresi bittiğinde kullanıcının yeniden giriş yapmasını (login) engellemek ve yeni bir Access Token almak için kullanılır. Uzun süreli (örn: **7 gün**) olarak oluşturulmalı ve gerektiğinde iptal edilebilmesi (revoke) için **veritabanında saklanmalıdır**.
*   **Ara Katman Kontrolü (authMiddleware):** Dış dünyaya açık olmayan, sadece kimliği doğrulanmış kullanıcıların erişebileceği tüm korumalı endpoint'lerde mutlaka bir `authMiddleware` bulunmalıdır.
*   **Yetkisiz Erişim Yönetimi:** Yetki gerektiren işlemlerde eğer gelen istekte geçersiz, eksik veya süresi dolmuş bir token varsa, sistem her zaman standart bir HTTP **`401 Unauthorized`** hata kodu ve uygun bir hata mesajı döndürmek zorundadır.

## API Standartları ve Swagger

Projedeki tüm API uç noktaları **RESTful** mimari prensiplerine ve **OpenAPI 3.0** standardına uygun olarak tasarlanmalı ve belgelenmelidir.

### RESTful Endpoint Tasarım Kuralları

Her endpoint aşağıdaki HTTP metodu kurallarına **kesinlikle** uymalıdır:

| HTTP Metodu | Kullanım Amacı | Örnek |
|---|---|---|
| `GET` | Kaynak veya kaynak listesi okuma (veri değiştirmez) | `GET /users`, `GET /users/:id` |
| `POST` | Yeni kaynak oluşturma | `POST /users` |
| `PUT` | Mevcut kaynağın tamamını güncelleme | `PUT /users/:id` |
| `PATCH` | Mevcut kaynağın yalnızca belirli alanlarını güncelleme | `PATCH /users/:id` |
| `DELETE` | Kaynak silme | `DELETE /users/:id` |

**Ek RESTful Kuralları:**
*   **URL İsimlendirmesi:** Endpoint URL'leri **çoğul isimler** (noun) kullanmalıdır; fiil içermemelidir. (`/getUsers` ❌ → `/users` ✅)
*   **Hiyerarşik Yapı:** İlişkili kaynaklar URL hiyerarşisi ile ifade edilmelidir. (`/users/:id/orders`)
*   **HTTP Durum Kodları:** Yanıtlarda anlamlı HTTP durum kodları kullanılmalıdır:
    *   `200 OK` — Başarılı GET, PUT, PATCH, DELETE
    *   `201 Created` — Başarılı POST (yeni kaynak oluşturuldu)
    *   `400 Bad Request` — Geçersiz istek verisi
    *   `401 Unauthorized` — Kimlik doğrulama başarısız
    *   `403 Forbidden` — Yetki yetersiz
    *   `404 Not Found` — Kaynak bulunamadı
    *   `422 Unprocessable Entity` — Validasyon hatası
    *   `500 Internal Server Error` — Sunucu hatası

### Swagger / OpenAPI Dokümantasyonu

*   **Zorunluluk:** Projeye eklenen **her yeni endpoint**, aynı PR/commit içinde Swagger (OpenAPI 3.0) dokümantasyonu ile birlikte teslim edilmek zorundadır. Dokümante edilmemiş endpoint kabul edilmez.
*   **Araç:** Dokümantasyon `swagger-jsdoc` ve `swagger-ui-express` paketleri kullanılarak otomatik olarak üretilmelidir. Swagger arayüzü `/api-docs` yolundan erişilebilir olmalıdır.
*   **Asgari Dokümantasyon İçeriği:** Her endpoint için şunlar tanımlanmalıdır:
    *   Endpoint açıklaması (`summary` ve `description`)
    *   İstek parametreleri (`path`, `query`, `body`) ve veri tipleri
    *   Başarılı ve hatalı yanıt şemaları (response schemas)
    *   Gerekiyorsa kimlik doğrulama gereksinimi (`security`)
    *   Uygun `tags` ile gruplandırma

### Zorunlu Response Formatı

Projedeki **tüm API yanıtları** (başarılı veya hatalı) aşağıdaki standart JSON yapısına uymak zorundadır. Bu yapıdan sapan hiçbir yanıt kabul edilmeyecektir:

```json
{
  "success": boolean,
  "data": any,
  "message": string,
  "timestamp": "iso_date"
}
```

**Alan Açıklamaları:**

| Alan | Tip | Açıklama |
|---|---|---|
| `success` | `boolean` | İşlemin başarılı olup olmadığını belirtir. Başarılı yanıtlarda `true`, hatalı yanıtlarda `false`. |
| `data` | `any` | İstenen veriyi içerir. Başarısız işlemlerde veya döndürülecek veri yoksa `null` olmalıdır. |
| `message` | `string` | İşlemin sonucunu açıklayan, insanın okuyabileceği bir mesaj. (Örn: `"Kullanıcı başarıyla oluşturuldu."`) |
| `timestamp` | `string` | Yanıtın oluşturulduğu an, **ISO 8601** formatında UTC zaman damgası. (Örn: `"2026-04-15T16:33:00.000Z"`) |

**Örnek Başarılı Yanıt (`200 OK`):**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Ahmet Yılmaz",
    "email": "ahmet@example.com"
  },
  "message": "Kullanıcı başarıyla getirildi.",
  "timestamp": "2026-04-15T16:33:00.000Z"
}
```

**Örnek Hatalı Yanıt (`404 Not Found`):**

```json
{
  "success": false,
  "data": null,
  "message": "Kullanıcı bulunamadı.",
  "timestamp": "2026-04-15T16:33:00.000Z"
}
```

> **Not:** `timestamp` alanı her yanıtta dinamik olarak üretilmeli, kaynak koduna sabitlenmemelidir. Bu işlem `Utils/` katmanındaki merkezi bir yardımcı fonksiyon (`generateTimestamp`) üzerinden yapılmalıdır.

## Validasyon ve Hata Yönetimi

Güvenli, öngörülebilir ve bakımı kolay bir API için tüm giriş doğrulama ve hata yönetimi işlemleri **merkezi ve tutarlı** bir biçimde ele alınmalıdır.

### Request Validasyonu

*   **Zorunlu Kütüphane:** Gelen tüm HTTP isteklerindeki `body`, `query` ve `params` verileri **`Zod`** kütüphanesi kullanılarak doğrulanmak **zorundadır**. Elle yazılmış `if/else` kontrolleri veya başka doğrulama yöntemleri kabul edilmez.
*   **Schema Tanımlama Yeri:** Her endpoint için ilgili Zod şeması (schema), `Controllers/` veya `Routes/` katmanının yanında, ayrı bir `schemas/` klasöründe veya ilgili modülün kendi dizininde tutulmalıdır.
*   **Middleware Katmanı:** Doğrulama işlemi, Controller'a ulaşmadan önce bir `validateRequest` middleware'i üzerinden geçirilerek gerçekleştirilmelidir. Bu sayede Controller içi kod temiz kalır.
*   **Doğrulama Kapsamı:** Validasyon şemaları şu alanları kapsamalıdır:
    *   Veri tipleri (`string`, `number`, `boolean`, vb.)
    *   Zorunluluk durumu (`.required()` / `.optional()`)
    *   Format kuralları (e-posta, URL, UUID vb.)
    *   Boyut ve aralık kısıtlamaları (min/max uzunluk, sayı aralığı)

**Örnek Zod Schema Kullanımı:**

```typescript
import { z } from 'zod';

export const createUserSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    password: z.string().min(8),
    age: z.number().int().min(18).optional(),
  }),
});
```

**Örnek `validateRequest` Middleware:**

```typescript
import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

export const validateRequest =
  (schema: AnyZodObject) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(422).json({
          success: false,
          data: error.errors,
          message: 'Validasyon hatası. Lütfen gönderilen verileri kontrol edin.',
          timestamp: new Date().toISOString(),
        });
      }
      next(error);
    }
  };
```

---

### Global Exception Handler (Merkezi Hata Yakalayıcı)

*   **Zorunluluk:** Projede **tek bir merkezi hata yakalayıcı** (`globalErrorHandler`) bulunmalı ve tüm hataların bu middleware üzerinden geçmesi sağlanmalıdır. Bu middleware, Express'in `app.use()` zincirine en son eklenir.
*   **Stack Trace Yasağı:** Sunucu hata detayları (`stack`, `trace`, iç sistem bilgisi) **asla** istemciye gönderilmemelidir. Stack trace yalnızca sunucu taraflı loglama (örn: `console.error` veya loglama servisi) amacıyla kullanılmalıdır.
*   **Özel Hata Sınıfı:** Bilinçli olarak üretilen hatalar için `AppError` gibi bir özel hata sınıfı kullanılmalı; bu sayede `isOperational` bayrağı ile planlı hatalar (validation, not found) ile beklenmedik sistem hataları birbirinden ayrıştırılmalıdır.

**Hata Kategorileri ve HTTP Durum Kodları:**

| Hata Kategorisi | HTTP Kodu | Açıklama |
| --- | --- | --- |
| Validasyon Hatası | `422 Unprocessable Entity` | Zod veya schema doğrulama başarısız |
| Kimlik Doğrulama Hatası | `401 Unauthorized` | Token eksik, geçersiz veya süresi dolmuş |
| Yetki Hatası | `403 Forbidden` | Token geçerli ama işlem için yetki yok |
| Kaynak Bulunamadı | `404 Not Found` | İstenen kaynak mevcut değil |
| Çakışma Hatası | `409 Conflict` | Kaynak zaten mevcut (örn: e-posta) |
| Kötü İstek | `400 Bad Request` | Genel geçersiz istek |
| Sunucu Hatası | `500 Internal Server Error` | Beklenmedik sistem/uygulama hatası |

**Örnek `AppError` Sınıfı:**

```typescript
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}
```

**Örnek Global Error Handler Middleware:**

```typescript
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

export const globalErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Sunucu tarafında hatayı logla (stack görünür, istemciye gitmez)
  console.error(`[ERROR] ${err.message}`, err.stack);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      data: null,
      message: err.message,
      timestamp: new Date().toISOString(),
    });
  }

  // Beklenmedik hatalar için kullanıcı dostu mesaj
  return res.status(500).json({
    success: false,
    data: null,
    message: 'Sunucuda beklenmedik bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
    timestamp: new Date().toISOString(),
  });
};
```

> **Kural:** `throw new Error(...)` doğrudan kullanılmamalıdır. Bunun yerine her zaman `throw new AppError('Mesaj', statusCode)` kullanılarak hata türü ve HTTP kodu açıkça belirtilmelidir.
