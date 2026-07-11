"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  target: "thread" | "reply" | "project";
  targetId: string;
  initialCount: number;
  initiallyLiked: boolean;
  isAuthenticated: boolean;
};

export function LikeButton({
  target,
  targetId,
  initialCount,
  initiallyLiked,
  isAuthenticated,
}: Props) {
  const router = useRouter();
  const [count, setCount] = useState(initialCount);
  const [liked, setLiked] = useState(initiallyLiked);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (!isAuthenticated) {
      router.push("/giris");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target, id: targetId }),
      });
      const data = await response.json();
      if (response.ok) {
        setCount(data.likeCount);
        setLiked(Boolean(data.liked));
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      className={`like-btn${liked ? " like-btn-active" : ""}`}
      onClick={() => void toggle()}
      disabled={loading}
      aria-pressed={liked}
    >
      <span aria-hidden>{liked ? "♥" : "♡"}</span>
      <span>{liked ? "Beğenildi" : "Beğen"}</span>
      <span className="like-count">{count}</span>
    </button>
  );
}
