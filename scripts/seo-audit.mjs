/**
 * Dependency-free, read-only production SEO smoke audit.
 * Never accesses CMS/admin APIs or submits indexing requests.
 * Usage: npm run audit:seo
 */
import { appendFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const DEFAULT_URL = "https://hamid-astronomy-x-mrhossein.vercel.app";

export function extractSitemapUrls(xml) {
  return [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)]
    .map((match) => match[1].replace(/&amp;/g, "&").trim());
}

function attr(tag, name) {
  const re = new RegExp("(?:\\s|<)" + name + "\\s*=\\s*([\"'])(.*?)\\1", "i");
  const match = tag.match(re);
  return match ? match[2].replace(/&amp;/g, "&") : null;
}

function findTag(html, tagName, key, value) {
  const re = new RegExp("<" + tagName + "\\b[^>]*>", "gi");
  return [...html.matchAll(re)]
    .map((match) => match[0])
    .find((tag) => attr(tag, key)?.toLowerCase() === value.toLowerCase());
}

export function inspectHtml(html, expectedUrl, isHome) {
  const failures = [];
  const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim();
  if (!title) failures.push("Missing HTML title");

  const description = findTag(html, "meta", "name", "description");
  if (!description || !attr(description, "content")) failures.push("Missing meta description");

  const canonical = findTag(html, "link", "rel", "canonical");
  if (!canonical) {
    failures.push("Missing canonical link");
  } else if (attr(canonical, "href") !== expectedUrl) {
    failures.push("Canonical does not match sitemap URL");
  }

  const robots = findTag(html, "meta", "name", "robots");
  if (robots && /\bnoindex\b/i.test(attr(robots, "content") || "")) {
    failures.push("Sitemap URL has a noindex directive");
  }

  const ogTitle = findTag(html, "meta", "property", "og:title");
  if (!ogTitle || !attr(ogTitle, "content")) failures.push("Missing Open Graph title");

  if (!/<h1[\s>]/i.test(html)) failures.push("Missing heading H1");

  const ldMatches = [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  if (!ldMatches.length) failures.push("Missing JSON-LD");
  else {
    const schemas = ldMatches.map((match) => {
      try { return JSON.parse(match[1]); } catch { failures.push("Invalid JSON-LD"); return null; }
    }).filter(Boolean);
    if (!schemas.some((schema) => schema["@context"] === "https://schema.org")) {
      failures.push("Missing Schema.org JSON-LD context");
    }
  }

  if (isHome && !html.includes('id="gallery"')) {
    failures.push("Homepage is missing visible gallery section");
  }

  return failures;
}

async function getResponse(fetcher, url) {
  const response = await fetcher(url, {
    redirect: "follow",
    headers: { "User-Agent": "HamidAstronomy-SEO-Audit/1.0" },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error("HTTP " + response.status);
  return response.text();
}

export async function runSeoAudit({
  baseUrl = DEFAULT_URL,
  fetcher = fetch,
  maxDetailPages = 12,
} = {}) {
  const base = new URL(baseUrl);
  if (base.protocol !== "https:") throw new Error("Production audit requires HTTPS");
  const rootUrl = base.origin + "/";
  const failures = [];
  const observations = [];
  const addFailure = (message) => { failures.push(message); observations.push("FAIL: " + message); };
  const fetchText = async (path) => {
    try { return await getResponse(fetcher, new URL(path, rootUrl).toString()); }
    catch (error) { addFailure(path + ": " + (error instanceof Error ? error.message : String(error))); return null; }
  };

  const [robots, sitemapXml] = await Promise.all([
    fetchText("/robots.txt"),
    fetchText("/sitemap.xml"),
  ]);

  if (robots !== null) {
    if (!robots.includes("Sitemap: " + rootUrl + "sitemap.xml")) addFailure("robots.txt does not advertise the canonical sitemap");
    if (!/User-agent:\s*OAI-SearchBot/i.test(robots)) addFailure("OAI-SearchBot rule missing");
    if (!/Disallow:\s*\/admin/i.test(robots)) addFailure("Admin paths not disallowed");
    if (!/Disallow:\s*\/api\//i.test(robots)) addFailure("API paths not disallowed");
  }

  let urls = [];
  if (sitemapXml !== null) {
    if (!/<urlset(?:\s|>)/i.test(sitemapXml)) addFailure("Sitemap is not an XML urlset");
    urls = extractSitemapUrls(sitemapXml);
    if (!urls.length) addFailure("Sitemap contains no URLs");
    if (new Set(urls).size !== urls.length) addFailure("Sitemap has duplicate URLs");
    if (!urls.includes(rootUrl)) addFailure("Homepage is missing from sitemap");

    for (const candidate of urls) {
      try {
        const url = new URL(candidate);
        if (url.origin !== base.origin || url.protocol !== "https:" ||
          url.username || url.password || url.search || url.hash) {
          addFailure("Noncanonical or external sitemap URL: " + candidate);
        }
      } catch {
        addFailure("Invalid sitemap URL: " + candidate);
      }
    }
    if (urls.length > 50000) addFailure("Sitemap exceeds 50,000 URLs");
  }

  const eligible = urls.filter((url) => {
    try { return new URL(url).origin === base.origin; } catch { return false; }
  });
  const sampleSize = Math.min(Math.max(1, maxDetailPages), 20);
  const checkedUrls = [
    ...(eligible.includes(rootUrl) ? [rootUrl] : []),
    ...eligible.filter((url) => url !== rootUrl).slice(0, sampleSize),
  ];
  for (const url of checkedUrls) {
    const html = await fetchText(url);
    if (html === null) continue;
    const problems = inspectHtml(html, url, url === rootUrl);
    for (const problem of problems) addFailure(url + ": " + problem);
  }
  observations.unshift("Sitemap URLs: " + urls.length);
  observations.push("Crawlable sample pages checked: " + checkedUrls.length);

  return {
    status: failures.length ? "FAIL" : "PASS",
    sitemapUrlCount: urls.length,
    pagesChecked: checkedUrls.length,
    failures,
    observations,
  };
}

function githubSummary(report) {
  return [
    "## Hamid Astronomy SEO smoke audit",
    "",
    "| Item | Result |",
    "|---|---|",
    "| Status | " + report.status + " |",
    "| Sitemap URLs | " + report.sitemapUrlCount + " |",
    "| Pages checked | " + report.pagesChecked + " |",
    "",
    ...report.observations.map((item) => "- " + item.replace(/\|/g, "\\|")),
    "",
    "This audit checks public HTTP accessibility and SEO markup. It does NOT prove Google indexing, rankings, Core Web Vitals, or AI citation.",
  ].join("\n");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const report = await runSeoAudit({
    baseUrl: process.env.SEO_AUDIT_URL || DEFAULT_URL,
    maxDetailPages: Number(process.env.SEO_AUDIT_MAX_PAGES || 12),
  });
  console.log(report.observations.join("\n"));
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, githubSummary(report) + "\n");
  if (report.failures.length) process.exitCode = 1;
}
