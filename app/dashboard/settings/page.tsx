"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Download, LockKeyhole, ShieldCheck, Trash2, UserRound } from "lucide-react";
import { apiFetch, clearTokens } from "@/lib/api";
import Modal from "@/components/Modal";

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
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);

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

  async function handleExportData() {
    setExportError("");
    setExporting(true);
    try {
      const data = await apiFetch("/api/auth/me/export");
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `eldercare-tech-data-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "ดาวน์โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setExporting(false);
    }
  }

  async function handleDeleteAccount(e: React.FormEvent) {
    e.preventDefault();
    setDeleteError("");
    setDeleting(true);
    try {
      await apiFetch("/api/auth/me", {
        method: "DELETE",
        body: JSON.stringify({ password: deletePassword }),
      });
      clearTokens();
      router.replace("/");
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "ลบบัญชีไม่สำเร็จ");
    } finally {
      setDeleting(false);
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

      <div className="rounded-2xl border border-surface-line bg-surface p-5 shadow-card">
        <h3 className="text-lg font-semibold text-ink">ข้อมูลส่วนบุคคล (PDPA)</h3>
        <p className="mt-2 text-sm leading-6 text-ink-soft">
          อ่านรายละเอียดวิธีที่เราเก็บและใช้ข้อมูลของคุณได้ที่{" "}
          <Link href="/privacy" className="font-semibold text-brand-blue hover:underline">
            นโยบายความเป็นส่วนตัว
          </Link>
        </p>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            data-test="export-data-btn"
            onClick={handleExportData}
            disabled={exporting}
            className="btn-secondary flex items-center justify-center gap-2"
          >
            <Download size={16} /> {exporting ? "กำลังเตรียมไฟล์..." : "ดาวน์โหลดข้อมูลของฉัน"}
          </button>
          <button
            type="button"
            data-test="delete-account-btn"
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center justify-center gap-2 rounded-lg border border-status-red/30 px-4 py-2.5 text-sm font-semibold text-status-red hover:bg-status-red-bg"
          >
            <Trash2 size={16} /> ลบบัญชี
          </button>
        </div>
        {exportError ? <p className="mt-3 text-sm text-status-red">{exportError}</p> : null}
      </div>

      {showDeleteModal ? (
        <Modal title="ลบบัญชีถาวร" onClose={() => setShowDeleteModal(false)}>
          <form onSubmit={handleDeleteAccount} className="space-y-4" data-test="delete-account-form">
            <p className="rounded-lg border border-status-red/30 bg-status-red-bg px-3 py-2 text-sm text-status-red">
              การลบบัญชีจะลบข้อมูลผู้สูงอายุ ยา นัดหมาย และข้อมูลอื่นทั้งหมดที่ผูกกับบัญชีนี้
              อย่างถาวร ไม่สามารถกู้คืนได้
            </p>
            <label className="space-y-1 text-sm text-ink-soft">
              <span>กรอกรหัสผ่านเพื่อยืนยัน</span>
              <input
                data-test="delete-account-password"
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="input-field"
                required
              />
            </label>

            {deleteError ? <p className="rounded-lg border border-status-red/30 bg-status-red-bg px-3 py-2 text-sm text-status-red">{deleteError}</p> : null}

            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShowDeleteModal(false)} className="btn-secondary">
                ยกเลิก
              </button>
              <button
                data-test="delete-account-confirm-btn"
                type="submit"
                disabled={deleting}
                className="rounded-lg bg-status-red px-4 py-2.5 text-sm font-semibold text-white hover:brightness-95 disabled:opacity-50"
              >
                {deleting ? "กำลังลบบัญชี..." : "ลบบัญชีถาวร"}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  );
}
