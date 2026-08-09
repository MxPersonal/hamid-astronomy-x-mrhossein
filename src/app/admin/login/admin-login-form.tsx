"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  ShieldCheck,
  UserRound,
} from "lucide-react";

export function AdminLoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    const form = event.currentTarget;
    const formData = new FormData(form);
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/admin/login", {
        body: JSON.stringify({
          password: formData.get("password"),
          username: formData.get("username"),
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const result: unknown = await response.json();

      if (!response.ok) {
        const message =
          typeof result === "object" &&
          result !== null &&
          "error" in result &&
          typeof result.error === "string"
            ? result.error
            : "ورود انجام نشد. دوباره تلاش کنید.";
        setError(message);
        return;
      }

      form.reset();
      router.replace("/admin");
      router.refresh();
    } catch {
      setError("ارتباط با سرور برقرار نشد. دوباره تلاش کنید.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="admin-login-shell">
      <section className="admin-login-card" aria-labelledby="login-title">
        <div className="login-brand">
          <span className="brand-orbit" aria-hidden="true"><i /></span>
          <span><strong>سُها</strong><small>روایت بی‌کران</small></span>
        </div>

        <div className="login-security-icon" aria-hidden="true">
          <ShieldCheck size={29} />
        </div>
        <p className="login-eyebrow">ناحیه‌ی حفاظت‌شده</p>
        <h1 id="login-title">ورود مدیر</h1>
        <p className="login-description">
          برای دسترسی به مدیریت تصاویر و ویدیوها، اطلاعات مدیر را وارد کنید.
        </p>

        <form className="admin-login-form" onSubmit={submit}>
          <label htmlFor="admin-username">نام کاربری</label>
          <div className="login-input-wrap">
            <UserRound size={18} aria-hidden="true" />
            <input
              autoCapitalize="none"
              autoComplete="username"
              autoFocus
              disabled={submitting}
              id="admin-username"
              maxLength={128}
              name="username"
              required
              spellCheck={false}
              type="text"
            />
          </div>

          <label htmlFor="admin-password">رمز عبور</label>
          <div className="login-input-wrap">
            <LockKeyhole size={18} aria-hidden="true" />
            <input
              autoComplete="current-password"
              disabled={submitting}
              id="admin-password"
              maxLength={256}
              name="password"
              required
              type={showPassword ? "text" : "password"}
            />
            <button
              aria-label={showPassword ? "پنهان‌کردن رمز" : "نمایش رمز"}
              className="password-visibility"
              onClick={() => setShowPassword((visible) => !visible)}
              type="button"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div aria-live="polite" className={error ? "login-error visible" : "login-error"}>
            {error || "\u00a0"}
          </div>

          <button className="login-submit" disabled={submitting} type="submit">
            {submitting ? <LoaderCircle className="login-spinner" size={19} /> : <LockKeyhole size={18} />}
            {submitting ? "در حال بررسی..." : "ورود امن"}
          </button>
        </form>

        <div className="login-session-note">
          <ShieldCheck size={15} /> نشست امن شما پس از ۸ ساعت منقضی می‌شود.
        </div>
        <Link className="back-to-gallery" href="/">
          بازگشت به گالری <ArrowLeft size={16} />
        </Link>
      </section>
    </main>
  );
}
