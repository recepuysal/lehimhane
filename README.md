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
```

4. Deploy bitsin → Settings’ten public domain’i kopyala → `NEXTAUTH_URL`’yi o adresle güncelle → bir kez Redeploy
5. İlk açılışta demo: `demo@lehimhane.local` / `demo1234` (`SEED_ON_BOOT=1` ile)

`SEED_ON_BOOT` ilk kurulumdan sonra `0` yapman yeterli.

## Demo hesap

- E-posta: `demo@lehimhane.local`
- Şifre: `demo1234`

## Teknoloji

- Next.js (App Router) + TypeScript
- Tailwind CSS
- Prisma + SQLite
- NextAuth (Credentials)
