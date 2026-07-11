const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const replies = await prisma.reply.findMany({
    orderBy: { createdAt: "desc" },
    take: 8,
    include: { author: { select: { name: true } } },
  });

  for (const reply of replies) {
    console.log("---");
    console.log(reply.author.name);
    console.log(reply.body);
  }
}

main()
  .finally(() => prisma.$disconnect());
