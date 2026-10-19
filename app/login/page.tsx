"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Leaf, Mail, Lock, Eye, EyeOff } from "lucide-react";

const demoAccounts = [
  { role: "Family", email: "family@example.com", password: "123456" },
  { role: "Caregiver", email: "caregiver@example.com", password: "123456" },
  { role: "Admin", email: "admin@example.com", password: "123456" },
];

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("eldercare_access_token")) {
      router.replace("/dashboard");
    }
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.detail ?? "เข้าสู่ระบบไม่สำเร็จ");
      }

      localStorage.setItem("eldercare_access_token", data.access_token);
      localStorage.setItem("eldercare_token_type", data.token_type ?? "bearer");
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "เข้าสู่ระบบไม่สำเร็จ");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(30,111,168,0.12),_transparent_42%),linear-gradient(180deg,#F6FBFF_0%,#F6F8F9_100%)] px-5 py-10">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-8 flex items-center justify-center gap-2 text-xl font-bold text-brand-blue"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-green-light text-brand-green shadow-sm">
            <Leaf size={20} aria-hidden="true" />
          </div>
          Eldercare Tech
        </Link>

        <div className="card border-brand-blue/10 bg-white/90 p-6 shadow-[0_12px_30px_rgba(30,111,168,0.12)] sm:p-8">
          <h1 className="text-2xl font-bold text-ink">ยินดีต้อนรับกลับมา</h1>
          <p className="mt-1.5 text-ink-soft">เข้าสู่ระบบเพื่อดูแลคนที่คุณรัก</p>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink">
                อีเมล
              </label>
              <div className="input-shell">
                <Mail size={18} className="input-icon" aria-hidden="true" />
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field border-0 bg-transparent pl-11 shadow-none focus:border-0 focus:ring-0"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-ink">
                รหัสผ่าน
              </label>
              <div className="input-shell pr-11">
                <Lock size={18} className="input-icon" aria-hidden="true" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field border-0 bg-transparent pl-11 pr-0 shadow-none focus:border-0 focus:ring-0"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 z-10 -translate-y-1/2 cursor-pointer text-ink-muted hover:text-ink-soft"
                  aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex cursor-pointer items-center gap-2 text-ink-soft">
                <input type="checkbox" className="h-4 w-4 rounded border-surface-line accent-brand-blue" />
                จดจำฉัน
              </label>
              <a href="#" className="font-medium text-brand-blue hover:underline">
                ลืมรหัสผ่าน?
              </a>
            </div>

            {error ? (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            ) : null}

            <button type="submit" className="btn-primary mt-1 w-full" disabled={isSubmitting}>
              {isSubmitting ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-soft">
            ยังไม่มีบัญชี?{" "}
            <Link href="/register" className="font-semibold text-brand-blue hover:underline">
              สมัครสมาชิก
            </Link>
          </p>
        </div>

        {/* Demo accounts */}
        <div className="card mt-5 border-brand-blue/10 bg-brand-blue-light/40 p-5">
          <p className="text-sm font-semibold text-brand-blue">Demo Accounts</p>
          <div className="mt-3 flex flex-col gap-3">
            {demoAccounts.map((acc) => (
              <button
                key={acc.role}
                type="button"
                onClick={() => {
                  setEmail(acc.email);
                  setPassword(acc.password);
                }}
                className="cursor-pointer rounded-xl border border-brand-blue/10 bg-white/80 p-3 text-left text-sm transition-all hover:border-brand-blue hover:bg-brand-blue-light"
              >
                <p className="font-semibold text-ink">{acc.role}</p>
                <p className="text-ink-muted">
                  {acc.email} • {acc.password}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
