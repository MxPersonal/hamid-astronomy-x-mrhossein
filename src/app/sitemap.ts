import type { MetadataRoute } from "next";
import { getMediaItems } from "@/lib/cms-db";
import { SITE_URL, mediaPermalink } from "@/lib/seo";

/** Always reflect the current public content in Neon, including unpublishing. */
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const items = await getMediaItems();
  return [
    { url: SITE_URL + "/" },
    ...items.filter((item) => item.seo?.indexable !== false).map((item) => ({
      url: new URL(mediaPermalink(item), SITE_URL).toString(),
    })),
  ];
}
