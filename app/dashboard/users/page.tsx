"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, UserCircle2, Edit2, UserX, X, Save } from "lucide-react";
import { apiFetch as fetchWithToken } from "@/lib/api";
import Modal from "@/components/Modal";

export default function UsersPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<any>({ role: "family", is_active: true });
  const [saving, setSaving] = useState(false);
  const [deactivatingId, setDeactivatingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([fetchWithToken("/api/users?size=20"), fetchWithToken("/api/auth/me")])
      .then(([data, me]) => {
        setItems(data.items ?? []);
        setCurrentUserId(me.id);
      })
      .catch((error: any) => {
        if (error?.status === 401 || error?.status === 403) {
          setAccessDenied(true);
          return;
        }
        router.replace("/login");
      })
      .finally(() => setLoading(false));
  }, [router]);

  function openEdit(user: any) {
    setEditingId(user.id);
    setForm({ role: user.role, is_active: user.is_active });
    setError("");
  }

  function closeModal() {
    setEditingId(null);
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    setSaving(true);
    setError("");

    try {
      const updated = await fetchWithToken(`/api/users/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setItems((current) => current.map((it) => (it.id === editingId ? updated : it)));
      closeModal();
    } catch (err: any) {
      setError(err?.message ?? "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(id: number) {
    if (!window.confirm("ยืนยันปิดใช้งานบัญชีนี้? ผู้ใช้จะไม่สามารถเข้าสู่ระบบได้อีก")) return;
    setDeactivatingId(id);
    try {
      const updated = await fetchWithToken(`/api/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: false }),
      });
      setItems((current) => current.map((it) => (it.id === id ? updated : it)));
    } catch (err: any) {
      window.alert(err?.message ?? "ดำเนินการไม่สำเร็จ");
    } finally {
      setDeactivatingId(null);
    }
  }

  if (loading) {
    return <div className="text-ink-muted">กำลังโหลดข้อมูลผู้ใช้งาน...</div>;
  }

  if (accessDenied) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
        <div className="flex items-center gap-2 font-semibold">
          <ShieldCheck size={18} />
          คุณไม่มีสิทธิ์เข้าถึงหน้า user management
        </div>
        <p className="mt-2 text-sm">เฉพาะ admin เท่านั้นที่สามารถดูข้อมูลผู้ใช้งานได้</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-ink">Users / ผู้ใช้งาน</h2>

      {editingId ? (
        <Modal title="แก้ไขผู้ใช้งาน" onClose={closeModal}>
          <form onSubmit={handleSubmit} className="space-y-4" data-test="user-form">
            <label className="space-y-1 text-sm text-ink-soft">
              <span>บทบาท (role)</span>
              <select data-test="user-input-role" value={form.role} onChange={(e) => setForm((c: any) => ({ ...c, role: e.target.value }))} className="input-field">
                <option value="family">family</option>
                <option value="caregiver">caregiver</option>
                <option value="nurse">nurse</option>
                <option value="partner">partner</option>
                <option value="admin">admin</option>
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm text-ink-soft">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((c: any) => ({ ...c, is_active: e.target.checked }))} className="h-4 w-4 rounded border-surface-line accent-brand-blue" />
              <span>เปิดใช้งานบัญชี</span>
            </label>

            {error ? <p className="rounded-lg border border-status-red/30 bg-status-red-bg px-3 py-2 text-sm text-status-red">{error}</p> : null}

            <div className="flex justify-end gap-3">
              <button type="button" onClick={closeModal} className="btn-secondary flex items-center gap-2"><X size={16} /> ยกเลิก</button>
              <button data-test="user-submit-btn" type="submit" disabled={saving} className="btn-primary flex items-center gap-2">{saving ? "กำลังบันทึก..." : <><Save size={16} /> บันทึก</>}</button>
            </div>
          </form>
        </Modal>
      ) : null}

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-surface-line bg-surface p-6 text-ink-muted">
          ยังไม่มีข้อมูลผู้ใช้งาน
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((user) => (
            <div key={user.id} className="rounded-2xl border border-surface-line bg-surface p-5 shadow-card">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-blue-light text-brand-blue">
                    <UserCircle2 size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-ink">
                      {user.first_name || user.username} {user.last_name || ""}
                    </h3>
                    <p className="text-sm text-ink-muted">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${user.is_active ? "bg-brand-green-light text-status-green" : "bg-status-red-bg text-status-red"}`}>
                    {user.is_active ? user.role : `${user.role} (ปิดใช้งาน)`}
                  </span>
                  <button type="button" data-test={"user-edit-" + user.id} onClick={() => openEdit(user)} className="rounded-full p-2 hover:bg-surface-soft" aria-label="แก้ไข">
                    <Edit2 size={16} />
                  </button>
                  {user.id !== currentUserId && user.is_active ? (
                    <button
                      type="button"
                      data-test={"user-deactivate-" + user.id}
                      onClick={() => handleDeactivate(user.id)}
                      disabled={deactivatingId === user.id}
                      className="rounded-full p-2 text-status-red hover:bg-status-red-bg disabled:opacity-50"
                      aria-label="ปิดใช้งานบัญชี"
                    >
                      <UserX size={16} />
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
