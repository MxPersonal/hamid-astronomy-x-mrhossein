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
import { MediaCard } from "./media-card";
import { MediaModal } from "./media-modal";
import { MediaImage } from "./media-image";

interface PublicGalleryProps {
  items: MediaItem[];
  onLike: (id: string) => void;
  onEnterAdmin: () => void;
}

export function PublicGallery({
  items,
  onLike,
  onEnterAdmin,
}: PublicGalleryProps) {
  const [activeCategory, setActiveCategory] = useState<"همه" | MediaCategory>(
    "همه",
  );
  const [query, setQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);

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
        <a className="brand" href="#top" aria-label="صفحه اصلی سها">
          <span className="brand-orbit" aria-hidden="true">
            <i />
          </span>
          <span>
            <strong>سُها</strong>
            <small>روایت بی‌کران</small>
          </span>
        </a>

        <nav aria-label="ناوبری اصلی">
          <a className="active" href="#gallery">
            گالری
          </a>
          <a href="#about">درباره سها</a>
        </nav>

        <button type="button" className="admin-entry" onClick={onEnterAdmin}>
          ورود مدیر
          <ArrowLeft size={16} />
        </button>
      </header>

      <main id="top">
        <section className="hero" aria-labelledby="hero-title">
          {featured && (
            <MediaImage
              src={featured.image}
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
              آرشیو تصویری جهان
            </div>
            <h1 id="hero-title">
              جهان، <em>قاب به قاب</em>
            </h1>
            <p>
              مجموعه‌ای انتخاب‌شده از شگفت‌انگیزترین تصاویر و ویدیوهای کیهان؛
              از سکوت ماه تا مرزهای دور کهکشان‌ها.
            </p>
            <div className="hero-actions">
              <a href="#gallery" className="primary-action">
                تماشای گالری <ArrowDown size={17} />
              </a>
              <span>هر تصویر، یک جهان برای کشف</span>
            </div>
          </div>
          <div className="hero-index" aria-hidden="true">
            <span>∞</span>
            <i />
            <small>SOHA / COSMIC ARCHIVE</small>
          </div>
        </section>

        <section className="gallery-section" id="gallery">
          <div className="section-heading">
            <div>
              <span className="section-number">۰۱</span>
              <h2>تازه‌های کیهان</h2>
              <p>آخرین قاب‌های اضافه‌شده به آرشیو سها</p>
            </div>
            <label className="search-field">
              <Search size={17} />
              <span className="sr-only">جست‌وجوی گالری</span>
              <input
                type="search"
                placeholder="جست‌وجو در کیهان..."
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
                  onOpen={setSelectedItem}
                />
              ))}
            </div>
          ) : (
            <div className="empty-gallery">
              <span className="brand-orbit" aria-hidden="true">
                <i />
              </span>
              <h3>چیزی در این مدار پیدا نشد</h3>
              <p>عبارت جست‌وجو یا دسته‌بندی را تغییر دهید.</p>
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setActiveCategory("همه");
                }}
              >
                نمایش همه آثار
              </button>
            </div>
          )}
        </section>

        <section className="about-strip" id="about">
          <div>
            <span className="section-number">۰۲</span>
            <p>درباره‌ی سها</p>
          </div>
          <h2>
            برای دیدنِ دوردست‌ها،
            <br /> گاهی فقط باید <em>مکث کرد.</em>
          </h2>
          <p>
            سها یک گالری مستقل برای روایت تصویری نجوم است؛ جایی برای نزدیک‌تر
            شدن به علم، زیبایی و سکوت بی‌انتهای جهان.
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
        <p>ساخته‌شده برای عاشقان آسمان و آن‌سوی آن.</p>
        <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="اینستاگرام">
          <Aperture size={18} />
        </a>
      </footer>

      {selectedItem && (
        <MediaModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onLike={onLike}
        />
      )}
    </div>
  );
}
