"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PublicGallery } from "@/components/public-gallery";
import type { MediaItem } from "@/types/media";
import type { SiteContent } from "@/lib/cms-content";

export function PublicHome({ initialItems, content, categories }: { initialItems: MediaItem[]; content: SiteContent; categories: string[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  async function counter(id: string, action: "like" | "view") {
    try {
      const response = await fetch("/api/media/" + encodeURIComponent(id), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!response.ok) return;
      const values = await response.json() as { likes: number; views: number };
      setItems((current) => current.map((item) => item.id === id ? { ...item, ...values } : item));
    } catch { /* Network errors must not block the public gallery. */ }
  }
  return <PublicGallery
    items={items}
    content={content}
    categories={categories}
    onLike={(id) => { void counter(id, "like"); }}
    onView={(id) => { void counter(id, "view"); }}
    onEnterAdmin={() => router.push("/admin")}
  />;
}
