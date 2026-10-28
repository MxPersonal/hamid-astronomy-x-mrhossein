import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import { getSiteContent } from "@/lib/cms-db";
import "./globals.css";

const vazirmatn = Vazirmatn({
  variable: "--font-vazirmatn",
  subsets: ["arabic", "latin"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteContent();
  return {
    title: site.seoTitle || "Hamid Astronomy",
    description: site.seoDescription,
    applicationName: "Hamid Astronomy",
  };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fa" dir="rtl" className={`${vazirmatn.variable} h-full`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
