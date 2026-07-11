"use client";

import { useMemo, useState } from "react";

export type PendingFile = {
  id: string;
  file: File;
  previewUrl?: string;
};

type Props = {
  files: PendingFile[];
  onChange: (files: PendingFile[]) => void;
  maxFiles?: number;
  accept?: string;
  hint?: string;
};

export function AttachmentPicker({
  files,
  onChange,
  maxFiles = 3,
  accept,
  hint,
}: Props) {
  const [error, setError] = useState("");

  const acceptValue = useMemo(
    () =>
      accept ??
      ".jpg,.jpeg,.png,.webp,.gif,.txt,.md,.csv,.log,.json,image/*,text/plain,text/markdown,text/csv",
    [accept],
  );

  function addFiles(list: FileList | null) {
    if (!list) return;
    setError("");

    const incoming = Array.from(list);
    if (files.length + incoming.length > maxFiles) {
      setError(`En fazla ${maxFiles} dosya ekleyebilirsin`);
      return;
    }

    const next = [...files];
    for (const file of incoming) {
      const previewUrl = file.type.startsWith("image/")
        ? URL.createObjectURL(file)
        : undefined;
      next.push({
        id: `${file.name}-${file.size}-${Math.random().toString(16).slice(2)}`,
        file,
        previewUrl,
      });
    }
    onChange(next);
  }

  function removeFile(id: string) {
    const target = files.find((item) => item.id === id);
    if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
    onChange(files.filter((item) => item.id !== id));
  }

  return (
    <div className="attachment-picker">
      <label className="btn btn-ghost file-btn">
        Dosya ekle
        <input
          type="file"
          accept={acceptValue}
          multiple
          hidden
          onChange={(event) => {
            addFiles(event.target.files);
            event.target.value = "";
          }}
        />
      </label>
      <p className="editor-hint">
        {hint ?? `Resim veya TXT/MD/CSV — en fazla ${maxFiles} dosya, her biri 2 MB.`}
      </p>
      {error ? <p className="form-error">{error}</p> : null}
      {files.length > 0 ? (
        <ul className="attachment-preview-list">
          {files.map((item) => (
            <li key={item.id} className="attachment-preview-item">
              {item.previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.previewUrl} alt={item.file.name} />
              ) : (
                <div className="attachment-file-icon">TXT</div>
              )}
              <div className="attachment-preview-meta">
                <strong>{item.file.name}</strong>
                <span>{Math.ceil(item.file.size / 1024)} KB</span>
              </div>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => removeFile(item.id)}
              >
                Kaldır
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
