/**
 * The signed-in tenant's own records.
 *
 * The property's message list and rent reviews also hold the previous household.
 * A thread or notice stays only when it names this login. Matching every item on
 * the property showed the previous tenant's name and email.
 */

export type SignedInTenant = {
  name: string;
  email: string;
};

type ThreadLike = {
  participants?: string[] | null;
  messages?: { from?: string | null }[] | null;
};

type ReviewEmail = {
  to?: string | null;
  toEmail?: string | null;
};

type ReviewLike = {
  emails?: ReviewEmail[] | null;
};

function compact(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9@.\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function namesViewer(text: string | null | undefined, viewer: SignedInTenant): boolean {
  const raw = text?.trim();
  if (!raw) return false;
  const email = viewer.email.trim().toLowerCase();
  if (email.includes('@') && raw.toLowerCase().includes(email)) return true;
  const name = compact(viewer.name);
  const haystack = compact(raw);
  if (name.length < 3 || haystack.length < 3) return false;
  return haystack === name || haystack.includes(name);
}

export function threadIsForSignedInTenant(thread: ThreadLike, viewer: SignedInTenant): boolean {
  if (!viewer.email.trim() && !viewer.name.trim()) return true;
  if ((thread.participants ?? []).some((name) => namesViewer(name, viewer))) return true;
  return (thread.messages ?? []).some((message) => namesViewer(message.from, viewer));
}

export function reviewIsForSignedInTenant(review: ReviewLike, viewer: SignedInTenant): boolean {
  if (!viewer.email.trim() && !viewer.name.trim()) return true;
  const notices = (review.emails ?? []).filter((email) => email.to?.trim() || email.toEmail?.trim());
  if (notices.length === 0) return true;
  return notices.some((email) => namesViewer(email.to, viewer) || namesViewer(email.toEmail, viewer));
}
