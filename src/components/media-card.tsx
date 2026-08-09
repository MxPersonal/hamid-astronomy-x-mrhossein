"use client";

import { Eye, Heart, Play } from "lucide-react";
import { formatCompactNumber } from "@/lib/format";
import type { MediaItem } from "@/types/media";
import { MediaImage } from "./media-image";

interface MediaCardProps {
  item: MediaItem;
  index: number;
  onOpen: (item: MediaItem) => void;
}

export function MediaCard({ item, index, onOpen }: MediaCardProps) {
  return (
    <article
      className={`gallery-card gallery-card-${index % 5}`}
      style={{ animationDelay: `${Math.min(index * 70, 420)}ms` }}
    >
      <button
        type="button"
        className="gallery-card-button"
        onClick={() => onOpen(item)}
        aria-label={`نمایش ${item.title}`}
      >
        <MediaImage
          src={item.image}
          alt={item.title}
          sizes="(max-width: 680px) 100vw, (max-width: 1100px) 50vw, 33vw"
          className="gallery-image"
        />
        <div className="gallery-card-shade" />
        <div className="gallery-card-top">
          <span>{item.category}</span>
          {item.type === "video" && (
            <span className="duration-badge">
              <Play size={12} fill="currentColor" /> {item.duration ?? "ویدیو"}
            </span>
          )}
        </div>
        {item.type === "video" && (
          <span className="gallery-play" aria-hidden="true">
            <Play size={25} fill="currentColor" />
          </span>
        )}
        <div className="gallery-card-copy">
          <h3>{item.title}</h3>
          <p>{item.description}</p>
          <div className="gallery-stats">
            <span>
              <Eye size={14} /> {formatCompactNumber(item.views)}
            </span>
            <span>
              <Heart size={14} /> {formatCompactNumber(item.likes)}
            </span>
          </div>
        </div>
      </button>
    </article>
  );
}
