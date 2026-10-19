"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Leaf, Users, HeartHandshake, Stethoscope } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { getErrorMessage, setTokens, translateErrorMessage } from "@/lib/api";

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

function randomSuffix(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

async function registerRequest(payload: Record<string, unknown>) {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  return { response, data };
}

export default function RegisterPage() {
  const router = useRouter();
  const [accountType, setAccountType] = useState<(typeof accountTypes)[number]["key"]>("family");
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
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

    if (!agreedToPrivacy) {
      setError("กรุณายินยอมนโยบายความเป็นส่วนตัวก่อนสมัครสมาชิก");
      return;
    }

    const username = buildUsername(firstName, lastName, email);

    setIsSubmitting(true);

    try {
      const basePayload = {
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        phone,
        role: accountType,
      };

      let { response, data } = await registerRequest({ ...basePayload, username });

      // A 409 here could be a duplicate email or a duplicate username —
      // retry once with a random suffix in case it was just the username,
      // so a Thai-name collision (e.g. two "somchai"s) doesn't make the
      // user re-type the whole form for something they can't control.
      if (response.status === 409) {
        ({ response, data } = await registerRequest({ ...basePayload, username: `${username}${randomSuffix()}` }));
      }

      if (!response.ok) {
        throw new Error(translateErrorMessage(getErrorMessage(data?.detail, "สมัครสมาชิกไม่สำเร็จ"), response.status));
      }

      // Register straight into a session instead of bouncing the user to
      // /login to re-enter the password they just typed.
      const loginResponse = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const loginData = await loginResponse.json().catch(() => ({}));
      if (!loginResponse.ok) {
        // Registered fine but auto-login failed for some reason — don't
        // strand the user, just send them to log in manually instead.
        router.push("/login");
        return;
      }

      setTokens(loginData.access_token, loginData.refresh_token);
      router.push("/dashboard/elders");
    } catch (err) {
      setError(err instanceof Error ? err.message : "สมัครสมาชิกไม่สำเร็จ");
    } finally {
      setIsSubmitting(false);
    }
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

            <label className="flex items-start gap-2.5 text-sm text-ink-soft">
              <input
                type="checkbox"
                checked={agreedToPrivacy}
                onChange={(e) => setAgreedToPrivacy(e.target.checked)}
                required
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-surface-line accent-brand-blue"
              />
              <span>
                ฉันยินยอมให้เก็บและใช้ข้อมูลตาม{" "}
                <Link href="/privacy" target="_blank" className="font-semibold text-brand-blue hover:underline">
                  นโยบายความเป็นส่วนตัว
                </Link>{" "}
                ของ Eldercare Tech
              </span>
            </label>

            {error ? (
              <p className="rounded-lg border border-status-red/30 bg-status-red-bg px-3 py-2 text-sm text-status-red">
                {error}
              </p>
            ) : null}

            <button type="submit" className="btn-primary mt-1 w-full" disabled={isSubmitting || !agreedToPrivacy}>
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
