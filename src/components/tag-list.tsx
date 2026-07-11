import Link from "next/link";

type TagItem = {
  slug: string;
  name: string;
};

export function TagList({ tags }: { tags: TagItem[] }) {
  if (tags.length === 0) return null;

  return (
    <div className="tag-list">
      {tags.map((tag) => (
        <Link key={tag.slug} href={`/etiket/${tag.slug}`} className="tag-chip">
          #{tag.name}
        </Link>
      ))}
    </div>
  );
}
