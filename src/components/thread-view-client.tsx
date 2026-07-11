"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDate } from "@/lib/format";
import { countLikes } from "@/lib/votes";
import { excerptText } from "@/lib/moderation";
import { RankBadge } from "@/components/rank-badge";
import { LikeButton } from "@/components/like-button";
import { RichText } from "@/components/rich-text";
import { TagList } from "@/components/tag-list";
import { AttachmentList } from "@/components/attachment-list";
import { ReplyForm, type QuoteDraft } from "@/components/reply-form";
import { ThreadModerationBar } from "@/components/thread-moderation-bar";

type Author = {
  id: string;
  name: string;
  rank: string;
  postCount: number;
};

type Vote = { value: number; userId: string };

type Attachment = {
  id: string;
  fileName: string;
  url: string;
  mimeType: string;
  size: number;
  kind: string;
};

type QuoteReply = {
  id: string;
  body: string;
  author: { id: string; name: string };
};

type Reply = {
  id: string;
  body: string;
  createdAt: string | Date;
  quoteOriginal: boolean;
  author: Author;
  votes: Vote[];
  attachments: Attachment[];
  quoteReply: QuoteReply | null;
};

type ThreadView = {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  locked: boolean;
  createdAt: string | Date;
  authorId: string;
  author: Author;
  category: { name: string; slug: string };
  votes: Vote[];
  tags: { tag: { name: string; slug: string } }[];
  attachments: Attachment[];
  replies: Reply[];
};

export function ThreadViewClient({
  thread,
  userId,
  userRole,
  isAuthenticated,
}: {
  thread: ThreadView;
  userId?: string;
  userRole?: string;
  isAuthenticated: boolean;
}) {
  const [quote, setQuote] = useState<QuoteDraft | null>(null);

  const threadLikes = countLikes(thread.votes);
  const threadLiked =
    userId != null &&
    thread.votes.some((vote) => vote.userId === userId && vote.value === 1);

  const isMod = userRole === "MOD" || userRole === "ADMIN";
  const isAuthor = userId === thread.authorId;
  const canPin = isMod;
  const canLock = isMod || isAuthor;
  const canQuote = isAuthenticated && !thread.locked;

  return (
    <div className="stack">
      <div className="breadcrumb">
        <Link href="/">Forum</Link>
        <span>/</span>
        <Link href={`/kategori/${thread.category.slug}`}>
          {thread.category.name}
        </Link>
        <span>/</span>
        <span>{thread.title}</span>
      </div>

      <article className="panel">
        <div className="thread-post">
          <div className="thread-title-row">
            <h1>{thread.title}</h1>
            <div className="thread-badges">
              {thread.pinned ? <span className="status-chip">Sabit</span> : null}
              {thread.locked ? <span className="status-chip">Kilitli</span> : null}
            </div>
          </div>
          <p className="item-meta item-meta-row">
            <Link href={`/profil/${thread.author.id}`} className="author-link">
              {thread.author.name}
            </Link>
            <RankBadge rank={thread.author.rank} />
            <span>·</span>
            <span>{formatDate(thread.createdAt)}</span>
          </p>
          <TagList tags={thread.tags.map((item) => item.tag)} />
          <div className="thread-body" style={{ marginTop: "1rem" }}>
            <RichText content={thread.body} />
          </div>
          <AttachmentList attachments={thread.attachments} />
          <div className="action-row">
            <LikeButton
              target="thread"
              targetId={thread.id}
              initialCount={threadLikes}
              initiallyLiked={threadLiked}
              isAuthenticated={isAuthenticated}
            />
            {canQuote ? (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() =>
                  setQuote({
                    original: true,
                    authorName: thread.author.name,
                    excerpt: excerptText(thread.body),
                  })
                }
              >
                Alıntıla
              </button>
            ) : null}
          </div>
          <ThreadModerationBar
            threadId={thread.id}
            pinned={thread.pinned}
            locked={thread.locked}
            canPin={canPin}
            canLock={canLock}
          />
        </div>
      </article>

      <section className="panel">
        <div className="panel-head">
          <h2>Yanıtlar ({thread.replies.length})</h2>
        </div>
        <ul className="reply-list">
          {thread.replies.length === 0 ? (
            <li className="reply-item muted">
              Henüz yanıt yok. İlk yanıtı sen yaz.
            </li>
          ) : (
            thread.replies.map((reply) => {
              const replyLikes = countLikes(reply.votes);
              const replyLiked =
                userId != null &&
                reply.votes.some(
                  (vote) => vote.userId === userId && vote.value === 1,
                );

              return (
                <li key={reply.id} id={`reply-${reply.id}`} className="reply-item">
                  <div className="item-meta item-meta-row">
                    <Link
                      href={`/profil/${reply.author.id}`}
                      className="author-link"
                    >
                      {reply.author.name}
                    </Link>
                    <RankBadge rank={reply.author.rank} compact />
                    <span>·</span>
                    <span>{formatDate(reply.createdAt)}</span>
                  </div>
                  {reply.quoteOriginal ? (
                    <blockquote className="quote-block">
                      <div className="quote-block-head">
                        {thread.author.name} · konu
                      </div>
                      <p>{excerptText(thread.body)}</p>
                    </blockquote>
                  ) : null}
                  {reply.quoteReply ? (
                    <blockquote className="quote-block">
                      <div className="quote-block-head">
                        <a href={`#reply-${reply.quoteReply.id}`}>
                          {reply.quoteReply.author.name}
                        </a>
                      </div>
                      <p>{excerptText(reply.quoteReply.body)}</p>
                    </blockquote>
                  ) : null}
                  <div className="reply-body">
                    <RichText content={reply.body} />
                  </div>
                  <AttachmentList attachments={reply.attachments} />
                  <div className="action-row">
                    <LikeButton
                      target="reply"
                      targetId={reply.id}
                      initialCount={replyLikes}
                      initiallyLiked={replyLiked}
                      isAuthenticated={isAuthenticated}
                    />
                    {canQuote ? (
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() =>
                          setQuote({
                            replyId: reply.id,
                            authorName: reply.author.name,
                            excerpt: excerptText(reply.body),
                          })
                        }
                      >
                        Alıntıla
                      </button>
                    ) : null}
                  </div>
                </li>
              );
            })
          )}
        </ul>
      </section>

      <section>
        <h2
          style={{
            margin: "0 0 0.75rem",
            fontFamily: "var(--font-display), Georgia, serif",
            fontSize: "1.35rem",
          }}
        >
          Yanıt yaz
        </h2>
        <ReplyForm
          threadId={thread.id}
          isAuthenticated={isAuthenticated}
          locked={thread.locked}
          quote={quote}
          onClearQuote={() => setQuote(null)}
        />
      </section>
    </div>
  );
}
