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

const categories: MediaCategory[] = [
  "سحابی‌ها",
  "کهکشان‌ها",
  "منظومه شمسی",
  "ماه",
  "ویدیوها",
  "نوشته‌ها",
];

interface PublishModalProps {
  onClose: () => void;
  onPublish: (input: NewMediaInput) => Promise<void>;
  initial?: MediaItem;
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

export function PublishModal({ onClose, onPublish, initial }: PublishModalProps) {
  const [type, setType] = useState<MediaType>(initial?.type ?? "image");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [category, setCategory] = useState<MediaCategory>(initial?.category ?? "سحابی‌ها");
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
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
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
      category: type === "video" ? "ویدیوها" : type === "text" ? "نوشته‌ها" : category,
      image: image.trim(),
      videoUrl: type === "video" ? normalizeVideoUrl(videoUrl) : undefined,
      capturedAt: capturedAt.trim(),
      published,
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
                onClick={() => { setType("image"); if (category === "ویدیوها" || category === "نوشته‌ها") setCategory("سحابی‌ها"); }}
                disabled={Boolean(initial)}
              >
                <ImagePlus size={17} /> تصویر
              </button>
              <button
                type="button"
                className={type === "video" ? "active" : ""}
                onClick={() => {
                  setType("video");
                  setCategory("ویدیوها");
                }}
                disabled={Boolean(initial)}
              >
                <UploadCloud size={17} /> ویدیو
              </button>
              <button type="button" className={type === "text" ? "active" : ""}
                onClick={() => { setType("text"); setCategory("نوشته‌ها"); }}
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
                  value={type === "video" ? "ویدیوها" : type === "text" ? "نوشته‌ها" : category}
                  onChange={(event) =>
                    setCategory(event.target.value as MediaCategory)
                  }
                  disabled={type === "video" || type === "text"}
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
