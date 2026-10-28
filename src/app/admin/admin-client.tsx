"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminDashboard } from "@/components/admin-dashboard";
import type { MediaItem, NewMediaInput } from "@/types/media";
import type { CmsNotification, SiteContent } from "@/lib/cms-content";

async function api<T>(path: string, method: string, body?: unknown): Promise<T> {
  const response = await fetch(path, {
    method, headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : "درخواست ناموفق بود");
  return data as T;
}

export function AdminClient({ initialItems, initialContent, initialNotifications, initialCategories }: {
  initialItems: MediaItem[];
  initialContent: SiteContent;
  initialNotifications: CmsNotification[];
  initialCategories: string[];
}) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [content, setContent] = useState(initialContent);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [categories, setCategories] = useState(initialCategories);
  const [loggingOut, setLoggingOut] = useState(false);
  const [legacyItems, setLegacyItems] = useState<Array<{ id: string; data: NewMediaInput }>>([]);
  const [importingLegacy, setImportingLegacy] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("soha-media-library-v1");
      if (!raw) return;
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return;
      const imported: string[] = JSON.parse(localStorage.getItem("hamid-astronomy-imported-ids-v1") || "[]");
      const known = new Set([
        "cosmic-rift", "ringed-world", "deep-space-film",
        "lunar-terminator", "violet-nebula", "ice-moon",
        ...imported,
        ...initialItems.map((item) => item.id),
      ]);
      const remaining: Array<{ id: string; data: NewMediaInput }> = [];
      for (const item of parsed) {
        if (!item || typeof item !== "object" || typeof item.id !== "string" || known.has(item.id)) continue;
        if (typeof item.title !== "string" || typeof item.description !== "string" || typeof item.image !== "string") continue;
        remaining.push({
          id: item.id,
          data: {
            title: item.title, description: item.description,
            type: item.type === "video" ? "video" : "image",
            category: item.category, image: item.image,
            videoUrl: item.videoUrl,
            capturedAt: typeof item.capturedAt === "string" ? item.capturedAt : "",
            published: item.published === true,
          },
        });
      }
      setLegacyItems(remaining);
    } catch { /* No old browser library to migrate. */ }
  }, [initialItems]);

  const refreshNotifications = async () => {
    const response = await api<{ notifications: CmsNotification[] }>("/api/cms/notifications", "GET");
    setNotifications(response.notifications);
  };
  const add = async (input: NewMediaInput) => {
    const { item } = await api<{ item: MediaItem }>("/api/cms/media", "POST", input);
    setItems((current) => [item, ...current]);
    await refreshNotifications().catch(() => {});
  };
  const edit = async (id: string, input: NewMediaInput) => {
    const { item } = await api<{ item: MediaItem }>("/api/cms/media", "PUT", { ...input, id });
    setItems((current) => current.map((existing) => existing.id === id ? item : existing));
    await refreshNotifications().catch(() => {});
  };
  const remove = async (id: string) => {
    await api("/api/cms/media", "DELETE", { id });
    setItems((current) => current.filter((item) => item.id !== id));
    await refreshNotifications().catch(() => {});
  };
  const togglePublished = async (id: string) => {
    const { item } = await api<{ item: MediaItem }>("/api/cms/media", "PATCH", { id });
    setItems((current) => current.map((existing) => existing.id === id ? item : existing));
    await refreshNotifications().catch(() => {});
  };
  const saveContent = async (key: keyof SiteContent, value: string) => {
    await api("/api/cms/content", "PATCH", { key, value });
    setContent((current) => ({ ...current, [key]: value.trim() }));
    await refreshNotifications().catch(() => {});
    router.refresh();
  };
  const createCategory = async (name: string): Promise<string> => {
    const { category } = await api<{ category: string }>("/api/cms/categories", "POST", { name });
    setCategories((existing) => existing.includes(category) ? existing : [...existing, category]);
    await refreshNotifications().catch(() => {});
    return category;
  };
  const readNotifications = async () => {
    await api("/api/cms/notifications", "PATCH");
    await refreshNotifications();
  };
  const importLegacy = async () => {
    if (importingLegacy || !legacyItems.length) return;
    if (!window.confirm(`انتقال ${legacyItems.length.toLocaleString("fa-IR")} رسانه از حافظه قدیمی این مرورگر به Neon انجام شود؟`)) return;
    setImportingLegacy(true);
    const completed = new Set<string>(JSON.parse(localStorage.getItem("hamid-astronomy-imported-ids-v1") || "[]"));
    let failures = 0;
    try {
      for (const original of legacyItems) {
        try {
          const { item } = await api<{ item: MediaItem }>("/api/cms/media", "POST", original.data);
          setItems((current) => [item, ...current]);
          completed.add(original.id);
          localStorage.setItem("hamid-astronomy-imported-ids-v1", JSON.stringify([...completed]));
        } catch { failures += 1; }
      }
      setLegacyItems((current) => current.filter((item) => !completed.has(item.id)));
      await refreshNotifications().catch(() => {});
      window.alert(failures
        ? `محتوای قابل انتقال منتقل شد؛ ${failures} مورد به‌دلیل محدودیت فرمت یا حجم منتقل نشد.`
        : "محتواهای قدیمی به پایگاه داده Neon منتقل شدند.");
    } finally { setImportingLegacy(false); }
  };

  const logout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await api("/api/admin/logout", "POST");
      router.replace("/");
      router.refresh();
    } catch {
      setLoggingOut(false);
      window.alert("خروج امن انجام نشد. اتصال خود را بررسی و دوباره تلاش کنید.");
    }
  };
  return (
    <AdminDashboard
      items={items} content={content} notifications={notifications}
      categories={categories} onCreateCategory={createCategory}
      legacyCount={legacyItems.length} importingLegacy={importingLegacy}
      onImportLegacy={() => void importLegacy()}
      onAdd={add} onEdit={edit} onDelete={remove} onTogglePublished={togglePublished}
      onSaveContent={saveContent} onReadNotifications={readNotifications}
      onLogout={() => void logout()} onViewSite={() => router.push("/")}
    />
  );
}
