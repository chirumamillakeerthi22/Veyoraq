/*
  Server-only: reads environment variables. Import it only from server code.

  Env vars are read when the page is built, so changing GEMINI_API_KEY in Vercel
  takes effect after the next deployment, which Vercel requires for any env change.
*/

export function getGeminiApiKey(): string | undefined {
  return process.env.GEMINI_API_KEY?.trim() || undefined;
}

// True when outfit ideas can be generated.
export function isStylistConfigured(): boolean {
  return getGeminiApiKey() !== undefined;
}
