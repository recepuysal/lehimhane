import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { rankFromPostCount } from "../src/lib/ranks";

const prisma = new PrismaClient();

async function main() {
  await prisma.reply.deleteMany();
  await prisma.thread.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await hash("demo1234", 10);

  const demoUser = await prisma.user.create({
    data: {
      name: "Demo Maker",
      email: "demo@lehimhane.local",
      passwordHash,
      postCount: 12,
      rank: rankFromPostCount(12),
      role: "MOD",
    },
  });

  await prisma.user.create({
    data: {
      name: "Acemi Pin",
      email: "acemi@lehimhane.local",
      passwordHash,
      postCount: 1,
      rank: rankFromPostCount(1),
    },
  });

  await prisma.user.create({
    data: {
      name: "STM32 Ustası",
      email: "ustas@lehimhane.local",
      passwordHash,
      postCount: 75,
      rank: rankFromPostCount(75),
    },
  });

  const categories = await Promise.all(
    [
      {
        name: "Genel",
        slug: "genel",
        description: "Tanışma, sohbet ve genel elektronik muhabbeti.",
      },
      {
        name: "Arduino",
        slug: "arduino",
        description: "Uno, Nano, ESP ile sketch, sensör ve shield projeleri.",
      },
      {
        name: "Raspberry Pi",
        slug: "raspberry-pi",
        description: "Pi OS, GPIO, kamera, IoT ve Linux tabanlı projeler.",
      },
      {
        name: "STM32 / ARM",
        slug: "stm32-arm",
        description: "CubeMX, HAL, bare-metal ve debug ipuçları.",
      },
      {
        name: "PCB & Elektronik",
        slug: "pcb-elektronik",
        description: "Şematik, PCB tasarım, lehim, güç ve analog/digital.",
      },
      {
        name: "Proje Vitrini",
        slug: "proje-vitrini",
        description: "Bitmiş veya devam eden projelerini sergile.",
      },
      {
        name: "Alım-Satım",
        slug: "alim-satim",
        description: "Modül, kart ve ekipman ilanları.",
      },
      {
        name: "Duyurular",
        slug: "duyurular",
        description: "Lehimhane topluluk duyuruları.",
      },
    ].map((category) => prisma.category.create({ data: category })),
  );

  const arduino = categories.find((c) => c.slug === "arduino")!;
  const genel = categories.find((c) => c.slug === "genel")!;

  const welcome = await prisma.thread.create({
    data: {
      title: "Lehimhane'ye hoş geldiniz!",
      body: "Elektronikçiler ve hobiciler için topluluk forumu.\n\nArduino, Raspberry Pi, STM32, PCB ve proje konularını açabilirsin.\n\nDemo hesap: demo@lehimhane.local / demo1234\nRütbeler mesaj sayına göre yükselir.\nSite: lehimhane.com",
      authorId: demoUser.id,
      categoryId: genel.id,
      pinned: true,
    },
  });

  await prisma.reply.create({
    data: {
      body: "İlk lehimini at, ilk sketch'ini paylaş. Konu açmaktan çekinme!",
      authorId: demoUser.id,
      threadId: welcome.id,
    },
  });

  await prisma.thread.create({
    data: {
      title: "Arduino Nano ile DHT22 nem ölçümü",
      body: "Nano + DHT22 + 4.7k pull-up ile nem/sıcaklık okuyorum. Kod ve bağlantı şemasını paylaşmak isteyen var mı? Özellikle uzun kablo ile gürültü yaşayanlar deneyimini yazsın.",
      authorId: demoUser.id,
      categoryId: arduino.id,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
