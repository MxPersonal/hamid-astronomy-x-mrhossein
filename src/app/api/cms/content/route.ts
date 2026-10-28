import { NextResponse } from "next/server";
import { hasValidAdminSession } from "@/lib/admin-auth";
import { isSameOriginRequest } from "@/lib/request-security";
import { SITE_DEFAULTS, type SiteContent } from "@/lib/cms-content";
import { updateSiteContent } from "@/lib/cms-db";

export async function PATCH(request: Request) {
  if (!(await hasValidAdminSession())) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "مبدأ نامعتبر" }, { status: 403 });
  try {
    const raw = await request.text();
    if (raw.length > 3_600_000) return NextResponse.json({ error: "حجم تصویر یا متن زیاد است" }, { status: 413 });
    const body: unknown = JSON.parse(raw);
    if (!body || typeof body !== "object") return NextResponse.json({ error: "داده نامعتبر" }, { status: 400 });
    const { key, value } = body as Record<string, unknown>;
    if (typeof key !== "string" || !Object.prototype.hasOwnProperty.call(SITE_DEFAULTS, key) ||
      typeof value !== "string" || value.length > (key === "heroImage" ? 3_500_000 : 5000)) {
      return NextResponse.json({ error: "مقدار یا کلید نامعتبر است" }, { status: 400 });
    }
    if ((key === "heroImage" || key === "footerInstagram") && value.trim()) {
      const validHttps = /^https:\/\//i.test(value.trim());
      const validImage = key === "heroImage" &&
        /^data:image\/(png|jpeg|webp);base64,[a-z0-9+/=]+$/i.test(value);
      if (!validHttps && !validImage) return NextResponse.json({ error: "آدرس HTTPS یا تصویر معتبر لازم است" }, { status: 400 });
    }
    await updateSiteContent(key as keyof SiteContent, value.trim());
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "ذخیره تنظیمات ناموفق بود؛ اتصال پایگاه داده را بررسی کنید" }, { status: 500 });
  }
}
