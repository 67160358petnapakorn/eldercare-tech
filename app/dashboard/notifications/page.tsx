"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BellRing, Dot, Plus, Trash2, X, Save } from "lucide-react";
import { apiFetch } from "@/lib/api";
import Modal from "@/components/Modal";

export default function NotificationsPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", message: "" });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  async function loadNotifications() {
    try {
      const [data, me] = await Promise.all([
        apiFetch("/api/notifications?size=20"),
        apiFetch("/api/auth/me"),
      ]);
      setItems(data.items ?? []);
      setCurrentUserId(me.id);
    } catch {
      router.replace("/login");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) {
      setError("กรุณากรอกหัวข้อและข้อความ");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const created = await apiFetch("/api/notifications", {
        method: "POST",
        body: JSON.stringify({ user_id: currentUserId, type: "reminder", title: form.title, message: form.message }),
      });
      setItems((current) => [created, ...current]);
      setShowForm(false);
      setForm({ title: "", message: "" });
    } catch (err: any) {
      setError(err?.message ?? "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm("ยืนยันลบการแจ้งเตือนนี้?")) return;
    setDeletingId(id);
    try {
      await apiFetch(`/api/notifications/${id}`, { method: "DELETE" });
      setItems((current) => current.filter((item) => item.id !== id));
    } catch (err: any) {
      window.alert(err?.message ?? "ลบไม่สำเร็จ");
    } finally {
      setDeletingId(null);
    }
  }

  async function markAsRead(id: number) {
    try {
      await apiFetch(`/api/notifications/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ is_read: true }),
      });
      setItems((current) => current.map((item) => (item.id === id ? { ...item, is_read: true } : item)));
    } catch {
      // leave the item as unread in the UI if the update failed
    }
  }

  async function markAllAsRead() {
    const unreadIds = items.filter((item) => !item.is_read).map((item) => item.id);

    await Promise.all(unreadIds.map((id) => markAsRead(id)));
  }

  useEffect(() => {
    loadNotifications();
  }, [router]);

  if (loading) {
    return <div className="text-ink-muted">กำลังโหลดการแจ้งเตือน...</div>;
  }

  const unreadCount = items.filter((item) => !item.is_read).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-ink">การแจ้งเตือน</h2>
        <div className="flex items-center gap-2">
          {unreadCount > 0 ? (
            <button type="button" onClick={markAllAsRead} className="btn-secondary text-sm">
              อ่านทั้งหมด ({unreadCount})
            </button>
          ) : null}
          <button type="button" data-test="notification-create-btn" onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> เพิ่มการแจ้งเตือน
          </button>
        </div>
      </div>

      {showForm ? (
        <Modal title="เพิ่มการแจ้งเตือน" onClose={() => setShowForm(false)}>
          <form onSubmit={handleCreate} className="space-y-4" data-test="notification-form">
            <label className="space-y-1 text-sm text-ink-soft">
              <span>หัวข้อ *</span>
              <input data-test="notification-input-title" value={form.title} onChange={(e) => setForm((c) => ({ ...c, title: e.target.value }))} className="input-field" required />
            </label>
            <label className="space-y-1 text-sm text-ink-soft">
              <span>ข้อความ *</span>
              <textarea rows={3} value={form.message} onChange={(e) => setForm((c) => ({ ...c, message: e.target.value }))} className="input-field" required />
            </label>

            {error ? <p className="rounded-lg border border-status-red/30 bg-status-red-bg px-3 py-2 text-sm text-status-red">{error}</p> : null}

            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex items-center gap-2"><X size={16} /> ยกเลิก</button>
              <button data-test="notification-submit-btn" type="submit" disabled={saving} className="btn-primary flex items-center gap-2">{saving ? "กำลังบันทึก..." : <><Save size={16} /> บันทึก</>}</button>
            </div>
          </form>
        </Modal>
      ) : null}

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-surface-line bg-surface p-10 text-center">
          <p className="text-ink-muted">ยังไม่มีการแจ้งเตือน</p>
          <button type="button" onClick={() => setShowForm(true)} className="btn-primary mt-4 inline-flex items-center gap-2">
            <Plus size={16} /> เพิ่มการแจ้งเตือนแรก
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-2xl border border-surface-line bg-surface p-5 shadow-card">
              <div className="flex items-start gap-3">
                <div className="mt-1 rounded-full bg-brand-blue-light p-2 text-brand-blue">
                  <BellRing size={16} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-ink">{item.title}</h3>
                    <div className="flex items-center gap-2">
                      {!item.is_read ? <Dot className="text-status-red" size={18} /> : null}
                      <button
                        type="button"
                        data-test={"notification-delete-" + item.id}
                        onClick={() => handleDelete(item.id)}
                        disabled={deletingId === item.id}
                        className="rounded-full p-1.5 text-status-red hover:bg-status-red-bg disabled:opacity-50"
                        aria-label="ลบการแจ้งเตือน"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-ink-soft">{item.message}</p>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <p className="text-xs text-ink-muted">{item.type ?? "notification"}</p>
                    {!item.is_read ? (
                      <button
                        type="button"
                        onClick={() => markAsRead(item.id)}
                        className="text-sm font-medium text-brand-blue hover:underline"
                      >
                        ทำเครื่องหมายว่าอ่านแล้ว
                      </button>
                    ) : (
                      <span className="text-xs font-medium text-status-green">อ่านแล้ว</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
