import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { hasValidAdminSession } from "@/lib/admin-auth";
import { AdminLoginForm } from "./admin-login-form";

export const metadata: Metadata = {
  title: "ورود مدیر | Hamid Astronomy",
  description: "ورود امن به پنل مدیریت گالری Hamid Astronomy",
  robots: { follow: false, index: false },
};

export default async function AdminLoginPage() {
  if (await hasValidAdminSession()) redirect("/admin");

  return <AdminLoginForm />;
}
