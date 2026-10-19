"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, HeartPulse, Thermometer, Droplets, Plus, Edit2, Trash2, X, Save } from "lucide-react";
import { apiFetch as fetchWithToken } from "@/lib/api";
import Modal from "@/components/Modal";
import HealthChart from "@/components/HealthChart";

const emptyForm = {
  heart_rate: 75,
  systolic: 120,
  diastolic: 80,
  temperature: 36.8,
  spo2: 98,
  blood_sugar: 100,
  weight: 60,
  sleep_hours: 7,
  activity: 4000,
};

export default function HealthPage() {
  const router = useRouter();
  const [elders, setElders] = useState<any[]>([]);
  const [selectedElderId, setSelectedElderId] = useState<number | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<any>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchWithToken("/api/elders?size=100")
      .then((data) => {
        const elderItems = data.items ?? [];
        setElders(elderItems);
        if (elderItems.length > 0) setSelectedElderId(elderItems[0].id);
        else setLoading(false);
      })
      .catch(() => router.replace("/login"));
  }, [router]);

  useEffect(() => {
    if (!selectedElderId) return;
    setLoading(true);
    fetchWithToken(`/api/health-records?elder_id=${selectedElderId}&size=100`)
      .then((data) => setItems(data.items ?? []))
      .catch(() => router.replace("/login"))
      .finally(() => setLoading(false));
  }, [selectedElderId, router]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setShowForm(true);
  }

  function openEdit(record: any) {
    setEditingId(record.id);
    setForm({
      heart_rate: record.heart_rate,
      systolic: record.systolic,
      diastolic: record.diastolic,
      temperature: record.temperature,
      spo2: record.spo2,
      blood_sugar: record.blood_sugar,
      weight: record.weight,
      sleep_hours: record.sleep_hours,
      activity: record.activity,
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

  function numericPayload() {
    return Object.fromEntries(Object.entries(form).map(([key, value]) => [key, Number(value)]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedElderId) return;
    setSaving(true);
    setError("");

    try {
      if (editingId) {
        const updated = await fetchWithToken(`/api/health-records/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(numericPayload()),
        });
        setItems((current) => current.map((it) => (it.id === editingId ? updated : it)));
      } else {
        const created = await fetchWithToken("/api/health-records", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...numericPayload(), elder_id: selectedElderId }),
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
    if (!window.confirm("ยืนยันลบบันทึกสุขภาพนี้?")) return;
    setDeletingId(id);
    try {
      await fetchWithToken(`/api/health-records/${id}`, { method: "DELETE" });
      setItems((current) => current.filter((it) => it.id !== id));
    } catch (err: any) {
      window.alert(err?.message ?? "ลบไม่สำเร็จ");
    } finally {
      setDeletingId(null);
    }
  }

  const fields: { key: keyof typeof emptyForm; label: string; step?: string }[] = [
    { key: "heart_rate", label: "ชีพจร (BPM)" },
    { key: "systolic", label: "ความดันตัวบน (mmHg)" },
    { key: "diastolic", label: "ความดันตัวล่าง (mmHg)" },
    { key: "temperature", label: "อุณหภูมิ (°C)", step: "0.1" },
    { key: "spo2", label: "ออกซิเจนในเลือด (%)" },
    { key: "blood_sugar", label: "น้ำตาลในเลือด (mg/dL)" },
    { key: "weight", label: "น้ำหนัก (kg)", step: "0.1" },
    { key: "sleep_hours", label: "ชั่วโมงการนอน", step: "0.1" },
    { key: "activity", label: "กิจกรรม (ก้าว)" },
  ];

  if (elders.length === 0 && !loading) {
    return (
      <div className="rounded-2xl border border-dashed border-surface-line bg-surface p-10 text-center text-ink-muted">
        กรุณาเพิ่มข้อมูลผู้สูงอายุก่อน จึงจะบันทึกข้อมูลสุขภาพได้
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-ink">สุขภาพ</h2>
        <div className="flex items-center gap-3">
          {elders.length > 1 ? (
            <select
              data-test="health-elder-select"
              value={selectedElderId ?? ""}
              onChange={(e) => setSelectedElderId(Number(e.target.value))}
              className="input-field"
            >
              {elders.map((elder) => (
                <option key={elder.id} value={elder.id}>{elder.first_name} {elder.last_name}</option>
              ))}
            </select>
          ) : null}
          <button type="button" data-test="health-add-btn" onClick={openCreate} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> บันทึกค่าสุขภาพ
          </button>
        </div>
      </div>

      {showForm ? (
        <Modal title={editingId ? "แก้ไขบันทึกสุขภาพ" : "บันทึกค่าสุขภาพ"} onClose={closeModal}>
          <form onSubmit={handleSubmit} className="space-y-4" data-test="health-form">
            <div className="grid gap-4 sm:grid-cols-2">
              {fields.map((field) => (
                <label key={field.key} className="space-y-1 text-sm text-ink-soft">
                  <span>{field.label}</span>
                  <input
                    data-test={`health-input-${field.key}`}
                    type="number"
                    step={field.step}
                    value={form[field.key]}
                    onChange={(e) => setForm((c: any) => ({ ...c, [field.key]: e.target.value }))}
                    className="input-field"
                    required
                  />
                </label>
              ))}
            </div>

            {error ? <p className="rounded-lg border border-status-red/30 bg-status-red-bg px-3 py-2 text-sm text-status-red">{error}</p> : null}

            <div className="flex justify-end gap-3">
              <button type="button" onClick={closeModal} className="btn-secondary flex items-center gap-2"><X size={16} /> ยกเลิก</button>
              <button data-test="health-submit-btn" type="submit" disabled={saving} className="btn-primary flex items-center gap-2">{saving ? "กำลังบันทึก..." : <><Save size={16} /> บันทึก</>}</button>
            </div>
          </form>
        </Modal>
      ) : null}

      {loading ? (
        <div className="text-ink-muted">กำลังโหลดข้อมูลสุขภาพ...</div>
      ) : (
        <>
          <HealthChart records={items} />

          {items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-surface-line bg-surface p-10 text-center">
              <p className="text-ink-muted">ยังไม่มีข้อมูลสุขภาพสำหรับผู้สูงอายุคนนี้</p>
              <button type="button" onClick={openCreate} className="btn-primary mt-4 inline-flex items-center gap-2">
                <Plus size={16} /> บันทึกค่าสุขภาพแรก
              </button>
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {[
                  { id: "heart", label: "อัตราการเต้นหัวใจ", value: `${items[0].heart_rate ?? 0} BPM`, icon: HeartPulse },
                  { id: "bp", label: "ความดันโลหิต", value: `${items[0].systolic ?? 0}/${items[0].diastolic ?? 0} mmHg`, icon: Activity },
                  { id: "temp", label: "อุณหภูมิ", value: `${(items[0].temperature ?? 0).toFixed(1)} °C`, icon: Thermometer },
                  { id: "spo2", label: "ออกซิเจนในเลือด", value: `${items[0].spo2 ?? 0} %`, icon: Droplets },
                ].map((card) => {
                  const Icon = card.icon;
                  return (
                    <div key={card.id} className="rounded-2xl border border-surface-line bg-surface p-5 shadow-card">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-ink-muted">{card.label}</span>
                        <div className="rounded-lg bg-brand-blue-light p-2 text-brand-blue">
                          <Icon size={18} />
                        </div>
                      </div>
                      <p className="mt-4 text-2xl font-bold text-ink">{card.value}</p>
                    </div>
                  );
                })}
              </div>

              <div className="rounded-2xl border border-surface-line bg-surface p-5 shadow-card">
                <h3 className="text-lg font-bold text-ink">ประวัติการบันทึก</h3>
                <div className="mt-4 space-y-3">
                  {items.map((record) => (
                    <div key={record.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface-soft p-4">
                      <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink-soft">
                        <span>{record.created_at ? new Date(record.created_at).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" }) : "-"}</span>
                        <span>ชีพจร {record.heart_rate} BPM</span>
                        <span>ความดัน {record.systolic}/{record.diastolic}</span>
                        <span>น้ำตาล {record.blood_sugar} mg/dL</span>
                        <span>น้ำหนัก {record.weight} kg</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button type="button" data-test={"health-edit-" + record.id} onClick={() => openEdit(record)} className="rounded-full p-2 hover:bg-surface" aria-label="แก้ไข">
                          <Edit2 size={16} />
                        </button>
                        <button
                          type="button"
                          data-test={"health-delete-" + record.id}
                          onClick={() => handleDelete(record.id)}
                          disabled={deletingId === record.id}
                          className="rounded-full p-2 text-status-red hover:bg-status-red-bg disabled:opacity-50"
                          aria-label="ลบ"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
