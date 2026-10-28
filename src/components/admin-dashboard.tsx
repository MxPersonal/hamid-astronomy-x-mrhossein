"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  BarChart3, Bell, CheckCircle2, CircleUserRound, Eye, FileImage, Globe2, Heart,
  Images, LayoutDashboard, LogOut, Menu, Plus, Search, Settings,
  Trash2, Video, X, Pencil, Check, FileText,
} from "lucide-react";
import { formatCompactNumber, toPersianDate } from "@/lib/format";
import type { MediaItem, NewMediaInput } from "@/types/media";
import type { CmsNotification, SiteContent } from "@/lib/cms-content";
import { PublishModal } from "./publish-modal";
import { MediaImage } from "./media-image";
import { SiteContentEditor } from "./site-content-editor";
import { AdminAnalyticsCharts } from "./admin-analytics-charts";

type AdminSection = "dashboard" | "contents" | "categories" | "analytics" | "settings";

const SECTION_DETAILS: Record<AdminSection, { title: string; subtitle: string; breadcrumb: string }> = {
  dashboard: {
    title: "نمای کلی مدیریت",
    subtitle: "خلاصه آخرین وضعیت محتوا و فعالیت‌های سایت",
    breadcrumb: "نمای کلی",
  },
  contents: {
    title: "مدیریت محتواها",
    subtitle: "افزودن، ویرایش و انتشار آثار نجومی",
    breadcrumb: "محتواها",
  },
  categories: {
    title: "دسته‌بندی‌های سایت",
    subtitle: "مدیریت گروه‌های نمایش محتوا در گالری",
    breadcrumb: "دسته‌بندی‌ها",
  },
  analytics: {
    title: "تحلیل و آمار سایت",
    subtitle: "نمودارهای واقعی بر اساس داده‌های ثبت‌شده در Neon",
    breadcrumb: "آمار و نمودارها",
  },
  settings: {
    title: "تنظیمات و محتوای سایت",
    subtitle: "ویرایش متن‌ها، تصاویر و تنظیمات عمومی SEO",
    breadcrumb: "تنظیمات سایت",
  },
};

function sectionFromHash(): AdminSection {
  if (typeof window === "undefined") return "dashboard";
  const section = window.location.hash.slice(1);
  return section in SECTION_DETAILS ? section as AdminSection : "dashboard";
}

interface Props {
  items: MediaItem[];
  categories: string[];
  onCreateCategory: (name: string) => Promise<string>;
  content: SiteContent;
  notifications: CmsNotification[];
  legacyCount: number;
  importingLegacy: boolean;
  onImportLegacy: () => void;
  onAdd: (input: NewMediaInput) => Promise<void>;
  onEdit: (id: string, input: NewMediaInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onTogglePublished: (id: string) => Promise<void>;
  onSaveContent: (key: keyof SiteContent, value: string) => Promise<void>;
  onReadNotifications: () => Promise<void>;
  onLogout: () => void;
  onViewSite: () => void;
}

export function AdminDashboard({
  items, categories, onCreateCategory, content, notifications, legacyCount, importingLegacy, onImportLegacy, onAdd, onEdit, onDelete, onTogglePublished,
  onSaveContent, onReadNotifications, onLogout, onViewSite,
}: Props) {
  const [activeSection, setActiveSection] = useState<AdminSection>("dashboard");
  const [showPublish, setShowPublish] = useState(false);
  const [editing, setEditing] = useState<MediaItem | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [categoryError, setCategoryError] = useState("");
  const [savingCategory, setSavingCategory] = useState(false);
  const [toast, setToast] = useState("");
  const [busy, setBusy] = useState(false);

  const stats = useMemo(() => ({
    published: items.filter((item) => item.published).length,
    views: items.reduce((sum, item) => sum + item.views, 0),
    likes: items.reduce((sum, item) => sum + item.likes, 0),
    posts: items.filter((item) => item.type === "text").length,
    videos: items.filter((item) => item.type === "video").length,
  }), [items]);
  const unread = notifications.filter((item) => !item.read_at).length;
  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("fa");
    return normalized ? items.filter((item) =>
      `${item.title} ${item.category}`.toLocaleLowerCase("fa").includes(normalized)) : items;
  }, [items, query]);

  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(""), 3500); };
  const perform = async (job: () => Promise<void>, success: string) => {
    setBusy(true);
    try { await job(); notify(success); }
    catch (error) { notify(error instanceof Error ? error.message : "عملیات ناموفق بود"); throw error; }
    finally { setBusy(false); }
  };
  const saveMedia = async (input: NewMediaInput) => {
    await perform(() => editing ? onEdit(editing.id, input) : onAdd(input), editing ? "اثر ویرایش شد" : "اثر ذخیره شد");
    setEditing(null);
    setShowPublish(false);
  };
  const addCategory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newCategory.trim() || savingCategory) return;
    setCategoryError("");
    setSavingCategory(true);
    try {
      await onCreateCategory(newCategory);
      setNewCategory("");
      notify("دسته‌بندی جدید ثبت شد");
    } catch (error) {
      setCategoryError(error instanceof Error ? error.message : "ثبت دسته‌بندی ناموفق بود");
    } finally {
      setSavingCategory(false);
    }
  };
  const closeMenu = () => setMenuOpen(false);
  useEffect(() => {
    const sync = () => setActiveSection(sectionFromHash());
    sync();
    window.addEventListener("hashchange", sync);
    window.addEventListener("popstate", sync);
    return () => {
      window.removeEventListener("hashchange", sync);
      window.removeEventListener("popstate", sync);
    };
  }, []);

  const navigate = (section: AdminSection) => {
    setActiveSection(section);
    closeMenu();
    setNotificationsOpen(false);
    if (window.location.hash !== `#${section}`) {
      window.history.pushState(null, "", `#${section}`);
    }
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  return (
    <div className="admin-shell">
      <aside className={menuOpen ? "admin-sidebar open" : "admin-sidebar"}>
        <div className="sidebar-brand">
          <span className="brand-orbit" aria-hidden="true"><i /></span>
          <span><strong>{content.brandName}</strong><small>پنل مدیریت محتوا</small></span>
          <button type="button" onClick={closeMenu} aria-label="بستن منو"><X size={19} /></button>
        </div>
        <nav aria-label="ناوبری مدیریت">
          <span>فضای کاری</span>
          <button type="button" className={activeSection === "dashboard" ? "active" : ""} aria-current={activeSection === "dashboard" ? "page" : undefined} onClick={() => navigate("dashboard")}><LayoutDashboard size={19} /> نمای کلی</button>
          <button type="button" className={activeSection === "contents" ? "active" : ""} aria-current={activeSection === "contents" ? "page" : undefined} onClick={() => navigate("contents")}><Images size={19} /> محتواها <b>{items.length.toLocaleString("fa-IR")}</b></button>
          <button type="button" className={activeSection === "categories" ? "active" : ""} aria-current={activeSection === "categories" ? "page" : undefined} onClick={() => navigate("categories")}><Plus size={19} /> دسته‌بندی‌ها</button>
          <button type="button" className={activeSection === "analytics" ? "active" : ""} aria-current={activeSection === "analytics" ? "page" : undefined} onClick={() => navigate("analytics")}><BarChart3 size={19} /> آمار و نمودارها</button>
          <span>مدیریت سایت</span>
          <button type="button" className={activeSection === "settings" ? "active" : ""} aria-current={activeSection === "settings" ? "page" : undefined} onClick={() => navigate("settings")}><Settings size={19} /> تمام متن‌ها و تصاویر</button>
        </nav>
        <div className="sidebar-profile">
          <span><CircleUserRound size={22} /></span>
          <div><strong>مدیر {content.brandName}</strong><small>مدیر اصلی</small></div>
        </div>
      </aside>
      {menuOpen && <button className="sidebar-scrim" type="button" aria-label="بستن منو" onClick={closeMenu} />}

      <div className="admin-main">
        <header className="admin-topbar">
          <button className="menu-button" type="button" onClick={() => setMenuOpen(true)} aria-label="بازکردن منو"><Menu size={21} /></button>
          <div className="admin-breadcrumb"><span>{content.brandName}</span><b>/</b><strong>{SECTION_DETAILS[activeSection].breadcrumb}</strong></div>
          <div className="topbar-actions">
            <button type="button" className="view-site-topbar" onClick={onViewSite}>
              <Globe2 size={17} /><span>بازگشت به سایت</span>
            </button>
            <div className="notifications-wrap">
              <button type="button" aria-label={`اعلان‌ها، ${unread} خوانده‌نشده`}
                className="notification-button" aria-expanded={notificationsOpen}
                onClick={() => setNotificationsOpen((state) => !state)}>
                <Bell size={19} />{unread > 0 && <span className="notification-count">{unread.toLocaleString("fa-IR")}</span>}
              </button>
              {notificationsOpen && (
                <section className="notifications-panel" aria-label="اعلان‌های مدیریت">
                  <div className="notifications-heading">
                    <strong>اعلان‌های پنل مدیریت</strong>
                    <button type="button" disabled={unread === 0} onClick={() =>
                      void perform(onReadNotifications, "اعلان‌ها خوانده شدند").catch(() => {})}>
                      <Check size={14} /> خواندن همه
                    </button>
                  </div>
                  <div className="notification-items">
                    {notifications.length ? notifications.map((item) => (
                      <article key={item.id} className={item.read_at ? "notification-item" : "notification-item unread"}>
                        <strong>{item.title}</strong><p>{item.message}</p>
                        <time>{toPersianDate(item.created_at)}</time>
                      </article>
                    )) : <p className="notification-empty">هنوز اعلانی ثبت نشده است.</p>}
                  </div>
                </section>
              )}
            </div>
            <button type="button" className="logout-button" onClick={onLogout}><LogOut size={17} /><span>خروج</span></button>
          </div>
        </header>

        <main className="dashboard-content" id="main-admin-panel" key={activeSection}>
          <section className="dashboard-welcome">
            <div>
              <p>{new Intl.DateTimeFormat("fa-IR", { dateStyle: "full" }).format(new Date())}</p>
              <h1>{SECTION_DETAILS[activeSection].title}</h1>
              <span>{SECTION_DETAILS[activeSection].subtitle}</span>
            </div>
            <div className="welcome-actions">
              {legacyCount > 0 && <button type="button" className="legacy-import" disabled={importingLegacy}
                onClick={onImportLegacy}>
                {importingLegacy ? "در حال انتقال..." : `انتقال ${legacyCount.toLocaleString("fa-IR")} رسانه قدیمی`}
              </button>}
              <button type="button" onClick={() => { setEditing(null); setShowPublish(true); }}><Plus size={19} /> انتشار محتوای جدید</button>
            </div>
          </section>

          {(activeSection === "dashboard" || activeSection === "analytics") && <section className="stats-grid" aria-label="آمار کلی">
            <article><span className="stat-icon purple"><FileImage size={21} /></span><div><small>آثار منتشرشده</small><strong>{stats.published.toLocaleString("fa-IR")}</strong></div></article>
            <article><span className="stat-icon cyan"><Eye size={21} /></span><div><small>مجموع بازدیدها</small><strong>{formatCompactNumber(stats.views)}</strong></div></article>
            <article><span className="stat-icon rose"><Heart size={21} /></span><div><small>مجموع پسندها</small><strong>{formatCompactNumber(stats.likes)}</strong></div></article>
            <article><span className="stat-icon amber"><FileText size={21} /></span><div><small>نوشته‌ها</small><strong>{stats.posts.toLocaleString("fa-IR")}</strong></div></article>
            <article><span className="stat-icon cyan"><Video size={21} /></span><div><small>ویدیوها</small><strong>{stats.videos.toLocaleString("fa-IR")}</strong></div></article>
          </section>}
          {(activeSection === "dashboard" || activeSection === "analytics") && <AdminAnalyticsCharts items={items} compact={activeSection === "dashboard"} />}

          {activeSection === "contents" && <section className="content-panel" id="contents">
            <div className="content-panel-header">
              <div><h2>رسانه‌ها و آثار</h2><p>افزودن، ویرایش، حذف و انتشار نوشته‌ها، عکس‌ها و ویدیوها</p></div>
              <label className="admin-search"><Search size={17} /><span className="sr-only">جست‌وجوی محتوا</span>
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="جست‌وجوی محتوا..." /></label>
            </div>
            <div className="content-table" role="table" aria-label="فهرست محتواها">
              <div className="table-head" role="row">
                <span role="columnheader">محتوا</span><span role="columnheader">دسته‌بندی</span>
                <span role="columnheader">وضعیت</span><span role="columnheader">بازدید</span>
                <span role="columnheader">تاریخ انتشار</span><span role="columnheader">عملیات</span>
              </div>
              {filteredItems.map((item) => (
                <article className="table-row" role="row" key={item.id}>
                  <div className="content-identity" role="cell">
                    <div className="content-thumb">{item.image ? <MediaImage src={item.image} alt="" className="object-cover" /> : <span className="text-thumb"><FileText size={21} /></span>}{item.type === "video" && <Video size={14} />}</div>
                    <div><strong>{item.title}</strong><small>{item.type === "video" ? "ویدیو" : item.type === "text" ? "نوشته" : "تصویر"}</small></div>
                  </div>
                  <span role="cell" data-label="دسته‌بندی">{item.category}</span>
                  <div role="cell" data-label="وضعیت">
                    <button type="button" disabled={busy} className={`status-pill ${item.published ? "published" : "draft"}`}
                      onClick={() => void perform(() => onTogglePublished(item.id), "وضعیت انتشار تغییر کرد").catch(() => {})}>
                      {item.published ? <CheckCircle2 size={13} /> : <span />}
                      {item.published ? "منتشرشده" : "پیش‌نویس"}
                    </button>
                  </div>
                  <span role="cell" data-label="بازدید">{formatCompactNumber(item.views)}</span>
                  <span role="cell" data-label="تاریخ">{toPersianDate(item.createdAt)}</span>
                  <div className="row-actions" role="cell">
                    <button type="button" aria-label={`ویرایش ${item.title}`}
                      onClick={() => { setEditing(item); setShowPublish(true); }}><Pencil size={17} /></button>
                    <button type="button" className="delete-action" disabled={busy} aria-label={`حذف ${item.title}`}
                      onClick={() => { if (window.confirm(`«${item.title}» حذف شود؟`)) void perform(() => onDelete(item.id), "محتوا حذف شد").catch(() => {}); }}>
                      <Trash2 size={17} /></button>
                  </div>
                </article>
              ))}
              {filteredItems.length === 0 && <div className="table-empty">محتوایی با این عبارت پیدا نشد.</div>}
            </div>
          </section>}

          {activeSection === "categories" && <section className="category-manager" id="categories">
            <div className="category-manager-heading">
              <h2>مدیریت دسته‌بندی‌ها</h2>
              <p>دسته‌بندی‌های ساخته‌شده در فرم انتشار و فیلترهای سایت نمایش داده می‌شوند.</p>
            </div>
            <form onSubmit={(event) => void addCategory(event)} className="category-manager-form">
              <label htmlFor="new-site-category" className="sr-only">نام دسته‌بندی جدید</label>
              <input id="new-site-category" value={newCategory} maxLength={60}
                onChange={(event) => setNewCategory(event.target.value)}
                placeholder="مثلاً: رویدادهای نجومی" required />
              <button type="submit" disabled={savingCategory || newCategory.trim().length < 2}>
                <Plus size={17} /> {savingCategory ? "در حال ثبت..." : "افزودن دسته‌بندی"}
              </button>
            </form>
            {categoryError && <p className="category-error" role="alert">{categoryError}</p>}
            <div className="category-manager-tags" aria-label="دسته‌بندی‌های موجود">
              {categories.map((name) => <span key={name}>{name}</span>)}
            </div>
          </section>}

          {activeSection === "settings" && <SiteContentEditor content={content} onSave={onSaveContent} />}

          {(activeSection === "dashboard" || activeSection === "settings") && <section className="manager-note">
            <span><CheckCircle2 size={19} /></span>
            <div><strong>دیتابیس مرکزی Neon PostgreSQL</strong><p>تغییرات پس از ذخیره به‌صورت مشترک برای تمام بازدیدکنندگان در دسترس است.</p></div>
          </section>}
        </main>
      </div>

      {showPublish && <PublishModal initial={editing ?? undefined} categories={categories}
        onCreateCategory={onCreateCategory}
        onClose={() => { setShowPublish(false); setEditing(null); }} onPublish={saveMedia} />}
      {toast && <div className="toast-message" role="status"><CheckCircle2 size={18} />{toast}</div>}
    </div>
  );
}
