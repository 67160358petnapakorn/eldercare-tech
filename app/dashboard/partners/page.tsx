"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, Building2, Mail, MapPin, Phone, Plus, Edit2, Trash2, X, Save } from "lucide-react";
import { apiFetch as fetchWithToken } from "@/lib/api";
import Modal from "@/components/Modal";

const emptyForm = {
  name: "",
  type: "clinic",
  address: "",
  phone: "",
  email: "",
  description: "",
  verified: false,
};

export default function PartnersPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<any>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([fetchWithToken("/api/partners?size=20"), fetchWithToken("/api/auth/me")])
      .then(([data, me]) => {
        setItems(data.items ?? []);
        setRole(me.role);
      })
      .catch(() => router.replace("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  const canManage = role === "admin" || role === "partner";

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setShowForm(true);
  }

  function openEdit(partner: any) {
    setEditingId(partner.id);
    setForm({
      name: partner.name || "",
      type: partner.type || "clinic",
      address: partner.address || "",
      phone: partner.phone || "",
      email: partner.email || "",
      description: partner.description || "",
      verified: !!partner.verified,
    });
    setError("");
    setShowForm(true);
  }

  function closeModal() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.address.trim()) {
      setError("กรุณากรอกชื่อและที่อยู่");
      return;
    }
    setSaving(true);
    setError("");

    try {
      if (editingId) {
        const updated = await fetchWithToken(`/api/partners/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        setItems((current) => current.map((it) => (it.id === editingId ? updated : it)));
      } else {
        const created = await fetchWithToken("/api/partners", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        setItems((current) => [...current, created]);
      }
      closeModal();
    } catch (err: any) {
      setError(err?.message ?? "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm("ยืนยันลบ partner นี้?")) return;
    setDeletingId(id);
    try {
      await fetchWithToken(`/api/partners/${id}`, { method: "DELETE" });
      setItems((current) => current.filter((it) => it.id !== id));
    } catch (err: any) {
      window.alert(err?.message ?? "ลบไม่สำเร็จ");
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return <div className="text-ink-muted">กำลังโหลดข้อมูล partner...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-ink">Partner / หน่วยงานร่วมมือ</h2>
        {canManage ? (
          <button type="button" onClick={openCreate} className="btn-primary flex items-center gap-2" data-test="partner-create-btn">
            <Plus size={16} /> เพิ่ม Partner
          </button>
        ) : null}
      </div>

      {showForm ? (
        <Modal title={editingId ? "แก้ไข Partner" : "เพิ่ม Partner"} onClose={closeModal}>
          <form onSubmit={handleSubmit} className="space-y-4" data-test="partner-form">
            <label className="space-y-1 text-sm text-ink-soft">
              <span>ชื่อ *</span>
              <input data-test="partner-input-name" value={form.name} onChange={(e) => setForm((c: any) => ({ ...c, name: e.target.value }))} className="input-field" required />
            </label>
            <label className="space-y-1 text-sm text-ink-soft">
              <span>ประเภท</span>
              <select value={form.type} onChange={(e) => setForm((c: any) => ({ ...c, type: e.target.value }))} className="input-field">
                <option value="clinic">clinic</option>
                <option value="hospital">hospital</option>
                <option value="homecare">homecare</option>
                <option value="pharmacy">pharmacy</option>
              </select>
            </label>
            <label className="space-y-1 text-sm text-ink-soft">
              <span>ที่อยู่ *</span>
              <input data-test="partner-input-address" value={form.address} onChange={(e) => setForm((c: any) => ({ ...c, address: e.target.value }))} className="input-field" required />
            </label>
            <label className="space-y-1 text-sm text-ink-soft">
              <span>เบอร์โทร</span>
              <input value={form.phone} onChange={(e) => setForm((c: any) => ({ ...c, phone: e.target.value }))} className="input-field" />
            </label>
            <label className="space-y-1 text-sm text-ink-soft">
              <span>อีเมล</span>
              <input type="email" value={form.email} onChange={(e) => setForm((c: any) => ({ ...c, email: e.target.value }))} className="input-field" />
            </label>
            <label className="space-y-1 text-sm text-ink-soft">
              <span>รายละเอียด</span>
              <textarea rows={3} value={form.description} onChange={(e) => setForm((c: any) => ({ ...c, description: e.target.value }))} className="input-field" />
            </label>
            <label className="flex items-center gap-2 text-sm text-ink-soft">
              <input type="checkbox" checked={form.verified} onChange={(e) => setForm((c: any) => ({ ...c, verified: e.target.checked }))} className="h-4 w-4 rounded border-surface-line accent-brand-blue" />
              <span>ผ่านการตรวจสอบแล้ว (Verified)</span>
            </label>

            {error ? <p className="rounded-lg border border-status-red/30 bg-status-red-bg px-3 py-2 text-sm text-status-red">{error}</p> : null}

            <div className="flex justify-end gap-3">
              <button type="button" onClick={closeModal} className="btn-secondary flex items-center gap-2"><X size={16} /> ยกเลิก</button>
              <button data-test="partner-submit-btn" type="submit" disabled={saving} className="btn-primary flex items-center gap-2">{saving ? "กำลังบันทึก..." : <><Save size={16} /> บันทึก</>}</button>
            </div>
          </form>
        </Modal>
      ) : null}

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-surface-line bg-surface p-10 text-center">
          <p className="text-ink-muted">ยังไม่มีข้อมูล partner</p>
          {canManage ? (
            <button type="button" onClick={openCreate} className="btn-primary mt-4 inline-flex items-center gap-2">
              <Plus size={16} /> เพิ่ม Partner แรก
            </button>
          ) : null}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((partner) => (
            <div key={partner.id} className="rounded-2xl border border-surface-line bg-surface p-5 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-blue">{partner.type}</p>
                  <h3 className="mt-2 text-xl font-bold text-ink">{partner.name}</h3>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-green-light text-2xl">
                  <Building2 size={20} className="text-brand-green" />
                </div>
              </div>

              <div className="mt-4 space-y-2 text-sm text-ink-soft">
                {partner.address ? (
                  <div className="flex items-start gap-2">
                    <MapPin size={16} className="mt-0.5 text-brand-blue" />
                    <span>{partner.address}</span>
                  </div>
                ) : null}
                {partner.phone ? (
                  <div className="flex items-center gap-2">
                    <Phone size={16} className="text-brand-blue" />
                    <span>{partner.phone}</span>
                  </div>
                ) : null}
                {partner.email ? (
                  <div className="flex items-center gap-2">
                    <Mail size={16} className="text-brand-blue" />
                    <span>{partner.email}</span>
                  </div>
                ) : null}
              </div>

              {partner.description ? <p className="mt-4 text-sm text-ink-soft">{partner.description}</p> : null}

              {partner.verified ? (
                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-status-green-bg px-2.5 py-1 text-xs font-medium text-status-green">
                  <BadgeCheck size={14} />
                  Verified
                </div>
              ) : null}

              {canManage ? (
                <div className="mt-4 flex items-center gap-2 border-t border-surface-line pt-4">
                  <button type="button" data-test={"partner-edit-" + partner.id} onClick={() => openEdit(partner)} className="btn-secondary flex items-center gap-2 text-sm">
                    <Edit2 size={14} /> แก้ไข
                  </button>
                  <button
                    type="button"
                    data-test={"partner-delete-" + partner.id}
                    onClick={() => handleDelete(partner.id)}
                    disabled={deletingId === partner.id}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-status-red hover:bg-status-red-bg disabled:opacity-50"
                  >
                    <Trash2 size={14} /> ลบ
                  </button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
