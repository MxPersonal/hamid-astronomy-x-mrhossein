import type { MediaItem } from "@/types/media";

export const SITE_URL = "https://hamid-astronomy-x-mrhossein.vercel.app";

export function mediaPermalink(id: MediaItem["id"]): string {
  return `/gallery/${encodeURIComponent(id)}`;
}

/** Return only publicly fetchable image URLs for crawlers and link previews. */
export function publicImageUrl(image?: string): string | undefined {
  if (!image) return undefined;
  if (image.startsWith("/") && !image.startsWith("//")) {
    return new URL(image, SITE_URL).toString();
  }
  try {
    const url = new URL(image);
    return url.protocol === "https:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

/** Safely serialize JSON-LD inside a script element. */
export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
