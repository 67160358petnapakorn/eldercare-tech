"use client";

import { useState } from "react";
import Link from "next/link";
import { Leaf, CheckCircle2, Users, HeartHandshake, Stethoscope } from "lucide-react";

const accountTypes = [
  { key: "family", label: "ครอบครัว", icon: Users },
  { key: "caregiver", label: "ผู้ดูแล", icon: HeartHandshake },
  { key: "nurse", label: "พยาบาล", icon: Stethoscope },
] as const;

export default function RegisterPage() {
  const [accountType, setAccountType] = useState<(typeof accountTypes)[number]["key"]>("family");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Phase 1: Mock registration only — no database write.
    setSubmitted(true);
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
    <div className="flex min-h-screen items-center justify-center bg-surface-soft px-5 py-10">
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
                <input id="firstName" required placeholder="สมชาย" className="input-field" />
              </div>
              <div>
                <label htmlFor="lastName" className="mb-1.5 block text-sm font-medium text-ink">
                  นามสกุล
                </label>
                <input id="lastName" required placeholder="ใจดี" className="input-field" />
              </div>
            </div>

            <div>
              <label htmlFor="regEmail" className="mb-1.5 block text-sm font-medium text-ink">
                อีเมล
              </label>
              <input
                id="regEmail"
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

            <button type="submit" className="btn-primary mt-1 w-full">
              สมัครสมาชิก
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
