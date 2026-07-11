import { RankName, rankSlug } from "@/lib/ranks";

export function RankBadge({
  rank,
  compact = false,
}: {
  rank: string;
  compact?: boolean;
}) {
  const slug = rankSlug(rank);

  return (
    <span
      className={`rank-badge rank-${slug}${compact ? " rank-compact" : ""}`}
      title={rank}
    >
      {rank as RankName}
    </span>
  );
}
