const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

function cleanupBody(body) {
  return body
    .replace(/\[metin\]\(https?:\/\/\)/gi, "")
    .replace(/\*\*metin\*\*/gi, "")
    .replace(/(^|[^*])\*([^*\n]+)\*\*\*/g, "$1**$2**")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function main() {
  const replies = await prisma.reply.findMany();
  let updated = 0;

  for (const reply of replies) {
    const next = cleanupBody(reply.body);
    if (next !== reply.body) {
      await prisma.reply.update({
        where: { id: reply.id },
        data: { body: next || reply.body },
      });
      updated += 1;
      console.log("fixed:", reply.id, "=>", next);
    }
  }

  console.log("updated", updated);
}

main()
  .finally(() => prisma.$disconnect());
