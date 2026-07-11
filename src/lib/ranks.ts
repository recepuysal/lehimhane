export const RANK_THRESHOLDS = [
  { min: 100, name: "Full Stack Hacker" },
  { min: 50, name: "MCU Ustası" },
  { min: 20, name: "Devre Kurucu" },
  { min: 5, name: "Direnç Avcısı" },
  { min: 0, name: "Acemi Pin" },
] as const;

export type RankName = (typeof RANK_THRESHOLDS)[number]["name"];

export function rankFromPostCount(postCount: number): RankName {
  for (const tier of RANK_THRESHOLDS) {
    if (postCount >= tier.min) {
      return tier.name;
    }
  }
  return "Acemi Pin";
}

export function rankSlug(rank: string): string {
  return rank
    .toLocaleLowerCase("tr-TR")
    .replaceAll("ı", "i")
    .replaceAll("ğ", "g")
    .replaceAll("ü", "u")
    .replaceAll("ş", "s")
    .replaceAll("ö", "o")
    .replaceAll("ç", "c")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-]/g, "");
}
