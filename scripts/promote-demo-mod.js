import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const demo = await prisma.user.updateMany({
    where: { email: "demo@lehimhane.local" },
    data: { role: "MOD" },
  });
  const pinned = await prisma.thread.updateMany({
    where: { title: { contains: "hoş geldiniz" } },
    data: { pinned: true },
  });
  console.log({ demo, pinned });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
