import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  adminSessionCookieOptions,
  createAdminSessionToken,
  isAdminAuthConfigured,
  verifyAdminCredentials,
} from "@/lib/admin-auth";
import {
  clearLoginFailures,
  getLoginRateLimit,
  recordFailedLogin,
} from "@/lib/admin-rate-limit";
import { isSameOriginRequest } from "@/lib/request-security";

const MAX_REQUEST_BYTES = 1024;

function jsonError(message: string, status: number, retryAfter?: number) {
  const response = NextResponse.json({ error: message }, { status });
  response.headers.set("Cache-Control", "no-store");
  if (retryAfter) response.headers.set("Retry-After", String(retryAfter));
  return response;
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return jsonError("درخواست نامعتبر است.", 403);
  }

  if (!isAdminAuthConfigured()) {
    return jsonError("ورود مدیر روی سرور پیکربندی نشده است.", 503);
  }

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > MAX_REQUEST_BYTES) {
    return jsonError("حجم درخواست بیش از حد مجاز است.", 413);
  }

  const rateLimit = getLoginRateLimit(request);
  if (rateLimit.retryAfterSeconds > 0) {
    return jsonError(
      "تعداد تلاش‌ها بیش از حد مجاز است؛ کمی بعد دوباره امتحان کنید.",
      429,
      rateLimit.retryAfterSeconds,
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("درخواست نامعتبر است.", 400);
  }

  if (typeof body !== "object" || body === null) {
    return jsonError("درخواست نامعتبر است.", 400);
  }

  const { username, password } = body as Record<string, unknown>;
  if (
    typeof username !== "string" ||
    typeof password !== "string" ||
    username.length < 1 ||
    username.length > 128 ||
    password.length < 1 ||
    password.length > 256
  ) {
    recordFailedLogin(rateLimit.key);
    return jsonError("نام کاربری یا رمز عبور نادرست است.", 401);
  }

  if (!verifyAdminCredentials(username, password)) {
    recordFailedLogin(rateLimit.key);
    return jsonError("نام کاربری یا رمز عبور نادرست است.", 401);
  }

  clearLoginFailures(rateLimit.key);
  const response = NextResponse.json({ authenticated: true });
  response.cookies.set(
    ADMIN_SESSION_COOKIE,
    createAdminSessionToken(),
    adminSessionCookieOptions,
  );
  response.headers.set("Cache-Control", "no-store");
  return response;
}
