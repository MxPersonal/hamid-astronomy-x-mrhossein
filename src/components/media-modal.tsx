"use client";

import { useEffect, useRef } from "react";
import { CalendarDays, Eye, Heart, Play, X } from "lucide-react";
import { formatCompactNumber } from "@/lib/format";
import type { MediaItem } from "@/types/media";
import { MediaImage } from "./media-image";

interface MediaModalProps {
  item: MediaItem;
  onClose: () => void;
  onLike: (id: string) => void;
}

export function MediaModal({ item, onClose, onLike }: MediaModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    closeButtonRef.current?.focus();
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="media-modal-title"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <article className="media-modal">
        <button
          ref={closeButtonRef}
          type="button"
          className="modal-close"
          onClick={onClose}
          aria-label="بستن پنجره"
        >
          <X size={20} />
        </button>

        <div className="modal-visual">
          {item.type === "video" && item.videoUrl ? (
            item.videoUrl.includes("youtube.com/embed") ? (
              <iframe
                src={item.videoUrl}
                title={item.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video src={item.videoUrl} poster={item.image} controls autoPlay />
            )
          ) : (
            <MediaImage
              src={item.image}
              alt={item.title}
              sizes="(max-width: 900px) 100vw, 70vw"
              className="object-cover"
              priority
            />
          )}
          {item.type === "video" && !item.videoUrl && (
            <div className="video-unavailable">
              <Play size={34} />
              <span>آدرس ویدیو در دسترس نیست</span>
            </div>
          )}
        </div>

        <div className="modal-copy">
          <div className="modal-kicker">
            <span>{item.category}</span>
            <span>•</span>
            <span>{item.type === "video" ? "ویدیو" : "تصویر"}</span>
          </div>
          <h2 id="media-modal-title">{item.title}</h2>
          <p>{item.description}</p>
          <div className="modal-meta">
            <span>
              <CalendarDays size={16} /> {item.capturedAt}
            </span>
            <span>
              <Eye size={16} /> {formatCompactNumber(item.views)} بازدید
            </span>
            <button type="button" onClick={() => onLike(item.id)}>
              <Heart size={16} /> {formatCompactNumber(item.likes)} پسند
            </button>
          </div>
        </div>
      </article>
    </div>
  );
}
