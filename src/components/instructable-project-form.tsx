"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PROJECT_PLATFORMS } from "@/lib/projects";

type StepDraft = {
  id: string;
  title: string;
  body: string;
  existingImageUrl?: string | null;
  file?: File | null;
  previewUrl?: string;
};

type SupplyDraft = {
  id: string;
  name: string;
  quantity: string;
  note: string;
  link: string;
};

type Props = {
  mode: "create" | "edit";
  projectId?: string;
  initial?: {
    title: string;
    summary: string;
    body: string;
    platform: string;
    status: string;
    coverUrl?: string | null;
    steps: Array<{
      title: string;
      body: string;
      imageUrl?: string | null;
    }>;
    supplies: Array<{
      name: string;
      quantity: string;
      note?: string;
      link?: string;
    }>;
  };
};

function uid() {
  return Math.random().toString(16).slice(2);
}

export function InstructableProjectForm({ mode, projectId, initial }: Props) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [summary, setSummary] = useState(initial?.summary ?? "");
  const [intro, setIntro] = useState(initial?.body ?? "");
  const [platform, setPlatform] = useState(initial?.platform ?? "");
  const [status, setStatus] = useState(initial?.status ?? "devam");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState(initial?.coverUrl ?? "");
  const [steps, setSteps] = useState<StepDraft[]>(
    initial?.steps?.length
      ? initial.steps.map((step) => ({
          id: uid(),
          title: step.title,
          body: step.body,
          existingImageUrl: step.imageUrl,
          previewUrl: step.imageUrl ?? undefined,
        }))
      : [{ id: uid(), title: "Adım 1", body: "", existingImageUrl: null }],
  );
  const [supplies, setSupplies] = useState<SupplyDraft[]>(
    initial?.supplies?.length
      ? initial.supplies.map((item) => ({
          id: uid(),
          name: item.name,
          quantity: item.quantity,
          note: item.note ?? "",
          link: item.link ?? "",
        }))
      : [{ id: uid(), name: "", quantity: "", note: "", link: "" }],
  );

  const coverStyle = useMemo(
    () =>
      coverPreview
        ? { backgroundImage: `url(${coverPreview})` }
        : undefined,
    [coverPreview],
  );

  function updateStep(id: string, patch: Partial<StepDraft>) {
    setSteps((prev) => prev.map((step) => (step.id === id ? { ...step, ...patch } : step)));
  }

  function updateSupply(id: string, patch: Partial<SupplyDraft>) {
    setSupplies((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData();
    form.set("title", title);
    form.set("summary", summary);
    form.set("body", intro);
    form.set("platform", platform);
    form.set("status", status);
    form.set(
      "stepsJson",
      JSON.stringify(
        steps.map((step) => ({
          title: step.title,
          body: step.body,
          existingImageUrl: step.existingImageUrl ?? null,
        })),
      ),
    );
    form.set(
      "suppliesJson",
      JSON.stringify(
        supplies
          .filter((item) => item.name.trim())
          .map((item) => ({
            name: item.name,
            quantity: item.quantity,
            note: item.note,
            link: item.link,
          })),
      ),
    );

    if (coverFile) {
      form.set("cover", coverFile);
    }

    steps.forEach((step, index) => {
      if (step.file) {
        form.append(`stepImage_${index}`, step.file);
      }
    });

    const endpoint =
      mode === "create" ? "/api/projects" : `/api/projects/${projectId}`;
    const method = mode === "create" ? "POST" : "PATCH";

    const response = await fetch(endpoint, { method, body: form });
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(data.error ?? "Kayıt başarısız");
      return;
    }

    router.push(`/projeler/${data.project.id}`);
    router.refresh();
  }

  return (
    <form className="composer instructable-form" onSubmit={onSubmit}>
      <div
        className="instructable-cover-picker"
        style={coverStyle}
      >
        <label className="btn btn-primary file-btn">
          Kapak görseli seç
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              if (coverPreview && coverPreview.startsWith("blob:")) {
                URL.revokeObjectURL(coverPreview);
              }
              setCoverFile(file);
              setCoverPreview(file ? URL.createObjectURL(file) : initial?.coverUrl ?? "");
              event.target.value = "";
            }}
          />
        </label>
      </div>

      <label>
        Proje adı
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          minLength={3}
          maxLength={100}
          placeholder="Örn. Arduino ile akıllı saksı"
        />
      </label>

      <div className="form-grid-2">
        <label>
          Platform
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            required
          >
            <option value="" disabled>
              Seçin
            </option>
            {PROJECT_PLATFORMS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label>
          Durum
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="fikir">Fikir</option>
            <option value="devam">Devam ediyor</option>
            <option value="bitti">Bitti</option>
          </select>
        </label>
      </div>

      <label>
        Kısa özet
        <input
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          required
          minLength={10}
          maxLength={220}
          placeholder="Kartlarda görünecek kısa açıklama"
        />
      </label>

      <label>
        Giriş
        <textarea
          value={intro}
          onChange={(e) => setIntro(e.target.value)}
          rows={4}
          placeholder="Projeyi kısaca tanıt (opsiyonel)"
        />
      </label>

      <section className="builder-section">
        <div className="builder-head">
          <h3>Malzemeler (isteğe bağlı)</h3>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() =>
              setSupplies((prev) => [
                ...prev,
                { id: uid(), name: "", quantity: "", note: "", link: "" },
              ])
            }
          >
            Malzeme ekle
          </button>
        </div>
        <p className="editor-hint">
          İstersen miktar, not ve satın alma linki ekleyebilirsin.
        </p>
        <div className="supply-list">
          {supplies.map((item) => (
            <div key={item.id} className="supply-card">
              <div className="supply-row">
                <input
                  value={item.name}
                  onChange={(e) => updateSupply(item.id, { name: e.target.value })}
                  placeholder="Malzeme adı"
                />
                <input
                  value={item.quantity}
                  onChange={(e) =>
                    updateSupply(item.id, { quantity: e.target.value })
                  }
                  placeholder="Adet / miktar"
                />
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() =>
                    setSupplies((prev) =>
                      prev.length === 1
                        ? prev
                        : prev.filter((row) => row.id !== item.id),
                    )
                  }
                >
                  Sil
                </button>
              </div>
              <input
                value={item.note}
                onChange={(e) => updateSupply(item.id, { note: e.target.value })}
                placeholder="Not (isteğe bağlı)"
              />
              <input
                value={item.link}
                onChange={(e) => updateSupply(item.id, { link: e.target.value })}
                placeholder="Malzeme linki (isteğe bağlı) https://..."
              />
            </div>
          ))}
        </div>
      </section>

      <section className="builder-section">
        <div className="builder-head">
          <h3>Adımlar</h3>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() =>
              setSteps((prev) => [
                ...prev,
                {
                  id: uid(),
                  title: `Adım ${prev.length + 1}`,
                  body: "",
                  existingImageUrl: null,
                },
              ])
            }
          >
            Adım ekle
          </button>
        </div>

        <div className="step-builder-list">
          {steps.map((step, index) => (
            <div key={step.id} className="step-builder-card">
              <div className="step-builder-top">
                <strong>Adım {index + 1}</strong>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() =>
                    setSteps((prev) =>
                      prev.length === 1 ? prev : prev.filter((row) => row.id !== step.id),
                    )
                  }
                >
                  Sil
                </button>
              </div>
              <input
                value={step.title}
                onChange={(e) => updateStep(step.id, { title: e.target.value })}
                placeholder="Adım başlığı"
              />
              <textarea
                value={step.body}
                onChange={(e) => updateStep(step.id, { body: e.target.value })}
                rows={4}
                placeholder="Bu adımda ne yapıyorsun?"
                required
              />
              <div className="step-image-row">
                {step.previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={step.previewUrl} alt="" className="step-thumb" />
                ) : (
                  <div className="step-thumb step-thumb-empty">Görsel yok</div>
                )}
                <label className="btn btn-ghost file-btn">
                  Adım görseli
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      if (step.previewUrl?.startsWith("blob:")) {
                        URL.revokeObjectURL(step.previewUrl);
                      }
                      updateStep(step.id, {
                        file,
                        previewUrl: file
                          ? URL.createObjectURL(file)
                          : step.existingImageUrl ?? undefined,
                      });
                      event.target.value = "";
                    }}
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      </section>

      {error ? <p className="form-error">{error}</p> : null}
      <button className="btn btn-primary" type="submit" disabled={loading}>
        {loading
          ? "Kaydediliyor..."
          : mode === "create"
            ? "Projeyi yayınla"
            : "Değişiklikleri kaydet"}
      </button>
    </form>
  );
}
