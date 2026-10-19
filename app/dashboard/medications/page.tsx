"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Pill, Clock3, Plus, Trash2, Loader2, Edit2, Save } from "lucide-react";
import { apiFetch as fetchWithToken } from "@/lib/api";

const emptyForm = {
  elder_id: 1,
  name: "",
  dosage: "",
  quantity: 30,
  time: "08:00",
  frequency: "daily",
  meal_instruction: "",
  start_date: "",
  end_date: "",
  note: "",
};

export default function MedicationsPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<any>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);

  async function loadMedications() {
    try {
      const data = await fetchWithToken("/api/medications?size=50");
      setItems(data.items ?? []);
    } catch {
      router.replace("/login");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMedications();
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
      name: item.name || "",
      dosage: item.dosage || "",
      quantity: item.quantity || 1,
      time: item.time || "08:00",
      frequency: item.frequency || "daily",
      meal_instruction: item.meal_instruction || "",
      start_date: item.start_date || "",
      end_date: item.end_date || "",
      note: item.note || "",
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
        const updated = await fetchWithToken(`/api/medications/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, elder_id: Number(form.elder_id), quantity: Number(form.quantity) }),
        });
        setItems((current) => current.map((it) => (it.id === editingId ? updated : it)));
      } else {
        const created = await fetchWithToken("/api/medications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, elder_id: Number(form.elder_id), quantity: Number(form.quantity) }),
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
      await fetchWithToken(`/api/medications/${id}`, { method: "DELETE" });
      setItems((current) => current.filter((item) => item.id !== id));
    } catch {
      router.replace("/login");
    }
  }

  if (loading) {
    return <div className="text-ink-muted">กำลังโหลดข้อมูลยา...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-ink">ยา</h2>
        <button type="button" onClick={startCreate} className="btn-primary flex items-center gap-2" data-test="medication-create-btn">
          <Plus size={16} />
          เพิ่มยา
        </button>
      </div>

      {showForm ? (
        <form onSubmit={handleSubmit} className="rounded-2xl border border-surface-line bg-white p-5 shadow-card" data-test="medication-form">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1 text-sm text-ink-soft">
              <span>Elder ID</span>
              <input data-test="medication-input-elder-id" type="number" value={form.elder_id} onChange={(e) => setForm((c: any) => ({ ...c, elder_id: Number(e.target.value) }))} className="input-shell h-11 w-full border px-3" required />
            </label>
            <label className="space-y-1 text-sm text-ink-soft">
              <span>ชื่อยา</span>
              <input data-test="medication-input-name" value={form.name} onChange={(e) => setForm((c: any) => ({ ...c, name: e.target.value }))} className="input-shell h-11 w-full border px-3" required />
            </label>
            <label className="space-y-1 text-sm text-ink-soft">
              <span>ขนาด/วิธีใช้</span>
              <input data-test="medication-input-dosage" value={form.dosage} onChange={(e) => setForm((c: any) => ({ ...c, dosage: e.target.value }))} className="input-shell h-11 w-full border px-3" required />
            </label>
            <label className="space-y-1 text-sm text-ink-soft">
              <span>จำนวน</span>
              <input data-test="medication-input-quantity" type="number" value={form.quantity} onChange={(e) => setForm((c: any) => ({ ...c, quantity: Number(e.target.value) }))} className="input-shell h-11 w-full border px-3" required />
            </label>
            <label className="space-y-1 text-sm text-ink-soft">
              <span>เวลา</span>
              <input data-test="medication-input-time" type="time" value={form.time} onChange={(e) => setForm((c: any) => ({ ...c, time: e.target.value }))} className="input-shell h-11 w-full border px-3" required />
            </label>
            <label className="space-y-1 text-sm text-ink-soft">
              <span>ความถี่</span>
              <input value={form.frequency} onChange={(e) => setForm((c: any) => ({ ...c, frequency: e.target.value }))} className="input-shell h-11 w-full border px-3" required />
            </label>
            <label className="space-y-1 text-sm text-ink-soft">
              <span>เริ่มวันที่</span>
              <input data-test="medication-input-start-date" type="date" value={form.start_date} onChange={(e) => setForm((c: any) => ({ ...c, start_date: e.target.value }))} className="input-shell h-11 w-full border px-3" required />
            </label>
            <label className="space-y-1 text-sm text-ink-soft">
              <span>สิ้นสุดวันที่</span>
              <input data-test="medication-input-end-date" type="date" value={form.end_date} onChange={(e) => setForm((c: any) => ({ ...c, end_date: e.target.value }))} className="input-shell h-11 w-full border px-3" required />
            </label>
            <label className="space-y-1 text-sm text-ink-soft md:col-span-2">
              <span>คำแนะนำก่อน/หลังอาหาร</span>
              <input value={form.meal_instruction} onChange={(e) => setForm((c: any) => ({ ...c, meal_instruction: e.target.value }))} className="input-shell h-11 w-full border px-3" />
            </label>
            <label className="space-y-1 text-sm text-ink-soft md:col-span-2">
              <span>หมายเหตุ</span>
              <textarea rows={3} value={form.note} onChange={(e) => setForm((c: any) => ({ ...c, note: e.target.value }))} className="input-shell w-full border px-3 py-2" />
            </label>
          </div>

          {error ? <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

          <div className="mt-5 flex justify-end gap-3">
            <button data-test="medication-cancel-btn" type="button" onClick={cancelForm} className="btn-secondary">ยกเลิก</button>
            <button data-test="medication-submit-btn" type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
              {saving ? <Loader2 size={16} className="animate-spin" /> : editingId ? <Save size={16} /> : <Plus size={16} />}
              {saving ? "กำลังบันทึก..." : editingId ? "บันทึกการแก้ไข" : "บันทึก"}
            </button>
          </div>
        </form>
      ) : null}

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-surface-line bg-white p-6 text-ink-muted">
          ยังไม่มีข้อมูลยา
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((med) => (
            <div key={med.id} className="rounded-2xl border border-surface-line bg-white p-5 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-brand-blue">
                    <Pill size={18} />
                    <span className="font-semibold">{med.name}</span>
                  </div>
                  <p className="mt-2 text-sm text-ink-soft">{med.dosage}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex rounded-full bg-brand-green-light px-2.5 py-1 text-xs font-medium text-status-green">{med.frequency}</span>
                  <button type="button" data-test={"medication-edit-" + med.id} onClick={() => startEdit(med)} className="rounded-full p-2 hover:bg-surface-soft" aria-label="แก้ไข">
                    <Edit2 size={16} />
                  </button>
                  <button type="button" data-test={"medication-delete-" + med.id} onClick={() => handleDelete(med.id)} className="rounded-full p-2 text-status-red hover:bg-red-50" aria-label="ลยาข้อมูล">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div>
                  <p className="text-xs text-ink-muted">เวลา</p>
                  <p className="mt-1 flex items-center gap-2 text-sm font-medium text-ink"><Clock3 size={14} />{med.time}</p>
                </div>
                <div>
                  <p className="text-xs text-ink-muted">ปริมาณ</p>
                  <p className="mt-1 text-sm font-medium text-ink">{med.quantity}</p>
                </div>
                <div>
                  <p className="text-xs text-ink-muted">หมายเหตุ</p>
                  <p className="mt-1 text-sm font-medium text-ink">{med.note ?? "-"}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
