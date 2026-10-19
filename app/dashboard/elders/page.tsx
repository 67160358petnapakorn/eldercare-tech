"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, MapPin, Phone, Edit2, Trash2, Plus, X, Save } from "lucide-react";
import { apiFetch as fetchWithToken } from "@/lib/api";
import PhotoUpload from "@/components/PhotoUpload";
import Modal from "@/components/Modal";

const emptyForm = {
  first_name: "",
  last_name: "",
  date_of_birth: "",
  phone: "",
  address: "",
  gender: "female",
  emergency_contact: "",
  relationship_type: "",
  medical_note: "",
};

export default function EldersPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<any>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [photoError, setPhotoError] = useState<Record<number, string>>({});

  async function handlePhotoUploaded(elderId: number, url: string) {
    setPhotoError((current) => ({ ...current, [elderId]: "" }));
    try {
      const updated = await fetchWithToken(`/api/elders/${elderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photo_url: url }),
      });
      setItems((current) => current.map((it) => (it.id === elderId ? updated : it)));
    } catch (err: any) {
      setPhotoError((current) => ({ ...current, [elderId]: err?.message ?? "บันทึกรูปภาพไม่สำเร็จ" }));
    }
  }

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

  function openCreate() {
    setForm(emptyForm);
    setError("");
    setShowCreate(true);
  }

  function startEdit(elder: any) {
    setEditingId(elder.id);
    setError("");
    setForm({
      first_name: elder.first_name || "",
      last_name: elder.last_name || "",
      date_of_birth: elder.date_of_birth ? elder.date_of_birth.split("T")[0] : "",
      phone: elder.phone || "",
      address: elder.address || "",
      gender: elder.gender || "female",
      emergency_contact: elder.emergency_contact || "",
      relationship_type: elder.relationship_type || "",
      medical_note: elder.medical_note || "",
    });
  }

  function closeModal() {
    setEditingId(null);
    setShowCreate(false);
    setForm(emptyForm);
    setError("");
  }

  function validate(): string | null {
    if (!form.first_name.trim() || !form.last_name.trim()) return "กรุณากรอกชื่อและนามสกุล";
    return null;
  }

  // date_of_birth is an optional *date* field on the backend — sending ""
  // (the empty-input default) fails Pydantic's date parsing with a 422,
  // since "" isn't null and isn't a valid date string.
  function toPayload(values: typeof emptyForm) {
    return { ...values, date_of_birth: values.date_of_birth || null };
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setSaving(true);
    setError("");

    try {
      const created = await fetchWithToken("/api/elders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload(form)),
      });
      setItems((current) => [...current, created]);
      closeModal();
    } catch (err: any) {
      setError(err?.message ?? "เพิ่มผู้สูงอายุไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setSaving(true);
    setError("");

    try {
      const updated = await fetchWithToken(`/api/elders/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload(form)),
      });

      setItems((current) => current.map((it) => (it.id === editingId ? updated : it)));
      closeModal();
    } catch (err: any) {
      setError(err?.message ?? "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(elderId: number) {
    if (!window.confirm("ยืนยันลบข้อมูลผู้สูงอายุคนนี้? ข้อมูลที่เกี่ยวข้อง (ยา นัดหมาย ฯลฯ) จะไม่สามารถกู้คืนได้")) return;
    setDeletingId(elderId);
    try {
      await fetchWithToken(`/api/elders/${elderId}`, { method: "DELETE" });
      setItems((current) => current.filter((it) => it.id !== elderId));
    } catch (err: any) {
      window.alert(err?.message ?? "ลบไม่สำเร็จ");
    } finally {
      setDeletingId(null);
    }
  }

  function renderForm(onSubmit: (e: React.FormEvent) => void) {
    return (
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1 text-sm text-ink-soft">
            <span>ชื่อ *</span>
            <input data-test="elder-input-first-name" value={form.first_name} onChange={(e) => setForm((c: any) => ({ ...c, first_name: e.target.value }))} className="input-field" required />
          </label>
          <label className="space-y-1 text-sm text-ink-soft">
            <span>นามสกุล *</span>
            <input data-test="elder-input-last-name" value={form.last_name} onChange={(e) => setForm((c: any) => ({ ...c, last_name: e.target.value }))} className="input-field" required />
          </label>
          <label className="space-y-1 text-sm text-ink-soft">
            <span>วันเกิด</span>
            <input data-test="elder-input-dob" type="date" value={form.date_of_birth} onChange={(e) => setForm((c: any) => ({ ...c, date_of_birth: e.target.value }))} className="input-field" />
          </label>
          <label className="space-y-1 text-sm text-ink-soft">
            <span>เพศ</span>
            <select data-test="elder-input-gender" value={form.gender} onChange={(e) => setForm((c: any) => ({ ...c, gender: e.target.value }))} className="input-field">
              <option value="female">หญิง</option>
              <option value="male">ชาย</option>
              <option value="other">อื่น ๆ</option>
            </select>
          </label>
          <label className="space-y-1 text-sm text-ink-soft">
            <span>เบอร์โทร</span>
            <input data-test="elder-input-phone" value={form.phone} onChange={(e) => setForm((c: any) => ({ ...c, phone: e.target.value }))} className="input-field" />
          </label>
          <label className="space-y-1 text-sm text-ink-soft">
            <span>เบอร์ฉุกเฉิน</span>
            <input value={form.emergency_contact} onChange={(e) => setForm((c: any) => ({ ...c, emergency_contact: e.target.value }))} className="input-field" />
          </label>
          <label className="space-y-1 text-sm text-ink-soft sm:col-span-2">
            <span>ที่อยู่</span>
            <input data-test="elder-input-address" value={form.address} onChange={(e) => setForm((c: any) => ({ ...c, address: e.target.value }))} className="input-field" />
          </label>
          <label className="space-y-1 text-sm text-ink-soft sm:col-span-2">
            <span>ความสัมพันธ์</span>
            <input data-test="elder-input-relationship" placeholder="เช่น ลูกสาว, ลูกชาย" value={form.relationship_type} onChange={(e) => setForm((c: any) => ({ ...c, relationship_type: e.target.value }))} className="input-field" />
          </label>
          <label className="space-y-1 text-sm text-ink-soft sm:col-span-2">
            <span>หมายเหตุทางการแพทย์</span>
            <textarea rows={3} value={form.medical_note} onChange={(e) => setForm((c: any) => ({ ...c, medical_note: e.target.value }))} className="input-field" />
          </label>
        </div>

        {error ? <p className="rounded-lg border border-status-red/30 bg-status-red-bg px-3 py-2 text-sm text-status-red">{error}</p> : null}

        <div className="flex justify-end gap-3">
          <button type="button" data-test="elder-cancel-btn" onClick={closeModal} className="btn-secondary flex items-center gap-2"><X size={16} /> ยกเลิก</button>
          <button data-test="elder-submit-btn" type="submit" disabled={saving} className="btn-primary flex items-center gap-2">{saving ? "กำลังบันทึก..." : <><Save size={16} /> บันทึก</>}</button>
        </div>
      </form>
    );
  }

  if (loading) {
    return <div className="text-ink-muted">กำลังโหลดข้อมูลผู้สูงอายุ...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-ink">ผู้สูงอายุ</h2>
        <button type="button" data-test="elder-add-btn" onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> เพิ่มผู้สูงอายุ
        </button>
      </div>

      {showCreate ? (
        <Modal title="เพิ่มผู้สูงอายุ" onClose={closeModal}>
          {renderForm(handleCreate)}
        </Modal>
      ) : null}

      {editingId ? (
        <Modal title="แก้ไขข้อมูลผู้สูงอายุ" onClose={closeModal}>
          {renderForm(saveEdit)}
        </Modal>
      ) : null}

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-surface-line bg-surface p-10 text-center">
          <p className="text-ink-muted">ยังไม่มีข้อมูลผู้สูงอายุ เริ่มต้นด้วยการเพิ่มคนแรกของคุณ</p>
          <button type="button" onClick={openCreate} className="btn-primary mt-4 inline-flex items-center gap-2">
            <Plus size={16} /> เพิ่มผู้สูงอายุคนแรก
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((elder) => (
            <div key={elder.id} className="rounded-2xl border border-surface-line bg-surface p-5 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <PhotoUpload
                    photoUrl={elder.photo_url}
                    size={52}
                    fallback={
                      <span className="flex h-full w-full items-center justify-center bg-brand-blue-light text-2xl" aria-hidden="true">
                        {elder.gender === "male" ? "👴" : "👵"}
                      </span>
                    }
                    onUploaded={(url) => handlePhotoUploaded(elder.id, url)}
                    onError={(message) => setPhotoError((current) => ({ ...current, [elder.id]: message }))}
                  />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-blue">ผู้สูงอายุ</p>
                    <h3 className="mt-1 text-xl font-bold text-ink">{elder.first_name} {elder.last_name}</h3>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button type="button" data-test={"elder-edit-" + elder.id} onClick={() => startEdit(elder)} className="rounded-full p-2 hover:bg-surface-soft" aria-label="แก้ไข">
                    <Edit2 size={16} />
                  </button>
                  <button
                    type="button"
                    data-test={"elder-delete-" + elder.id}
                    onClick={() => handleDelete(elder.id)}
                    disabled={deletingId === elder.id}
                    className="rounded-full p-2 text-status-red hover:bg-status-red-bg disabled:opacity-50"
                    aria-label="ลบ"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {photoError[elder.id] ? (
                <p className="mt-2 text-xs text-status-red">{photoError[elder.id]}</p>
              ) : null}

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
