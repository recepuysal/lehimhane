const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const projects = await prisma.project.findMany({
    include: { steps: true },
  });

  let migrated = 0;
  for (const project of projects) {
    if (project.steps.length > 0) continue;
    await prisma.projectStep.create({
      data: {
        projectId: project.id,
        order: 1,
        title: "Adım 1",
        body: project.body || project.summary || "Proje anlatımı",
        imageUrl: project.coverUrl,
      },
    });
    migrated += 1;
  }

  console.log("migrated_projects", migrated);
}

main().finally(() => prisma.$disconnect());
