"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, MapPin, Star, Clock3, Plus, Edit2, Trash2, X, Save } from "lucide-react";
import { API_BASE_URL, apiFetch as fetchWithToken } from "@/lib/api";
import PhotoUpload from "@/components/PhotoUpload";
import Modal from "@/components/Modal";

const emptyForm = {
  name: "",
  location: "",
  hourly_rate: 300,
  bio: "",
  skills: "",
};

export default function CaregiversPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ id: number; role: string } | null>(null);
  const [photoError, setPhotoError] = useState<Record<number, string>>({});
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<any>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([fetchWithToken("/api/caregivers"), fetchWithToken("/api/auth/me")])
      .then(([data, me]) => {
        setItems(data.items ?? []);
        setCurrentUser({ id: me.id, role: me.role });
      })
      .catch(() => router.replace("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  async function handlePhotoUploaded(caregiverId: number, url: string) {
    setPhotoError((current) => ({ ...current, [caregiverId]: "" }));
    try {
      const updated = await fetchWithToken(`/api/caregivers/${caregiverId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photo_url: url }),
      });
      setItems((current) => current.map((it) => (it.id === caregiverId ? updated : it)));
    } catch (err: any) {
      setPhotoError((current) => ({ ...current, [caregiverId]: err?.message ?? "บันทึกรูปภาพไม่สำเร็จ" }));
    }
  }

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setShowForm(true);
  }

  function openEdit(caregiver: any) {
    setEditingId(caregiver.id);
    setForm({
      name: caregiver.name || "",
      location: caregiver.location || "",
      hourly_rate: caregiver.hourly_rate ?? 300,
      bio: caregiver.bio || "",
      skills: (caregiver.skills ?? []).map((s: any) => s.skill).join(", "),
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

  function buildPayload() {
    return {
      name: form.name,
      location: form.location,
      hourly_rate: Number(form.hourly_rate),
      bio: form.bio,
      skills: form.skills
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean),
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("กรุณากรอกชื่อผู้ดูแล");
      return;
    }
    setSaving(true);
    setError("");

    try {
      if (editingId) {
        const updated = await fetchWithToken(`/api/caregivers/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildPayload()),
        });
        setItems((current) => current.map((it) => (it.id === editingId ? updated : it)));
      } else {
        const created = await fetchWithToken("/api/caregivers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildPayload()),
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

  async function handleDelete(caregiverId: number) {
    if (!window.confirm("ยืนยันลบโปรไฟล์ผู้ดูแลนี้?")) return;
    setDeletingId(caregiverId);
    try {
      await fetchWithToken(`/api/caregivers/${caregiverId}`, { method: "DELETE" });
      setItems((current) => current.filter((it) => it.id !== caregiverId));
    } catch (err: any) {
      window.alert(err?.message ?? "ลบไม่สำเร็จ");
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return <div className="text-ink-muted">กำลังโหลดข้อมูลผู้ดูแล...</div>;
  }

  const myCaregiver = items.find((c) => c.user_id === currentUser?.id);
  const canCreateOwnProfile = currentUser?.role === "caregiver" && !myCaregiver;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-ink">ผู้ดูแล</h2>
        {canCreateOwnProfile ? (
          <button type="button" onClick={openCreate} className="btn-primary flex items-center gap-2" data-test="caregiver-create-btn">
            <Plus size={16} /> สร้างโปรไฟล์ผู้ดูแล
          </button>
        ) : null}
      </div>

      {showForm ? (
        <Modal title={editingId ? "แก้ไขโปรไฟล์ผู้ดูแล" : "สร้างโปรไฟล์ผู้ดูแล"} onClose={closeModal}>
          <form onSubmit={handleSubmit} className="space-y-4" data-test="caregiver-form">
            <label className="space-y-1 text-sm text-ink-soft">
              <span>ชื่อ *</span>
              <input data-test="caregiver-input-name" value={form.name} onChange={(e) => setForm((c: any) => ({ ...c, name: e.target.value }))} className="input-field" required />
            </label>
            <label className="space-y-1 text-sm text-ink-soft">
              <span>พื้นที่ให้บริการ</span>
              <input value={form.location} onChange={(e) => setForm((c: any) => ({ ...c, location: e.target.value }))} className="input-field" />
            </label>
            <label className="space-y-1 text-sm text-ink-soft">
              <span>ค่าบริการ (บาท/ชั่วโมง)</span>
              <input data-test="caregiver-input-rate" type="number" min={0} value={form.hourly_rate} onChange={(e) => setForm((c: any) => ({ ...c, hourly_rate: e.target.value }))} className="input-field" required />
            </label>
            <label className="space-y-1 text-sm text-ink-soft">
              <span>ทักษะ (คั่นด้วยจุลภาค)</span>
              <input placeholder="เช่น ดูแลผู้สูงอายุ, ให้ยา" value={form.skills} onChange={(e) => setForm((c: any) => ({ ...c, skills: e.target.value }))} className="input-field" />
            </label>
            <label className="space-y-1 text-sm text-ink-soft">
              <span>แนะนำตัว</span>
              <textarea rows={3} value={form.bio} onChange={(e) => setForm((c: any) => ({ ...c, bio: e.target.value }))} className="input-field" />
            </label>

            {error ? <p className="rounded-lg border border-status-red/30 bg-status-red-bg px-3 py-2 text-sm text-status-red">{error}</p> : null}

            <div className="flex justify-end gap-3">
              <button type="button" onClick={closeModal} className="btn-secondary flex items-center gap-2"><X size={16} /> ยกเลิก</button>
              <button data-test="caregiver-submit-btn" type="submit" disabled={saving} className="btn-primary flex items-center gap-2">{saving ? "กำลังบันทึก..." : <><Save size={16} /> บันทึก</>}</button>
            </div>
          </form>
        </Modal>
      ) : null}

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-surface-line bg-surface p-10 text-center">
          <p className="text-ink-muted">ยังไม่มีข้อมูลผู้ดูแล</p>
          {canCreateOwnProfile ? (
            <button type="button" onClick={openCreate} className="btn-primary mt-4 inline-flex items-center gap-2">
              <Plus size={16} /> สร้างโปรไฟล์ผู้ดูแลของคุณ
            </button>
          ) : null}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((caregiver) => {
            const isOwnProfile = caregiver.user_id === currentUser?.id;
            const canManage = isOwnProfile || currentUser?.role === "admin";
            return (
              <div key={caregiver.id} className="rounded-2xl border border-surface-line bg-surface p-5 shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-blue">Caregiver</p>
                    <h3 className="mt-2 text-xl font-bold text-ink">{caregiver.name}</h3>
                  </div>
                  {isOwnProfile ? (
                    <PhotoUpload
                      photoUrl={caregiver.photo_url}
                      size={48}
                      fallback={
                        <span className="flex h-full w-full items-center justify-center bg-brand-blue-light text-2xl" aria-hidden="true">
                          👩‍⚕️
                        </span>
                      }
                      onUploaded={(url) => handlePhotoUploaded(caregiver.id, url)}
                      onError={(message) => setPhotoError((current) => ({ ...current, [caregiver.id]: message }))}
                    />
                  ) : (
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full">
                      {caregiver.photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={`${API_BASE_URL}${caregiver.photo_url}`} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-brand-blue-light text-2xl" aria-hidden="true">
                          👩‍⚕️
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {photoError[caregiver.id] ? (
                  <p className="mt-2 text-xs text-status-red">{photoError[caregiver.id]}</p>
                ) : null}

                <div className="mt-4 space-y-2 text-sm text-ink-soft">
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-brand-blue" />
                    {caregiver.location ?? "ไม่ระบุพื้นที่"}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock3 size={16} className="text-brand-blue" />
                    {caregiver.experience ?? 0} ปี ประสบการณ์
                  </div>
                  <div className="flex items-center gap-2">
                    <Star size={16} className="text-brand-blue" />
                    {caregiver.rating ?? 0} / 5
                  </div>
                </div>

                {caregiver.verified ? (
                  <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-status-green-bg px-2.5 py-1 text-xs font-medium text-status-green">
                    <BadgeCheck size={14} />
                    Verified
                  </div>
                ) : null}

                {canManage ? (
                  <div className="mt-4 flex items-center gap-2 border-t border-surface-line pt-4">
                    <button type="button" data-test={"caregiver-edit-" + caregiver.id} onClick={() => openEdit(caregiver)} className="btn-secondary flex items-center gap-2 text-sm">
                      <Edit2 size={14} /> แก้ไข
                    </button>
                    <button
                      type="button"
                      data-test={"caregiver-delete-" + caregiver.id}
                      onClick={() => handleDelete(caregiver.id)}
                      disabled={deletingId === caregiver.id}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-status-red hover:bg-status-red-bg disabled:opacity-50"
                    >
                      <Trash2 size={14} /> ลบ
                    </button>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
