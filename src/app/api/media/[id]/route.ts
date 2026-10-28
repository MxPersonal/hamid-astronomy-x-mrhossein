import { NextResponse } from "next/server";
import { incrementMediaCounter } from "@/lib/cms-db";
import { isSameOriginRequest } from "@/lib/request-security";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "مبدأ نامعتبر" }, { status: 403 });
  const { id } = await context.params;
  if (!id || id.length > 200) return NextResponse.json({ error: "شناسه نامعتبر" }, { status: 400 });
  try {
    const body = await request.json();
    if (body.action !== "like" && body.action !== "view") return NextResponse.json({ error: "عملیات نامعتبر" }, { status: 400 });
    const counters = await incrementMediaCounter(id, body.action);
    return counters ? NextResponse.json(counters) : NextResponse.json({ error: "محتوا پیدا نشد" }, { status: 404 });
  } catch { return NextResponse.json({ error: "به‌روزرسانی آمار ناموفق بود" }, { status: 500 }); }
}
