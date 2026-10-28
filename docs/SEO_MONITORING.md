# Hamid Astronomy | Phase 5: SEO Monitoring and Validation

Production: https://hamid-astronomy-x-mrhossein.vercel.app

## What was implemented

- A dependency-free, **read-only** production audit at `scripts/seo-audit.mjs`.
- Six offline tests in `tests/seo-audit.test.mjs` on top of existing science/SEO validation tests.
- A GitHub Actions workflow, `.github/workflows/seo-audit.yml`, with:
  - Manual runs via **Actions > Production SEO Smoke Audit > Run workflow**;
  - Weekly scheduled runs on Mondays at **10:17 UTC**;
  - A run when the monitoring script, tests or workflow definition is updated on `main`.
- Reported checks: production HTTP reachability, robots.txt, OAI-SearchBot rule, sitemap.xml, same-origin/duplicate URLs, canonical URLs, indexing meta, meta descriptions, OG title, H1, Schema.org JSON-LD validity.
- Checks the homepage and up to 12 current public detail pages in the sitemap per run. This is a **sample**, not a complete crawl when the sitemap contains more than 12 detail URLs.
- A source-integrity fix for Article JSON-LD. The primary source link and additional editor-curated scientific references are preserved in one citation list, rather than one overwriting the other.

**No new production endpoint, database table, paid API, CMS write or Vercel deployment trigger was added for monitoring.**

## How to see results without terminal

1. Open [SEO Audit GitHub Actions](https://github.com/MxPersonal/hamid-astronomy-x-mrhossein/actions/workflows/seo-audit.yml).
2. Select the most recent workflow run and open the `seo-audit` job.
3. See the `Check live robots, sitemap and SEO metadata` step and `Summary`.
4. A green run indicates that *sampled public HTTP and metadata tests* passed at that moment. A red run lists concrete failed URLs/checks.

If GitHub Actions is disabled for the repository, enable it in **Settings > Actions** before manual/scheduled runs will work.

## Locally (optional)

Requires Node 24 or later. No additional dependency:

```bash
npm run test
node scripts/seo-audit.mjs
```

The audit is intentionally separate from `npm run build`. Build runs offline validation tests but doesn't depend on an externally reachable live domain.

## What this audit does NOT measure

- Actual Google Search Console indexing status or URL Inspection results;
- Search impressions, clicks, CTR or rank;
- Lighthouse and Core Web Vitals (LCP, INP, CLS);
- AI Overview/ChatGPT Search citations or inclusion;
- Neon CMS save/reload end-to-end;
- Image copyright or factual astronomy accuracy.

To check actual indexing, open **Google Search Console > Indexing > Pages**, and use **Performance > Search results** for clicks, impressions and CTR. Avoid resubmitting the unchanged sitemap repeatedly. Google may crawl pages much later than the first submission.

For field performance, use [PageSpeed Insights](https://pagespeed.web.dev/) with the actual public page URL. If your Vercel Hobby project has a free Speed Insights project slot available, it can be enabled from the Vercel dashboard. Confirm the current Hobby data-point limit and existing usage before enabling it.

## Operational caveats

- The workflow runs publicly reachable URLs without credentials and does not touch protected admin routes.
- A site outage, WAF/bot block or transient network problem may fail the audit even if the Next.js build is healthy. Review the failing URL and retry manually after fixing the cause.
- A passed SEO audit never guarantees indexing, rankings, or generative-answer citation.
- The repository is currently **public**, so GitHub-hosted standard Actions runners are typically free; any policy/rate-limit changes should be reviewed in GitHub's Actions billing settings.
- Images uploaded as base64 data into Neon may increase page HTML/hydration weight. Prefer measured performance and a future storage plan before making disruptive media-storage changes.
- Large sites will eventually need paginated sitemap indices and a larger or sampled audit strategy; Google currently caps individual sitemaps at 50,000 URLs or 50 MB uncompressed.

## Official references

- Google sitemap guidance: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- Google Search Console workflow: https://developers.google.com/search/docs/monitor-debug/search-console-start
- Vercel Hobby plan: https://vercel.com/docs/plans/hobby
- Vercel Speed Insights limits: https://vercel.com/docs/speed-insights/limits-and-pricing
