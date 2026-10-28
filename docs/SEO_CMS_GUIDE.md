# Hamid Astronomy | SEO CMS Guide

This project uses Next.js App Router + Neon PostgreSQL, and supports editor-managed per-content SEO without requiring a database migration.

## Where to edit SEO

1. Sign in to `/admin/login`.
2. From the media library, choose **Edit** for an existing image, video or article, or use **Publish new**.
3. Scroll to **تنظیمات پیشرفته SEO برای همین محتوا**.
4. Set any optional fields as needed and save the item.

| Field | Purpose | Fallback |
| --- | --- | --- |
| Slug | Human-readable canonical URL (`/gallery/<slug>`) | Immutable media ID |
| SEO title | Browser title, Open Graph and search result title | Media title + site name |
| Meta description | Page description and social card description | Short media description |
| Alt text | Accessible image description for gallery, modal and detail pages | Media title |
| Social image | HTTPS URL for Open Graph/Twitter | Media cover image, if publicly fetchable |
| Source link | Real scientific source or image credit, where provided | Omitted |
| Publication date | Known publication date, ISO `YYYY-MM-DD` | Omitted from datePublished/uploadDate when unknown |
| Indexing toggle | `noindex` on the detail page, and exclude from sitemap | Indexable |

### Important semantics

- Draft/unpublished content is never included in the sitemap and cannot be reached through the public detail route.
- If `indexable` is unchecked, the public detail page remains accessible to users but is excluded from the sitemap and includes `noindex`.
- Custom slugs must be lowercase ASCII letters, numbers and hyphens, unique among media IDs, custom slugs and prior slug aliases. Changing a slug retains the old slug as a permanent redirect.
- Do not use fake publication dates, source credits or license claims.
- Only publicly accessible HTTPS images can be used for search/social preview metadata. Inline `data:` uploads are displayed by the gallery but are *not* usable as normal external preview-image URLs.
- Google decides whether to index eligible pages. Submitting a sitemap does not guarantee indexing.

## Storage details

SEO JSON is stored as a `site_content` row with key `media-seo:<media-id>`. This reuses the existing table and does not modify the `media_items` or `text_posts` schemas. The private CMS API validates changes and stores metadata alongside media writes; public pages only fetch published items. Removing a media record also removes its corresponding SEO row.

## Operational verification

- Build and TypeScript check: inspect GitHub-triggered Vercel Production build.
- In CMS, edit one **draft** first and save SEO settings, refresh, reopen: verify values persist.
- For a published item, open `/gallery/<slug>`, confirm title, description, image alt, source link and Canonical in HTML.
- Test the previous `/gallery/<id>` URL: it should permanently redirect to a custom slug when set.
- Test unpublish: direct link must return 404 and disappear from sitemap.
- Test noindex: page stays public, has robots noindex and is removed from sitemap.
- Confirm /sitemap.xml still contains only published, indexable pages and remains accepted in Google Search Console.
- Verify Search Console Page Indexing after subsequent Google crawls; do not repeatedly resubmit index requests.

**Note**: This project has no browser/HTTP integration tests in the current repository. A READY build validates compilation and deployment, not the full end-to-end CMS editing flow.
