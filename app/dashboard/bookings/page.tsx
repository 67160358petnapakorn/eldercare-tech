"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarCheck2, UserRound, ClipboardList, Clock3, Plus, Trash2, Loader2, Edit2, Save } from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

const emptyForm = {
  elder_id: 1,
  caregiver_id: 1,
  date: "",
  start_time: "09:00",
  end_time: "13:00",
  service_type: "elder_care",
  note: "",
  status: "pending",
};

async function fetchWithToken(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem("eldercare_access_token");
  if (!token) throw new Error("missing-token");

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.headers ?? {}),
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({}));
    throw Object.assign(new Error(errorPayload?.detail ?? "fetch-failed"), { status: response.status });
  }

  return response.json().catch(() => ({}));
}

export default function BookingsPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<any>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);

  async function loadBookings() {
    try {
      const data = await fetchWithToken("/api/bookings?size=50");
      setItems(data.items ?? []);
    } catch {
      router.replace("/login");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBookings();
  }, [router]);

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function startEdit(item: any) {
    setEditingId(item.id);
    setForm({
      elder_id: item.elder_id,
      caregiver_id: item.caregiver_id,
      date: item.date || "",
      start_time: item.start_time || "09:00",
      end_time: item.end_time || "13:00",
      service_type: item.service_type || "elder_care",
      note: item.note || "",
      status: item.status || "pending",
    });
    setShowForm(true);
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelForm() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(false);
    setError("");
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      if (editingId) {
        const updated = await fetchWithToken(`/api/bookings/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...form,
            elder_id: Number(form.elder_id),
            caregiver_id: Number(form.caregiver_id),
          }),
        });
        setItems((current) => current.map((it) => (it.id === editingId ? updated : it)));
      } else {
        const created = await fetchWithToken("/api/bookings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...form,
            elder_id: Number(form.elder_id),
            caregiver_id: Number(form.caregiver_id),
          }),
        });
        setItems((current) => [created, ...current]);
      }

      cancelForm();
    } catch (err: any) {
      setError(err?.message ?? "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      await fetchWithToken(`/api/bookings/${id}`, { method: "DELETE" });
      setItems((current) => current.filter((item) => item.id !== id));
    } catch {
      router.replace("/login");
    }
  }

  if (loading) {
    return <div className="text-ink-muted">กำลังโหลดข้อมูลการจอง...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-ink">การจอง</h2>
        <button type="button" onClick={startCreate} className="btn-primary flex items-center gap-2" data-test="booking-create-btn">
          <Plus size={16} />
          เพิ่มการจอง
        </button>
      </div>

      {showForm ? (
        <form onSubmit={handleSubmit} className="rounded-2xl border border-surface-line bg-white p-5 shadow-card" data-test="booking-form">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1 text-sm text-ink-soft">
              <span>Elder ID</span>
              <input data-test="booking-input-elder-id" type="number" value={form.elder_id} onChange={(e) => setForm((c: any) => ({ ...c, elder_id: Number(e.target.value) }))} className="input-shell h-11 w-full border px-3" required />
            </label>
            <label className="space-y-1 text-sm text-ink-soft">
              <span>Caregiver ID</span>
              <input data-test="booking-input-caregiver-id" type="number" value={form.caregiver_id} onChange={(e) => setForm((c: any) => ({ ...c, caregiver_id: Number(e.target.value) }))} className="input-shell h-11 w-full border px-3" required />
            </label>
            <label className="space-y-1 text-sm text-ink-soft">
              <span>วันที่</span>
              <input data-test="booking-input-date" type="date" value={form.date} onChange={(e) => setForm((c: any) => ({ ...c, date: e.target.value }))} className="input-shell h-11 w-full border px-3" required />
            </label>
            <label className="space-y-1 text-sm text-ink-soft">
              <span>สถานะ</span>
              <select data-test="booking-input-status" value={form.status} onChange={(e) => setForm((c: any) => ({ ...c, status: e.target.value }))} className="input-shell h-11 w-full border px-3" required>
                <option value="pending">pending</option>
                <option value="confirmed">confirmed</option>
                <option value="completed">completed</option>
                <option value="cancelled">cancelled</option>
                <option value="rejected">rejected</option>
              </select>
            </label>
            <label className="space-y-1 text-sm text-ink-soft">
              <span>เวลาเริ่ม</span>
              <input data-test="booking-input-start-time" type="time" value={form.start_time} onChange={(e) => setForm((c: any) => ({ ...c, start_time: e.target.value }))} className="input-shell h-11 w-full border px-3" required />
            </label>
            <label className="space-y-1 text-sm text-ink-soft">
              <span>เวลาจบ</span>
              <input data-test="booking-input-end-time" type="time" value={form.end_time} onChange={(e) => setForm((c: any) => ({ ...c, end_time: e.target.value }))} className="input-shell h-11 w-full border px-3" required />
            </label>
            <label className="space-y-1 text-sm text-ink-soft md:col-span-2">
              <span>ประเภทการดูแล</span>
              <input data-test="booking-input-service-type" value={form.service_type} onChange={(e) => setForm((c: any) => ({ ...c, service_type: e.target.value }))} className="input-shell h-11 w-full border px-3" required />
            </label>
            <label className="space-y-1 text-sm text-ink-soft md:col-span-2">
              <span>หมายเหตุ</span>
              <textarea data-test="booking-input-note" rows={3} value={form.note} onChange={(e) => setForm((c: any) => ({ ...c, note: e.target.value }))} className="input-shell w-full border px-3 py-2" />
            </label>
          </div>

          {error ? <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

          <div className="mt-5 flex justify-end gap-3">
            <button type="button" data-test="booking-cancel-btn" onClick={cancelForm} className="btn-secondary">ยกเลิก</button>
            <button data-test="booking-submit-btn" type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
              {saving ? <Loader2 size={16} className="animate-spin" /> : editingId ? <Save size={16} /> : <Plus size={16} />}
              {saving ? "กำลังบันทึก..." : editingId ? "บันทึกการแก้ไข" : "บันทึก"}
            </button>
          </div>
        </form>
      ) : null}

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-surface-line bg-white p-6 text-ink-muted">
          ยังไม่มีข้อมูลการจอง
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((booking) => (
            <div key={booking.id} className="rounded-2xl border border-surface-line bg-white p-5 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-brand-blue">
                    <ClipboardList size={18} />
                    <span className="font-semibold">{booking.service_type}</span>
                  </div>
                  <p className="mt-2 text-sm text-ink-soft">{booking.note ?? "-"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-brand-blue-light px-2.5 py-1 text-xs font-medium text-brand-blue">{booking.status}</span>
                  <button type="button" data-test={"booking-edit-" + booking.id} onClick={() => startEdit(booking)} className="rounded-full p-2 hover:bg-surface-soft" aria-label="แก้ไข">
                    <Edit2 size={16} />
                  </button>
                  <button type="button" data-test={"booking-delete-" + booking.id} onClick={() => handleDelete(booking.id)} className="rounded-full p-2 text-status-red hover:bg-red-50" aria-label="ลบการจอง">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div>
                  <p className="text-xs text-ink-muted">วันที่</p>
                  <p className="mt-1 flex items-center gap-2 text-sm font-medium text-ink"><CalendarCheck2 size={14} />{booking.date}</p>
                </div>
                <div>
                  <p className="text-xs text-ink-muted">เวลา</p>
                  <p className="mt-1 flex items-center gap-2 text-sm font-medium text-ink"><Clock3 size={14} />{booking.start_time} - {booking.end_time}</p>
                </div>
                <div>
                  <p className="text-xs text-ink-muted">ผู้ดูแล</p>
                  <p className="mt-1 flex items-center gap-2 text-sm font-medium text-ink"><UserRound size={14} />{booking.caregiver_id ?? "-"}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
