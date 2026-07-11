"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

type ProfileValues = {
  name: string;
  bio: string;
  location: string;
  website: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
};

export function ProfileEditForm({ initial }: { initial: ProfileValues }) {
  const router = useRouter();
  const { update } = useSession();
  const [values, setValues] = useState(initial);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<"avatar" | "banner" | null>(null);

  async function uploadImage(kind: "avatar" | "banner", file: File) {
    setError("");
    setMessage("");
    setUploading(kind);

    const formData = new FormData();
    formData.append("kind", kind);
    formData.append("file", file);

    const response = await fetch("/api/profile/upload", {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    setUploading(null);

    if (!response.ok) {
      setError(data.error ?? "Yükleme başarısız");
      return;
    }

    setValues((prev) => ({
      ...prev,
      avatarUrl: data.user.avatarUrl,
      bannerUrl: data.user.bannerUrl,
    }));
    setMessage(kind === "avatar" ? "Profil fotoğrafı güncellendi." : "Arka plan güncellendi.");
    router.refresh();
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);

    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: values.name,
        bio: values.bio,
        location: values.location,
        website: values.website,
      }),
    });

    const data = await response.json();
    setSaving(false);

    if (!response.ok) {
      setError(data.error ?? "Kayıt başarısız");
      return;
    }

    await update({ name: data.user.name });
    setMessage("Profil bilgilerin kaydedildi.");
    router.refresh();
  }

  return (
    <div className="stack">
      <section className="profile-media-editor panel">
        <div
          className="profile-banner"
          style={
            values.bannerUrl
              ? { backgroundImage: `url(${values.bannerUrl})` }
              : undefined
          }
        />
        <div className="profile-media-controls">
          <div className="profile-avatar-wrap">
            {values.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={values.avatarUrl} alt="Avatar" className="profile-avatar" />
            ) : (
              <div className="profile-avatar profile-avatar-fallback">
                {values.name.slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>
          <div className="profile-upload-actions">
            <label className="btn btn-ghost file-btn">
              {uploading === "avatar" ? "Yükleniyor..." : "Fotoğraf seç"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                hidden
                disabled={uploading !== null}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void uploadImage("avatar", file);
                  event.target.value = "";
                }}
              />
            </label>
            <label className="btn btn-ghost file-btn">
              {uploading === "banner" ? "Yükleniyor..." : "Arka plan seç"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                hidden
                disabled={uploading !== null}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void uploadImage("banner", file);
                  event.target.value = "";
                }}
              />
            </label>
          </div>
        </div>
      </section>

      <form className="composer" onSubmit={onSubmit}>
        <label>
          Görünen isim
          <input
            value={values.name}
            onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
            required
            minLength={2}
            maxLength={50}
          />
        </label>
        <label>
          Hakkımda
          <textarea
            value={values.bio}
            onChange={(e) => setValues((v) => ({ ...v, bio: e.target.value }))}
            rows={4}
            maxLength={500}
            placeholder="Ne ile uğraşıyorsun? Arduino, PCB, firmware..."
          />
        </label>
        <label>
          Konum
          <input
            value={values.location}
            onChange={(e) => setValues((v) => ({ ...v, location: e.target.value }))}
            maxLength={80}
            placeholder="Örn. İstanbul"
          />
        </label>
        <label>
          Website / GitHub
          <input
            value={values.website}
            onChange={(e) => setValues((v) => ({ ...v, website: e.target.value }))}
            maxLength={120}
            placeholder="https://github.com/kullanici"
          />
        </label>
        {error ? <p className="form-error">{error}</p> : null}
        {message ? <p className="form-success">{message}</p> : null}
        <button className="btn btn-primary" type="submit" disabled={saving}>
          {saving ? "Kaydediliyor..." : "Bilgileri kaydet"}
        </button>
      </form>
    </div>
  );
}
