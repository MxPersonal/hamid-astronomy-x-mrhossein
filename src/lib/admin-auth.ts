import "server-only";

import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_SESSION_COOKIE = "soha_admin_session";

const SESSION_LIFETIME_SECONDS = 8 * 60 * 60;
const SESSION_VERSION = 1;

interface AdminSessionPayload {
  exp: number;
  iat: number;
  role: "admin";
  version: number;
}

interface AdminAuthConfiguration {
  password: string;
  secret: string;
  username: string;
}

function getConfiguration(): AdminAuthConfiguration | null {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  const secret = process.env.ADMIN_SESSION_SECRET;
  const minimumPasswordLength =
    process.env.ALLOW_WEAK_ADMIN_PASSWORD === "true" ? 5 : 12;

  if (
    !username ||
    !password ||
    !secret ||
    username.length > 128 ||
    password.length < minimumPasswordLength ||
    password.length > 256 ||
    secret.length < 48
  ) {
    return null;
  }

  return { username, password, secret };
}

function constantTimeTextEqual(left: string, right: string): boolean {
  const leftDigest = createHash("sha256").update(left, "utf8").digest();
  const rightDigest = createHash("sha256").update(right, "utf8").digest();
  return timingSafeEqual(leftDigest, rightDigest);
}

function sign(encodedPayload: string, secret: string): string {
  return createHmac("sha256", secret).update(encodedPayload).digest("base64url");
}

function parsePayload(encodedPayload: string): AdminSessionPayload | null {
  try {
    const candidate: unknown = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    );

    if (
      typeof candidate !== "object" ||
      candidate === null ||
      !("exp" in candidate) ||
      !("iat" in candidate) ||
      !("role" in candidate) ||
      !("version" in candidate)
    ) {
      return null;
    }

    const payload = candidate as Record<string, unknown>;
    if (
      typeof payload.exp !== "number" ||
      typeof payload.iat !== "number" ||
      payload.role !== "admin" ||
      payload.version !== SESSION_VERSION
    ) {
      return null;
    }

    return payload as unknown as AdminSessionPayload;
  } catch {
    return null;
  }
}

export function isAdminAuthConfigured(): boolean {
  return getConfiguration() !== null;
}

export function verifyAdminCredentials(
  username: string,
  password: string,
): boolean {
  const configuration = getConfiguration();
  if (!configuration) return false;

  const usernameMatches = constantTimeTextEqual(
    username,
    configuration.username,
  );
  const passwordMatches = constantTimeTextEqual(
    password,
    configuration.password,
  );

  return usernameMatches && passwordMatches;
}

export function createAdminSessionToken(): string {
  const configuration = getConfiguration();
  if (!configuration) {
    throw new Error("Admin authentication is not configured.");
  }

  const now = Math.floor(Date.now() / 1000);
  const payload: AdminSessionPayload = {
    exp: now + SESSION_LIFETIME_SECONDS,
    iat: now,
    role: "admin",
    version: SESSION_VERSION,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
    "base64url",
  );

  return `${encodedPayload}.${sign(encodedPayload, configuration.secret)}`;
}

export function verifyAdminSessionToken(token: string | undefined): boolean {
  const configuration = getConfiguration();
  if (!configuration || !token || token.length > 2048) return false;

  const parts = token.split(".");
  if (parts.length !== 2) return false;

  const [encodedPayload, suppliedSignature] = parts;
  const expectedSignature = sign(encodedPayload, configuration.secret);
  if (!constantTimeTextEqual(suppliedSignature, expectedSignature)) return false;

  const payload = parsePayload(encodedPayload);
  if (!payload) return false;

  const now = Math.floor(Date.now() / 1000);
  return payload.exp > now && payload.iat <= now + 60;
}

export async function hasValidAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  return verifyAdminSessionToken(
    cookieStore.get(ADMIN_SESSION_COOKIE)?.value,
  );
}

export const adminSessionCookieOptions = {
  httpOnly: true,
  maxAge: SESSION_LIFETIME_SECONDS,
  path: "/",
  priority: "high" as const,
  sameSite: "strict" as const,
  secure: process.env.NODE_ENV === "production",
};
