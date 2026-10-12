import { createRateLimiter } from "@/lib/stylist/rate-limit";

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

// A full run asks an image model for four pictures, so the allowance is small.
export const hairRunLimiter = createRateLimiter({
  rules: [
    { windowMs: 10 * MINUTE, max: 3 },
    { windowMs: DAY, max: 12 },
  ],
});

// Redoing one picture costs one image.
export const hairRetryLimiter = createRateLimiter({
  rules: [
    { windowMs: 10 * MINUTE, max: 8 },
    { windowMs: DAY, max: 30 },
  ],
});
