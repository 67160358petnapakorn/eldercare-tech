"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Hospital, Stethoscope, Plus, Trash2, Loader2, Edit2, Save } from "lucide-react";
import { apiFetch as fetchWithToken } from "@/lib/api";
import Modal from "@/components/Modal";

const emptyForm = {
  elder_id: "",
  hospital_name: "",
  doctor_name: "",
  department: "",
  appointment_date: "",
  appointment_time: "09:00",
  reason: "",
  note: "",
  status: "upcoming",
};

export default function AppointmentsPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [elders, setElders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState<any>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);

  async function loadAppointments() {
    try {
      const [appointmentData, elderData] = await Promise.all([
        fetchWithToken("/api/appointments?size=50"),
        fetchWithToken("/api/elders?size=100"),
      ]);
      setItems(appointmentData.items ?? []);
      setElders(elderData.items ?? []);
    } catch {
      router.replace("/login");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAppointments();
  }, [router]);

  function elderName(elderId: number) {
    const elder = elders.find((e) => e.id === elderId);
    return elder ? `${elder.first_name} ${elder.last_name}` : `#${elderId}`;
  }

  function startCreate() {
    if (elders.length === 0) {
      window.alert("กรุณาเพิ่มข้อมูลผู้สูงอายุก่อน จึงจะเพิ่มนัดหมายได้");
      return;
    }
    setEditingId(null);
    setForm({ ...emptyForm, elder_id: elders[0].id });
    setShowForm(true);
    setError("");
  }

  function startEdit(item: any) {
    setEditingId(item.id);
    setForm({
      elder_id: item.elder_id,
      hospital_name: item.hospital_name || "",
      doctor_name: item.doctor_name || "",
      department: item.department || "",
      appointment_date: item.appointment_date ? item.appointment_date.split("T")[0] : item.appointment_date || "",
      appointment_time: item.appointment_time || "09:00",
      reason: item.reason || "",
      note: item.note || "",
      status: item.status || "upcoming",
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
        const updated = await fetchWithToken(`/api/appointments/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, elder_id: Number(form.elder_id) }),
        });
        setItems((current) => current.map((it) => (it.id === editingId ? updated : it)));
      } else {
        const created = await fetchWithToken("/api/appointments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, elder_id: Number(form.elder_id) }),
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
    if (!window.confirm("ยืนยันลบนัดหมายนี้?")) return;
    setDeletingId(id);
    try {
      await fetchWithToken(`/api/appointments/${id}`, { method: "DELETE" });
      setItems((current) => current.filter((item) => item.id !== id));
    } catch (err: any) {
      window.alert(err?.message ?? "ลบไม่สำเร็จ");
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return <div className="text-ink-muted">กำลังโหลดข้อมูลนัดหมาย...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-ink">นัดหมาย</h2>
        <button type="button" onClick={startCreate} className="btn-primary flex items-center gap-2" data-test="appointment-create-btn">
          <Plus size={16} />
          เพิ่มนัดหมาย
        </button>
      </div>

      {showForm ? (
        <Modal title={editingId ? "แก้ไขนัดหมาย" : "เพิ่มนัดหมาย"} onClose={cancelForm}>
        <form onSubmit={handleSubmit} data-test="appointment-form">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1 text-sm text-ink-soft">
              <span>ผู้สูงอายุ</span>
              <select data-test="appointment-input-elder-id" value={form.elder_id} onChange={(e) => setForm((c: any) => ({ ...c, elder_id: Number(e.target.value) }))} className="input-field" required>
                {elders.map((elder) => (
                  <option key={elder.id} value={elder.id}>{elder.first_name} {elder.last_name}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-sm text-ink-soft">
              <span>สถานะ</span>
              <select data-test="appointment-input-status" value={form.status} onChange={(e) => setForm((c: any) => ({ ...c, status: e.target.value }))} className="input-shell h-11 w-full border px-3" required>
                <option value="upcoming">upcoming</option>
                <option value="completed">completed</option>
                <option value="cancelled">cancelled</option>
                <option value="rescheduled">rescheduled</option>
              </select>
            </label>
            <label className="space-y-1 text-sm text-ink-soft md:col-span-2">
              <span>ชื่อโรงพยาบาล</span>
              <input data-test="appointment-input-hospital" value={form.hospital_name} onChange={(e) => setForm((c: any) => ({ ...c, hospital_name: e.target.value }))} className="input-shell h-11 w-full border px-3" required />
            </label>
            <label className="space-y-1 text-sm text-ink-soft">
              <span>ชื่อแพทย์</span>
              <input data-test="appointment-input-doctor" value={form.doctor_name} onChange={(e) => setForm((c: any) => ({ ...c, doctor_name: e.target.value }))} className="input-shell h-11 w-full border px-3" required />
            </label>
            <label className="space-y-1 text-sm text-ink-soft">
              <span>แผนก</span>
              <input data-test="appointment-input-department" value={form.department} onChange={(e) => setForm((c: any) => ({ ...c, department: e.target.value }))} className="input-shell h-11 w-full border px-3" required />
            </label>
            <label className="space-y-1 text-sm text-ink-soft">
              <span>วันที่</span>
              <input data-test="appointment-input-date" type="date" value={form.appointment_date} onChange={(e) => setForm((c: any) => ({ ...c, appointment_date: e.target.value }))} className="input-shell h-11 w-full border px-3" required />
            </label>
            <label className="space-y-1 text-sm text-ink-soft">
              <span>เวลา</span>
              <input data-test="appointment-input-time" type="time" value={form.appointment_time} onChange={(e) => setForm((c: any) => ({ ...c, appointment_time: e.target.value }))} className="input-shell h-11 w-full border px-3" required />
            </label>
            <label className="space-y-1 text-sm text-ink-soft md:col-span-2">
              <span>เหตุผล</span>
              <input data-test="appointment-input-reason" value={form.reason} onChange={(e) => setForm((c: any) => ({ ...c, reason: e.target.value }))} className="input-shell h-11 w-full border px-3" required />
            </label>
            <label className="space-y-1 text-sm text-ink-soft md:col-span-2">
              <span>หมายเหตุ</span>
              <textarea rows={3} value={form.note} onChange={(e) => setForm((c: any) => ({ ...c, note: e.target.value }))} className="input-shell w-full border px-3 py-2" />
            </label>
          </div>

          {error ? <p className="mt-4 rounded-lg border border-status-red/30 bg-status-red-bg px-3 py-2 text-sm text-status-red">{error}</p> : null}

          <div className="mt-5 flex justify-end gap-3">
            <button data-test="appointment-cancel-btn" type="button" onClick={cancelForm} className="btn-secondary">ยกเลิก</button>
            <button data-test="appointment-submit-btn" type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
              {saving ? <Loader2 size={16} className="animate-spin" /> : editingId ? <Save size={16} /> : <Plus size={16} />}
              {saving ? "กำลังบันทึก..." : editingId ? "บันทึกการแก้ไข" : "บันทึก"}
            </button>
          </div>
        </form>
        </Modal>
      ) : null}

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-surface-line bg-surface p-10 text-center">
          <p className="text-ink-muted">ยังไม่มีข้อมูลนัดหมาย</p>
          <button type="button" onClick={startCreate} className="btn-primary mt-4 inline-flex items-center gap-2">
            <Plus size={16} /> เพิ่มนัดหมายแรก
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-2xl border border-surface-line bg-surface p-5 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-brand-blue">
                    <Hospital size={18} />
                    <span className="font-semibold">{item.hospital_name}</span>
                  </div>
                  <p className="mt-2 text-sm text-ink-soft">{item.department} • {elderName(item.elder_id)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-brand-blue-light px-2.5 py-1 text-xs font-medium text-brand-blue">{item.status}</span>
                  <button type="button" data-test={"appointment-edit-" + item.id} onClick={() => startEdit(item)} className="rounded-full p-2 hover:bg-surface-soft" aria-label="แก้ไข">
                    <Edit2 size={16} />
                  </button>
                  <button
                    type="button"
                    data-test={"appointment-delete-" + item.id}
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingId === item.id}
                    className="rounded-full p-2 text-status-red hover:bg-status-red-bg disabled:opacity-50"
                    aria-label="ลบนัดหมาย"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div>
                  <p className="text-xs text-ink-muted">แพทย์</p>
                  <p className="mt-1 flex items-center gap-2 text-sm font-medium text-ink"><Stethoscope size={14} />{item.doctor_name}</p>
                </div>
                <div>
                  <p className="text-xs text-ink-muted">วันที่</p>
                  <p className="mt-1 flex items-center gap-2 text-sm font-medium text-ink"><CalendarClock size={14} />{item.appointment_date}</p>
                </div>
                <div>
                  <p className="text-xs text-ink-muted">เวลา</p>
                  <p className="mt-1 text-sm font-medium text-ink">{item.appointment_time}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
