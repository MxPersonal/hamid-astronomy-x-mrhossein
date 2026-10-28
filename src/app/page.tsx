import type { Metadata } from "next";
import { PublicHome } from "@/components/public-home";
import { getMediaItems, getSiteContent, getSiteCategories } from "@/lib/cms-db";
import { SITE_URL, publicImageUrl, serializeJsonLd } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const [content, items] = await Promise.all([getSiteContent(), getMediaItems()]);
  const image = publicImageUrl(content.heroImage) ??
    items.map((item) => publicImageUrl(item.image)).find(Boolean);
  return {
    title: content.seoTitle,
    description: content.seoDescription,
    alternates: { canonical: SITE_URL + "/" },
    openGraph: {
      title: content.seoTitle,
      description: content.seoDescription,
      url: SITE_URL + "/",
      siteName: content.brandName,
      locale: "fa_IR",
      type: "website",
      ...(image ? { images: [{ url: image, alt: content.brandName }] } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: content.seoTitle,
      description: content.seoDescription,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default async function Home() {
  const [initialItems, content, categories] = await Promise.all([
    getMediaItems(), getSiteContent(), getSiteCategories(),
  ]);
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": SITE_URL + "/#website",
    name: content.brandName,
    url: SITE_URL + "/",
    description: content.seoDescription,
    inLanguage: "fa-IR",
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }} />
      <PublicHome initialItems={initialItems} content={content} categories={categories} />
    </>
  );
}
