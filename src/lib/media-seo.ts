import type { MediaSeo } from "@/types/media";

export const SEO_KEY_PREFIX = "media-seo:";

export const DEFAULT_MEDIA_SEO: MediaSeo = {
  slug: "",
  title: "",
  description: "",
  altText: "",
  shareImage: "",
  sourceUrl: "",
  indexable: true,
  publishedAt: "",
};

export function parseStoredMediaSeo(value: unknown): MediaSeo {
  if (!value || typeof value !== "object") return { ...DEFAULT_MEDIA_SEO };
  const data = value as Record<string, unknown>;
  return {
    slug: typeof data.slug === "string" ? data.slug : "",
    title: typeof data.title === "string" ? data.title : "",
    description: typeof data.description === "string" ? data.description : "",
    altText: typeof data.altText === "string" ? data.altText : "",
    shareImage: typeof data.shareImage === "string" ? data.shareImage : "",
    sourceUrl: typeof data.sourceUrl === "string" ? data.sourceUrl : "",
    indexable: data.indexable !== false,
    publishedAt: typeof data.publishedAt === "string" ? data.publishedAt : "",
    aliases: Array.isArray(data.aliases) ? data.aliases.filter((v): v is string => typeof v === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v)).slice(-20) : [],
  };
}

export function parseSeoInput(value: unknown): MediaSeo | null {
  if (value === undefined) return { ...DEFAULT_MEDIA_SEO };
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const v = value as Record<string, unknown>;
  const lengths = { slug: 90, title: 160, description: 320, altText: 300,
    shareImage: 2048, sourceUrl: 2048, publishedAt: 10 } as const;
  for (const [key, max] of Object.entries(lengths)) {
    if (typeof v[key] !== "string" || (v[key] as string).length > max) return null;
  }
  const seo = parseStoredMediaSeo(v);
  seo.slug = seo.slug.trim().toLowerCase();
  if (seo.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(seo.slug)) return null;
  for (const url of [seo.sourceUrl, seo.shareImage]) {
    if (!url.trim()) continue;
    try { if (new URL(url).protocol !== "https:") return null; }
    catch { return null; }
  }
  if (seo.publishedAt) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(seo.publishedAt) ||
      Number.isNaN(Date.parse(seo.publishedAt)) ||
      new Date(seo.publishedAt).toISOString().slice(0, 10) !== seo.publishedAt) return null;
  }
  if (typeof v.indexable !== "boolean") return null;
  return seo;
}
