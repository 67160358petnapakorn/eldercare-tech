"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Leaf, Mail, Lock, Eye, EyeOff, Users, HeartHandshake, ShieldCheck } from "lucide-react";
import { setTokens } from "@/lib/api";

const demoAccounts = [
  {
    role: "Family",
    label: "ครอบครัว",
    email: "family@example.com",
    password: "123456",
    icon: Users,
    iconClass: "bg-brand-blue-light text-brand-blue",
  },
  {
    role: "Caregiver",
    label: "ผู้ดูแล",
    email: "caregiver@example.com",
    password: "123456",
    icon: HeartHandshake,
    iconClass: "bg-brand-green-light text-brand-green",
  },
  {
    role: "Admin",
    label: "ผู้ดูแลระบบ",
    email: "admin@example.com",
    password: "123456",
    icon: ShieldCheck,
    iconClass: "bg-status-amber-bg text-status-amber",
  },
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

      setTokens(data.access_token, data.refresh_token);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "เข้าสู่ระบบไม่สำเร็จ");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-surface-soft px-5 py-10">
      {/* Decorative aurora background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-24 -top-32 h-80 w-80 rounded-full bg-brand-blue/25 blur-3xl" />
        <div className="absolute -right-20 top-10 h-72 w-72 rounded-full bg-brand-green/20 blur-3xl" />
        <div className="absolute bottom-[-6rem] left-1/3 h-72 w-72 rounded-full bg-status-amber/10 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(246,251,255,0.4)_0%,rgba(246,248,249,0.92)_55%)]" />
      </div>

      <div className="relative w-full max-w-md">
        <Link
          href="/"
          className="mb-8 flex items-center justify-center gap-2.5 text-xl font-bold text-ink"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-brand-blue to-brand-green text-white shadow-[0_8px_20px_rgba(30,111,168,0.35)]">
            <Leaf size={22} aria-hidden="true" />
          </div>
          <span>
            Eldercare<span className="text-brand-blue">Tech</span>
          </span>
        </Link>

        <div className="card rounded-2xl border-white/60 bg-white/90 p-6 shadow-[0_20px_45px_-12px_rgba(30,111,168,0.25)] backdrop-blur-xl sm:p-8">
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

            <button
              type="submit"
              className="btn mt-1 w-full bg-gradient-to-r from-brand-blue to-brand-green text-white shadow-[0_10px_24px_-8px_rgba(30,111,168,0.55)] transition-transform hover:brightness-105 hover:shadow-[0_14px_28px_-8px_rgba(30,111,168,0.6)] active:scale-[0.99]"
              disabled={isSubmitting}
            >
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
        <div className="card mt-5 rounded-2xl border-white/60 bg-white/80 p-5 backdrop-blur-xl">
          <p className="text-sm font-semibold text-ink">
            บัญชีทดลองใช้ <span className="text-ink-muted font-normal">(คลิกเพื่อกรอกอัตโนมัติ)</span>
          </p>
          <div className="mt-3 flex flex-col gap-2.5">
            {demoAccounts.map((acc) => {
              const Icon = acc.icon;
              return (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => {
                    setEmail(acc.email);
                    setPassword(acc.password);
                  }}
                  className="group flex cursor-pointer items-center gap-3 rounded-xl border border-surface-line bg-white p-3 text-left text-sm transition-all hover:-translate-y-0.5 hover:border-brand-blue/40 hover:shadow-[0_8px_16px_-6px_rgba(30,111,168,0.25)]"
                >
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${acc.iconClass}`}>
                    <Icon size={17} aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <p className="font-semibold text-ink">{acc.label}</p>
                    <p className="truncate text-ink-muted">
                      {acc.email} • {acc.password}
                    </p>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
