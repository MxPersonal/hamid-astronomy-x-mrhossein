import "server-only";
import { neon } from "@neondatabase/serverless";
import { initialMedia, mediaCategories } from "@/data/media";
import { SITE_DEFAULTS, type SiteContent, type CmsNotification } from "@/lib/cms-content";
import type { MediaItem, MediaSeo, NewMediaInput } from "@/types/media";
import { DEFAULT_MEDIA_SEO, SEO_KEY_PREFIX, parseStoredMediaSeo } from "@/lib/media-seo";

function seoKey(id: string) { return SEO_KEY_PREFIX + id; }

async function getSeoMap(): Promise<Map<string, MediaSeo>> {
  const map = new Map<string, MediaSeo>();
  if (!isDatabaseConfigured()) return map;
  const rows = await db()`SELECT key, value FROM site_content WHERE key LIKE 'media-seo:%'`;
  for (const row of rows) {
    try {
      map.set(String(row.key).slice(SEO_KEY_PREFIX.length), parseStoredMediaSeo(JSON.parse(String(row.value))));
    } catch { /* Ignore malformed metadata while retaining the media record. */ }
  }
  return map;
}

async function getSeoForId(id: string): Promise<MediaSeo> {
  if (!isDatabaseConfigured()) return { ...DEFAULT_MEDIA_SEO };
  const rows = await db()`SELECT value FROM site_content WHERE key = ${seoKey(id)} LIMIT 1`;
  if (!rows.length) return { ...DEFAULT_MEDIA_SEO };
  try { return parseStoredMediaSeo(JSON.parse(String(rows[0].value))); }
  catch { return { ...DEFAULT_MEDIA_SEO }; }
}

async function writeSeo(id: string, seo?: MediaSeo): Promise<MediaSeo | undefined> {
  if (!seo) return undefined;
  const previous = await getSeoForId(id);
  const aliases = new Set(previous.aliases ?? []);
  if (previous.slug && previous.slug !== seo.slug) aliases.add(previous.slug);
  aliases.delete(seo.slug);
  const combined: MediaSeo = { ...seo, aliases: [...aliases].slice(-20) };
  const key = seoKey(id), value = JSON.stringify(combined);
  await db()`INSERT INTO site_content (key, value, updated_at) VALUES (${key}, ${value}, now())
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`;
  return combined;
}

async function assertUniqueSeoSlug(id: string | null, slug?: string) {
  if (!slug) return;
  const items = await getMediaItems(true);
  if (items.some((item) => item.id !== id && (item.id === slug || item.seo?.slug === slug || item.seo?.aliases?.includes(slug)))) {
    throw new Error("SEO_SLUG_CONFLICT");
  }
}

export function isDatabaseConfigured() {
  return Boolean(process.env.HAMID_ASTRONOMY_DATABASE_URL || process.env.DATABASE_URL);
}

function db() {
  const url = process.env.HAMID_ASTRONOMY_DATABASE_URL || process.env.DATABASE_URL;
  if (!url) throw new Error("Hamid Astronomy database URL is not configured");
  return neon(url);
}

function asMedia(row: Record<string, unknown>): MediaItem {
  return {
    id: String(row.id),
    title: String(row.title),
    description: String(row.description),
    type: row.type as MediaItem["type"],
    category: row.category as MediaItem["category"],
    image: String(row.image),
    videoUrl: row.video_url == null ? undefined : String(row.video_url),
    duration: row.duration == null ? undefined : String(row.duration),
    capturedAt: String(row.captured_at),
    views: Number(row.views),
    likes: Number(row.likes),
    featured: Boolean(row.featured),
    published: Boolean(row.published),
    createdAt: new Date(String(row.created_at)).toISOString(),
  };
}

function asTextPost(row: Record<string, unknown>): MediaItem {
  return asMedia({ ...row, type: "text", video_url: null, duration: null, featured: false });
}

function isTextPost(id: string) {
  return id.startsWith("text-");
}

export async function getSiteCategories(): Promise<string[]> {
  if (!isDatabaseConfigured()) return mediaCategories.filter((category) => category !== "همه");
  const rows = await db()`SELECT name FROM site_categories ORDER BY sort_order, created_at, name`;
  return rows.map((row) => String(row.name));
}

export async function createSiteCategory(name: string): Promise<string | null> {
  const normalized = name.normalize("NFC").trim().replace(/\\s+/g, " ");
  const rows = await db()`
    INSERT INTO site_categories (name)
    VALUES (${normalized})
    ON CONFLICT (name) DO NOTHING RETURNING name
  `;
  if (rows.length === 0) return null;
  await notify("دسته‌بندی جدید ایجاد شد", normalized, "category");
  return normalized;
}

export async function siteCategoryExists(name: string): Promise<boolean> {
  const rows = await db()`SELECT 1 FROM site_categories WHERE name = ${name} LIMIT 1`;
  return rows.length > 0;
}

export async function getSiteContent(): Promise<SiteContent> {
  const defaults: SiteContent = { ...SITE_DEFAULTS };
  if (!isDatabaseConfigured()) return defaults;
  const rows = await db()`SELECT key, value FROM site_content`;
  for (const row of rows) {
    if (Object.prototype.hasOwnProperty.call(defaults, row.key)) {
      defaults[row.key as keyof SiteContent] = String(row.value);
    }
  }
  return defaults;
}

export async function getMediaItems(all = false): Promise<MediaItem[]> {
  if (!isDatabaseConfigured()) return initialMedia.filter((item) => all || item.published);
  const sql = db();
  const [mediaRows, postRows, seoMap] = await Promise.all([
    all
      ? sql`SELECT * FROM media_items ORDER BY created_at DESC, id DESC`
      : sql`SELECT * FROM media_items WHERE published = true ORDER BY created_at DESC, id DESC`,
    all
      ? sql`SELECT * FROM text_posts ORDER BY created_at DESC, id DESC`
      : sql`SELECT * FROM text_posts WHERE published = true ORDER BY created_at DESC, id DESC`,
    getSeoMap(),
  ]);
  return [...mediaRows.map((row) => asMedia(row)), ...postRows.map((row) => asTextPost(row))]
    .map((item) => ({ ...item, seo: seoMap.get(item.id) ?? { ...DEFAULT_MEDIA_SEO } }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Fetch one public record from Neon. Drafts and deleted records are never exposed. */
/** Resolve a public item by stable ID or optional editorial slug. */
export async function getPublicMediaItem(idOrSlug: string): Promise<MediaItem | null> {
  if (!idOrSlug || idOrSlug.length > 200) return null;
  if (!isDatabaseConfigured()) {
    return initialMedia.find((item) => item.published && item.id === idOrSlug) ?? null;
  }
  const sql = db();
  const rows = idOrSlug.startsWith("text-")
    ? await sql`SELECT * FROM text_posts WHERE id = ${idOrSlug} AND published = true LIMIT 1`
    : await sql`SELECT * FROM media_items WHERE id = ${idOrSlug} AND published = true LIMIT 1`;
  if (rows.length) {
    const item = idOrSlug.startsWith("text-") ? asTextPost(rows[0]) : asMedia(rows[0]);
    return { ...item, seo: await getSeoForId(item.id) };
  }
  const items = await getMediaItems();
  return items.find((item) => item.seo?.slug === idOrSlug || item.seo?.aliases?.includes(idOrSlug)) ?? null;
}

export async function getCmsNotifications(): Promise<CmsNotification[]> {
  if (!isDatabaseConfigured()) return [];
  const rows = await db()`SELECT id, title, message, event_type, created_at, read_at FROM cms_notifications ORDER BY created_at DESC LIMIT 50`;
  return rows.map((row) => ({
    id: Number(row.id),
    title: String(row.title),
    message: String(row.message),
    event_type: String(row.event_type),
    created_at: new Date(String(row.created_at)).toISOString(),
    read_at: row.read_at ? new Date(String(row.read_at)).toISOString() : null,
  }));
}

async function notify(title: string, message: string, eventType: string) {
  await db()`INSERT INTO cms_notifications (title, message, event_type) VALUES (${title}, ${message}, ${eventType})`;
}

export async function updateSiteContent(key: keyof SiteContent, value: string) {
  await db()`INSERT INTO site_content (key, value, updated_at) VALUES (${key}, ${value}, now())
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`;
  await notify("محتوای سایت ویرایش شد", `فیلد «${key}» به‌روزرسانی شد.`, "content");
}

export async function createMedia(input: NewMediaInput): Promise<MediaItem> {
  await assertUniqueSeoSlug(null, input.seo?.slug);
  if (input.type === "text") {
    const id = "text-" + crypto.randomUUID();
    const rows = await db()`INSERT INTO text_posts
      (id, title, description, category, image, captured_at, published)
      VALUES (${id}, ${input.title}, ${input.description}, ${input.category},
        ${input.image}, ${input.capturedAt}, ${input.published})
      RETURNING *`;
    const savedSeo = await writeSeo(id, input.seo);
    await notify(input.published ? "نوشته جدید منتشر شد" : "پیش‌نویس نوشته ذخیره شد", input.title, "text");
    return { ...asTextPost(rows[0]), seo: savedSeo };
  }
  const id = crypto.randomUUID();
  const rows = await db()`INSERT INTO media_items
    (id, title, description, type, category, image, video_url, captured_at, published, featured)
    VALUES (${id}, ${input.title}, ${input.description}, ${input.type}, ${input.category},
      ${input.image}, ${input.videoUrl || null}, ${input.capturedAt}, ${input.published}, false)
    RETURNING *`;
  const savedSeo = await writeSeo(id, input.seo);
  await notify(input.published ? "اثر جدید منتشر شد" : "پیش‌نویس تازه ذخیره شد", input.title, "media");
  return { ...asMedia(rows[0]), seo: savedSeo };
}

export async function editMedia(id: string, input: NewMediaInput): Promise<MediaItem | null> {
  await assertUniqueSeoSlug(id, input.seo?.slug);
  if (isTextPost(id)) {
    if (input.type !== "text") return null;
    const rows = await db()`UPDATE text_posts SET
      title = ${input.title}, description = ${input.description},
      category = ${input.category}, image = ${input.image}, captured_at = ${input.capturedAt},
      published = ${input.published}
      WHERE id = ${id} RETURNING *`;
    if (!rows.length) return null;
    const savedSeo = await writeSeo(id, input.seo);
    await notify("نوشته ویرایش شد", input.title, "text");
    return { ...asTextPost(rows[0]), seo: savedSeo ?? await getSeoForId(id) };
  }
  if (input.type === "text") return null;
  const rows = await db()`UPDATE media_items SET
    title = ${input.title}, description = ${input.description}, type = ${input.type},
    category = ${input.category}, image = ${input.image}, video_url = ${input.videoUrl || null},
    captured_at = ${input.capturedAt}, published = ${input.published}
    WHERE id = ${id} RETURNING *`;
  if (!rows.length) return null;
  const savedSeo = await writeSeo(id, input.seo);
  await notify("محتوا ویرایش شد", input.title, "media");
  return { ...asMedia(rows[0]), seo: savedSeo ?? await getSeoForId(id) };
}

export async function deleteMedia(id: string): Promise<boolean> {
  const rows = isTextPost(id)
    ? await db()`DELETE FROM text_posts WHERE id = ${id} RETURNING title`
    : await db()`DELETE FROM media_items WHERE id = ${id} RETURNING title`;
  if (!rows.length) return false;
  await db()`DELETE FROM site_content WHERE key = ${seoKey(id)}`;
  await notify("محتوا حذف شد", String(rows[0].title), "media");
  return true;
}

export async function toggleMediaPublish(id: string): Promise<MediaItem | null> {
  const rows = isTextPost(id)
    ? await db()`UPDATE text_posts SET published = NOT published WHERE id = ${id} RETURNING *`
    : await db()`UPDATE media_items SET published = NOT published WHERE id = ${id} RETURNING *`;
  if (!rows.length) return null;
  await notify(rows[0].published ? "اثر منتشر شد" : "اثر پیش‌نویس شد", String(rows[0].title), "media");
  return { ...(isTextPost(id) ? asTextPost(rows[0]) : asMedia(rows[0])), seo: await getSeoForId(id) };
}

export async function incrementMediaCounter(id: string, action: "like" | "view") {
  const rows = isTextPost(id)
    ? action === "like"
      ? await db()`UPDATE text_posts SET likes = likes + 1 WHERE id = ${id} AND published = true RETURNING likes, views`
      : await db()`UPDATE text_posts SET views = views + 1 WHERE id = ${id} AND published = true RETURNING likes, views`
    : action === "like"
      ? await db()`UPDATE media_items SET likes = likes + 1 WHERE id = ${id} AND published = true RETURNING likes, views`
      : await db()`UPDATE media_items SET views = views + 1 WHERE id = ${id} AND published = true RETURNING likes, views`;
  return rows.length ? { likes: Number(rows[0].likes), views: Number(rows[0].views) } : null;
}

export async function readAllNotifications() {
  await db()`UPDATE cms_notifications SET read_at = now() WHERE read_at IS NULL`;
}
