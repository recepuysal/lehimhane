import { prisma } from "@/lib/prisma";

export async function notifyThreadReply(params: {
  threadId: string;
  threadTitle: string;
  threadAuthorId: string;
  actorId: string;
  actorName: string;
}) {
  if (params.threadAuthorId === params.actorId) {
    return null;
  }

  return prisma.notification.create({
    data: {
      type: "thread_reply",
      message: `${params.actorName}, "${params.threadTitle}" konuna yanıt yazdı.`,
      userId: params.threadAuthorId,
      actorId: params.actorId,
      threadId: params.threadId,
    },
  });
}

export async function notifyThreadUpvote(params: {
  threadId: string;
  threadTitle: string;
  threadAuthorId: string;
  actorId: string;
  actorName: string;
}) {
  if (params.threadAuthorId === params.actorId) {
    return null;
  }

  return prisma.notification.create({
    data: {
      type: "thread_upvote",
      message: `${params.actorName}, "${params.threadTitle}" konunu beğendi.`,
      userId: params.threadAuthorId,
      actorId: params.actorId,
      threadId: params.threadId,
    },
  });
}

export async function notifyProjectLike(params: {
  projectId: string;
  projectTitle: string;
  projectAuthorId: string;
  actorId: string;
  actorName: string;
}) {
  if (params.projectAuthorId === params.actorId) {
    return null;
  }

  return prisma.notification.create({
    data: {
      type: "project_like",
      message: `${params.actorName}, "${params.projectTitle}" projeni beğendi.`,
      userId: params.projectAuthorId,
      actorId: params.actorId,
      projectId: params.projectId,
    },
  });
}

export async function notifyProjectComment(params: {
  projectId: string;
  projectTitle: string;
  projectAuthorId: string;
  actorId: string;
  actorName: string;
}) {
  if (params.projectAuthorId === params.actorId) {
    return null;
  }

  return prisma.notification.create({
    data: {
      type: "project_comment",
      message: `${params.actorName}, "${params.projectTitle}" projenine yorum yazdı.`,
      userId: params.projectAuthorId,
      actorId: params.actorId,
      projectId: params.projectId,
    },
  });
}
