export const PROJECT_PLATFORMS = [
  "Arduino",
  "Raspberry Pi",
  "STM32",
  "ESP32",
  "PCB",
  "Diğer",
] as const;

export const PROJECT_STATUSES = ["fikir", "devam", "bitti"] as const;

export const STATUS_LABEL: Record<string, string> = {
  fikir: "Fikir",
  devam: "Devam ediyor",
  bitti: "Bitti",
};

export type StepInput = {
  title: string;
  body: string;
  existingImageUrl?: string | null;
};

export type SupplyInput = {
  name: string;
  quantity: string;
  note: string;
  link: string;
};

function normalizeSupplyLink(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^[\w.-]+\.[a-z]{2,}(\/.*)?$/i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return "";
}

export function parseProjectMeta(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const platform = String(formData.get("platform") ?? "").trim();
  const status = String(formData.get("status") ?? "devam").trim();

  if (title.length < 3 || title.length > 100) {
    return { error: "Başlık 3–100 karakter olmalı" } as const;
  }
  if (summary.length < 10 || summary.length > 220) {
    return { error: "Kısa özet 10–220 karakter olmalı" } as const;
  }
  if (body.length > 4000) {
    return { error: "Giriş yazısı en fazla 4000 karakter olabilir" } as const;
  }
  if (!(PROJECT_PLATFORMS as readonly string[]).includes(platform)) {
    return { error: "Platform seçilmeli" } as const;
  }
  if (!(PROJECT_STATUSES as readonly string[]).includes(status)) {
    return { error: "Geçersiz durum" } as const;
  }

  return { title, summary, body, platform, status } as const;
}

export function parseStepsJson(raw: FormDataEntryValue | null): StepInput[] | { error: string } {
  try {
    const parsed = JSON.parse(String(raw ?? "[]")) as StepInput[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return { error: "En az bir adım eklemelisin" };
    }
    if (parsed.length > 12) {
      return { error: "En fazla 12 adım ekleyebilirsin" };
    }

    const steps = parsed.map((step, index) => ({
      title: String(step.title ?? "").trim() || `Adım ${index + 1}`,
      body: String(step.body ?? "").trim(),
      existingImageUrl: step.existingImageUrl ?? null,
    }));

    if (steps.some((step) => step.body.length < 5)) {
      return { error: "Her adım en az 5 karakter olmalı" };
    }

    return steps;
  } catch {
    return { error: "Adım verisi geçersiz" };
  }
}

export function parseSuppliesJson(
  raw: FormDataEntryValue | null,
): SupplyInput[] | { error: string } {
  try {
    const parsed = JSON.parse(String(raw ?? "[]")) as SupplyInput[];
    if (!Array.isArray(parsed)) {
      return { error: "Malzeme listesi geçersiz" };
    }
    if (parsed.length > 30) {
      return { error: "En fazla 30 malzeme ekleyebilirsin" };
    }

    const supplies: SupplyInput[] = [];
    for (const item of parsed) {
      const name = String(item.name ?? "").trim();
      if (!name) continue;

      const linkRaw = String(item.link ?? "").trim();
      const link = linkRaw ? normalizeSupplyLink(linkRaw) : "";
      if (linkRaw && !link) {
        return {
          error: `"${name}" için geçerli bir malzeme linki gir (https://...)`,
        };
      }

      supplies.push({
        name,
        quantity: String(item.quantity ?? "").trim().slice(0, 60),
        note: String(item.note ?? "").trim().slice(0, 120),
        link,
      });
    }

    return supplies;
  } catch {
    return { error: "Malzeme listesi geçersiz" };
  }
}
