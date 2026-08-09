"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Leaf, Mail, Lock, Eye, EyeOff } from "lucide-react";

const demoAccounts = [
  { role: "Family", email: "family@example.com", password: "123456" },
  { role: "Caregiver", email: "caregiver@example.com", password: "123456" },
  { role: "Admin", email: "admin@example.com", password: "123456" },
];

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Phase 1: Mock login only — no real authentication.
    router.push("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-soft px-5 py-10">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-8 flex items-center justify-center gap-2 text-xl font-bold text-brand-blue"
        >
          <Leaf size={24} className="text-brand-green" aria-hidden="true" />
          Eldercare Tech
        </Link>

        <div className="card p-6 sm:p-8">
          <h1 className="text-2xl font-bold text-ink">ยินดีต้อนรับกลับมา</h1>
          <p className="mt-1.5 text-ink-soft">เข้าสู่ระบบเพื่อดูแลคนที่คุณรัก</p>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink">
                อีเมล
              </label>
              <div className="relative">
                <Mail
                  size={18}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted"
                  aria-hidden="true"
                />
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-11"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-ink">
                รหัสผ่าน
              </label>
              <div className="relative">
                <Lock
                  size={18}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted"
                  aria-hidden="true"
                />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-11 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer text-ink-muted hover:text-ink-soft"
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

            <button type="submit" className="btn-primary mt-1 w-full">
              เข้าสู่ระบบ
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
        <div className="card mt-5 p-5">
          <p className="text-sm font-semibold text-ink">Demo Accounts</p>
          <div className="mt-3 flex flex-col gap-3">
            {demoAccounts.map((acc) => (
              <button
                key={acc.role}
                type="button"
                onClick={() => {
                  setEmail(acc.email);
                  setPassword(acc.password);
                }}
                className="cursor-pointer rounded-lg border border-surface-line p-3 text-left text-sm transition-colors hover:border-brand-blue hover:bg-brand-blue-light"
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
