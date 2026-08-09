import "server-only";

import { createHash } from "node:crypto";

const MAX_FAILURES = 5;
const WINDOW_MILLISECONDS = 15 * 60 * 1000;

interface AttemptRecord {
  failures: number;
  resetAt: number;
}

const attempts = new Map<string, AttemptRecord>();

function getClientKey(request: Request): string {
  const forwardedAddress = request.headers
    .get("x-forwarded-for")
    ?.split(",")[0]
    ?.trim();
  const address =
    request.headers.get("x-real-ip")?.trim() || forwardedAddress || "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";

  return createHash("sha256")
    .update(`${address}\u0000${userAgent}`)
    .digest("hex");
}

function removeExpiredRecords(now: number): void {
  for (const [key, record] of attempts) {
    if (record.resetAt <= now) attempts.delete(key);
  }
}

export function getLoginRateLimit(request: Request): {
  key: string;
  retryAfterSeconds: number;
} {
  const now = Date.now();
  removeExpiredRecords(now);

  const key = getClientKey(request);
  const record = attempts.get(key);
  if (!record || record.failures < MAX_FAILURES) {
    return { key, retryAfterSeconds: 0 };
  }

  return {
    key,
    retryAfterSeconds: Math.max(1, Math.ceil((record.resetAt - now) / 1000)),
  };
}

export function recordFailedLogin(key: string): void {
  const now = Date.now();
  const record = attempts.get(key);

  if (!record || record.resetAt <= now) {
    attempts.set(key, { failures: 1, resetAt: now + WINDOW_MILLISECONDS });
    return;
  }

  record.failures += 1;
}

export function clearLoginFailures(key: string): void {
  attempts.delete(key);
}
