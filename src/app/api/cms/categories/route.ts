import { NextResponse } from "next/server";
import { hasValidAdminSession } from "@/lib/admin-auth";
import { isSameOriginRequest } from "@/lib/request-security";
import { createSiteCategory, getSiteCategories } from "@/lib/cms-db";

export async function GET() {
  if (!(await hasValidAdminSession())) {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  }
  try {
    return NextResponse.json(
      { categories: await getSiteCategories() },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json({ error: "خواندن دسته‌بندی‌ها ناموفق بود" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await hasValidAdminSession())) {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  }
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "مبدأ درخواست معتبر نیست" }, { status: 403 });
  }
  try {
    const raw = await request.text();
    if (raw.length > 500) {
      return NextResponse.json({ error: "داده بیش از اندازه بزرگ است" }, { status: 413 });
    }
    const body: unknown = JSON.parse(raw);
    if (!body || typeof body !== "object" || !("name" in body) || typeof body.name !== "string") {
      return NextResponse.json({ error: "نام دسته‌بندی لازم است" }, { status: 400 });
    }
    const name = body.name.normalize("NFC").trim().replace(/\s+/g, " ");
    if (name.length < 2 || name.length > 60 || name === "همه" || /[<>\u0000-\u001f]/.test(name)) {
      return NextResponse.json({ error: "نام دسته‌بندی باید بین ۲ تا ۶۰ نویسه و بدون نویسه‌های نامعتبر باشد" }, { status: 400 });
    }
    const saved = await createSiteCategory(name);
    if (!saved) {
      return NextResponse.json({ error: "این دسته‌بندی قبلاً ثبت شده است" }, { status: 409 });
    }
    return NextResponse.json({ category: saved }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "ثبت دسته‌بندی ناموفق بود" }, { status: 500 });
  }
}
