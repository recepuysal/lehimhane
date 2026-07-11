"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ComposerEditor } from "@/components/composer-editor";
import {
  AttachmentPicker,
  type PendingFile,
} from "@/components/attachment-picker";
import { PROJECT_PLATFORMS } from "@/lib/projects";

type ExistingImage = {
  id: string;
  url: string;
  fileName: string;
};

type Props = {
  project: {
    id: string;
    title: string;
    summary: string;
    body: string;
    platform: string;
    status: string;
    images: ExistingImage[];
  };
};

export function EditProjectForm({ project }: Props) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<PendingFile[]>([]);
  const [removedIds, setRemovedIds] = useState<string[]>([]);

  const visibleImages = project.images.filter((image) => !removedIds.includes(image.id));
  const remainingSlots = Math.max(0, 4 - visibleImages.length);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(event.currentTarget);
    for (const id of removedIds) {
      form.append("removeImageIds", id);
    }
    for (const item of files.slice(0, remainingSlots)) {
      form.append("files", item.file);
    }

    const response = await fetch(`/api/projects/${project.id}`, {
      method: "PATCH",
      body: form,
    });
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(data.error ?? "Proje güncellenemedi");
      return;
    }

    router.push(`/projeler/${project.id}`);
    router.refresh();
  }

  return (
    <form className="composer" onSubmit={onSubmit}>
      <label>
        Proje adı
        <input
          name="title"
          required
          minLength={3}
          maxLength={100}
          defaultValue={project.title}
        />
      </label>
      <label>
        Platform
        <select name="platform" required defaultValue={project.platform}>
          {PROJECT_PLATFORMS.map((platform) => (
            <option key={platform} value={platform}>
              {platform}
            </option>
          ))}
        </select>
      </label>
      <label>
        Durum
        <select name="status" defaultValue={project.status}>
          <option value="fikir">Fikir</option>
          <option value="devam">Devam ediyor</option>
          <option value="bitti">Bitti</option>
        </select>
      </label>
      <label>
        Kısa özet
        <input
          name="summary"
          required
          minLength={10}
          maxLength={220}
          defaultValue={project.summary}
        />
      </label>
      <ComposerEditor
        name="body"
        label="Proje anlatımı"
        required
        minLength={20}
        rows={8}
        defaultValue={project.body}
      />

      {visibleImages.length > 0 ? (
        <div className="existing-images">
          <div className="editor-label">Mevcut görseller</div>
          <ul className="attachment-preview-list">
            {visibleImages.map((image) => (
              <li key={image.id} className="attachment-preview-item">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.url} alt={image.fileName} />
                <div className="attachment-preview-meta">
                  <strong>{image.fileName}</strong>
                  <span>Kayıtlı görsel</span>
                </div>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() =>
                    setRemovedIds((prev) =>
                      prev.includes(image.id) ? prev : [...prev, image.id],
                    )
                  }
                >
                  Kaldır
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {remainingSlots > 0 ? (
        <AttachmentPicker
          files={files}
          onChange={setFiles}
          maxFiles={remainingSlots}
          accept=".jpg,.jpeg,.png,.webp,.gif,image/*"
          hint={`En fazla ${remainingSlots} yeni görsel ekleyebilirsin.`}
        />
      ) : (
        <p className="editor-hint">Görsel limiti dolu (4). Yeni eklemek için önce birini kaldır.</p>
      )}

      {error ? <p className="form-error">{error}</p> : null}
      <button className="btn btn-primary" type="submit" disabled={loading}>
        {loading ? "Kaydediliyor..." : "Değişiklikleri kaydet"}
      </button>
    </form>
  );
}
