# Lehimhane

Elektronikçiler ve hobiciler için forum. Arduino, Raspberry Pi, STM32, PCB ve proje paylaşımı.

**Alan adı (hedef):** [lehimhane.com](https://lehimhane.com)

## Özellikler

- Elektronik kategorileri
- Konu açma / yanıtlama
- Rütbe sistemi (mesaj sayısına göre)
- Kayıt / giriş / çıkış

## Rütbeler

| Rütbe | Mesaj |
|--------|--------|
| Acemi Pin | 0–4 |
| Direnç Avcısı | 5–19 |
| Devre Kurucu | 20–49 |
| MCU Ustası | 50–99 |
| Full Stack Hacker | 100+ |

## Kurulum

```bash
cd C:\Users\Uysal\Desktop\forum
npm install
npx prisma migrate dev
npm run db:seed
npm run dev
```

Tarayıcı: [http://localhost:3000](http://localhost:3000)

## Demo görseller

`public/demo/` altında Arduino, STM32, Raspberry Pi, PCB ve tezgah görselleri var.
Mevcut DB’ye örnek proje eklemek için (veri silmez):

```bash
node scripts/enrich-demo-content.js
```

### Yerel PC denemesi (domain / Railway şart değil)

LabStock’taki gibi PC’de çalıştırırsın; bilgisayar kapanınca site de kapanır.

```bash
npm install
npx prisma migrate dev
npm run db:seed
npm run dev
```

Tarayıcı: [http://localhost:3000](http://localhost:3000)

`.env.local` içinde `MAIL_DEV_MODE=1` varken kayıt sonrası **doğrulama linki sayfada** çıkar (Resend domain gerekmez). İstersen `RESEND_API_KEY` ekleyerek kendi iCloud’una mail de deneyebilirsin.

## Railway ile yayın

1. Railway → **New Project** → **Deploy from GitHub** → `lehimhane`
2. Servise **Volume** ekle, mount path: `/data`
3. **Variables** ekle:

```
DATABASE_URL=file:/data/prod.db
NEXTAUTH_URL=https://SENIN-PROJE.up.railway.app
NEXTAUTH_SECRET=buraya-uzun-rastgele-yazi
UPLOAD_ROOT=/data/uploads
SEED_ON_BOOT=1
RESEND_API_KEY=re_xxxxxxxx
EMAIL_FROM=Lehimhane <onboarding@resend.dev>
```

Railway Variables’da değere **tırnak koyma**. Yanlış: `"Lehimhane <...>"` · Doğru: `Lehimhane <onboarding@resend.dev>`  
Sadece adres de olur: `onboarding@resend.dev`

4. Deploy bitsin → Settings’ten public domain’i kopyala → `NEXTAUTH_URL`’yi o adresle güncelle → bir kez Redeploy
5. İlk açılışta demo: `demo@lehimhane.local` / `demo1234` (`SEED_ON_BOOT=1` ile)

`SEED_ON_BOOT` ilk kurulumdan sonra `0` yapman yeterli.

### E-posta (Resend)

- `RESEND_API_KEY` tanımlıysa kayıt sonrası **e-posta doğrulama zorunlu** olur; şifre sıfırlama mailleri de gönderilir.
- Domain doğrulanana kadar gönderen: `Lehimhane <onboarding@resend.dev>` (veya sadece `onboarding@resend.dev`).
- Kendi domain’in hazır olunca Resend → Domains’de SPF/DKIM doğrula ve örn. `EMAIL_FROM=Lehimhane <noreply@lehimhane.com>` yap.
- API anahtarını koda veya GitHub’a yazma; yalnızca Railway Variables’a koy.

## Demo hesap

- E-posta: `demo@lehimhane.local`
- Şifre: `demo1234`

## Teknoloji

- Next.js (App Router) + TypeScript
- Tailwind CSS
- Prisma + SQLite
- NextAuth (Credentials)
