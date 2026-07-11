import Link from "next/link";

type AttachmentItem = {
  id: string;
  fileName: string;
  url: string;
  mimeType: string;
  size: number;
  kind: string;
};

export function AttachmentList({ attachments }: { attachments: AttachmentItem[] }) {
  if (attachments.length === 0) return null;

  return (
    <div className="attachment-list">
      {attachments.map((file) =>
        file.kind === "image" ? (
          <a
            key={file.id}
            href={file.url}
            target="_blank"
            rel="noopener noreferrer"
            className="attachment-image"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={file.url} alt={file.fileName} />
            <span>{file.fileName}</span>
          </a>
        ) : (
          <Link key={file.id} href={file.url} className="attachment-file" target="_blank">
            <strong>{file.fileName}</strong>
            <span>{Math.ceil(file.size / 1024)} KB · indir / aç</span>
          </Link>
        ),
      )}
    </div>
  );
}
