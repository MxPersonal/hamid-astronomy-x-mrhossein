import { NextResponse } from "next/server";
import { hasValidAdminSession } from "@/lib/admin-auth";
import { isSameOriginRequest } from "@/lib/request-security";
import { getCmsNotifications, readAllNotifications } from "@/lib/cms-db";

export async function GET() {
  if (!(await hasValidAdminSession())) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  try {
    return NextResponse.json({ notifications: await getCmsNotifications() }, { headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ error: "دریافت اعلان‌ها ناموفق بود" }, { status: 500 }); }
}
export async function PATCH(request: Request) {
  if (!(await hasValidAdminSession())) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "مبدأ نامعتبر" }, { status: 403 });
  try {
    await readAllNotifications();
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "بروزرسانی اعلان‌ها ناموفق بود" }, { status: 500 }); }
}
