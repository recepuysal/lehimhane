/**
 * DS18B20 + Arduino Uno projesini idempotent ekler/günceller.
 * Production (dolu DB) ve lokal için: node scripts/ensure-ds18b20-project.mjs
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TITLE = "Arduino Uno ile DS18B20 sıcaklık ölçümü (Serial)";

const CODE = `\`\`\`cpp
#include <OneWire.h>
#include <DallasTemperature.h>

// DS18B20 veri ucu (DQ) → Arduino D2
#define ONE_WIRE_BUS 2

OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);

void setup() {
  Serial.begin(9600);
  sensors.begin();
  Serial.println("DS18B20 + Arduino Uno");
}

void loop() {
  sensors.requestTemperatures();
  float celsius = sensors.getTempCByIndex(0);

  if (celsius == DEVICE_DISCONNECTED_C) {
    Serial.println("Sensor bulunamadi! Baglantiyi kontrol et.");
  } else {
    Serial.print("Sicaklik: ");
    Serial.print(celsius);
    Serial.println(" C");
  }

  delay(1000);
}
\`\`\``;

const PROJECT = {
  title: TITLE,
  summary:
    "DS18B20 özelliklerinden bağlantıya: Arduino Uno ile 1-Wire sıcaklık okuma ve Serial Monitor çıktısı.",
  body: `Bu projede **Arduino Uno** ve **DS18B20** dijital sıcaklık sensörünü kullanarak ölçümü **USB Serial (Serial Monitor)** üzerinden okuyoruz.

## DS18B20 nedir?
Dallas/Maxim’in **1-Wire** protokolüyle çalışan dijital sıcaklık sensörüdür. Analog okuma ve harici ADC gerekmez; veri hattından doğrudan °C gelir.

## Öne çıkan özellikler
- Ölçüm aralığı: **−55 °C … +125 °C**
- Tipik doğruluk: **±0.5 °C** (−10…+85 °C aralığında)
- Besleme: **3.0–5.5 V** (Uno 5V ile uyumlu)
- Çözünürlük: 9–12 bit (yazılımla seçilir)
- Aynı veri hattına birden fazla sensör bağlanabilir (unique 64-bit ROM)
- Su geçirmez metal kılıflı versiyonları sıvı/ortam ölçümü için popülerdir

## Bu projede ne yapacağız?
1. Uno + DS18B20 + **4.7kΩ pull-up** bağlantısı
2. OneWire + DallasTemperature kütüphaneleri
3. Sıcaklığı **9600 baud** Serial Monitor’da yazdırma

**Durum:** tamamlandı (bitti).`,
  platform: "Arduino",
  status: "bitti",
  coverUrl: "/demo/ds18b20.png",
  steps: [
    {
      order: 1,
      title: "1) DS18B20’ye kısa bakış",
      body: `TO-92 veya su geçirmez sonda formunda gelir. Üç bacak/kablo:

| Uç | Görev |
|----|--------|
| **VDD** | Besleme (5V) |
| **DQ** | 1-Wire veri |
| **GND** | Toprak |

Parazit güçlü (parasite power) modda VDD’yi GND’ye bağlayan kablolama da vardır; bu projede **normal 3 telli** besleme kullanıyoruz (daha güvenilir).`,
      imageUrl: "/demo/ds18b20.png",
    },
    {
      order: 2,
      title: "2) Devre bağlantısı (Uno × DS18B20)",
      body: `Breadboard üzerinde:

1. **VDD → Arduino 5V**
2. **GND → Arduino GND**
3. **DQ → Arduino dijital D2**
4. **4.7kΩ** direnci **DQ ile 5V arasına** (pull-up) — **zorunlu**. Yoksa iletişim düşer.

İpucu: Su geçirmez kabloluda genelde kırmızı=VDD, sarı/beyaz=DQ, siyah=GND olur; üretici etiketine bak.`,
      imageUrl: "/demo/ds18b20-wiring.png",
    },
    {
      order: 3,
      title: "3) Kütüphaneler",
      body: `Arduino IDE → **Tools → Manage Libraries**:

- **OneWire** (Paul Stoffregen)
- **DallasTemperature** (Miles Burton)

İkisini de kur, kart olarak **Arduino Uno** seç, USB ile bağla.`,
      imageUrl: "/demo/arduino.jpg",
    },
    {
      order: 4,
      title: "4) Kod (Serial’e sıcaklık yaz)",
      body: `Aşağıdaki sketch’i yükle. DQ hattı **D2**’ye bağlı olmalı.

${CODE}

\`DEVICE_DISCONNECTED_C\` (−127) gelirse kablo veya pull-up’ı kontrol et.`,
      imageUrl: "/demo/ds18b20-wiring.png",
    },
    {
      order: 5,
      title: "5) Serial Monitor ve sonuç",
      body: `1. **Tools → Serial Monitor**
2. Baud: **9600**
3. Her saniye \`Sicaklik: xx.xx C\` satırları akmalı

Parmakla sensöre dokununca değer yavaşça yükselir; bu da bağlantının doğru olduğunu gösterir.

**Bitti:** Uno + DS18B20 ile temel sıcaklık okuma tamam.`,
      imageUrl: "/demo/ds18b20.png",
    },
  ],
  supplies: [
    { order: 1, name: "Arduino Uno", quantity: "1", note: "veya Uno R3 uyumlu", link: "" },
    { order: 2, name: "DS18B20", quantity: "1", note: "TO-92 veya su geçirmez sonda", link: "" },
    { order: 3, name: "4.7kΩ direnç", quantity: "1", note: "DQ–5V pull-up", link: "" },
    { order: 4, name: "Breadboard + jumper", quantity: "1 set", note: "prototip bağlantı", link: "" },
    { order: 5, name: "USB kablo", quantity: "1", note: "besleme + Serial", link: "" },
  ],
};

async function main() {
  const author =
    (await prisma.user.findUnique({
      where: { email: "demo@lehimhane.local" },
    })) ??
    (await prisma.user.findFirst({ orderBy: { createdAt: "asc" } }));

  if (!author) {
    throw new Error("Kullanıcı yok. Önce seed çalıştır.");
  }

  const existing = await prisma.project.findFirst({
    where: { title: TITLE },
  });

  if (existing) {
    await prisma.projectStep.deleteMany({ where: { projectId: existing.id } });
    await prisma.projectSupply.deleteMany({ where: { projectId: existing.id } });
    await prisma.project.update({
      where: { id: existing.id },
      data: {
        summary: PROJECT.summary,
        body: PROJECT.body,
        platform: PROJECT.platform,
        status: PROJECT.status,
        coverUrl: PROJECT.coverUrl,
        authorId: author.id,
        steps: { create: PROJECT.steps },
        supplies: { create: PROJECT.supplies },
      },
    });
    console.log("updated project:", TITLE, existing.id);
  } else {
    const created = await prisma.project.create({
      data: {
        title: PROJECT.title,
        summary: PROJECT.summary,
        body: PROJECT.body,
        platform: PROJECT.platform,
        status: PROJECT.status,
        coverUrl: PROJECT.coverUrl,
        authorId: author.id,
        steps: { create: PROJECT.steps },
        supplies: { create: PROJECT.supplies },
      },
    });
    console.log("created project:", TITLE, created.id);
  }

  // Arduino kategori thread (forum)
  const arduino = await prisma.category.findUnique({ where: { slug: "arduino" } });
  if (arduino) {
    const threadTitle = "DS18B20 + Arduino Uno Serial sıcaklık okuma";
    const threadExists = await prisma.thread.findFirst({
      where: { title: threadTitle },
    });
    if (!threadExists) {
      await prisma.thread.create({
        data: {
          title: threadTitle,
          body: `Proje vitrinine **${TITLE}** eklendi.

DS18B20 özellikleri, 4.7k pull-up bağlantısı, OneWire/DallasTemperature kodu ve Serial Monitor adımları orada.

→ Projeler → Arduino filtresi veya ana sayfa proje galerisi.`,
          authorId: author.id,
          categoryId: arduino.id,
        },
      });
      console.log("created thread:", threadTitle);
    }
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
