"use client";

import { useState } from "react";
import { CONTENT_FIELDS, type SiteContent } from "@/lib/cms-content";
import { Check, ImagePlus, Save } from "lucide-react";

export function SiteContentEditor({ content, onSave }: {
  content: SiteContent;
  onSave: (key: keyof SiteContent, value: string) => Promise<void>;
}) {
  const [draft, setDraft] = useState<SiteContent>({ ...content });
  const [activeGroup, setActiveGroup] = useState(CONTENT_FIELDS[0].section);
  const [saving, setSaving] = useState<keyof SiteContent | null>(null);
  const [message, setMessage] = useState("");
  const save = async (key: keyof SiteContent) => {
    setSaving(key);
    setMessage("");
    try {
      await onSave(key, draft[key]);
      setMessage("تغییر ذخیره شد و در سایت عمومی نمایش داده می‌شود.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "ذخیره ناموفق بود");
    } finally { setSaving(null); }
  };

  const readImage = (key: keyof SiteContent, file?: File) => {
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 2.5 * 1024 * 1024) {
      setMessage("فقط PNG/JPG/WEBP با حجم حداکثر ۲.۵ مگابایت قابل انتخاب است.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setDraft((current) => ({ ...current, [key]: String(reader.result) }));
    reader.readAsDataURL(file);
  };

  return (
    <section className="site-editor" id="settings" aria-label="مدیریت کل سایت">
      <div className="site-editor-header">
        <h2>مدیریت تمام محتوای سایت</h2>
        <p>نام، تیترها، متن‌ها، تصویر Hero، بخش درباره، لینک‌ها و اطلاعات سئو را از همین‌جا ویرایش کنید.</p>
      </div>
      <nav className="site-editor-tabs" aria-label="بخش‌های تنظیمات سایت">
        {CONTENT_FIELDS.map((group) => (
          <button key={group.section} type="button" aria-pressed={activeGroup === group.section}
            className={activeGroup === group.section ? "active" : ""}
            onClick={() => { setActiveGroup(group.section); setMessage(""); }}>
            {group.section}
          </button>
        ))}
      </nav>
      {CONTENT_FIELDS.filter((group) => group.section === activeGroup).map((group) => (
        <div className="editor-group" key={group.section}>
          <h3>{group.section}</h3>
          <div className="editor-fields">
            {group.fields.map((field) => (
              <div className="editor-field" key={field.key}>
                <label htmlFor={field.key}>{field.label}</label>
                {field.multiline ? (
                  <textarea
                    id={field.key} rows={3} value={draft[field.key]}
                    onChange={(event) => setDraft((current) => ({ ...current, [field.key]: event.target.value }))}
                  />
                ) : (
                  <input
                    id={field.key} dir={field.image || field.key === "footerInstagram" ? "ltr" : "auto"}
                    value={draft[field.key].startsWith("data:image/") ? "" : draft[field.key]}
                    placeholder={field.image ? "https://... یا تصویر خود را انتخاب کنید" : ""}
                    onChange={(event) => setDraft((current) => ({ ...current, [field.key]: event.target.value }))}
                  />
                )}
                {field.image && (
                  <div className="editor-image-actions">
                    <label className="editor-upload">
                      <ImagePlus size={16} /> انتخاب تصویر
                      <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => readImage(field.key, e.target.files?.[0])} />
                    </label>
                    {draft[field.key] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={draft[field.key]} alt="پیش‌نمایش تصویر" className="editor-image-preview" />
                    )}
                  </div>
                )}
                <button type="button" className="editor-save" disabled={saving !== null || draft[field.key] === content[field.key]}
                  onClick={() => void save(field.key)}>
                  {draft[field.key] === content[field.key] ? <Check size={15} /> : <Save size={15} />}
                  {saving === field.key ? "در حال ذخیره..." : draft[field.key] === content[field.key] ? "ذخیره‌شده" : "ذخیره تغییر"}
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
      {message && <p className="editor-feedback" role="status">{message}</p>}
    </section>
  );
}
