import { NextResponse } from "next/server";
import { hasValidAdminSession } from "@/lib/admin-auth";
import { isSameOriginRequest } from "@/lib/request-security";
import { createMedia, editMedia, toggleMediaPublish, deleteMedia, siteCategoryExists } from "@/lib/cms-db";
import type { MediaCategory, NewMediaInput } from "@/types/media";

const MAX_REQUEST_BYTES = 4 * 1024 * 1024;

async function allowed(request: Request): Promise<Response | null> {
  if (!(await hasValidAdminSession())) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "مبدأ نامعتبر" }, { status: 403 });
  return null;
}

function validImage(value: string) {
  if (/^https:\/\//i.test(value)) return true;
  return /^data:image\/(png|jpeg|webp);base64,[a-z0-9+/=]+$/i.test(value) && value.length < 3_500_000;
}
function parseMedia(data: unknown): NewMediaInput | null {
  if (!data || typeof data !== "object") return null;
  const x = data as Record<string, unknown>;
  if (typeof x.title !== "string" || x.title.trim().length < 3 || x.title.length > 160 ||
    typeof x.description !== "string" || x.description.trim().length < 10 ||
    x.description.length > (x.type === "text" ? 10000 : 3000) ||
    (x.type !== "image" && x.type !== "video" && x.type !== "text") ||
    typeof x.category !== "string" || x.category.length < 2 || x.category.length > 60 || x.category === "همه" ||
    typeof x.image !== "string" ||
    (x.type === "text" ? (x.image !== "" && !validImage(x.image)) : !validImage(x.image)) ||
    typeof x.capturedAt !== "string" || x.capturedAt.length > 120 ||
    typeof x.published !== "boolean") return null;
  let videoUrl: string | undefined;
  if (x.type === "video") {
    if (typeof x.videoUrl !== "string" || x.videoUrl.length > 2000) return null;
    try {
      const u = new URL(x.videoUrl.trim());
      if (u.protocol !== "https:") return null;
      if (u.hostname === "youtu.be") videoUrl = "https://www.youtube.com/embed/" + encodeURIComponent(u.pathname.slice(1));
      else if (["www.youtube.com", "youtube.com", "m.youtube.com"].includes(u.hostname) && u.pathname === "/watch" && u.searchParams.get("v"))
        videoUrl = "https://www.youtube.com/embed/" + encodeURIComponent(u.searchParams.get("v")!);
      else if (["www.youtube.com", "youtube.com", "www.youtube-nocookie.com"].includes(u.hostname) && u.pathname.startsWith("/embed/")) videoUrl = u.href;
      else if (/\.(mp4|webm)(\?.*)?$/i.test(u.href)) videoUrl = u.href;
      else return null;
    } catch { return null; }
  }
  return {
    title: x.title.trim(), description: x.description.trim(), type: x.type,
    category: x.category.trim() as MediaCategory,
    image: x.image, videoUrl, capturedAt: x.capturedAt.trim(), published: x.published,
  };
}

async function readInput(request: Request): Promise<{ input: NewMediaInput | null; id: string | null }> {
  const length = Number(request.headers.get("content-length") || 0);
  if (length > MAX_REQUEST_BYTES) return { input: null, id: null };
  const data = await request.text();
  if (data.length > MAX_REQUEST_BYTES) return { input: null, id: null };
  const body: unknown = JSON.parse(data);
  return { input: parseMedia(body), id: body && typeof body === "object" && "id" in body && typeof body.id === "string" ? body.id : null };
}

export async function POST(request: Request) {
  const auth = await allowed(request); if (auth) return auth;
  try {
    const { input } = await readInput(request);
    if (!input) return NextResponse.json({ error: "مشخصات محتوا نامعتبر است؛ برای نوشته فقط عنوان و متن لازم است" }, { status: 400 });
    if (!(await siteCategoryExists(input.category))) return NextResponse.json({ error: "دسته‌بندی انتخاب‌شده وجود ندارد؛ ابتدا آن را بسازید" }, { status: 400 });
    return NextResponse.json({ item: await createMedia(input) }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "ثبت رسانه در پایگاه داده ناموفق بود" }, { status: 500 });
  }
}
export async function PUT(request: Request) {
  const auth = await allowed(request); if (auth) return auth;
  try {
    const { input, id } = await readInput(request);
    if (!input || !id || id.length > 200) return NextResponse.json({ error: "مشخصات نامعتبر" }, { status: 400 });
    if (!(await siteCategoryExists(input.category))) return NextResponse.json({ error: "دسته‌بندی انتخاب‌شده معتبر نیست" }, { status: 400 });
    const item = await editMedia(id, input);
    return item ? NextResponse.json({ item }) : NextResponse.json({ error: "محتوا پیدا نشد" }, { status: 404 });
  } catch {
    return NextResponse.json({ error: "ویرایش محتوا ناموفق بود" }, { status: 500 });
  }
}
export async function PATCH(request: Request) {
  const auth = await allowed(request); if (auth) return auth;
  try {
    const body = await request.json();
    if (typeof body.id !== "string" || body.id.length > 200) return NextResponse.json({ error: "شناسه نامعتبر" }, { status: 400 });
    const item = await toggleMediaPublish(body.id);
    return item ? NextResponse.json({ item }) : NextResponse.json({ error: "محتوا پیدا نشد" }, { status: 404 });
  } catch {
    return NextResponse.json({ error: "تغییر وضعیت ناموفق بود" }, { status: 500 });
  }
}
export async function DELETE(request: Request) {
  const auth = await allowed(request); if (auth) return auth;
  try {
    const body = await request.json();
    if (typeof body.id !== "string" || body.id.length > 200) return NextResponse.json({ error: "شناسه نامعتبر" }, { status: 400 });
    return (await deleteMedia(body.id)) ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "محتوا پیدا نشد" }, { status: 404 });
  } catch {
    return NextResponse.json({ error: "حذف محتوا ناموفق بود" }, { status: 500 });
  }
}
