"use client";

import { useState } from "react";
import Link from "next/link";
import { Leaf, CheckCircle2, Users, HeartHandshake, Stethoscope } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

const accountTypes = [
  { key: "family", label: "ครอบครัว", icon: Users },
  { key: "caregiver", label: "ผู้ดูแล", icon: HeartHandshake },
  { key: "nurse", label: "พยาบาล", icon: Stethoscope },
] as const;

// Keeps only what the backend's username validator accepts, then trims
// leading/trailing dots. Must lowercase *before* filtering — filtering
// against the lowercase character class first would otherwise strip every
// uppercase English letter too.
function sanitizeUsername(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9._]/g, "")
    .replace(/^\.+|\.+$/g, "");
}

// Thai (or any non-Latin) names sanitize down to "" once the Thai
// characters are stripped, not just the "." joiner — a plain truthiness
// check on the old `firstName.lastName` string missed that ("." is
// truthy), which is what let a 2-char invalid username slip past to the
// backend instead of falling back to the email-derived one.
function buildUsername(firstName: string, lastName: string, email: string): string {
  const fromName = sanitizeUsername(`${firstName}.${lastName}`);
  if (fromName.length >= 3) return fromName;
  return sanitizeUsername(email.split("@")[0] ?? "");
}

// FastAPI/Pydantic 422 responses send `detail` as an array of
// { msg, loc, ... } objects, not a string — `new Error(data?.detail)`
// used to stringify that array as "[object Object]". Other error
// responses (409, etc.) still send a plain string.
function getErrorMessage(detail: unknown): string {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => (item && typeof item === "object" && "msg" in item ? String((item as { msg: unknown }).msg) : null))
      .filter((msg): msg is string => Boolean(msg));
    if (messages.length > 0) return messages.join(", ");
  }
  return "สมัครสมาชิกไม่สำเร็จ";
}

// Translates the handful of validation/conflict errors a user is likely
// to actually hit into Thai; anything else falls through unchanged.
function translateErrorMessage(message: string, status?: number): string {
  if (status === 409) return "อีเมลนี้ถูกใช้แล้ว";
  const lower = message.toLowerCase();
  if (lower.includes("email") && lower.includes("valid")) return "รูปแบบอีเมลไม่ถูกต้อง";
  if (lower.includes("password") && lower.includes("6")) return "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร";
  return message;
}

export default function RegisterPage() {
  const [accountType, setAccountType] = useState<(typeof accountTypes)[number]["key"]>("family");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const formData = new FormData(e.currentTarget);
    const firstName = String(formData.get("firstName") ?? "").trim();
    const lastName = String(formData.get("lastName") ?? "").trim();
    const email = String(formData.get("regEmail") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const password = String(formData.get("regPassword") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (password !== confirmPassword) {
      setError("รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน");
      return;
    }

    const username = buildUsername(firstName, lastName, email);

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          email,
          password,
          first_name: firstName,
          last_name: lastName,
          phone,
          role: accountType,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(translateErrorMessage(getErrorMessage(data?.detail), response.status));
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "สมัครสมาชิกไม่สำเร็จ");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-soft px-5 py-10">
        <div className="card w-full max-w-md p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-status-green-bg text-status-green">
            <CheckCircle2 size={30} aria-hidden="true" />
          </div>
          <h1 className="mt-5 text-xl font-bold text-ink">สมัครสมาชิกสำเร็จ</h1>
          <p className="mt-2 text-ink-soft">
            ยินดีต้อนรับสู่ Eldercare Tech คุณสามารถเข้าสู่ระบบเพื่อเริ่มใช้งานได้ทันที
          </p>
          <Link href="/login" className="btn-primary mt-6 w-full">
            ไปหน้าเข้าสู่ระบบ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-surface-soft px-5 py-10">
      <ThemeToggle className="absolute right-4 top-4 bg-surface shadow-card" />
      <div className="w-full max-w-lg">
        <Link
          href="/"
          className="mb-8 flex items-center justify-center gap-2 text-xl font-bold text-brand-blue"
        >
          <Leaf size={24} className="text-brand-green" aria-hidden="true" />
          Eldercare Tech
        </Link>

        <div className="card p-6 sm:p-8">
          <h1 className="text-2xl font-bold text-ink">สร้างบัญชี Eldercare Tech</h1>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="firstName" className="mb-1.5 block text-sm font-medium text-ink">
                  ชื่อ
                </label>
                <input id="firstName" name="firstName" required placeholder="สมชาย" className="input-field" />
              </div>
              <div>
                <label htmlFor="lastName" className="mb-1.5 block text-sm font-medium text-ink">
                  นามสกุล
                </label>
                <input id="lastName" name="lastName" required placeholder="ใจดี" className="input-field" />
              </div>
            </div>

            <div>
              <label htmlFor="regEmail" className="mb-1.5 block text-sm font-medium text-ink">
                อีเมล
              </label>
              <input
                id="regEmail"
                name="regEmail"
                type="email"
                required
                placeholder="you@example.com"
                className="input-field"
              />
            </div>

            <div>
              <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-ink">
                เบอร์โทรศัพท์
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                placeholder="08X-XXX-XXXX"
                className="input-field"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="regPassword" className="mb-1.5 block text-sm font-medium text-ink">
                  รหัสผ่าน
                </label>
                <input
                  id="regPassword"
                  name="regPassword"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="input-field"
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-ink">
                  ยืนยันรหัสผ่าน
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="input-field"
                />
              </div>
            </div>

            <fieldset>
              <legend className="mb-1.5 text-sm font-medium text-ink">เลือกประเภทบัญชี</legend>
              <div className="grid grid-cols-3 gap-3">
                {accountTypes.map((type) => {
                  const Icon = type.icon;
                  const active = accountType === type.key;
                  return (
                    <button
                      key={type.key}
                      type="button"
                      onClick={() => setAccountType(type.key)}
                      aria-pressed={active}
                      className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border p-3 text-sm font-medium transition-colors ${
                        active
                          ? "border-brand-blue bg-brand-blue-light text-brand-blue"
                          : "border-surface-line text-ink-soft hover:border-brand-blue/40"
                      }`}
                    >
                      <Icon size={20} aria-hidden="true" />
                      {type.label}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            {error ? (
              <p className="rounded-lg border border-status-red/30 bg-status-red-bg px-3 py-2 text-sm text-status-red">
                {error}
              </p>
            ) : null}

            <button type="submit" className="btn-primary mt-1 w-full" disabled={isSubmitting}>
              {isSubmitting ? "กำลังสมัครสมาชิก..." : "สมัครสมาชิก"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-soft">
            มีบัญชีอยู่แล้ว?{" "}
            <Link href="/login" className="font-semibold text-brand-blue hover:underline">
              เข้าสู่ระบบ
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
