import type { Metadata } from "next";
import { PublicHome } from "@/components/public-home";
import { getMediaItems, getSiteContent, getSiteCategories } from "@/lib/cms-db";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const content = await getSiteContent();
  return { title: content.seoTitle, description: content.seoDescription };
}

export default async function Home() {
  const [initialItems, content, categories] = await Promise.all([getMediaItems(), getSiteContent(), getSiteCategories()]);
  return <PublicHome initialItems={initialItems} content={content} categories={categories} />;
}
