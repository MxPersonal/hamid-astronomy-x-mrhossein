"use client";

import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  Aperture,
  Search,
  Sparkles,
} from "lucide-react";
import { mediaCategories } from "@/data/media";
import type { MediaCategory, MediaItem } from "@/types/media";
import type { SiteContent } from "@/lib/cms-content";
import { MediaCard } from "./media-card";
import { MediaModal } from "./media-modal";
import { MediaImage } from "./media-image";

interface PublicGalleryProps {
  items: MediaItem[];
  onLike: (id: string) => void;
  onView: (id: string) => void;
  onEnterAdmin: () => void;
  content: SiteContent;
}

export function PublicGallery({
  items,
  onLike,
  onView,
  onEnterAdmin,
  content,
}: PublicGalleryProps) {
  const [activeCategory, setActiveCategory] = useState<"همه" | MediaCategory>(
    "همه",
  );
  const [query, setQuery] = useState("");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const selectedItem = items.find((item) => item.id === selectedItemId) ?? null;

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("fa");
    return items.filter((item) => {
      const matchesCategory =
        activeCategory === "همه" || item.category === activeCategory;
      const matchesQuery =
        !normalizedQuery ||
        `${item.title} ${item.description} ${item.category}`
          .toLocaleLowerCase("fa")
          .includes(normalizedQuery);
      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, items, query]);

  const featured = items.find((item) => item.featured) ?? items[0];

  return (
    <div className="public-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="صفحه اصلی Hamid Astronomy">
          <span className="brand-orbit" aria-hidden="true">
            <i />
          </span>
          <span>
            <strong>{content.brandName}</strong>
            <small>{content.brandTagline}</small>
          </span>
        </a>

        <nav aria-label="ناوبری اصلی">
          <a className="active" href="#gallery">
            {content.navGallery}
          </a>
          <a href="#about">{content.navAbout}</a>
        </nav>

        <button type="button" className="admin-entry" onClick={onEnterAdmin}>
          {content.adminEntryLabel}
          <ArrowLeft size={16} />
        </button>
      </header>

      <main id="top">
        <section className="hero" aria-labelledby="hero-title">
          {featured && (
            <MediaImage
              src={content.heroImage || featured.image}
              alt=""
              priority
              sizes="100vw"
              className="hero-image"
            />
          )}
          <div className="hero-grid" />
          <div className="hero-aurora" />
          <div className="hero-content">
            <div className="eyebrow">
              <Sparkles size={15} />
              {content.heroEyebrow}
            </div>
            <h1 id="hero-title">
              {content.heroTitle} <em>{content.heroHighlight}</em>
            </h1>
            <p>
              {content.heroDescription}
            </p>
            <div className="hero-actions">
              <a href="#gallery" className="primary-action">
                {content.heroButton} <ArrowDown size={17} />
              </a>
              <span>{content.heroCaption}</span>
            </div>
          </div>
          <div className="hero-index" aria-hidden="true">
            <span>∞</span>
            <i />
            <small>HAMID ASTRONOMY / COSMIC ARCHIVE</small>
          </div>
        </section>

        <section className="gallery-section" id="gallery">
          <div className="section-heading">
            <div>
              <span className="section-number">۰۱</span>
              <h2>{content.galleryTitle}</h2>
              <p>{content.galleryDescription}</p>
            </div>
            <label className="search-field">
              <Search size={17} />
              <span className="sr-only">جست‌وجوی گالری</span>
              <input
                type="search"
                placeholder={content.gallerySearch}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
          </div>

          <div className="gallery-filters" role="group" aria-label="فیلتر گالری">
            {mediaCategories.map((category) => (
              <button
                type="button"
                key={category}
                className={activeCategory === category ? "active" : ""}
                onClick={() => setActiveCategory(category)}
              >
                {category}
                {category === "همه" && <span>{items.length.toLocaleString("fa-IR")}</span>}
              </button>
            ))}
          </div>

          {filteredItems.length > 0 ? (
            <div className="gallery-grid">
              {filteredItems.map((item, index) => (
                <MediaCard
                  key={item.id}
                  item={item}
                  index={index}
                  onOpen={(item) => { setSelectedItemId(item.id); onView(item.id); }}
                />
              ))}
            </div>
          ) : (
            <div className="empty-gallery">
              <span className="brand-orbit" aria-hidden="true">
                <i />
              </span>
              <h3>{content.galleryEmptyTitle}</h3>
              <p>{content.galleryEmptyDescription}</p>
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setActiveCategory("همه");
                }}
              >
                {content.galleryEmptyButton}
              </button>
            </div>
          )}
        </section>

        <section className="about-strip" id="about">
          <div>
            <span className="section-number">۰۲</span>
            <p>{content.aboutEyebrow}</p>
          </div>
          <h2>
            {content.aboutTitle} <em>{content.aboutHighlight}</em>
          </h2>
          <p>
            {content.aboutDescription}
          </p>
        </section>
      </main>

      <footer>
        <a className="brand brand-footer" href="#top">
          <span className="brand-orbit" aria-hidden="true">
            <i />
          </span>
          <span>
            <strong>سُها</strong>
            <small>روایت بی‌کران</small>
          </span>
        </a>
        <p>{content.footerDescription}</p>
        <a href={content.footerInstagram || "#about"} target="_blank" rel="noreferrer" aria-label="اینستاگرام">
          <Aperture size={18} />
        </a>
      </footer>

      {selectedItem && (
        <MediaModal
          item={selectedItem}
          onClose={() => setSelectedItemId(null)}
          onLike={onLike}
        />
      )}
    </div>
  );
}
