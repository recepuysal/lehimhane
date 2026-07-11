"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { RankBadge } from "@/components/rank-badge";
import { NotificationBell } from "@/components/notification-bell";
import { HeaderSearch } from "@/components/header-search";

export function Header() {
  const { data: session, status } = useSession();

  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link href="/" className="brand">
          Lehimhane
        </Link>

        <nav className="header-nav" aria-label="Ana menü">
          <HeaderSearch />
          <Link href="/">Forum</Link>
          <Link href="/projeler">Projeler</Link>
          {status === "authenticated" ? (
            <>
              <Link href="/yeni-konu" className="btn btn-primary">
                Yeni konu
              </Link>
              <NotificationBell />
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
            </>
          ) : (
            <>
              <Link href="/giris">Giriş</Link>
              <Link href="/kayit" className="btn btn-primary">
                Kayıt ol
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
