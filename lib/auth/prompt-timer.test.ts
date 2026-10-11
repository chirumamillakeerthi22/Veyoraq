import { describe, expect, it } from "vitest";
import {
  DISMISS_FOR_MS,
  PROMPT_AFTER_MS,
  isAuthPath,
  shouldShowPrompt,
  type PromptState,
} from "./prompt-timer";

const base: PromptState = {
  visibleMs: PROMPT_AFTER_MS,
  signedIn: false,
  dismissedAt: null,
  shownThisSession: false,
  pathname: "/",
  now: 10 * DISMISS_FOR_MS,
  configured: true,
};

describe("shouldShowPrompt", () => {
  it("shows after two minutes for a signed-out visitor", () => {
    expect(shouldShowPrompt(base)).toBe(true);
  });

  it("waits until two minutes have passed", () => {
    expect(shouldShowPrompt({ ...base, visibleMs: PROMPT_AFTER_MS - 1 })).toBe(false);
  });

  it("never shows for a signed-in visitor, nor while that is still unknown", () => {
    expect(shouldShowPrompt({ ...base, signedIn: true })).toBe(false);
    expect(shouldShowPrompt({ ...base, signedIn: null })).toBe(false);
  });

  it("shows at most once per session", () => {
    expect(shouldShowPrompt({ ...base, shownThisSession: true })).toBe(false);
  });

  it("stays away for a week after it was dismissed, then may return", () => {
    const dismissedAt = base.now - (DISMISS_FOR_MS - 1_000);
    expect(shouldShowPrompt({ ...base, dismissedAt })).toBe(false);
    expect(shouldShowPrompt({ ...base, dismissedAt: base.now - DISMISS_FOR_MS - 1 })).toBe(true);
  });

  it("does nothing when Supabase is not configured", () => {
    expect(shouldShowPrompt({ ...base, configured: false })).toBe(false);
  });

  it.each(["/account", "/account/reset-password", "/auth/callback"])(
    "does not show on %s",
    (pathname) => {
      expect(shouldShowPrompt({ ...base, pathname })).toBe(false);
    },
  );

  it.each(["/", "/stylist", "/saved", "/fix-my-style"])("shows on %s", (pathname) => {
    expect(shouldShowPrompt({ ...base, pathname })).toBe(true);
  });
});

describe("isAuthPath", () => {
  it.each([
    ["/account", true],
    ["/account/reset-password", true],
    ["/auth/confirm", true],
    ["/accounting", false],
    ["/authors", false],
    ["/", false],
  ])("%s is %s", (pathname, expected) => {
    expect(isAuthPath(pathname)).toBe(expected);
  });
});
