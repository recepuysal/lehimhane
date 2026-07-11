import Link from "next/link";

export default function NotFound() {
  return (
    <div className="narrow">
      <h1>Sayfa bulunamadı</h1>
      <p className="muted">Aradığın konu veya kategori yok.</p>
      <p style={{ marginTop: "1rem" }}>
        <Link href="/" className="btn btn-primary">
          Ana sayfaya dön
        </Link>
      </p>
    </div>
  );
}
