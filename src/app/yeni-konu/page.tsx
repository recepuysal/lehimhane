import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NewThreadForm } from "@/components/new-thread-form";

export const dynamic = "force-dynamic";

export default async function NewThreadPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/giris");
  }

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="narrow">
      <h1>Yeni konu</h1>
      <p className="muted">
        Arduino, Pi, STM32 veya PCB — kategori seç, sorunu veya projeni yaz.
      </p>
      <NewThreadForm categories={categories} />
    </div>
  );
}
