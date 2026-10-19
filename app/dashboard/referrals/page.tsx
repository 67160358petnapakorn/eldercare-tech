"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, ClipboardList, ShieldAlert, Plus, Edit2, Trash2, X, Save } from "lucide-react";
import { apiFetch as fetchWithToken } from "@/lib/api";
import Modal from "@/components/Modal";

const emptyForm = {
  elder_id: "",
  partner_id: "",
  reason: "",
  symptoms: "",
  priority: "medium",
  consent: false,
  status: "new",
};

export default function ReferralsPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [elders, setElders] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<any>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  async function loadAll() {
    try {
      const [referralData, elderData, partnerData] = await Promise.all([
        fetchWithToken("/api/referrals?size=20"),
        fetchWithToken("/api/elders?size=100"),
        fetchWithToken("/api/partners?size=100"),
      ]);
      setItems(referralData.items ?? []);
      setElders(elderData.items ?? []);
      setPartners(partnerData.items ?? []);
    } catch (error: any) {
      router.replace("/login");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, [router]);

  function elderName(elderId: number) {
    const elder = elders.find((e) => e.id === elderId);
    return elder ? `${elder.first_name} ${elder.last_name}` : `#${elderId}`;
  }

  function partnerName(partnerId: number) {
    const partner = partners.find((p) => p.id === partnerId);
    return partner ? partner.name : `#${partnerId}`;
  }

  function openCreate() {
    if (elders.length === 0 || partners.length === 0) {
      window.alert("ต้องมีข้อมูลผู้สูงอายุและ Partner อย่างน้อยอย่างละ 1 รายการก่อน");
      return;
    }
    setEditingId(null);
    setForm({ ...emptyForm, elder_id: elders[0].id, partner_id: partners[0].id });
    setError("");
    setShowForm(true);
  }

  function openEdit(referral: any) {
    setEditingId(referral.id);
    setForm({
      elder_id: referral.elder_id,
      partner_id: referral.partner_id,
      reason: referral.reason || "",
      symptoms: referral.symptoms || "",
      priority: referral.priority || "medium",
      consent: !!referral.consent,
      status: referral.status || "new",
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
    if (!form.reason.trim()) {
      setError("กรุณากรอกเหตุผลการส่งต่อ");
      return;
    }
    setSaving(true);
    setError("");

    const payload = { ...form, elder_id: Number(form.elder_id), partner_id: Number(form.partner_id) };

    try {
      if (editingId) {
        const updated = await fetchWithToken(`/api/referrals/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        setItems((current) => current.map((it) => (it.id === editingId ? updated : it)));
      } else {
        const created = await fetchWithToken("/api/referrals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        setItems((current) => [created, ...current]);
      }
      closeModal();
    } catch (err: any) {
      setError(err?.message ?? "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm("ยืนยันลบ referral นี้?")) return;
    setDeletingId(id);
    try {
      await fetchWithToken(`/api/referrals/${id}`, { method: "DELETE" });
      setItems((current) => current.filter((it) => it.id !== id));
    } catch (err: any) {
      window.alert(err?.message ?? "ลบไม่สำเร็จ");
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return <div className="text-ink-muted">กำลังโหลดข้อมูล referral...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-ink">Referral / การส่งต่อ</h2>
        <button type="button" onClick={openCreate} className="btn-primary flex items-center gap-2" data-test="referral-create-btn">
          <Plus size={16} /> เพิ่ม Referral
        </button>
      </div>

      {showForm ? (
        <Modal title={editingId ? "แก้ไข Referral" : "เพิ่ม Referral"} onClose={closeModal}>
          <form onSubmit={handleSubmit} className="space-y-4" data-test="referral-form">
            <label className="space-y-1 text-sm text-ink-soft">
              <span>ผู้สูงอายุ</span>
              <select data-test="referral-input-elder-id" value={form.elder_id} onChange={(e) => setForm((c: any) => ({ ...c, elder_id: Number(e.target.value) }))} className="input-field" required>
                {elders.map((elder) => (
                  <option key={elder.id} value={elder.id}>{elder.first_name} {elder.last_name}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-sm text-ink-soft">
              <span>Partner ปลายทาง</span>
              <select data-test="referral-input-partner-id" value={form.partner_id} onChange={(e) => setForm((c: any) => ({ ...c, partner_id: Number(e.target.value) }))} className="input-field" required>
                {partners.map((partner) => (
                  <option key={partner.id} value={partner.id}>{partner.name}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-sm text-ink-soft">
              <span>เหตุผล *</span>
              <input data-test="referral-input-reason" value={form.reason} onChange={(e) => setForm((c: any) => ({ ...c, reason: e.target.value }))} className="input-field" required />
            </label>
            <label className="space-y-1 text-sm text-ink-soft">
              <span>อาการ</span>
              <input value={form.symptoms} onChange={(e) => setForm((c: any) => ({ ...c, symptoms: e.target.value }))} className="input-field" />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1 text-sm text-ink-soft">
                <span>ความเร่งด่วน</span>
                <select value={form.priority} onChange={(e) => setForm((c: any) => ({ ...c, priority: e.target.value }))} className="input-field">
                  <option value="low">low</option>
                  <option value="medium">medium</option>
                  <option value="high">high</option>
                  <option value="urgent">urgent</option>
                </select>
              </label>
              <label className="space-y-1 text-sm text-ink-soft">
                <span>สถานะ</span>
                <select value={form.status} onChange={(e) => setForm((c: any) => ({ ...c, status: e.target.value }))} className="input-field">
                  <option value="new">new</option>
                  <option value="reviewed">reviewed</option>
                  <option value="accepted">accepted</option>
                  <option value="rejected">rejected</option>
                </select>
              </label>
            </div>
            <label className="flex items-center gap-2 text-sm text-ink-soft">
              <input type="checkbox" checked={form.consent} onChange={(e) => setForm((c: any) => ({ ...c, consent: e.target.checked }))} className="h-4 w-4 rounded border-surface-line accent-brand-blue" />
              <span>ได้รับความยินยอมจากผู้สูงอายุ/ครอบครัวแล้ว</span>
            </label>

            {error ? <p className="rounded-lg border border-status-red/30 bg-status-red-bg px-3 py-2 text-sm text-status-red">{error}</p> : null}

            <div className="flex justify-end gap-3">
              <button type="button" onClick={closeModal} className="btn-secondary flex items-center gap-2"><X size={16} /> ยกเลิก</button>
              <button data-test="referral-submit-btn" type="submit" disabled={saving} className="btn-primary flex items-center gap-2">{saving ? "กำลังบันทึก..." : <><Save size={16} /> บันทึก</>}</button>
            </div>
          </form>
        </Modal>
      ) : null}

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-surface-line bg-surface p-10 text-center">
          <p className="text-ink-muted">ยังไม่มีข้อมูล referral</p>
          <button type="button" onClick={openCreate} className="btn-primary mt-4 inline-flex items-center gap-2">
            <Plus size={16} /> เพิ่ม Referral แรก
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-2xl border border-surface-line bg-surface p-5 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-brand-blue">
                    <ClipboardList size={18} />
                    <span className="font-semibold">{elderName(item.elder_id)} → {partnerName(item.partner_id)}</span>
                  </div>
                  <p className="mt-2 text-sm text-ink-soft">{item.reason}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-brand-blue-light px-2.5 py-1 text-xs font-medium text-brand-blue">
                    {item.status}
                  </span>
                  <button type="button" data-test={"referral-edit-" + item.id} onClick={() => openEdit(item)} className="rounded-full p-2 hover:bg-surface-soft" aria-label="แก้ไข">
                    <Edit2 size={16} />
                  </button>
                  <button
                    type="button"
                    data-test={"referral-delete-" + item.id}
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingId === item.id}
                    className="rounded-full p-2 text-status-red hover:bg-status-red-bg disabled:opacity-50"
                    aria-label="ลบ"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-4">
                <div>
                  <p className="text-xs text-ink-muted">Priority</p>
                  <p className="mt-1 flex items-center gap-2 text-sm font-medium text-ink">
                    {item.priority === "urgent" || item.priority === "high" ? <ShieldAlert size={14} className="text-status-red" /> : <AlertTriangle size={14} className="text-brand-blue" />}
                    {item.priority}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-ink-muted">Symptoms</p>
                  <p className="mt-1 text-sm font-medium text-ink">{item.symptoms ?? "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-ink-muted">Consent</p>
                  <p className="mt-1 flex items-center gap-2 text-sm font-medium text-ink">
                    {item.consent ? <CheckCircle2 size={14} className="text-status-green" /> : <AlertTriangle size={14} className="text-status-red" />}
                    {item.consent ? "ยินยอม" : "ยังไม่ยินยอม"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-ink-muted">เผยแพร่ / สถานะ</p>
                  <p className="mt-1 text-sm font-medium text-ink">{item.status}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
