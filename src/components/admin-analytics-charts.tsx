"use client";

import { useMemo, useState } from "react";
import { Activity, BarChart3, Eye, Image as ImageIcon, FileText, Video } from "lucide-react";
import type { MediaItem } from "@/types/media";
import { getMonthlyContentCounts, getMediaTypeBreakdown, getTopViewedMedia } from "@/lib/admin-analytics";
import { formatCompactNumber } from "@/lib/format";

type Range = 3 | 6 | 12;

export function AdminAnalyticsCharts({ items, compact = false }: { items: MediaItem[]; compact?: boolean }) {
  const [range, setRange] = useState<Range>(6);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const months = useMemo(() => getMonthlyContentCounts(items, range), [items, range]);
  const breakdown = useMemo(() => getMediaTypeBreakdown(items), [items]);
  const topItems = useMemo(() => getTopViewedMedia(items), [items]);
  const max = Math.max(1, ...months.map((item) => item.count));
  const total = months.reduce((sum, item) => sum + item.count, 0);
  const x0 = 40, x1 = 684, y0 = 28, y1 = 207;
  const gap = (x1 - x0) / Math.max(1, months.length - 1);
  const points = months.map((bucket, i) => ({
    x: x0 + gap * i,
    y: y1 - (bucket.count / max) * (y1 - y0),
  }));
  const line = points.map((point, i) => (i ? "L" : "M") + point.x.toFixed(1) + " " + point.y.toFixed(1)).join(" ");
  const area = points.length ? line + ` L ${points[points.length - 1].x} ${y1} L ${points[0].x} ${y1} Z` : "";
  const activeMonth = selectedMonth === null || selectedMonth >= months.length ? months.length - 1 : selectedMonth;
  const activePoint = points[activeMonth];
  const activeBucket = months[activeMonth];
  const labels: Record<string, string> = { image: "تصاویر", video: "ویدیوها", text: "نوشته‌ها" };
  const colors: Record<string, string> = { image: "#8062df", video: "#38b7c9", text: "#ed9b5b" };
  const typeTotal = breakdown.reduce((sum, item) => sum + item.count, 0);
  const topMax = Math.max(1, ...topItems.map((item) => item.views));

  return (
    <div className={`saas-analytics ${compact ? "compact" : ""}`}>
      <section className="saas-chart-card saas-activity" aria-label="روند ماهانه ایجاد محتوا">
        <div className="saas-chart-header">
          <div>
            <span className="saas-eyebrow"><Activity size={15} /> CONTENT ACTIVITY</span>
            <h2>روند ایجاد محتوا</h2>
            <p>تعداد آثار ثبت‌شده در هر ماه میلادی، بر اساس تاریخ ایجاد در Neon</p>
          </div>
          <div className="saas-range" role="group" aria-label="بازه زمانی نمودار">
            {([3, 6, 12] as const).map((value) => (
              <button key={value} type="button" className={range === value ? "active" : ""}
                aria-pressed={range === value}
                onClick={() => { setRange(value); setSelectedMonth(null); }}>
                {value.toLocaleString("fa-IR")} ماه
              </button>
            ))}
          </div>
        </div>
        <div className="saas-chart-topline">
          <strong>{total.toLocaleString("fa-IR")}</strong>
          <span>محتوا در {range.toLocaleString("fa-IR")} ماه اخیر</span>
          <span className="saas-chart-highlight">{activeBucket?.label ?? ""}: {(activeBucket?.count ?? 0).toLocaleString("fa-IR")}</span>
        </div>
        <div className="saas-line-wrap">
          <svg viewBox="0 0 720 252" role="img"
            aria-label={`نمودار ایجاد محتوا: ${months.map((item) => item.label + " " + item.count).join("، ")}`}
            preserveAspectRatio="xMidYMid meet">
            <defs>
              <linearGradient id="saasAreaGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#8569ee" stopOpacity=".24" />
                <stop offset="100%" stopColor="#8569ee" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[0, .25, .5, .75, 1].map((ratio) => (
              <g key={ratio}>
                <line x1={x0} x2={x1} y1={y1 - ratio * (y1 - y0)}
                  y2={y1 - ratio * (y1 - y0)} stroke="#eae8f2" strokeDasharray="4 7" />
                <text x="28" y={y1 - ratio * (y1 - y0) + 4} textAnchor="end"
                  fontSize="10" fill="#9a94ab">{Math.round(max * ratio).toLocaleString("fa-IR")}</text>
              </g>
            ))}
            {area && <path d={area} fill="url(#saasAreaGradient)" />}
            {line && <path d={line} stroke="#8062df" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />}
            {activePoint && <line x1={activePoint.x} x2={activePoint.x} y1={y0} y2={y1}
              stroke="#a6a0bd" strokeDasharray="3 6" strokeWidth="1.2" />}
            {points.map((point, i) => (
              <g key={months[i].key} tabIndex={0} role="button"
                aria-label={`${months[i].label}: ${months[i].count.toLocaleString("fa-IR")} محتوا`}
                onMouseEnter={() => setSelectedMonth(i)}
                onFocus={() => setSelectedMonth(i)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setSelectedMonth(i); }}>
                <circle cx={point.x} cy={point.y} r="15" fill="transparent" />
                <circle cx={point.x} cy={point.y} r={i === activeMonth ? "6.5" : "4"}
                  fill="#fff" stroke="#8062df" strokeWidth="3" />
                <title>{months[i].label}: {months[i].count.toLocaleString("fa-IR")} محتوا</title>
              </g>
            ))}
            {months.map((bucket, i) => (
              <text key={bucket.key} x={points[i].x} y="232" fontSize="10"
                textAnchor="middle" fill="#928ba6">{bucket.label}</text>
            ))}
          </svg>
        </div>
        <p className="saas-chart-footnote">این نمودار روند ایجاد محتواست، نه تاریخچه ترافیک یا بازدید روزانه سایت.</p>
      </section>

      {!compact && (
        <div className="saas-chart-columns">
          <section className="saas-chart-card" aria-label="ترکیب محتوای سایت">
            <div className="saas-chart-header"><div>
              <span className="saas-eyebrow"><BarChart3 size={15} /> CONTENT MIX</span>
              <h2>ترکیب محتوا</h2><p>بر اساس تمام آثار ثبت‌شده، شامل پیش‌نویس‌ها</p>
            </div></div>
            <div className="saas-donut-block">
              <div className="saas-donut" role="img"
                aria-label={breakdown.map((item) => labels[item.type] + ": " + item.count).join("، ")}
                style={{ background: typeTotal === 0 ? "#eeedf5" : `conic-gradient(${breakdown.map((b, i) => {
                  const start = breakdown.slice(0, i).reduce((sum, x) => sum + x.count, 0) / typeTotal * 100;
                  const end = start + b.count / typeTotal * 100;
                  return `${colors[b.type]} ${start}% ${end}%`;
                }).join(", ")})` }}>
                <div><strong>{typeTotal.toLocaleString("fa-IR")}</strong><small>کل آثار</small></div>
              </div>
              <div className="saas-legend">
                {breakdown.map((item) => (
                  <div key={item.type}>
                    <span className="saas-legend-label"><i style={{ background: colors[item.type] }} />
                      {item.type === "image" ? <ImageIcon size={14} /> : item.type === "video" ? <Video size={14} /> : <FileText size={14} />}
                      {labels[item.type]}
                    </span>
                    <strong>{item.count.toLocaleString("fa-IR")}</strong>
                    <small>{typeTotal ? Math.round(item.count / typeTotal * 100).toLocaleString("fa-IR") : "۰"}٪</small>
                  </div>
                ))}
              </div>
            </div>
          </section>
          <section className="saas-chart-card" aria-label="آثار پربازدید">
            <div className="saas-chart-header"><div>
              <span className="saas-eyebrow"><Eye size={15} /> TOP CONTENT</span>
              <h2>پربازدیدترین آثار</h2>
              <p>بر اساس مجموع بازدیدهای ثبت‌شده برای آثار منتشرشده</p>
            </div></div>
            {topItems.length > 0 ? (
              <div className="saas-top-items">
                {topItems.map((item, i) => (
                  <div className="saas-top-item" key={item.id}>
                    <div className="saas-top-caption">
                      <span title={item.title}><b>{(i + 1).toLocaleString("fa-IR")}</b>{item.title}</span>
                      <strong>{formatCompactNumber(item.views)}</strong>
                    </div>
                    <div className="saas-top-track"><span style={{ width: `${(item.views / topMax) * 100}%` }} /></div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="saas-no-data">هنوز محتوای منتشرشده‌ای برای نمایش وجود ندارد.</p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
