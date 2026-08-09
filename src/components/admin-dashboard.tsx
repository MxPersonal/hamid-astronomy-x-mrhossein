"use client";

import { useMemo, useState } from "react";
import {
  BarChart3,
  Bell,
  CheckCircle2,
  ChevronDown,
  CircleUserRound,
  Eye,
  FileImage,
  Globe2,
  Heart,
  Images,
  LayoutDashboard,
  LogOut,
  Menu,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  Trash2,
  Video,
  X,
} from "lucide-react";
import { formatCompactNumber, toPersianDate } from "@/lib/format";
import type { MediaItem, NewMediaInput } from "@/types/media";
import { PublishModal } from "./publish-modal";
import { MediaImage } from "./media-image";

interface AdminDashboardProps {
  items: MediaItem[];
  onAdd: (input: NewMediaInput) => MediaItem;
  onDelete: (id: string) => void;
  onTogglePublished: (id: string) => void;
  onLogout: () => void;
  onViewSite: () => void;
}

export function AdminDashboard({
  items,
  onAdd,
  onDelete,
  onTogglePublished,
  onLogout,
  onViewSite,
}: AdminDashboardProps) {
  const [showPublish, setShowPublish] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState("");

  const stats = useMemo(() => {
    const published = items.filter((item) => item.published).length;
    const views = items.reduce((sum, item) => sum + item.views, 0);
    const likes = items.reduce((sum, item) => sum + item.likes, 0);
    return { published, views, likes };
  }, [items]);

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("fa");
    if (!normalized) return items;
    return items.filter((item) =>
      `${item.title} ${item.category}`
        .toLocaleLowerCase("fa")
        .includes(normalized),
    );
  }, [items, query]);

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2800);
  };

  const publish = (input: NewMediaInput) => {
    onAdd(input);
    setShowPublish(false);
    notify(input.published ? "اثر با موفقیت منتشر شد." : "پیش‌نویس ذخیره شد.");
  };

  return (
    <div className="admin-shell">
      <aside className={menuOpen ? "admin-sidebar open" : "admin-sidebar"}>
        <div className="sidebar-brand">
          <span className="brand-orbit" aria-hidden="true">
            <i />
          </span>
          <span>
            <strong>سُها</strong>
            <small>پنل مدیریت</small>
          </span>
          <button type="button" onClick={() => setMenuOpen(false)} aria-label="بستن منو">
            <X size={19} />
          </button>
        </div>

        <nav aria-label="ناوبری مدیریت">
          <span>فضای کاری</span>
          <a className="active" href="#dashboard">
            <LayoutDashboard size={19} /> نمای کلی
          </a>
          <a href="#contents">
            <Images size={19} /> محتواها
            <b>{items.length.toLocaleString("fa-IR")}</b>
          </a>
          <a href="#analytics">
            <BarChart3 size={19} /> آمار بازدید
          </a>
          <span>تنظیمات</span>
          <a href="#settings">
            <Settings size={19} /> تنظیمات سایت
          </a>
        </nav>

        <div className="sidebar-profile">
          <span>
            <CircleUserRound size={22} />
          </span>
          <div>
            <strong>مدیر سها</strong>
            <small>سطح دسترسی کامل</small>
          </div>
          <ChevronDown size={16} />
        </div>
        <button type="button" className="view-site-button" onClick={onViewSite}>
          <Globe2 size={17} /> مشاهده‌ی سایت
        </button>
      </aside>

      {menuOpen && (
        <button
          className="sidebar-scrim"
          type="button"
          aria-label="بستن منو"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <div className="admin-main">
        <header className="admin-topbar">
          <button className="menu-button" type="button" onClick={() => setMenuOpen(true)} aria-label="بازکردن منو">
            <Menu size={21} />
          </button>
          <div className="admin-breadcrumb">
            <span>مدیریت سها</span>
            <b>/</b>
            <strong>نمای کلی</strong>
          </div>
          <div className="topbar-actions">
            <button type="button" aria-label="اعلان‌ها" className="notification-button">
              <Bell size={19} />
              <i />
            </button>
            <button type="button" className="logout-button" onClick={onLogout}>
              <LogOut size={17} /> خروج از مدیریت
            </button>
          </div>
        </header>

        <main className="dashboard-content" id="dashboard">
          <section className="dashboard-welcome">
            <div>
              <p>شنبه، ۱۷ مرداد ۱۴۰۵</p>
              <h1>سلام، به سها خوش آمدید</h1>
              <span>محتوای گالری و وضعیت انتشار را از اینجا مدیریت کنید.</span>
            </div>
            <button type="button" onClick={() => setShowPublish(true)}>
              <Plus size={19} /> انتشار محتوای جدید
            </button>
          </section>

          <section className="stats-grid" id="analytics" aria-label="آمار کلی">
            <article>
              <span className="stat-icon purple"><FileImage size={21} /></span>
              <div><small>آثار منتشرشده</small><strong>{stats.published.toLocaleString("fa-IR")}</strong></div>
              <span className="trend positive">۱۲٪ +</span>
            </article>
            <article>
              <span className="stat-icon cyan"><Eye size={21} /></span>
              <div><small>مجموع بازدید</small><strong>{formatCompactNumber(stats.views)}</strong></div>
              <span className="trend positive">۸.۴٪ +</span>
            </article>
            <article>
              <span className="stat-icon rose"><Heart size={21} /></span>
              <div><small>مجموع پسندها</small><strong>{formatCompactNumber(stats.likes)}</strong></div>
              <span className="trend positive">۱۶٪ +</span>
            </article>
            <article>
              <span className="stat-icon amber"><Video size={21} /></span>
              <div><small>ویدیوها</small><strong>{items.filter((item) => item.type === "video").length.toLocaleString("fa-IR")}</strong></div>
              <span className="trend neutral">این ماه</span>
            </article>
          </section>

          <section className="content-panel" id="contents">
            <div className="content-panel-header">
              <div>
                <h2>محتواهای اخیر</h2>
                <p>مدیریت آخرین تصاویر و ویدیوهای آرشیو</p>
              </div>
              <label className="admin-search">
                <Search size={17} />
                <span className="sr-only">جست‌وجوی محتوا</span>
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="جست‌وجوی محتوا..." />
              </label>
            </div>

            <div className="content-table" role="table" aria-label="فهرست محتواها">
              <div className="table-head" role="row">
                <span role="columnheader">محتوا</span>
                <span role="columnheader">دسته‌بندی</span>
                <span role="columnheader">وضعیت</span>
                <span role="columnheader">بازدید</span>
                <span role="columnheader">تاریخ انتشار</span>
                <span role="columnheader">عملیات</span>
              </div>
              {filteredItems.map((item) => (
                <article className="table-row" role="row" key={item.id}>
                  <div className="content-identity" role="cell">
                    <div className="content-thumb">
                      <MediaImage src={item.image} alt="" className="object-cover" />
                      {item.type === "video" && <Video size={14} />}
                    </div>
                    <div><strong>{item.title}</strong><small>{item.type === "video" ? "ویدیو" : "تصویر"}</small></div>
                  </div>
                  <span role="cell" data-label="دسته‌بندی">{item.category}</span>
                  <div role="cell" data-label="وضعیت">
                    <button
                      type="button"
                      className={`status-pill ${item.published ? "published" : "draft"}`}
                      onClick={() => {
                        onTogglePublished(item.id);
                        notify(item.published ? "اثر به پیش‌نویس منتقل شد." : "اثر منتشر شد.");
                      }}
                    >
                      {item.published ? <CheckCircle2 size={13} /> : <span />}
                      {item.published ? "منتشرشده" : "پیش‌نویس"}
                    </button>
                  </div>
                  <span role="cell" data-label="بازدید">{formatCompactNumber(item.views)}</span>
                  <span role="cell" data-label="تاریخ">{toPersianDate(item.createdAt)}</span>
                  <div className="row-actions" role="cell">
                    <button type="button" aria-label={`گزینه‌های ${item.title}`}><MoreHorizontal size={18} /></button>
                    <button
                      type="button"
                      className="delete-action"
                      aria-label={`حذف ${item.title}`}
                      onClick={() => {
                        if (window.confirm(`«${item.title}» حذف شود؟`)) {
                          onDelete(item.id);
                          notify("محتوا حذف شد.");
                        }
                      }}
                    ><Trash2 size={17} /></button>
                  </div>
                </article>
              ))}
              {filteredItems.length === 0 && (
                <div className="table-empty">محتوایی با این عبارت پیدا نشد.</div>
              )}
            </div>
          </section>

          <section className="manager-note" id="settings">
            <span><CheckCircle2 size={19} /></span>
            <div><strong>همه‌چیز همگام است</strong><p>تغییرات این نسخه به‌صورت محلی در مرورگر شما ذخیره می‌شوند.</p></div>
          </section>
        </main>
      </div>

      {showPublish && <PublishModal onClose={() => setShowPublish(false)} onPublish={publish} />}
      {toast && <div className="toast-message"><CheckCircle2 size={18} />{toast}</div>}
    </div>
  );
}
