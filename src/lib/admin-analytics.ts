import type { MediaItem, MediaType } from "../types/media";

export interface MonthBucket {
  key: string;
  label: string;
  count: number;
}

/** Monthly counts reflect content creation, NOT historical visits or historical likes. */
export function getMonthlyContentCounts(
  items: Pick<MediaItem, "createdAt">[],
  months: number,
  reference = new Date(),
): MonthBucket[] {
  const count = Math.min(Math.max(Math.trunc(months) || 6, 1), 24);
  const now = Number.isFinite(reference.getTime()) ? reference : new Date();
  const formatter = new Intl.DateTimeFormat("fa-IR-u-ca-gregory", {
    month: "short", year: "2-digit", timeZone: "UTC",
  });
  const buckets = Array.from({ length: count }, (_, index) => {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (count - 1 - index), 1));
    return {
      key: `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`,
      label: formatter.format(date),
      count: 0,
    };
  });
  const byKey = new Map(buckets.map((bucket) => [bucket.key, bucket]));
  for (const item of items) {
    const date = new Date(item.createdAt);
    if (!Number.isFinite(date.getTime())) continue;
    const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
    const bucket = byKey.get(key);
    if (bucket) bucket.count += 1;
  }
  return buckets;
}

export function getMediaTypeBreakdown(items: Pick<MediaItem, "type">[]) {
  const types: MediaType[] = ["image", "video", "text"];
  return types.map((type) => ({
    type,
    count: items.filter((item) => item.type === type).length,
  }));
}

export function getTopViewedMedia(
  items: Pick<MediaItem, "id" | "title" | "views" | "published">[],
  limit = 5,
) {
  return items.filter((item) => item.published).sort((a, b) => b.views - a.views).slice(0, limit);
}
