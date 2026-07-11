"use client";

import { useRef, useState } from "react";

const EMOJIS = [
  "😀", "😁", "😂", "😊", "😍", "🤔", "😎", "🙌",
  "👍", "👎", "🔥", "✨", "✅", "❌", "⚠️", "💡",
  "🛠️", "🔧", "🔌", "🔋", "💻", "🧠", "📡", "🧪",
];

type Props = {
  name: string;
  label: string;
  required?: boolean;
  minLength?: number;
  rows?: number;
  defaultValue?: string;
  placeholder?: string;
};

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return false;
    return Boolean(url.hostname) && url.hostname.includes(".");
  } catch {
    return false;
  }
}

export function ComposerEditor({
  name,
  label,
  required,
  minLength,
  rows = 6,
  defaultValue = "",
  placeholder,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = useState(defaultValue);
  const [showEmoji, setShowEmoji] = useState(false);

  function applyChange(next: string, cursorStart: number, cursorEnd = cursorStart) {
    const el = textareaRef.current;
    setValue(next);
    requestAnimationFrame(() => {
      if (!el) return;
      el.focus();
      el.setSelectionRange(cursorStart, cursorEnd);
    });
  }

  function wrapSelection(before: string, after = before) {
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.slice(start, end);

    if (!selected) {
      const next = value.slice(0, start) + before + after + value.slice(end);
      applyChange(next, start + before.length);
      return;
    }

    const next =
      value.slice(0, start) + before + selected + after + value.slice(end);
    applyChange(next, start + before.length + selected.length + after.length);
  }

  function insertText(text: string) {
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const next = value.slice(0, start) + text + value.slice(end);
    applyChange(next, start + text.length);
  }

  function insertLink() {
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.slice(start, end).trim();

    const rawUrl = window.prompt("Link adresini gir (örn. https://example.com)");
    if (rawUrl == null) return;

    const url = rawUrl.trim();
    if (!isValidHttpUrl(url)) {
      window.alert("Geçerli bir link gir: https://ornek.com");
      return;
    }

    let labelText = selected;
    if (!labelText) {
      const asked = window.prompt("Görünen yazı", new URL(url).hostname);
      if (asked == null) return;
      labelText = asked.trim() || new URL(url).hostname;
    }

    const snippet = `[${labelText}](${url})`;
    const next = value.slice(0, start) + snippet + value.slice(end);
    applyChange(next, start + snippet.length);
  }

  return (
    <div className="composer-editor">
      <div className="editor-label">{label}</div>
      <div className="editor-toolbar" role="toolbar" aria-label="Yazı araçları">
        <button type="button" className="editor-tool" onClick={() => wrapSelection("**")}>
          Kalın
        </button>
        <button type="button" className="editor-tool" onClick={() => wrapSelection("*")}>
          İtalik
        </button>
        <button type="button" className="editor-tool" onClick={() => wrapSelection("`")}>
          Kod
        </button>
        <button type="button" className="editor-tool" onClick={insertLink}>
          Link
        </button>
        <button
          type="button"
          className="editor-tool"
          onClick={() => setShowEmoji((open) => !open)}
        >
          Emoji
        </button>
      </div>
      <p className="editor-hint">
        İpucu: Önce yazıyı seç, sonra Kalın / İtalik / Kod / Link’e bas.
      </p>

      {showEmoji ? (
        <div className="emoji-panel" role="listbox" aria-label="Emoji seç">
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className="emoji-btn"
              onClick={() => {
                insertText(emoji);
                setShowEmoji(false);
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      ) : null}

      <textarea
        ref={textareaRef}
        name={name}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        required={required}
        minLength={minLength}
        rows={rows}
        placeholder={placeholder}
      />
    </div>
  );
}
