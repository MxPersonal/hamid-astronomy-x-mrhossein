"use client";

import { useRouter } from "next/navigation";
import { PublicGallery } from "@/components/public-gallery";
import { useMediaLibrary } from "@/hooks/use-media-library";

export default function Home() {
  const router = useRouter();
  const { publishedItems, likeItem } = useMediaLibrary();

  return (
    <PublicGallery
      items={publishedItems}
      onLike={likeItem}
      onEnterAdmin={() => router.push("/admin")}
    />
  );
}
