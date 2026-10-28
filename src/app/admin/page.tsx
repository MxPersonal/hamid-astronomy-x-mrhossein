import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { hasValidAdminSession } from "@/lib/admin-auth";
import { getCmsNotifications, getMediaItems, getSiteContent } from "@/lib/cms-db";
import { AdminClient } from "./admin-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "پنل مدیریت | Hamid Astronomy",
  robots: { follow: false, index: false },
};

export default async function AdminPage() {
  if (!(await hasValidAdminSession())) redirect("/admin/login");
  const [initialItems, initialContent, initialNotifications] = await Promise.all([
    getMediaItems(true), getSiteContent(), getCmsNotifications(),
  ]);
  return <AdminClient
    initialItems={initialItems}
    initialContent={initialContent}
    initialNotifications={initialNotifications}
  />;
}
