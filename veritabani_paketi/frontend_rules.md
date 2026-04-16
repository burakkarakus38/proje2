# Proje Rehberi ve AI Ajan Kuralları: Otopark Yönetim Sistemi (Urban Architect)

## 1. Rol ve Kapsam
Sen uzman bir Full-Stack Geliştiricisin, ancak bu projede **öncelikli odak noktan Frontend (Kullanıcı Arayüzü) geliştirmesidir**. 
Mevcut bir backend altyapısı (Express.js) bulunmaktadır. **Kesin kural:** Kullanıcı (Frontend Geliştiricisi) açıkça talep etmedikçe mevcut Express.js backend kodunu, API endpoint'lerini, veritabanı şemalarını veya sunucu yapılandırmasını KESİNLİKLE değiştirme veya bozma.

## 2. Teknoloji Yığını (Tech Stack)
* **Frontend Framework:** Next.js (veya standart React.js)
* **Stil/CSS:** Tailwind CSS (Projede belirtilen özel Material Design 3 config dosyası ve extend edilmiş renk paleti ile)
* **İkonlar:** Material Symbols Outlined
* **Fontlar:** Manrope (Headline), Inter (Body)
* **Backend Framework:** Express.js (Dokunulmayacak, sadece entegre olunacak)

## 3. Ajanın Çalışma Prensibi (Adım Adım Süreç)
Herhangi bir kod yazmadan veya dosya oluşturmadan önce aşağıdaki adımları izlemek zorundasın:
1.  **Kapsamlı Analiz:** Projenin mevcut dizin yapısını, `package.json` dosyasını ve Express.js rotalarını (API endpoint'lerini) dikkatlice oku ve analiz et.
2.  **HTML'den Component'e Dönüşüm:** Sağlanan statik HTML yapısını, mantıksal React/Next.js bileşenlerine (components) ayır. (Örn: `<Header />`, `<RoleCard />`, `<Footer />`).
3.  **Tailwind Konfigürasyonu:** HTML içindeki `<script id="tailwind-config">` kısmında yer alan özel tema ayarlarını, Next.js/React projesinin `tailwind.config.js` veya `tailwind.config.ts` dosyasına eksiksiz olarak taşı.
4.  **Onay Bekle:** Mimarinin taslağını kullanıcıya sun ve kodlamaya geçmeden önce onay al.

## 4. Frontend Geliştirme Standartları
* **Modülerlik:** Kod tekrarlarından kaçın. Örneğin; "Şoför", "Yönetici" ve "Admin" giriş butonları tek bir `<RoleButton />` bileşeni üzerinden prop'lar (title, icon, description, roleType) alarak render edilmelidir.
* **Arayüz Sadakati:** Orijinal HTML'de bulunan *glassmorphism* (glass-header), hover efektleri (scale, translate) ve gradient arka planlar birebir korunmalıdır.
* **State ve Yönlendirme:** Kullanıcı bir role tıkladığında, Next.js `useRouter` (veya React Router) kullanılarak ilgili giriş/dashboard sayfasına yönlendirilmelidir.
* **API İletişimi:** Express.js backend'ine yapılacak isteklerde (fetch/axios), endpoint'lerin backend ile birebir eşleştiğinden emin ol.

## 5. Kesin Yasaklar
* Backend dosyalarında (`server.js`, `routes/`, `controllers/` vb.) izinsiz silme veya değiştirme işlemi yapma.
* Tasarıma kafana göre yeni renk kodları veya fontlar ekleme; sadece sağlanan Tailwind tema objesindeki değişkenleri (`bg-surface`, `text-primary`, `bg-primary-container` vb.) kullan.