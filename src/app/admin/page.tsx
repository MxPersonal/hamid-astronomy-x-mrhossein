import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { hasValidAdminSession } from "@/lib/admin-auth";
import { getCmsNotifications, getMediaItems, getSiteContent, getSiteCategories } from "@/lib/cms-db";
import { AdminClient } from "./admin-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "پنل مدیریت | Hamid Astronomy",
  robots: { follow: false, index: false },
};

export default async function AdminPage() {
  if (!(await hasValidAdminSession())) redirect("/admin/login");
  const [initialItems, initialContent, initialNotifications, initialCategories] = await Promise.all([
    getMediaItems(true), getSiteContent(), getCmsNotifications(), getSiteCategories(),
  ]);
  return <AdminClient
    initialItems={initialItems}
    initialContent={initialContent}
    initialNotifications={initialNotifications}
    initialCategories={initialCategories}
  />;
}
