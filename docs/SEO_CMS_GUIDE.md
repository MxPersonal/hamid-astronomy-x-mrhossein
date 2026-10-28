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

## Phase 4: evidence-first AEO / GEO

**This is a content-quality and accessibility workflow, not a separate ranking system or guaranteed ChatGPT/Google AI placement.**

The existing publish/edit modal now supports these additional *editor-written* fields:

- **Direct answer**: concise verified explanation for the actual topic, max 1,200 characters.
- **Verified FAQs**: up to eight non-empty question-answer pairs, rendered as visible text.
- **Scientific references**: up to ten HTTPS source links, each with a descriptive title. Link titles and URLs are not fabricated or automatically inferred from the article.
- **Authorship**: optional real contributor's name, shown on the page and in appropriate structured data. Do not claim credentials without verifying them.
- **Image provenance**: explicit editorial selection, if known: observation / illustration / simulation / AI-generated. Unknown is the default.

All fields live in the same existing `site_content` JSON record under `media-seo:<media-id>`. No Neon migration or paid third-party integration is required. Old media SEO JSON remains readable using safe defaults; old content is not rewritten until edited.

### Rendered public content

- Direct answer, FAQs and references are rendered as regular server-side HTML under the canonical `/gallery/<slug-or-id>` page.
- Article JSON-LD `abstract`, `author`, and `citation` appear only when their corresponding facts are visible on the page.
- We intentionally do **not** auto-generate FAQPage rich result markup: Google restricts FAQ rich results and does not require special AI schema.
- Source URLs are not proof of scientific accuracy. Editors must read the source and cross-check the actual claim.
- The separate existing **sourceUrl** field can be used for a primary credit/attribution link; the reference list is for independently sourced evidence.
- **Do not add fake dates, reviewers, authors, identities, telescopes, or telescope image provenance**. If unknown, leave blank/unspecified.
- The OpenAI `OAI-SearchBot` user-agent is explicitly allowed to crawl public URLs in `robots.txt`. This is independent from `GPTBot`, which is concerned with training; this change does not alter its existing policy.
- Google recommends people-first content, visible headings, crawlable links and structured data that matches what users see. Do not add unsupported `llms.txt` or other AI-only markup claiming ranking benefits.

### Review checklist before publishing

1. Draft a truthful, short answer based on the actual page topic.
2. Add only FAQ entries that the article answers and that readers would benefit from.
3. Open and read source URLs; make sure each source supports a specific claim.
4. Label a scene as observational, illustrated, simulated, or AI-generated **only** when known.
5. Add a byline only for a real credited contributor.
6. Save, refresh CMS and confirm the editor-controlled fields persist.
7. Open the public detail route and verify that answer, references, FAQ and image label display accurately.
8. View HTML source: JSON-LD must match the rendered body.
9. In Search Console, continue monitoring indexing, not merely Live Test eligibility.

### Validation and constraints

- The app validates sizes, types, FAQ counts, HTTPS references and no embedded URL credentials at the authenticated API boundary.
- Build/TypeScript checks can be inspected through the GitHub-triggered Vercel deployment logs.
- Manual CMS-save → Neon readback, real HTTP/robots access as OAI-SearchBot, and Google's crawl/index status require separate verification. A Vercel READY status does not prove indexing, scientific correctness or AI citation.
- Next.js/Neon/Vercel free-tier usage is not increased by adding a paid AI API. Normal database reads/writes still count against free-tier quotas.

Official documentation:
- Google generative search: https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
- Google helpful content: https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- OpenAI crawler agents: https://developers.openai.com/api/docs/bots
