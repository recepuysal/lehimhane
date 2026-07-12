import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEMO_PROJECTS = [
  {
    title: "Arduino ile LED nefes efekti",
    summary:
      "PWM ile yumuşak LED fade. Breadboard üzerinde 5 dakikada kurabileceğin giriş projesi.",
    body: "Bu projede Arduino Uno ile bir LED'e PWM uygulayarak nefes alan bir ışık efekti oluşturuyoruz.\n\n**Gerekenler:** Uno, LED, 220Ω direnç, breadboard.",
    platform: "Arduino",
    status: "bitti",
    coverUrl: "/demo/arduino.svg",
    stepTitle: "Bağlantı ve kod",
    stepBody:
      "LED anodu D9'a, katodu direnç üzerinden GND'ye. `analogWrite` ile 0–255 arasında salınım yaptır.",
  },
  {
    title: "STM32 Blue Pill blink & debug",
    summary:
      "CubeMX + HAL ile PC13 blink. ST-Link bağlantısı ve ilk debug oturumu.",
    body: "STM32F103 (Blue Pill) kartında ilk blink projesi.\n\nCubeMX'te PC13'ü GPIO_Output yap, HAL_GPIO_TogglePin ile döngü kur.",
    platform: "STM32",
    status: "devam",
    coverUrl: "/demo/stm32.svg",
    stepTitle: "CubeMX ayarı",
    stepBody:
      "SYS → Debug: Serial Wire. PC13 output. Generate code, main while içinde 200ms delay + toggle.",
  },
  {
    title: "Raspberry Pi GPIO ile röle kontrol",
    summary:
      "Python ile GPIO pininden röle sürme. Optocoupler ve güvenlik notları dahil.",
    body: "Pi 4 üzerinde bir röle modülünü güvenli şekilde sürmek için temel adımlar.\n\n**Uyarı:** Şebeke tarafına dokunmadan önce izolasyonu doğrula.",
    platform: "Raspberry Pi",
    status: "fikir",
    coverUrl: "/demo/raspberry-pi.svg",
    stepTitle: "Python ile pin aç/kapa",
    stepBody:
      "`gpiozero` veya RPi.GPIO ile OUT pin. Aktif-low rölelerde invert mantığına dikkat et.",
  },
];

async function main() {
  const author =
    (await prisma.user.findUnique({
      where: { email: "demo@lehimhane.local" },
    })) ??
    (await prisma.user.findFirst({ orderBy: { createdAt: "asc" } }));

  if (!author) {
    throw new Error("Kullanıcı yok. Önce seed çalıştır.");
  }

  const stm32Cat = await prisma.category.findUnique({
    where: { slug: "stm32-arm" },
  });
  const piCat = await prisma.category.findUnique({
    where: { slug: "raspberry-pi" },
  });

  for (const project of DEMO_PROJECTS) {
    const existing = await prisma.project.findFirst({
      where: { title: project.title, authorId: author.id },
    });
    if (existing) {
      await prisma.project.update({
        where: { id: existing.id },
        data: { coverUrl: project.coverUrl },
      });
      console.log("updated cover", project.title);
      continue;
    }

    await prisma.project.create({
      data: {
        title: project.title,
        summary: project.summary,
        body: project.body,
        platform: project.platform,
        status: project.status,
        coverUrl: project.coverUrl,
        authorId: author.id,
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
              name: project.platform === "Arduino" ? "Arduino Uno" : project.platform,
              quantity: "1",
              note: "Demo malzeme",
              link: "",
            },
          ],
        },
      },
    });
    console.log("created project", project.title);
  }

  if (stm32Cat) {
    const title = "STM32F4 Discovery ile ilk HAL projesi";
    const exists = await prisma.thread.findFirst({ where: { title } });
    if (!exists) {
      await prisma.thread.create({
        data: {
          title,
          body: "Discovery kartında LED + buton interrupt örneği arıyorum. CubeMX ayarlarını paylaşır mısınız?\n\nKapak referansı: demo STM32 görseli.",
          authorId: author.id,
          categoryId: stm32Cat.id,
        },
      });
      console.log("created thread", title);
    }
  }

  if (piCat) {
    const title = "Pi 4 kamera modülü odak sorunu";
    const exists = await prisma.thread.findFirst({ where: { title } });
    if (!exists) {
      await prisma.thread.create({
        data: {
          title,
          body: "Raspberry Pi Camera Module v2 ile fotoğraflar soft çıkıyor. `libcamera` ayar önerisi olan var mı?",
          authorId: author.id,
          categoryId: piCat.id,
        },
      });
      console.log("created thread", title);
    }
  }

  // Mevcut kapaksız projelere platforma göre demo kapak
  const bare = await prisma.project.findMany({
    where: { OR: [{ coverUrl: null }, { coverUrl: "" }] },
  });
  for (const project of bare) {
    const cover =
      project.platform === "Arduino"
        ? "/demo/arduino.svg"
        : project.platform === "STM32"
          ? "/demo/stm32.svg"
          : project.platform === "Raspberry Pi"
            ? "/demo/raspberry-pi.svg"
            : "/demo/pcb.svg";
    await prisma.project.update({
      where: { id: project.id },
      data: { coverUrl: cover },
    });
    console.log("backfilled cover", project.title);
  }

  console.log("enrich done");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
