"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { RankBadge } from "@/components/rank-badge";
import { HeaderSearch } from "@/components/header-search";

function UnreadBadge() {
  const { status } = useSession();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (status !== "authenticated") {
      setCount(0);
      return;
    }
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch("/api/notifications/unread-count");
        if (!response.ok) return;
        const data = await response.json();
        if (!cancelled) setCount(Number(data.unreadCount) || 0);
      } catch {
        // sessiz
      }
    }
    void load();
    const timer = window.setInterval(load, 30000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [status]);

  if (count <= 0) return null;
  return <span className="notif-count">{count > 99 ? "99+" : count}</span>;
}

export function Header() {
  const { data: session, status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link href="/" className="brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/lehimhane-logo.png"
            alt=""
            className="brand-logo"
            width={40}
            height={40}
          />
          <span className="brand-text">Lehimhane</span>
        </Link>

        <div className="header-tools">
          <HeaderSearch />

          {status === "authenticated" ? (
            <div className="header-account">
              <Link
                href={`/profil/${session.user?.id}`}
                className="user-chip user-chip-link"
              >
                {session.user?.name}
                {session.user?.rank ? (
                  <RankBadge rank={session.user.rank} compact />
                ) : null}
              </Link>
              <Link href="/profil/duzenle" className="btn btn-ghost">
                Profil
              </Link>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                Çıkış
              </button>
            </div>
          ) : status !== "loading" ? (
            <div className="header-auth">
              <Link href="/giris" className="btn btn-ghost">
                Giriş Yap
              </Link>
              <Link href="/kayit" className="btn btn-primary">
                Kayıt Ol
              </Link>
            </div>
          ) : null}

          <div className="header-menu" ref={menuRef}>
            <button
              type="button"
              className="hamburger-btn"
              aria-label="Menüyü aç"
              aria-expanded={menuOpen}
              aria-controls="header-menu-panel"
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span className="hamburger-lines" aria-hidden>
                <span />
                <span />
                <span />
              </span>
            </button>

            {menuOpen ? (
              <div
                id="header-menu-panel"
                className="hamburger-panel"
                role="menu"
              >
                <Link href="/" role="menuitem" onClick={closeMenu}>
                  Forum
                </Link>
                <Link href="/projeler" role="menuitem" onClick={closeMenu}>
                  Projeler
                </Link>
                {status === "authenticated" ? (
                  <>
                    <Link
                      href="/yeni-konu"
                      role="menuitem"
                      onClick={closeMenu}
                    >
                      Yeni konu
                    </Link>
                    <Link
                      href="/bildirimler"
                      role="menuitem"
                      className="hamburger-notif"
                      onClick={closeMenu}
                    >
                      Bildirimler
                      <UnreadBadge />
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/giris" role="menuitem" onClick={closeMenu}>
                      Giriş
                    </Link>
                    <Link href="/kayit" role="menuitem" onClick={closeMenu}>
                      Kayıt ol
                    </Link>
                  </>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
