"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ComposerEditor } from "@/components/composer-editor";
import {
  AttachmentPicker,
  type PendingFile,
} from "@/components/attachment-picker";

import { PROJECT_PLATFORMS } from "@/lib/projects";

export function NewProjectForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<PendingFile[]>([]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(event.currentTarget);
    for (const item of files.slice(0, 4)) {
      form.append("files", item.file);
    }

    const response = await fetch("/api/projects", {
      method: "POST",
      body: form,
    });
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(data.error ?? "Proje kaydedilemedi");
      return;
    }

    router.push(`/projeler/${data.project.id}`);
    router.refresh();
  }

  return (
    <form className="composer" onSubmit={onSubmit}>
      <label>
        Proje adı
        <input name="title" required minLength={3} maxLength={100} />
      </label>
      <label>
        Platform
        <select name="platform" required defaultValue="">
          <option value="" disabled>
            Seçin
          </option>
          {PROJECT_PLATFORMS.map((platform) => (
            <option key={platform} value={platform}>
              {platform}
            </option>
          ))}
        </select>
      </label>
      <label>
        Durum
        <select name="status" defaultValue="devam">
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
          placeholder="Bir cümleyle projeyi anlat"
        />
      </label>
      <ComposerEditor
        name="body"
        label="Proje anlatımı"
        required
        minLength={20}
        rows={8}
        placeholder="Ne yaptın, hangi parçaları kullandın, zorlandığın yerler..."
      />
      <AttachmentPicker
        files={files}
        onChange={setFiles}
        maxFiles={4}
        accept=".jpg,.jpeg,.png,.webp,.gif,image/*"
        hint="En fazla 4 görsel, her biri 2 MB. İlk görsel kapak olur."
      />
      {error ? <p className="form-error">{error}</p> : null}
      <button className="btn btn-primary" type="submit" disabled={loading}>
        {loading ? "Yayınlanıyor..." : "Projeyi yayınla"}
      </button>
    </form>
  );
}
