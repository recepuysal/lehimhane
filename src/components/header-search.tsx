"use client";

import { FormEvent } from "react";
import { useRouter } from "next/navigation";

export function HeaderSearch() {
  const router = useRouter();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const q = String(new FormData(form).get("q") ?? "").trim();
    if (!q) {
      router.push("/ara");
      return;
    }
    router.push(`/ara?q=${encodeURIComponent(q)}`);
  }

  return (
    <form className="header-search" onSubmit={onSubmit} role="search">
      <label className="sr-only" htmlFor="header-search-q">
        Konu ara
      </label>
      <input
        id="header-search-q"
        name="q"
        type="search"
        placeholder="Konu ara..."
        autoComplete="off"
      />
      <button type="submit" className="header-search-submit">
        Ara
      </button>
    </form>
  );
}
