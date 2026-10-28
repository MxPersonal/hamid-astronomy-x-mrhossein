import type { MediaSeo, ScienceQuestion, ScienceReference, VisualKind } from "@/types/media";

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
  answer: "",
  faqs: [],
  references: [],
  authorName: "",
  visualKind: "unspecified",
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
    answer: typeof data.answer === "string" ? data.answer : "",
    faqs: Array.isArray(data.faqs) ? data.faqs.filter((q): q is ScienceQuestion =>
      q !== null && typeof q === "object" && typeof q.question === "string" && typeof q.answer === "string").slice(0, 8) : [],
    references: Array.isArray(data.references) ? data.references.filter((r): r is ScienceReference =>
      r !== null && typeof r === "object" && typeof r.title === "string" && typeof r.url === "string").slice(0, 10) : [],
    authorName: typeof data.authorName === "string" ? data.authorName : "",
    visualKind: (["observation", "illustration", "simulation", "ai-generated"].includes(String(data.visualKind))
      ? data.visualKind : "unspecified") as VisualKind,
    aliases: Array.isArray(data.aliases) ? data.aliases.filter((v): v is string => typeof v === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v)).slice(-20) : [],
  };
}

export function parseSeoInput(value: unknown): MediaSeo | null {
  if (value === undefined) return { ...DEFAULT_MEDIA_SEO };
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const v = value as Record<string, unknown>;
  const lengths = { slug: 90, title: 160, description: 320, altText: 300,
    shareImage: 2048, sourceUrl: 2048, publishedAt: 10, answer: 1200, authorName: 120 } as const;
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
  if (v.faqs !== undefined && (!Array.isArray(v.faqs) || v.faqs.length > 8)) return null;
  if (v.references !== undefined && (!Array.isArray(v.references) || v.references.length > 10)) return null;
  if (v.visualKind !== undefined && !["unspecified", "observation", "illustration", "simulation", "ai-generated"].includes(String(v.visualKind))) return null;
  if (v.authorName !== undefined && typeof v.authorName !== "string") return null;
  if (v.answer !== undefined && typeof v.answer !== "string") return null;
  if (v.faqs !== undefined) {
    for (const q of v.faqs as unknown[]) {
      if (!q || typeof q !== "object") return null;
      const x = q as Record<string, unknown>;
      if (typeof x.question !== "string" || !x.question.trim() || x.question.length > 220 ||
          typeof x.answer !== "string" || !x.answer.trim() || x.answer.length > 1200) return null;
    }
  }
  if (v.references !== undefined) {
    for (const ref of v.references as unknown[]) {
      if (!ref || typeof ref !== "object") return null;
      const x = ref as Record<string, unknown>;
      if (typeof x.title !== "string" || !x.title.trim() || x.title.length > 180 ||
          typeof x.url !== "string" || x.url.length > 2048) return null;
      try {
        const url = new URL(x.url);
        if (url.protocol !== "https:" || url.username || url.password) return null;
      } catch { return null; }
    }
  }
  seo.answer = seo.answer.trim();
  seo.authorName = seo.authorName.trim();
  seo.faqs = seo.faqs.map((q) => ({ question: q.question.trim(), answer: q.answer.trim() }));
  seo.references = seo.references.map((r) => ({ title: r.title.trim(), url: r.url.trim() }));
  return seo;
}
