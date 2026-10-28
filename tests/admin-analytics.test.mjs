import test from "node:test";
import assert from "node:assert/strict";
import { getMonthlyContentCounts, getMediaTypeBreakdown, getTopViewedMedia } from "../src/lib/admin-analytics.ts";

const reference = new Date("2026-10-28T12:00:00Z");

test("monthly content counts use real createdAt month rather than cumulative views", () => {
  const result = getMonthlyContentCounts([
    { createdAt: "2026-10-03T08:00:00Z" },
    { createdAt: "2026-10-21T08:00:00Z" },
    { createdAt: "2026-09-25T09:00:00Z" },
    { createdAt: "2025-07-02T09:00:00Z" },
  ], 3, reference);
  assert.deepEqual(result.map((x) => x.key), ["2026-08", "2026-09", "2026-10"]);
  assert.deepEqual(result.map((x) => x.count), [0, 1, 2]);
});

test("invalid dates are ignored safely", () => {
  const result = getMonthlyContentCounts([{ createdAt: "invalid" }, { createdAt: "2026-10-01" }], 1, reference);
  assert.equal(result[0].count, 1);
});

test("type breakdown reflects records exactly including drafts", () => {
  const result = getMediaTypeBreakdown([{ type: "image" }, { type: "image" }, { type: "video" }, { type: "text" }]);
  assert.deepEqual(result.map((x) => x.count), [2, 1, 1]);
});

test("top viewed media only includes published items and descending view count", () => {
  const items = [
    { id: "a", title: "A", views: 3, published: true },
    { id: "b", title: "B", views: 900, published: false },
    { id: "c", title: "C", views: 15, published: true },
  ];
  const result = getTopViewedMedia(items);
  assert.deepEqual(result.map((x) => x.id), ["c", "a"]);
});

test("empty data yields zeroes, not artificial growth", () => {
  const result = getMonthlyContentCounts([], 6, reference);
  assert.equal(result.length, 6);
  assert.ok(result.every((x) => x.count === 0));
  assert.deepEqual(getTopViewedMedia([]), []);
  assert.deepEqual(getMediaTypeBreakdown([]).map((x) => x.count), [0, 0, 0]);
});
