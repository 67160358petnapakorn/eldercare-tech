"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, ShieldCheck, UserRound } from "lucide-react";
import { apiFetch } from "@/lib/api";

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await apiFetch("/api/auth/me");
        setProfile(data);
      } catch {
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);

    if (form.newPassword.length < 6) {
      setStatus({ type: "error", message: "รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร" });
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setStatus({ type: "error", message: "ยืนยันรหัสผ่านไม่ตรงกัน" });
      return;
    }

    try {
      setSubmitting(true);
      await apiFetch("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({
          current_password: form.currentPassword,
          new_password: form.newPassword,
        }),
      });

      setStatus({ type: "success", message: "เปลี่ยนรหัสผ่านสำเร็จ" });
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "เปลี่ยนรหัสผ่านไม่สำเร็จ",
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="text-ink-muted">กำลังโหลดข้อมูลผู้ใช้งาน...</div>;
  }

  const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || profile?.username || "ผู้ใช้งาน";
  const roleLabel = profile?.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : "Family";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-ink">ตั้งค่า</h2>
        <p className="mt-1 text-sm text-ink-soft">จัดการข้อมูลผู้ใช้งานและความปลอดภัยของบัญชี</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1.5fr]">
        <div className="rounded-2xl border border-surface-line bg-surface p-5 shadow-card">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-blue-light text-brand-blue">
              <UserRound size={22} />
            </div>
            <div>
              <p className="text-lg font-semibold text-ink">{fullName}</p>
              <p className="text-sm text-ink-soft">{profile?.email}</p>
            </div>
          </div>

          <div className="mt-6 space-y-3 text-sm text-ink-soft">
            <div className="flex items-center justify-between rounded-xl bg-surface-soft px-3 py-2">
              <span>บทบาท</span>
              <span className="font-semibold text-ink">{roleLabel}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-surface-soft px-3 py-2">
              <span>สถานะบัญชี</span>
              <span className="font-semibold text-status-green">พร้อมใช้งาน</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-surface-soft px-3 py-2">
              <span>เบอร์โทร</span>
              <span className="font-semibold text-ink">{profile?.phone || "-"}</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-surface-line bg-surface p-5 shadow-card">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-brand-blue" size={18} />
            <h3 className="text-lg font-semibold text-ink">เปลี่ยนรหัสผ่าน</h3>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label htmlFor="currentPassword" className="mb-1.5 block text-sm font-medium text-ink">
                รหัสผ่านปัจจุบัน
              </label>
              <input
                id="currentPassword"
                type="password"
                value={form.currentPassword}
                onChange={(e) => setForm((current) => ({ ...current, currentPassword: e.target.value }))}
                className="input-field"
                placeholder="กรอกรหัสผ่านปัจจุบัน"
              />
            </div>

            <div>
              <label htmlFor="newPassword" className="mb-1.5 block text-sm font-medium text-ink">
                รหัสผ่านใหม่
              </label>
              <input
                id="newPassword"
                type="password"
                value={form.newPassword}
                onChange={(e) => setForm((current) => ({ ...current, newPassword: e.target.value }))}
                className="input-field"
                placeholder="อย่างน้อย 6 ตัวอักษร"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-ink">
                ยืนยันรหัสผ่านใหม่
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setForm((current) => ({ ...current, confirmPassword: e.target.value }))}
                className="input-field"
                placeholder="พิมพ์รหัสผ่านอีกครั้ง"
              />
            </div>

            {status ? (
              <div
                className={`rounded-lg border px-3 py-2 text-sm ${
                  status.type === "success"
                    ? "border-status-green/30 bg-status-green-bg text-status-green"
                    : "border-status-red/30 bg-status-red-bg text-status-red"
                }`}
              >
                {status.message}
              </div>
            ) : null}

            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting ? "กำลังอัปเดต..." : "บันทึกรหัสผ่าน"}
            </button>
          </form>
        </div>
      </div>

      <div className="rounded-2xl border border-surface-line bg-surface p-5 shadow-card">
        <div className="flex items-center gap-2">
          <LockKeyhole className="text-brand-blue" size={18} />
          <h3 className="text-lg font-semibold text-ink">ความปลอดภัย</h3>
        </div>
        <p className="mt-3 text-sm leading-6 text-ink-soft">
          ระบบจะเก็บข้อมูลด้านรหัสผ่านแบบเข้ารหัส และการเปลี่ยนแปลงจะมีผลทันทีหลังจากยืนยันตัวตนเรียบร้อยแล้ว
        </p>
      </div>
    </div>
  );
}
