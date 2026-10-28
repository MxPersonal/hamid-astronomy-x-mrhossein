import { PublicHome } from "@/components/public-home";
import { getMediaItems, getSiteContent } from "@/lib/cms-db";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [initialItems, content] = await Promise.all([getMediaItems(), getSiteContent()]);
  return <PublicHome initialItems={initialItems} content={content} />;
}
