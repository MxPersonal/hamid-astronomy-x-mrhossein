import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { hasValidAdminSession } from "@/lib/admin-auth";
import { AdminLoginForm } from "./admin-login-form";

export const metadata: Metadata = {
  title: "ورود مدیر | سُها",
  description: "ورود امن به پنل مدیریت گالری سُها",
  robots: { follow: false, index: false },
};

export default async function AdminLoginPage() {
  if (await hasValidAdminSession()) redirect("/admin");

  return <AdminLoginForm />;
}
