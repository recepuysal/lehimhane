"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ComposerEditor } from "@/components/composer-editor";
import {
  AttachmentPicker,
  type PendingFile,
} from "@/components/attachment-picker";

export type QuoteDraft = {
  replyId?: string;
  original?: boolean;
  authorName: string;
  excerpt: string;
};

export function ReplyForm({
  threadId,
  isAuthenticated,
  locked = false,
  quote,
  onClearQuote,
}: {
  threadId: string;
  isAuthenticated: boolean;
  locked?: boolean;
  quote?: QuoteDraft | null;
  onClearQuote?: () => void;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [files, setFiles] = useState<PendingFile[]>([]);

  useEffect(() => {
    if (quote) {
      document.getElementById("reply-composer")?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [quote]);

  if (!isAuthenticated) {
    return (
      <div className="reply-gate">
        Yanıt yazmak için <Link href="/giris">giriş yapın</Link> veya{" "}
        <Link href="/kayit">kayıt olun</Link>.
      </div>
    );
  }

  if (locked) {
    return (
      <div className="reply-gate">
        Bu konu kilitli. Yeni yanıt eklenemez.
      </div>
    );
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set("threadId", threadId);
    if (quote?.replyId) {
      formData.set("quoteReplyId", quote.replyId);
    }
    if (quote?.original) {
      formData.set("quoteOriginal", "1");
    }
    for (const item of files) {
      formData.append("files", item.file);
    }

    const response = await fetch("/api/replies", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(data.error ?? "Yanıt eklenemedi");
      return;
    }

    for (const item of files) {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    }
    setFiles([]);
    setResetKey((value) => value + 1);
    onClearQuote?.();
    router.refresh();
  }

  return (
    <form id="reply-composer" className="composer" onSubmit={onSubmit}>
      {quote ? (
        <div className="quote-draft">
          <div className="quote-draft-head">
            <strong>{quote.authorName}</strong> alıntılanıyor
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClearQuote}
            >
              Kaldır
            </button>
          </div>
          <p>{quote.excerpt}</p>
        </div>
      ) : null}
      <ComposerEditor
        key={resetKey}
        name="body"
        label="Yanıtınız"
        minLength={files.length > 0 ? undefined : 2}
        required={files.length === 0}
        rows={6}
        placeholder="Yazı yaz, emoji ekle veya dosya paylaş..."
      />
      <AttachmentPicker
        key={`files-${resetKey}`}
        files={files}
        onChange={setFiles}
      />
      {error ? <p className="form-error">{error}</p> : null}
      <button className="btn btn-primary" type="submit" disabled={loading}>
        {loading ? "Gönderiliyor..." : "Yanıtı gönder"}
      </button>
    </form>
  );
}
