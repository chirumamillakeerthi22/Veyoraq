/*
  After signing in, the visitor is sent to the "next" page named in the link.
  That value comes from the URL, so it must never be allowed to point to another
  website (an "open redirect"): only plain paths on this site are accepted.
*/
const PLACEHOLDER_ORIGIN = "https://placeholder.invalid";

export function safeNextPath(
  raw: string | null | undefined,
  fallback = "/account",
): string {
  if (!raw) return fallback;
  if (!raw.startsWith("/")) return fallback;
  if (raw.startsWith("//") || raw.includes("\\")) return fallback;
  if (/[\u0000-\u001f\u007f]/.test(raw)) return fallback;

  try {
    const parsed = new URL(raw, PLACEHOLDER_ORIGIN);
    if (parsed.origin !== PLACEHOLDER_ORIGIN) return fallback;
    return parsed.pathname + parsed.search;
  } catch {
    return fallback;
  }
}
