import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { hasValidAdminSession } from "@/lib/admin-auth";
import { AdminClient } from "./admin-client";

export const metadata: Metadata = {
  title: "پنل مدیریت | سُها",
  robots: { follow: false, index: false },
};

export default async function AdminPage() {
  if (!(await hasValidAdminSession())) redirect("/admin/login");

  return <AdminClient />;
}
