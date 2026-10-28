"use client";

import { Eye, FileText, Heart, Play } from "lucide-react";
import Link from "next/link";
import { mediaPermalink } from "@/lib/seo";
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
      className={`gallery-card gallery-card-${index % 5}${item.type === "text" ? " gallery-card-text" : ""}`}
      style={{ animationDelay: `${Math.min(index * 70, 420)}ms` }}
    >
      <button
        type="button"
        className="gallery-card-button"
        onClick={() => onOpen(item)}
        aria-label={`نمایش ${item.title}`}
      >
        {item.image ? (
          <MediaImage
            src={item.image}
            alt={item.seo?.altText || item.title}
            sizes="(max-width: 680px) 100vw, (max-width: 1100px) 50vw, 33vw"
            className="gallery-image"
          />
        ) : (
          <div className="gallery-text-art" aria-hidden="true">
            <span className="gallery-text-orbit" />
            <FileText size={60} strokeWidth={1} />
          </div>
        )}
        <div className="gallery-card-shade" />
        <div className="gallery-card-top">
          <span>{item.category}</span>
          {item.type === "video" && (
            <span className="duration-badge">
              <Play size={12} fill="currentColor" /> {item.duration ?? "ویدیو"}
            </span>
          )}
          {item.type === "text" && (
            <span className="duration-badge"><FileText size={12} /> نوشته</span>
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
      <Link
        href={mediaPermalink(item)}
        prefetch={false}
        className="gallery-permalink"
        aria-label={`صفحه مستقل: ${item.title}`}
      >
        صفحه کامل
      </Link>
    </article>
  );
}
