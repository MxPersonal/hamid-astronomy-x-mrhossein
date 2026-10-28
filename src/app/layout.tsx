import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import { SITE_DEFAULTS } from "@/lib/cms-content";
import { SITE_URL } from "@/lib/seo";
import "./globals.css";

const vazirmatn = Vazirmatn({
  variable: "--font-vazirmatn",
  subsets: ["arabic", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_DEFAULTS.seoTitle,
  description: SITE_DEFAULTS.seoDescription,
  applicationName: "Hamid Astronomy",
  openGraph: { siteName: "Hamid Astronomy", locale: "fa_IR", type: "website" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fa" dir="rtl" className={`${vazirmatn.variable} h-full`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
