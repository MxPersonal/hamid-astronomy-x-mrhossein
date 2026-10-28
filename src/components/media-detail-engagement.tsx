"use client";

import { useEffect, useState } from "react";
import { Eye, Heart } from "lucide-react";
import { formatCompactNumber } from "@/lib/format";

interface Props {
  id: string;
  initialViews: number;
  initialLikes: number;
}

export function MediaDetailEngagement({ id, initialViews, initialLikes }: Props) {
  const [counts, setCounts] = useState({ views: initialViews, likes: initialLikes });
  const [liking, setLiking] = useState(false);

  useEffect(() => {
    let active = true;
    void fetch(`/api/media/${encodeURIComponent(id)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "view" }),
    }).then(async (response) => {
      if (response.ok && active) {
        const values = await response.json() as { views: number; likes: number };
        if (active) setCounts(values);
      }
    }).catch(() => { /* View counter failures must not block reading. */ });
    return () => { active = false; };
  }, [id]);

  async function handleLike() {
    if (liking) return;
    setLiking(true);
    try {
      const response = await fetch(`/api/media/${encodeURIComponent(id)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "like" }),
      });
      if (response.ok) {
        setCounts(await response.json() as { views: number; likes: number });
      }
    } catch {
      // Keep the current numbers if the request fails.
    } finally {
      setLiking(false);
    }
  }

  return (
    <div className="detail-engagement">
      <span><Eye size={17} aria-hidden="true" /> {formatCompactNumber(counts.views)} بازدید</span>
      <button type="button" onClick={handleLike} disabled={liking} aria-label="پسندیدن این محتوا">
        <Heart size={17} aria-hidden="true" /> {formatCompactNumber(counts.likes)} پسند
      </button>
    </div>
  );
}
