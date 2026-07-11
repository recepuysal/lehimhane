export function isModerator(role?: string | null) {
  return role === "MOD" || role === "ADMIN";
}

export function canModerateThread(params: {
  role?: string | null;
  userId?: string | null;
  authorId: string;
}) {
  if (!params.userId) return false;
  if (isModerator(params.role)) return true;
  return params.userId === params.authorId;
}

export function canLockThread(params: {
  role?: string | null;
  userId?: string | null;
  authorId: string;
}) {
  return canModerateThread(params);
}

export function canDeleteReply(params: {
  role?: string | null;
  userId?: string | null;
  authorId: string;
}) {
  if (!params.userId) return false;
  if (isModerator(params.role)) return true;
  return params.userId === params.authorId;
}

export function canEditReply(params: {
  userId?: string | null;
  authorId: string;
}) {
  if (!params.userId) return false;
  return params.userId === params.authorId;
}

export function canPinThread(role?: string | null) {
  return isModerator(role);
}

export function excerptText(value: string, max = 160) {
  const cleaned = value.replace(/\s+/g, " ").trim();
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max).trimEnd()}…`;
}
