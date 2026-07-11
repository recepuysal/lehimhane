"use client";

import { createElement, Fragment, type ReactNode } from "react";

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return false;
    return Boolean(url.hostname) && url.hostname.includes(".");
  } catch {
    return false;
  }
}

function renderInline(text: string): ReactNode[] {
  const pattern =
    /(`[^`]+`|\*\*[^*]+?\*\*|__[^_]+?__|\*[^*\n]+?\*|_[^_\n]+?_|\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)|(https?:\/\/[^\s<]+))/g;
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    if (token.startsWith("`")) {
      nodes.push(
        createElement("code", { key: key++, className: "md-code" }, token.slice(1, -1)),
      );
    } else if (token.startsWith("**") || token.startsWith("__")) {
      nodes.push(createElement("strong", { key: key++ }, token.slice(2, -2)));
    } else if (
      (token.startsWith("*") && token.endsWith("*")) ||
      (token.startsWith("_") && token.endsWith("_"))
    ) {
      nodes.push(createElement("em", { key: key++ }, token.slice(1, -1)));
    } else if (match[2] && match[3]) {
      if (isValidHttpUrl(match[3])) {
        nodes.push(
          createElement(
            "a",
            {
              key: key++,
              href: match[3],
              target: "_blank",
              rel: "noopener noreferrer",
              className: "md-link",
            },
            match[2],
          ),
        );
      } else {
        nodes.push(match[2]);
      }
    } else if (match[4] && isValidHttpUrl(match[4])) {
      nodes.push(
        createElement(
          "a",
          {
            key: key++,
            href: match[4],
            target: "_blank",
            rel: "noopener noreferrer",
            className: "md-link",
          },
          match[4].replace(/^https?:\/\//, ""),
        ),
      );
    } else {
      nodes.push(token);
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length > 0 ? nodes : [""];
}

export function RichText({ content }: { content: string }) {
  const normalized = content.replace(/\r\n/g, "\n").trimEnd();
  if (!normalized.trim()) {
    return createElement("div", { className: "rich-text muted" }, "İçerik yok");
  }

  const blocks = normalized.split(/\n{2,}/);

  return createElement(
    "div",
    { className: "rich-text" },
    blocks.map((block, blockIndex) => {
      const lines = block.split("\n");
      return createElement(
        "p",
        { key: blockIndex, className: "rich-text-p" },
        lines.map((line, lineIndex) =>
          createElement(
            Fragment,
            { key: lineIndex },
            ...renderInline(line),
            lineIndex < lines.length - 1
              ? createElement("br", { key: `br-${lineIndex}` })
              : null,
          ),
        ),
      );
    }),
  );
}
