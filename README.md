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

## Demo hesap

- E-posta: `demo@lehimhane.local`
- Şifre: `demo1234`

## Teknoloji

- Next.js (App Router) + TypeScript
- Tailwind CSS
- Prisma + SQLite
- NextAuth (Credentials)
