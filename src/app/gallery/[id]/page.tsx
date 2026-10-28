import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicMediaItem, getSiteContent } from "@/lib/cms-db";
import { MediaImage } from "@/components/media-image";
import { MediaDetailEngagement } from "@/components/media-detail-engagement";
import { SITE_URL, mediaPermalink, publicImageUrl, serializeJsonLd } from "@/lib/seo";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const [item, content] = await Promise.all([getPublicMediaItem(id), getSiteContent()]);
  if (!item) return { title: "محتوا پیدا نشد", robots: { index: false, follow: false } };

  const path = mediaPermalink(item.id);
  const url = new URL(path, SITE_URL).toString();
  const title = `${item.title} | ${content.brandName}`;
  const description = item.description.replace(/\s+/g, " ").trim().slice(0, 165);
  const image = publicImageUrl(item.image);
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title, description, url, siteName: content.brandName,
      locale: "fa_IR", type: item.type === "text" ? "article" : "website",
      ...(image ? { images: [{ url: image, alt: item.title }] } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title, description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default async function MediaPage({ params }: Props) {
  const { id } = await params;
  const [item, content] = await Promise.all([getPublicMediaItem(id), getSiteContent()]);
  if (!item) notFound();

  const url = new URL(mediaPermalink(item.id), SITE_URL).toString();
  const image = publicImageUrl(item.image);
  const description = item.description.replace(/\s+/g, " ").trim();
  const pageEntity: Record<string, unknown> = {
    "@type": "WebPage", "@id": url, url,
    name: item.title, description, inLanguage: "fa-IR",
    isPartOf: { "@id": `${SITE_URL}/#website` },
  };
  const mainEntity: Record<string, unknown> = item.type === "text" ? {
    "@type": "Article",
    headline: item.title, description,
    dateCreated: item.createdAt, inLanguage: "fa-IR",
    mainEntityOfPage: url,
    ...(image ? { image } : {}),
  } : item.type === "video" ? {
    "@type": "VideoObject",
    name: item.title, description,
    dateCreated: item.createdAt,
    ...(image ? { thumbnailUrl: image } : {}),
    ...(item.videoUrl?.includes("youtube.com/embed") ? { embedUrl: item.videoUrl } :
      item.videoUrl?.startsWith("https://") ? { contentUrl: item.videoUrl } : {}),
  } : {
    "@type": "ImageObject",
    name: item.title, description, inLanguage: "fa-IR",
    ...(image ? { contentUrl: image } : {}),
  };
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      pageEntity,
      mainEntity,
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "خانه", item: SITE_URL + "/" },
          { "@type": "ListItem", position: 2, name: item.title, item: url },
        ],
      },
    ],
  };

  return (
    <div className={styles.shell}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }} />
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>
          {content.brandName}
          <small>{content.brandTagline}</small>
        </Link>
        <Link href="/#gallery" className={styles.home}>بازگشت به گالری</Link>
      </header>
      <main className={styles.content}>
        <nav className={styles.breadcrumbs} aria-label="مسیر صفحه">
          <Link href="/">خانه</Link> / <Link href="/#gallery">گالری</Link> / {item.title}
        </nav>
        <article>
          <div className={styles.kicker}>
            {item.category} · {item.type === "text" ? "نوشته" : item.type === "video" ? "ویدیو" : "تصویر"}
          </div>
          <h1 className={styles.title}>{item.title}</h1>
          {item.type !== "text" && <p className={styles.description}>{item.description}</p>}
          {(item.type !== "text" || Boolean(item.image)) && (
            <div className={styles.visual}>
              {item.type === "video" && item.videoUrl ? (
                item.videoUrl.includes("youtube.com/embed") ?
                  <iframe title={item.title} src={item.videoUrl} loading="lazy"
                    allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen /> :
                  <video controls poster={item.image || undefined} src={item.videoUrl} preload="metadata" />
              ) : item.image ? (
                <MediaImage src={item.image} alt={item.title} sizes="(max-width: 900px) 100vw, 900px" priority />
              ) : (
                <div className={styles.notice}>ویدیویی برای نمایش در دسترس نیست.</div>
              )}
            </div>
          )}
          {item.type === "text" && (
            <div className={styles.body}>
              {item.description.split(/\n\s*\n/).map((paragraph, index) =>
                <p key={index}>{paragraph}</p>
              )}
            </div>
          )}
          <div className={styles.meta}>
            {item.capturedAt && <span>تاریخ ثبت: {item.capturedAt}</span>}
            <MediaDetailEngagement id={item.id} initialLikes={item.likes} initialViews={item.views} />
          </div>
        </article>
        <Link href="/#gallery" className={styles.back}>← مشاهده سایر آثار</Link>
      </main>
      <footer className={styles.footer}>{content.footerDescription}</footer>
    </div>
  );
}
