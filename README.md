# Tüga Web Sitesi (V1.0)

**Tüga Web Sitesi**, Node.js, Express ve SQLite3 mimarisi üzerine kurulmuş; dinamik içerik sunumu, kullanıcı kimlik doğrulaması ve güvenli bir admin yönetim paneli içeren tam kapsamlı (full-stack) bir web uygulamasıdır.

---

## 🚀 Özellikler

- **Gelişmiş Backend Yapısı:** Express.js v5 ile hızlı, esnek ve modüler API/sunucu yönetimi.
- **Güvenli Kimlik Doğrulama:**
  - `bcryptjs` ile parolanın güvenli şekilde hash'lenmesi.
  - `jsonwebtoken` (JWT) entegrasyonu ile oturum ve Yetkilendirme (Auth) kontrolü.
- **Dinamik Veri Yönetimi:** SQLite3 veritabanı ile hafif, hızlı ve bağımsız veri depolama.
- **Yönetim (Admin) Paneli:** Özel korumalı `views/admin.html` arayüzü ile dinamik içerik ve etkinlik yönetimi.
- **Statik ve Arayüz Dosyaları:** `public/` dizini altında optimize edilmiş `index.html`, `etkinlikler.html` ve medya varlıkları (`logo.jpg`).
- **CORS ve Body Parsing:** API istekleri için tam uyumlu veri işleme altyapısı.

---

## 🛠️ Teknoloji Yığını

- **Çalışma Zamanı (Runtime):** Node.js
- **Sunucu / Web Framework:** Express.js (`^5.2.1`)
- **Veritabanı:** SQLite3 (`^6.0.1`)
- **Güvenlik ve Bağımlılıklar:**
  - `bcryptjs` (`^3.0.3`) – Şifre hashleme
  - `jsonwebtoken` (`^9.0.3`) – JWT tabanlı oturum yönetimi
  - `body-parser` (`^2.3.0`) – HTTP istek gövdesi işleme
  - `cors` (`^2.8.6`) – Güvenli kökenler arası kaynak paylaşımı

---

## 📁 Proje Dizin Yapısı

```text
tuga/
├── public/                # Genel erişime açık frontend dosyaları
│   ├── index.html         # Ana sayfa
│   ├── etkinlikler.html   # Etkinlikler listesi ve detayları
│   └── logo.jpg           # Site görselleri / logosu
├── views/                 # Sunucu tarafı / Admin paneli arayüzleri
│   └── admin.html         # Yönetici paneli
├── server.js              # Express sunucusu ve API rotaları
├── package.json           # Bağımlılıklar ve proje yapılandırması
├── LICENSE                # Proje lisansı
└── .gitignore             # Git tarafından izlenmeyen dosyalar (node_modules, database.db vb.)
```

---

## 💻 Kurulum ve Çalıştırma

### 1. Depoyu Klonlayın
```bash
git clone https://github.com/yigitefeersoy/tuga.git
cd tuga
```

### 2. Bağımlılıkları Yükleyin
```bash
npm install
```

### 3. Uygulamayı Başlatın
```bash
node server.js
```

Sunucu çalıştıktan sonra tarayıcınızdan `http://localhost:3000` (veya belirlediğiniz port) adresine giderek projeyi görüntüleyebilirsiniz.

---

## 📄 Lisans

Bu proje [MIT Lisansı](LICENSE) altında lisanslanmıştır.
