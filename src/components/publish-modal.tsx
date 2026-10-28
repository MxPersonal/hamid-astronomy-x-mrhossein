"use client";

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { Check, FileText, ImagePlus, Link2, UploadCloud, X } from "lucide-react";
import type {
  MediaCategory,
  MediaType,
  NewMediaInput,
  MediaItem,
} from "@/types/media";
import { MediaImage } from "./media-image";
import { DEFAULT_MEDIA_SEO } from "@/lib/media-seo";
import type { MediaSeo } from "@/types/media";

interface PublishModalProps {
  onClose: () => void;
  onPublish: (input: NewMediaInput) => Promise<void>;
  initial?: MediaItem;
  categories: MediaCategory[];
  onCreateCategory: (name: string) => Promise<string>;
}

function normalizeVideoUrl(value: string): string {
  const trimmed = value.trim();
  try {
    const url = new URL(trimmed);
    if (url.hostname.includes("youtube.com") && url.searchParams.get("v")) {
      return `https://www.youtube.com/embed/${url.searchParams.get("v")}?rel=0`;
    }
    if (url.hostname === "youtu.be") {
      return `https://www.youtube.com/embed/${url.pathname.slice(1)}?rel=0`;
    }
  } catch {
    return trimmed;
  }
  return trimmed;
}

export function PublishModal({ onClose, onPublish, initial, categories, onCreateCategory }: PublishModalProps) {
  const [type, setType] = useState<MediaType>(initial?.type ?? "image");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [category, setCategory] = useState<MediaCategory>(initial?.category ?? (categories.includes("سحابی‌ها") ? "سحابی‌ها" : categories[0] || ""));
  const [image, setImage] = useState(initial?.image ?? "");
  const [videoUrl, setVideoUrl] = useState(initial?.videoUrl ?? "");
  const [capturedAt, setCapturedAt] = useState(initial?.capturedAt ??
    new Intl.DateTimeFormat("fa-IR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date()),
  );
  const [published, setPublished] = useState(initial?.published ?? true);
  const [seo, setSeo] = useState<MediaSeo>({ ...DEFAULT_MEDIA_SEO, ...initial?.seo });
  const changeSeo = <K extends keyof MediaSeo>(key: K, value: MediaSeo[K]) => setSeo((prev) => ({ ...prev, [key]: value }));
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [categoryBusy, setCategoryBusy] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    titleRef.current?.focus();
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("برای کاور، یک فایل تصویری انتخاب کنید.");
      return;
    }
    if (file.size > 2.5 * 1024 * 1024) {
      setError("حجم تصویر باید کمتر از ۲.۵ مگابایت باشد.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImage(String(reader.result));
      setError("");
    };
    reader.onerror = () => setError("خواندن فایل ناموفق بود؛ دوباره تلاش کنید.");
    reader.readAsDataURL(file);
  };

  const saveCategory = async () => {
    if (categoryBusy) return;
    const name = newCategory.trim().replace(/\\s+/g, " ");
    if (name.length < 2 || name.length > 60) {
      setError("نام دسته‌بندی باید بین ۲ تا ۶۰ نویسه باشد.");
      return;
    }
    setCategoryBusy(true);
    setError("");
    try {
      const created = await onCreateCategory(name);
      setCategory(created);
      setNewCategory("");
      setAddingCategory(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : "ساخت دسته‌بندی ناموفق بود");
    } finally {
      setCategoryBusy(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanTitle = title.trim();
    const cleanDescription = description.trim();
    if (cleanTitle.length < 3) {
      setError("عنوان باید دست‌کم ۳ نویسه داشته باشد.");
      return;
    }
    if (cleanDescription.length < 10) {
      setError("برای اثر، توضیح کامل‌تری بنویسید.");
      return;
    }
    if (cleanDescription.length > (type === "text" ? 10000 : 3000)) {
      setError("متن بیش از اندازه طولانی است.");
      return;
    }
    if (!category || !categories.includes(category)) {
      setError("ابتدا دسته‌بندی معتبری انتخاب یا ایجاد کنید.");
      return;
    }
    if (type !== "text" && !image) {
      setError("یک تصویر کاور بارگذاری کنید یا آدرس آن را وارد کنید.");
      return;
    }
    if (type === "video" && !videoUrl.trim()) {
      setError("آدرس ویدیو برای محتوای ویدیویی الزامی است.");
      return;
    }

    setSubmitting(true);
    try {
      await onPublish({
      title: cleanTitle,
      description: cleanDescription,
      type,
      category,
      image: image.trim(),
      videoUrl: type === "video" ? normalizeVideoUrl(videoUrl) : undefined,
      capturedAt: capturedAt.trim(),
      published,
      seo,
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : "ذخیره ناموفق بود");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="modal-backdrop publish-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="publish-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <form className="publish-modal" onSubmit={handleSubmit} noValidate>
        <div className="publish-header">
          <div>
            <span>مدیریت محتوا</span>
            <h2 id="publish-title">{initial ? "ویرایش اثر" : "انتشار اثر تازه"}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="بستن فرم">
            <X size={20} />
          </button>
        </div>

        <div className="publish-body">
          <div className="form-column">
            <fieldset className="type-switch">
              <legend>نوع محتوا</legend>
              <button
                type="button"
                className={type === "image" ? "active" : ""}
                onClick={() => { setType("image"); setCategory(categories.includes("سحابی‌ها") ? "سحابی‌ها" : categories[0] || ""); }}
                disabled={Boolean(initial)}
              >
                <ImagePlus size={17} /> تصویر
              </button>
              <button
                type="button"
                className={type === "video" ? "active" : ""}
                onClick={() => {
                  setType("video");
                  setCategory(categories.includes("ویدیوها") ? "ویدیوها" : categories[0] || "");
                }}
                disabled={Boolean(initial)}
              >
                <UploadCloud size={17} /> ویدیو
              </button>
              <button type="button" className={type === "text" ? "active" : ""}
                onClick={() => { setType("text"); setCategory(categories.includes("نوشته‌ها") ? "نوشته‌ها" : categories[0] || ""); }}
                disabled={Boolean(initial)}>
                <FileText size={17} /> نوشته
              </button>
            </fieldset>
            {initial && <p className="content-type-hint">نوع محتوای موجود هنگام ویرایش ثابت است.</p>}

            <label className="field-label">
              {type === "text" ? "عنوان نوشته" : "عنوان اثر"}
              <input
                ref={titleRef}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={160}
                placeholder="مثلاً: طلوع در مدار زحل"
              />
              <small>{title.length.toLocaleString("fa-IR")} / ۱۶۰</small>
            </label>

            <label className="field-label">
              {type === "text" ? "متن کامل نوشته" : "توضیحات"}
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                maxLength={type === "text" ? 10000 : 3000}
                rows={type === "text" ? 12 : 5}
                placeholder={type === "text" ? "متن مقاله یا یادداشت نجومی را اینجا بنویسید؛ پاراگراف‌ها حفظ می‌شوند..." : "داستان و اطلاعات این تصویر را بنویسید..."}
              />
              <small>{description.length.toLocaleString("fa-IR")} / {type === "text" ? "۱۰٬۰۰۰" : "۳٬۰۰۰"}</small>
            </label>

            <div className="form-row">
              <label className="field-label">
                دسته‌بندی
                <select
                  value={category}
                  onChange={(event) =>
                    setCategory(event.target.value as MediaCategory)
                  }
                >
                  {categories.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
              <label className="field-label">
                تاریخ ثبت
                <input
                  value={capturedAt}
                  onChange={(event) => setCapturedAt(event.target.value)}
                />
              </label>
            </div>

            <div className="inline-category-creator">
              <button type="button" className="inline-category-toggle"
                onClick={() => { setAddingCategory((open) => !open); setError(""); }}>
                {addingCategory ? "بستن ساخت دسته‌بندی" : "+ افزودن دسته‌بندی جدید"}
              </button>
              {addingCategory && (
                <div className="inline-category-form">
                  <label htmlFor="inline-new-category">نام دسته‌بندی جدید</label>
                  <div>
                    <input id="inline-new-category" value={newCategory}
                      maxLength={60} placeholder="مثلاً: عکاسی از آسمان شب"
                      onChange={(event) => setNewCategory(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          void saveCategory();
                        }
                      }} />
                    <button type="button" disabled={categoryBusy || newCategory.trim().length < 2}
                      onClick={() => void saveCategory()}>
                      {categoryBusy ? "در حال ثبت..." : "ساخت و انتخاب"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {type === "video" && (
              <label className="field-label">
                آدرس ویدیو
                <span className="input-with-icon">
                  <Link2 size={17} />
                  <input
                    dir="ltr"
                    value={videoUrl}
                    onChange={(event) => setVideoUrl(event.target.value)}
                    placeholder="YouTube or MP4 URL"
                  />
                </span>
              </label>
            )}
          </div>

          <div className="upload-column">
            <span className="upload-title">تصویر کاور {type === "text" ? "(اختیاری)" : "(الزامی)"}</span>
            <label className={`drop-zone ${image ? "has-image" : ""}`}>
              {image ? (
                <MediaImage
                  src={image}
                  alt="پیش‌نمایش کاور"
                  className="object-cover"
                />
              ) : (
                <>
                  <span>
                    <UploadCloud size={24} />
                  </span>
                  <strong>تصویر را اینجا انتخاب کنید</strong>
                  <small>PNG، JPG یا WEBP تا ۲.۵ مگابایت</small>
                </>
              )}
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={onFileChange} />
            </label>
            <div className="or-divider">یا</div>
            <label className="field-label">
              آدرس تصویر
              <span className="input-with-icon">
                <Link2 size={17} />
                <input
                  dir="ltr"
                  type="url"
                  value={image.startsWith("data:") ? "" : image}
                  onChange={(event) => setImage(event.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
              </span>
            </label>

            <label className="publish-toggle">
              <input
                type="checkbox"
                checked={published}
                onChange={(event) => setPublished(event.target.checked)}
              />
              <span aria-hidden="true" />
              <div>
                <strong>{type === "text" ? "انتشار نوشته در سایت" : "انتشار فوری در گالری"}</strong>
                <small>در صورت خاموش‌بودن، به‌صورت پیش‌نویس ذخیره می‌شود.</small>
              </div>
            </label>
          </div>
        </div>

        <fieldset className="seo-edit-panel">
          <legend>تنظیمات پیشرفته SEO برای همین محتوا</legend>
          <p className="seo-edit-note">
            همه فیلدها به‌جز وضعیت ایندکس اختیاری هستند. مقادیر خالی از عنوان، توضیح و تصویر اصلی محتوا استفاده می‌کنند.
          </p>
          <div className="seo-edit-grid">
            <label className="field-label">
              آدرس کوتاه (Slug انگلیسی)
              <input dir="ltr" value={seo.slug} maxLength={90}
                placeholder={initial?.id ?? "my-astronomy-photo"}
                onChange={(event) => changeSeo("slug", event.target.value.toLowerCase())} />
              <small>فقط حروف انگلیسی کوچک، عدد و خط تیره. تغییر Slug باعث تغییر نشانی اصلی محتوا می‌شود.</small>
            </label>
            <label className="field-label">
              عنوان اختصاصی نتایج جست‌وجو
              <input value={seo.title} maxLength={160}
                placeholder="در صورت خالی بودن از عنوان محتوا استفاده می‌شود"
                onChange={(event) => changeSeo("title", event.target.value)} />
            </label>
            <label className="field-label">
              توضیح متا (Meta Description)
              <textarea rows={3} maxLength={320} value={seo.description}
                placeholder="توضیح کوتاه و دقیق برای نتیجه گوگل"
                onChange={(event) => changeSeo("description", event.target.value)} />
            </label>
            <label className="field-label">
              متن جایگزین تصویر (Alt Text)
              <textarea rows={3} maxLength={300} value={seo.altText}
                placeholder="شرح واقعی محتوای تصویر، نه تکرار کلمات کلیدی"
                onChange={(event) => changeSeo("altText", event.target.value)} />
            </label>
            <label className="field-label">
              آدرس تصویر شبکه‌های اجتماعی (HTTPS)
              <input dir="ltr" type="url" maxLength={2048} value={seo.shareImage}
                placeholder="https://example.com/cover.webp"
                onChange={(event) => changeSeo("shareImage", event.target.value)} />
            </label>
            <label className="field-label">
              منبع علمی یا اعتبار اثر (HTTPS)
              <input dir="ltr" type="url" maxLength={2048} value={seo.sourceUrl}
                placeholder="https://science.nasa.gov/..."
                onChange={(event) => changeSeo("sourceUrl", event.target.value)} />
            </label>
            <label className="field-label">
              تاریخ واقعی انتشار (در صورت اطلاع)
              <input dir="ltr" type="date" value={seo.publishedAt}
                onChange={(event) => changeSeo("publishedAt", event.target.value)} />
              <small>تاریخ ساخت رکورد و تاریخ ثبت عکس، لزوماً تاریخ انتشار نیستند.</small>
            </label>
            <label className="seo-index-toggle">
              <input type="checkbox" checked={seo.indexable}
                onChange={(event) => changeSeo("indexable", event.target.checked)} />
              <span>اجازه ایندکس‌شدن در موتورهای جست‌وجو</span>
              <small>خاموش: صفحه عمومی می‌ماند، اما noindex می‌گیرد و از Sitemap حذف می‌شود.</small>
            </label>
          </div>
          <div className="aeo-editor">
            <h3>محتوای پاسخ‌محور و منابع علمی (AEO / GEO)</h3>
            <p className="seo-edit-note">فقط اطلاعاتی را وارد کنید که بررسی علمی شده‌اند. این بخش بدون تولید خودکار محتوا مستقیماً در صفحه مستقل نمایش داده می‌شود.</p>

            <label className="field-label">
              پاسخ کوتاه و مستقیم به پرسش اصلی
              <textarea rows={4} maxLength={1200} value={seo.answer}
                placeholder="چکیده دقیق، قابل‌فهم و تأییدشده درباره موضوع؛ در صورت نبود شواهد خالی بماند"
                onChange={(event) => changeSeo("answer", event.target.value)} />
              <small>پاسخ در بالای مقاله با تیتر «پاسخ کوتاه» دیده می‌شود و در Article Schema فقط برای نوشته‌ها استفاده خواهد شد.</small>
            </label>

            <label className="field-label">
              نام واقعی نویسنده یا تهیه‌کننده (اختیاری)
              <input value={seo.authorName} maxLength={120}
                placeholder="نام واقعی؛ عنوان یا مدرک ساختگی وارد نکنید"
                onChange={(event) => changeSeo("authorName", event.target.value)} />
            </label>

            <label className="field-label">
              نوع واقعی تصویر (در صورت اطلاع)
              <select value={seo.visualKind}
                onChange={(event) => changeSeo("visualKind", event.target.value as MediaSeo["visualKind"])}>
                <option value="unspecified">تعیین نشده</option>
                <option value="observation">عکس یا داده رصدی واقعی</option>
                <option value="illustration">تصویرسازی هنری</option>
                <option value="simulation">شبیه‌سازی علمی</option>
                <option value="ai-generated">تصویر تولیدشده با هوش مصنوعی</option>
              </select>
              <small>برچسب فقط با انتخاب آگاهانه مدیر، در صفحه عمومی نمایش داده می‌شود.</small>
            </label>

            <div className="aeo-field-heading">
              <strong>پرسش‌های متداول تأییدشده</strong>
              <button type="button" disabled={seo.faqs.length >= 8}
                onClick={() => changeSeo("faqs", [...seo.faqs, { question: "", answer: "" }])}>
                + افزودن پرسش
              </button>
            </div>
            {seo.faqs.map((faq, index) => (
              <div className="aeo-entry" key={index}>
                <label className="field-label">
                  پرسش {index + 1}
                  <input value={faq.question} maxLength={220}
                    onChange={(event) => changeSeo("faqs", seo.faqs.map((value, i) =>
                      i === index ? { ...value, question: event.target.value } : value))} />
                </label>
                <label className="field-label">
                  پاسخ مستند
                  <textarea rows={3} value={faq.answer} maxLength={1200}
                    onChange={(event) => changeSeo("faqs", seo.faqs.map((value, i) =>
                      i === index ? { ...value, answer: event.target.value } : value))} />
                </label>
                <button type="button" className="aeo-remove"
                  onClick={() => changeSeo("faqs", seo.faqs.filter((_, i) => i !== index))}>
                  حذف پرسش
                </button>
              </div>
            ))}

            <div className="aeo-field-heading">
              <strong>منابع و استنادهای علمی</strong>
              <button type="button" disabled={seo.references.length >= 10}
                onClick={() => changeSeo("references", [...seo.references, { title: "", url: "" }])}>
                + افزودن منبع
              </button>
            </div>
            {seo.references.map((reference, index) => (
              <div className="aeo-entry" key={index}>
                <label className="field-label">
                  عنوان واقعی منبع
                  <input value={reference.title} maxLength={180}
                    placeholder="عنوان مقاله، گزارش، رصدخانه یا نشریه"
                    onChange={(event) => changeSeo("references", seo.references.map((value, i) =>
                      i === index ? { ...value, title: event.target.value } : value))} />
                </label>
                <label className="field-label">
                  آدرس HTTPS منبع
                  <input dir="ltr" type="url" value={reference.url} maxLength={2048}
                    placeholder="https://science.nasa.gov/..."
                    onChange={(event) => changeSeo("references", seo.references.map((value, i) =>
                      i === index ? { ...value, url: event.target.value } : value))} />
                </label>
                <button type="button" className="aeo-remove"
                  onClick={() => changeSeo("references", seo.references.filter((_, i) => i !== index))}>
                  حذف منبع
                </button>
              </div>
            ))}
            <small className="aeo-hint">این منابع باید ادعاهای متن را واقعاً پشتیبانی کنند؛ افزودن URL به‌تنهایی تأیید علمی ایجاد نمی‌کند.</small>
          </div>
        </fieldset>

        {error && <p className="form-error">{error}</p>}

        <div className="publish-footer">
          <button type="button" className="cancel-button" onClick={onClose}>
            انصراف
          </button>
          <button type="submit" className="publish-button" disabled={submitting}>
            <Check size={18} /> {submitting ? "در حال ذخیره..." : initial ? "ذخیره ویرایش" : published ? type === "text" ? "انتشار نوشته" : "انتشار اثر" : "ذخیره پیش‌نویس"}
          </button>
        </div>
      </form>
    </div>
  );
}
