"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminDashboard } from "@/components/admin-dashboard";
import { useMediaLibrary } from "@/hooks/use-media-library";

export function AdminClient() {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const { items, addItem, removeItem, togglePublished } = useMediaLibrary();

  const logout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);

    try {
      const response = await fetch("/api/admin/logout", { method: "POST" });
      if (!response.ok) throw new Error("Logout failed");
      router.replace("/");
      router.refresh();
    } catch {
      setLoggingOut(false);
      window.alert("خروج امن انجام نشد. اتصال خود را بررسی و دوباره تلاش کنید.");
    }
  };

  return (
    <AdminDashboard
      items={items}
      onAdd={addItem}
      onDelete={removeItem}
      onTogglePublished={togglePublished}
      onLogout={logout}
      onViewSite={() => router.push("/")}
    />
  );
}
