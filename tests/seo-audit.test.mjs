import test from "node:test";
import assert from "node:assert/strict";
import { extractSitemapUrls, inspectHtml, runSeoAudit } from "../scripts/seo-audit.mjs";

const root = "https://example.org/";
const detail = "https://example.org/gallery/nebula";
const robots = "User-agent: *\nDisallow: /admin\nDisallow: /api/\n\nUser-agent: OAI-SearchBot\nAllow: /\n\nSitemap: https://example.org/sitemap.xml\n";
const sitemap = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>' + root + '</loc></url><url><loc>' + detail + '</loc></url></urlset>';

function page(url, home = false, extra = "") {
  return '<!doctype html><html lang="fa"><head><title>Hamid Astronomy</title>' +
    '<meta name="description" content="Astronomy article"/>' +
    '<meta property="og:title" content="Hamid Astronomy"/>' +
    '<link rel="canonical" href="' + url + '"/>' +
    '<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebPage"}</script>' +
    extra + '</head><body><h1>Astronomy</h1>' +
    (home ? '<section id="gallery">Gallery</section>' : '<article>Verified science</article>') +
    '</body></html>';
}

function fakeFetch(entries) {
  return async (url) => new Response(entries[url] ?? "Not found", { status: url in entries ? 200 : 404 });
}

test("sitemap URL extraction handles XML entity encoding", () => {
  assert.deepEqual(extractSitemapUrls("<loc>https://example.org/?a=1&amp;b=2</loc>"),
    ["https://example.org/?a=1&b=2"]);
});

test("fully valid public homepage and detail pages pass", async () => {
  const mock = fakeFetch({
    [root]: page(root, true),
    [detail]: page(detail),
    [root + "robots.txt"]: robots,
    [root + "sitemap.xml"]: sitemap,
  });
  const result = await runSeoAudit({ baseUrl: root, fetcher: mock });
  assert.equal(result.status, "PASS", JSON.stringify(result.failures));
  assert.equal(result.sitemapUrlCount, 2);
  assert.equal(result.pagesChecked, 2);
});

test("noindex in a submitted page causes an audit failure", () => {
  const html = page(detail, false, '<meta name="robots" content="noindex,follow"/>');
  assert.ok(inspectHtml(html, detail, false).some((item) => item.includes("noindex")));
});

test("wrong canonical and missing JSON-LD are detected", () => {
  const html = page(detail).replace(detail, "https://example.org/other")
    .replace(/<script type="application\/ld\+json">.*?<\/script>/, "");
  const problems = inspectHtml(html, detail, false);
  assert.ok(problems.some((item) => item.includes("Canonical")));
  assert.ok(problems.some((item) => item.includes("JSON-LD")));
});

test("unavailable production URL fails transparently", async () => {
  const result = await runSeoAudit({ baseUrl: root, fetcher: fakeFetch({}) });
  assert.equal(result.status, "FAIL");
  assert.ok(result.failures.some((item) => item.includes("HTTP 404")));
});

test("outside-origin URLs in sitemap are flagged", async () => {
  const badSitemap = sitemap.replace(detail, "https://other.example/gallery/bad");
  const result = await runSeoAudit({
    baseUrl: root, fetcher: fakeFetch({
      [root + "robots.txt"]: robots,
      [root + "sitemap.xml"]: badSitemap,
      [root]: page(root, true),
    }),
  });
  assert.equal(result.status, "FAIL");
  assert.ok(result.failures.some((item) => item.includes("external sitemap URL")));
});
