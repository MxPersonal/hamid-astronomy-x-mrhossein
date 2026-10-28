import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

/** Search crawling is allowed; administration and internal APIs are excluded. */
export default function robots(): MetadataRoute.Robots {
  const privatePaths = ["/admin", "/admin/", "/api/"];
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: privatePaths },
      { userAgent: "OAI-SearchBot", allow: "/", disallow: privatePaths },
    ],
    sitemap: SITE_URL + "/sitemap.xml",
  };
}
