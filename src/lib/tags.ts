export function slugifyTag(input: string) {
  return input
    .trim()
    .toLocaleLowerCase("tr-TR")
    .replaceAll("ı", "i")
    .replaceAll("ğ", "g")
    .replaceAll("ü", "u")
    .replaceAll("ş", "s")
    .replaceAll("ö", "o")
    .replaceAll("ç", "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export function normalizeTags(raw: unknown): string[] {
  const values = Array.isArray(raw)
    ? raw
    : typeof raw === "string"
      ? raw.split(/[,\s]+/)
      : [];

  const cleaned = values
    .map((value) => String(value).replace(/^#/, "").trim())
    .map((value) => ({ name: value, slug: slugifyTag(value) }))
    .filter((tag) => tag.slug.length >= 2);

  const unique = new Map<string, string>();
  for (const tag of cleaned) {
    if (!unique.has(tag.slug)) {
      unique.set(tag.slug, tag.name.slice(0, 30));
    }
  }

  return Array.from(unique.entries())
    .slice(0, 5)
    .map(([slug, name]) => `${slug}::${name}`);
}

export function parseTagTokens(tokens: string[]) {
  return tokens.map((token) => {
    const [slug, ...rest] = token.split("::");
    return { slug, name: rest.join("::") || slug };
  });
}
