"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ComposerEditor } from "@/components/composer-editor";
import {
  AttachmentPicker,
  type PendingFile,
} from "@/components/attachment-picker";

type CategoryOption = {
  id: string;
  name: string;
};

export function NewThreadForm({ categories }: { categories: CategoryOption[] }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [tags, setTags] = useState("");
  const [files, setFiles] = useState<PendingFile[]>([]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(event.currentTarget);
    form.set("tags", tags);
    for (const item of files) {
      form.append("files", item.file);
    }

    const response = await fetch("/api/threads", {
      method: "POST",
      body: form,
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(data.error ?? "Konu oluşturulamadı");
      return;
    }

    router.push(`/konu/${data.thread.id}`);
    router.refresh();
  }

  return (
    <form className="composer" onSubmit={onSubmit}>
      <label>
        Kategori
        <select name="categoryId" required defaultValue="">
          <option value="" disabled>
            Seçin
          </option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Başlık
        <input name="title" type="text" required minLength={3} maxLength={120} />
      </label>
      <label>
        Etiketler
        <input
          value={tags}
          onChange={(event) => setTags(event.target.value)}
          placeholder="arduino, pcb, stm32 (en fazla 5)"
          maxLength={120}
        />
      </label>
      <ComposerEditor
        name="body"
        label="İçerik"
        required={files.length === 0}
        minLength={files.length > 0 ? undefined : 10}
        rows={8}
        placeholder="Sorunu veya projeni yaz. Dosya da ekleyebilirsin."
      />
      <AttachmentPicker files={files} onChange={setFiles} />
      {error ? <p className="form-error">{error}</p> : null}
      <button className="btn btn-primary" type="submit" disabled={loading}>
        {loading ? "Gönderiliyor..." : "Konuyu yayınla"}
      </button>
    </form>
  );
}
