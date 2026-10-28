import type { MetadataRoute } from "next";
import { getMediaItems } from "@/lib/cms-db";

const SITE_URL =
  "https://hamid-astronomy-x-mrhossein.vercel.app";

export default async function sitemap():
  Promise<MetadataRoute.Sitemap> {

  const items = await getMediaItems();

  return [
    { url: SITE_URL },

    ...items.map((item) => ({
      url: `${SITE_URL}/gallery/${encodeURIComponent(item.id)}`,
    })),
  ];
}