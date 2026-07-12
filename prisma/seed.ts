import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { rankFromPostCount } from "../src/lib/ranks";

const prisma = new PrismaClient();

async function main() {
  // Bağımlı kayıtlar önce — FK kırılmadan temiz seed
  await prisma.notification.deleteMany();
  await prisma.projectComment.deleteMany();
  await prisma.projectVote.deleteMany();
  await prisma.projectImage.deleteMany();
  await prisma.projectStep.deleteMany();
  await prisma.projectSupply.deleteMany();
  await prisma.project.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.threadVote.deleteMany();
  await prisma.replyVote.deleteMany();
  await prisma.threadTag.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.authToken.deleteMany();
  await prisma.reply.deleteMany();
  await prisma.thread.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await hash("demo1234", 10);
  const verifiedAt = new Date();

  const demoUser = await prisma.user.create({
    data: {
      name: "Demo Maker",
      email: "demo@lehimhane.local",
      passwordHash,
      emailVerified: verifiedAt,
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
      emailVerified: verifiedAt,
      postCount: 1,
      rank: rankFromPostCount(1),
    },
  });

  await prisma.user.create({
    data: {
      name: "STM32 Ustası",
      email: "ustas@lehimhane.local",
      passwordHash,
      emailVerified: verifiedAt,
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
  const stm32 = categories.find((c) => c.slug === "stm32-arm")!;
  const pi = categories.find((c) => c.slug === "raspberry-pi")!;

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

  await prisma.thread.create({
    data: {
      title: "STM32F4 Discovery ile ilk HAL projesi",
      body: "Discovery kartında LED + buton interrupt örneği. CubeMX ayarlarını paylaşalım.",
      authorId: demoUser.id,
      categoryId: stm32.id,
    },
  });

  await prisma.thread.create({
    data: {
      title: "Pi 4 kamera modülü odak sorunu",
      body: "Raspberry Pi Camera Module v2 ile fotoğraflar soft çıkıyor. libcamera ayar önerisi?",
      authorId: demoUser.id,
      categoryId: pi.id,
    },
  });

  const demoProjects = [
    {
      title: "Arduino ile LED nefes efekti",
      summary:
        "PWM ile yumuşak LED fade. Breadboard üzerinde 5 dakikada kurabileceğin giriş projesi.",
      body: "Arduino Uno ile PWM LED nefes efekti.\n\n**Gerekenler:** Uno, LED, 220Ω.",
      platform: "Arduino",
      status: "bitti",
      coverUrl: "/demo/arduino.jpg",
      stepTitle: "Bağlantı ve kod",
      stepBody: "LED D9'a, PWM ile 0–255 salınım.",
    },
    {
      title: "STM32 Blue Pill blink & debug",
      summary: "CubeMX + HAL ile PC13 blink. ST-Link ve ilk debug.",
      body: "STM32F103 Blue Pill ilk blink.",
      platform: "STM32",
      status: "devam",
      coverUrl: "/demo/stm32.jpg",
      stepTitle: "CubeMX ayarı",
      stepBody: "PC13 output, HAL_GPIO_TogglePin + delay.",
    },
    {
      title: "Raspberry Pi GPIO ile röle kontrol",
      summary: "Python ile GPIO röle sürme ve güvenlik notları.",
      body: "Pi 4 röle kontrolü. Optocoupler izolasyonuna dikkat.",
      platform: "Raspberry Pi",
      status: "fikir",
      coverUrl: "/demo/raspberry-pi.jpg",
      stepTitle: "Python ile pin aç/kapa",
      stepBody: "gpiozero ile OUT pin; aktif-low invert.",
    },
  ];

  for (const project of demoProjects) {
    await prisma.project.create({
      data: {
        title: project.title,
        summary: project.summary,
        body: project.body,
        platform: project.platform,
        status: project.status,
        coverUrl: project.coverUrl,
        authorId: demoUser.id,
        steps: {
          create: [
            {
              order: 1,
              title: project.stepTitle,
              body: project.stepBody,
              imageUrl: project.coverUrl,
            },
          ],
        },
        supplies: {
          create: [
            {
              order: 1,
              name: project.platform,
              quantity: "1",
              note: "Demo",
              link: "",
            },
          ],
        },
      },
    });
  }
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
