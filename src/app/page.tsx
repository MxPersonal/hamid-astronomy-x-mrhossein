import type { Metadata } from "next";
import { PublicHome } from "@/components/public-home";
import { getMediaItems, getSiteContent } from "@/lib/cms-db";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const content = await getSiteContent();
  return { title: content.seoTitle, description: content.seoDescription };
}

export default async function Home() {
  const [initialItems, content] = await Promise.all([getMediaItems(), getSiteContent()]);
  return <PublicHome initialItems={initialItems} content={content} />;
}
