-- CreateTable
CREATE TABLE "ThreadVote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "value" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    CONSTRAINT "ThreadVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ThreadVote_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "Thread" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReplyVote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "value" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "replyId" TEXT NOT NULL,
    CONSTRAINT "ReplyVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ReplyVote_replyId_fkey" FOREIGN KEY ("replyId") REFERENCES "Reply" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ThreadVote_threadId_idx" ON "ThreadVote"("threadId");

-- CreateIndex
CREATE UNIQUE INDEX "ThreadVote_userId_threadId_key" ON "ThreadVote"("userId", "threadId");

-- CreateIndex
CREATE INDEX "ReplyVote_replyId_idx" ON "ReplyVote"("replyId");

-- CreateIndex
CREATE UNIQUE INDEX "ReplyVote_userId_replyId_key" ON "ReplyVote"("userId", "replyId");
