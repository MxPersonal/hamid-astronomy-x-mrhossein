import type { MediaItem } from "@/types/media";

export const SITE_DEFAULTS = {
  brandName: "Hamid Astronomy",
  brandTagline: "روایت بی‌کران",
  navGallery: "گالری",
  navAbout: "درباره ما",
  adminEntryLabel: "ورود مدیر",
  heroEyebrow: "آرشیو تصویری جهان",
  heroTitle: "جهان،",
  heroHighlight: "قاب به قاب",
  heroDescription: "مجموعه‌ای انتخاب‌شده از شگفت‌انگیزترین تصاویر و ویدیوهای کیهان؛ از سکوت ماه تا مرزهای دور کهکشان‌ها.",
  heroButton: "تماشای گالری",
  heroCaption: "هر تصویر، یک جهان برای کشف",
  heroImage: "",
  galleryTitle: "تازه‌های کیهان",
  galleryDescription: "آخرین قاب‌های اضافه‌شده به آرشیو Hamid Astronomy",
  gallerySearch: "جست‌وجو در کیهان...",
  galleryEmptyTitle: "چیزی در این مدار پیدا نشد",
  galleryEmptyDescription: "عبارت جست‌وجو یا دسته‌بندی را تغییر دهید.",
  galleryEmptyButton: "نمایش همه آثار",
  aboutEyebrow: "درباره Hamid Astronomy",
  aboutTitle: "برای دیدنِ دوردست‌ها، گاهی فقط باید",
  aboutHighlight: "مکث کرد.",
  aboutDescription: "Hamid Astronomy یک گالری مستقل برای روایت تصویری نجوم است؛ جایی برای نزدیک‌تر شدن به علم، زیبایی و سکوت بی‌انتهای جهان.",
  footerDescription: "ساخته‌شده برای عاشقان آسمان و آن‌سوی آن.",
  footerInstagram: "https://instagram.com",
  seoTitle: "Hamid Astronomy | روایت بی‌کران",
  seoDescription: "گالری فارسی تصاویر و ویدیوهای نجوم، فضا و شگفتی‌های جهان.",
} as const;

export type SiteContent = Record<keyof typeof SITE_DEFAULTS, string>;

export const CONTENT_FIELDS: {
  section: string;
  fields: { key: keyof SiteContent; label: string; multiline?: boolean; image?: boolean }[];
}[] = [
  { section: "هویت و برند", fields: [
    { key: "brandName", label: "نام سایت" },
    { key: "brandTagline", label: "شعار زیر لوگو" },
    { key: "navGallery", label: "نام منوی گالری" },
    { key: "navAbout", label: "نام منوی درباره" },
    { key: "adminEntryLabel", label: "متن دکمه ورود مدیر" },
  ] },
  { section: "صفحه نخست و Hero", fields: [
    { key: "heroEyebrow", label: "برچسب بالای تیتر" },
    { key: "heroTitle", label: "عنوان اصلی" },
    { key: "heroHighlight", label: "عنوان برجسته" },
    { key: "heroDescription", label: "متن معرفی", multiline: true },
    { key: "heroButton", label: "متن دکمه" },
    { key: "heroCaption", label: "متن کنار دکمه" },
    { key: "heroImage", label: "تصویر اصلی (URL یا بارگذاری)", image: true },
  ] },
  { section: "گالری", fields: [
    { key: "galleryTitle", label: "عنوان بخش گالری" },
    { key: "galleryDescription", label: "توضیح گالری", multiline: true },
    { key: "gallerySearch", label: "متن جست‌وجو" },
    { key: "galleryEmptyTitle", label: "عنوان نتیجه خالی" },
    { key: "galleryEmptyDescription", label: "توضیح نتیجه خالی" },
    { key: "galleryEmptyButton", label: "متن دکمه نمایش همه" },
  ] },
  { section: "درباره ما", fields: [
    { key: "aboutEyebrow", label: "عنوان کوچک" },
    { key: "aboutTitle", label: "متن اصلی" },
    { key: "aboutHighlight", label: "متن برجسته" },
    { key: "aboutDescription", label: "توضیحات", multiline: true },
  ] },
  { section: "فوتر و سئو", fields: [
    { key: "footerDescription", label: "متن فوتر", multiline: true },
    { key: "footerInstagram", label: "آدرس اینستاگرام" },
    { key: "seoTitle", label: "عنوان پیش‌فرض SEO" },
    { key: "seoDescription", label: "توضیح SEO", multiline: true },
  ] },
];

export type CmsNotification = {
  id: number;
  title: string;
  message: string;
  event_type: string;
  created_at: string;
  read_at: string | null;
};

export type MediaPatch = Partial<MediaItem>;
