import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_MEDIA_SEO, parseSeoInput, parseStoredMediaSeo } from "../src/lib/media-seo.ts";

test("legacy SEO records receive blank, evidence-first AEO defaults", () => {
  const result = parseStoredMediaSeo({ title: "Older article", indexable: false });
  assert.equal(result.title, "Older article");
  assert.equal(result.indexable, false);
  assert.equal(result.answer, "");
  assert.deepEqual(result.faqs, []);
  assert.deepEqual(result.references, []);
  assert.equal(result.visualKind, "unspecified");
  assert.equal(result.authorName, "");
});

test("verified answers, questions and HTTPS references are accepted", () => {
  const input = {
    ...DEFAULT_MEDIA_SEO,
    slug: "nebula-basics",
    answer: "A nebula is a region of interstellar gas and dust.",
    faqs: [{ question: "What is a nebula?", answer: "Interstellar gas and dust." }],
    references: [{ title: "NASA science", url: "https://science.nasa.gov/universe/" }],
    authorName: "A real credited author",
    visualKind: "illustration",
  };
  const result = parseSeoInput(input);
  assert.ok(result);
  assert.equal(result.slug, "nebula-basics");
  assert.equal(result.faqs.length, 1);
  assert.equal(result.references.length, 1);
});

test("missing or blank FAQ answers are not accepted", () => {
  const input = { ...DEFAULT_MEDIA_SEO, faqs: [{ question: "Question", answer: " " }] };
  assert.equal(parseSeoInput(input), null);
});

test("non-HTTPS and credential-bearing evidence links are rejected", () => {
  const input = { ...DEFAULT_MEDIA_SEO, references: [{ title: "Source", url: "http://example.com" }] };
  assert.equal(parseSeoInput(input), null);
  input.references[0].url = "https://user:password@example.com/";
  assert.equal(parseSeoInput(input), null);
});

test("invalid provenance and over-limit lists are rejected", () => {
  assert.equal(parseSeoInput({ ...DEFAULT_MEDIA_SEO, visualKind: "telescope-confirmed" }), null);
  const faqs = Array.from({ length: 9 }, () => ({ question: "Q", answer: "A" }));
  assert.equal(parseSeoInput({ ...DEFAULT_MEDIA_SEO, faqs }), null);
});
