"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, MapPin, Phone, Edit2, X, Save } from "lucide-react";
import { apiFetch as fetchWithToken } from "@/lib/api";

export default function EldersPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<any>({
    first_name: "",
    last_name: "",
    date_of_birth: "",
    phone: "",
    address: "",
    gender: "female",
    relationship_type: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadElders() {
    try {
      const data = await fetchWithToken("/api/elders");
      setItems(data.items ?? []);
    } catch {
      router.replace("/login");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadElders();
  }, [router]);

  function startEdit(elder: any) {
    setEditingId(elder.id);
    setForm({
      first_name: elder.first_name || "",
      last_name: elder.last_name || "",
      date_of_birth: elder.date_of_birth ? elder.date_of_birth.split("T")[0] : "",
      phone: elder.phone || "",
      address: elder.address || "",
      gender: elder.gender || "female",
      relationship_type: elder.relationship_type || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm({
      first_name: "",
      last_name: "",
      date_of_birth: "",
      phone: "",
      address: "",
      gender: "female",
      relationship_type: "",
    });
    setError("");
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    setSaving(true);
    setError("");

    try {
      const updated = await fetchWithToken(`/api/elders/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      setItems((current) => current.map((it) => (it.id === editingId ? updated : it)));
      cancelEdit();
    } catch (err: any) {
      setError(err?.message ?? "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="text-ink-muted">กำลังโหลดข้อมูลผู้สูงอายุ...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-ink">ผู้สูงอายุ</h2>
      </div>

      {editingId ? (
        <form onSubmit={saveEdit} className="rounded-2xl border border-surface-line bg-white p-5 shadow-card" data-test="elder-edit-form">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1 text-sm text-ink-soft">
              <span>ชื่อ</span>
              <input data-test="elder-input-first-name" value={form.first_name} onChange={(e) => setForm((c: any) => ({ ...c, first_name: e.target.value }))} className="input-shell h-11 w-full border px-3" required />
            </label>
            <label className="space-y-1 text-sm text-ink-soft">
              <span>นามสกุล</span>
              <input data-test="elder-input-last-name" value={form.last_name} onChange={(e) => setForm((c: any) => ({ ...c, last_name: e.target.value }))} className="input-shell h-11 w-full border px-3" required />
            </label>
            <label className="space-y-1 text-sm text-ink-soft">
              <span>วันเกิด</span>
              <input data-test="elder-input-dob" type="date" value={form.date_of_birth} onChange={(e) => setForm((c: any) => ({ ...c, date_of_birth: e.target.value }))} className="input-shell h-11 w-full border px-3" />
            </label>
            <label className="space-y-1 text-sm text-ink-soft">
              <span>เพศ</span>
              <select data-test="elder-input-gender" value={form.gender} onChange={(e) => setForm((c: any) => ({ ...c, gender: e.target.value }))} className="input-shell h-11 w-full border px-3">
                <option value="female">หญิง</option>
                <option value="male">ชาย</option>
                <option value="other">อื่น ๆ</option>
              </select>
            </label>
            <label className="space-y-1 text-sm text-ink-soft md:col-span-2">
              <span>ที่อยู่</span>
              <input data-test="elder-input-address" value={form.address} onChange={(e) => setForm((c: any) => ({ ...c, address: e.target.value }))} className="input-shell h-11 w-full border px-3" />
            </label>
            <label className="space-y-1 text-sm text-ink-soft">
              <span>เบอร์โทร</span>
              <input data-test="elder-input-phone" value={form.phone} onChange={(e) => setForm((c: any) => ({ ...c, phone: e.target.value }))} className="input-shell h-11 w-full border px-3" />
            </label>
            <label className="space-y-1 text-sm text-ink-soft md:col-span-2">
              <span>ความสัมพันธ์</span>
              <input data-test="elder-input-relationship" value={form.relationship_type} onChange={(e) => setForm((c: any) => ({ ...c, relationship_type: e.target.value }))} className="input-shell h-11 w-full border px-3" />
            </label>
          </div>

          {error ? <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

          <div className="mt-5 flex justify-end gap-3">
            <button type="button" data-test="elder-cancel-btn" onClick={cancelEdit} className="btn-secondary flex items-center gap-2"><X size={16} /> ยกเลิก</button>
            <button data-test="elder-submit-btn" type="submit" disabled={saving} className="btn-primary flex items-center gap-2">{saving ? 'กำลังบันทึก...' : <><Save size={16} /> บันทึก</>}</button>
          </div>
        </form>
      ) : null}

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-surface-line bg-white p-6 text-ink-muted">
          ยังไม่มีข้อมูลผู้สูงอายุ
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((elder) => (
            <div key={elder.id} className="rounded-2xl border border-surface-line bg-white p-5 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-blue">ผู้สูงอายุ</p>
                  <h3 className="mt-2 text-xl font-bold text-ink">{elder.first_name} {elder.last_name}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" data-test={"elder-edit-" + elder.id} onClick={() => startEdit(elder)} className="rounded-full p-2 hover:bg-surface-soft" aria-label="แก้ไข">
                    <Edit2 size={16} />
                  </button>
                </div>
              </div>

              <div className="mt-4 space-y-2 text-sm text-ink-soft">
                <div className="flex items-center gap-2">
                  <CalendarDays size={16} className="text-brand-blue" />
                  {elder.date_of_birth ? new Date(elder.date_of_birth).toLocaleDateString("th-TH") : "ไม่ระบุวันเกิด"}
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={16} className="text-brand-blue" />
                  {elder.phone ?? "ไม่ระบุเบอร์"}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-brand-blue" />
                  {elder.address ?? "ไม่ระบุที่อยู่"}
                </div>
              </div>

              {elder.relationship_type ? (
                <div className="mt-4 inline-flex rounded-full bg-brand-blue-light px-2.5 py-1 text-xs font-medium text-brand-blue">{elder.relationship_type}</div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
