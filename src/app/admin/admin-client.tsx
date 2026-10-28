"use client";

import { useState } from "react";
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

export function AdminClient({ initialItems, initialContent, initialNotifications }: {
  initialItems: MediaItem[];
  initialContent: SiteContent;
  initialNotifications: CmsNotification[];
}) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [content, setContent] = useState(initialContent);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [loggingOut, setLoggingOut] = useState(false);

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
  const readNotifications = async () => {
    await api("/api/cms/notifications", "PATCH");
    await refreshNotifications();
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
      onAdd={add} onEdit={edit} onDelete={remove} onTogglePublished={togglePublished}
      onSaveContent={saveContent} onReadNotifications={readNotifications}
      onLogout={() => void logout()} onViewSite={() => router.push("/")}
    />
  );
}
