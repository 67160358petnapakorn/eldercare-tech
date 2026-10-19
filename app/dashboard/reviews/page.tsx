"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquareText, Star, Plus, Edit2, Trash2, X, Save } from "lucide-react";
import { apiFetch as fetchWithToken } from "@/lib/api";
import Modal from "@/components/Modal";

export default function ReviewsPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<any>({ booking_id: "", rating: 5, comment: "" });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  // Only bookings that don't already have a review — the backend rejects a
  // second review per booking with a 409, so this keeps the dropdown honest.
  const reviewedBookingIds = new Set(items.map((r) => r.booking_id));
  const reviewableBookings = bookings.filter((b) => !reviewedBookingIds.has(b.id));

  async function loadAll() {
    try {
      const [reviewData, bookingData, me] = await Promise.all([
        fetchWithToken("/api/reviews?size=20"),
        fetchWithToken("/api/bookings?size=100"),
        fetchWithToken("/api/auth/me"),
      ]);
      setItems(reviewData.items ?? []);
      setBookings(bookingData.items ?? []);
      setRole(me.role);
    } catch {
      router.replace("/login");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, [router]);

  function openCreate() {
    if (reviewableBookings.length === 0) {
      window.alert("ไม่มีการจองที่ยังไม่ได้รีวิว");
      return;
    }
    setEditingId(null);
    setForm({ booking_id: reviewableBookings[0].id, rating: 5, comment: "" });
    setError("");
    setShowForm(true);
  }

  function openEdit(review: any) {
    setEditingId(review.id);
    setForm({ booking_id: review.booking_id, rating: review.rating, comment: review.comment || "" });
    setError("");
    setShowForm(true);
  }

  function closeModal() {
    setShowForm(false);
    setEditingId(null);
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      if (editingId) {
        const updated = await fetchWithToken(`/api/reviews/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rating: Number(form.rating), comment: form.comment }),
        });
        setItems((current) => current.map((it) => (it.id === editingId ? updated : it)));
      } else {
        const booking = bookings.find((b) => b.id === Number(form.booking_id));
        if (!booking) throw new Error("ไม่พบการจองที่เลือก");
        const created = await fetchWithToken("/api/reviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            booking_id: Number(form.booking_id),
            caregiver_id: booking.caregiver_id,
            rating: Number(form.rating),
            comment: form.comment,
          }),
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
    if (!window.confirm("ยืนยันลบรีวิวนี้?")) return;
    setDeletingId(id);
    try {
      await fetchWithToken(`/api/reviews/${id}`, { method: "DELETE" });
      setItems((current) => current.filter((it) => it.id !== id));
    } catch (err: any) {
      window.alert(err?.message ?? "ลบไม่สำเร็จ");
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return <div className="text-ink-muted">กำลังโหลดข้อมูลรีวิว...</div>;
  }

  const canCreate = role === "family" || role === "admin";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-ink">Review / ความประทับใจ</h2>
        {canCreate ? (
          <button type="button" onClick={openCreate} className="btn-primary flex items-center gap-2" data-test="review-create-btn">
            <Plus size={16} /> เพิ่มรีวิว
          </button>
        ) : null}
      </div>

      {showForm ? (
        <Modal title={editingId ? "แก้ไขรีวิว" : "เพิ่มรีวิว"} onClose={closeModal}>
          <form onSubmit={handleSubmit} className="space-y-4" data-test="review-form">
            {!editingId ? (
              <label className="space-y-1 text-sm text-ink-soft">
                <span>การจอง</span>
                <select data-test="review-input-booking-id" value={form.booking_id} onChange={(e) => setForm((c: any) => ({ ...c, booking_id: e.target.value }))} className="input-field" required>
                  {reviewableBookings.map((b) => (
                    <option key={b.id} value={b.id}>#{b.id} — {b.date} ({b.service_type})</option>
                  ))}
                </select>
              </label>
            ) : null}
            <label className="space-y-1 text-sm text-ink-soft">
              <span>คะแนน (1-5)</span>
              <select data-test="review-input-rating" value={form.rating} onChange={(e) => setForm((c: any) => ({ ...c, rating: e.target.value }))} className="input-field">
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>{n} ดาว</option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-sm text-ink-soft">
              <span>ความคิดเห็น</span>
              <textarea rows={3} value={form.comment} onChange={(e) => setForm((c: any) => ({ ...c, comment: e.target.value }))} className="input-field" />
            </label>

            {error ? <p className="rounded-lg border border-status-red/30 bg-status-red-bg px-3 py-2 text-sm text-status-red">{error}</p> : null}

            <div className="flex justify-end gap-3">
              <button type="button" onClick={closeModal} className="btn-secondary flex items-center gap-2"><X size={16} /> ยกเลิก</button>
              <button data-test="review-submit-btn" type="submit" disabled={saving} className="btn-primary flex items-center gap-2">{saving ? "กำลังบันทึก..." : <><Save size={16} /> บันทึก</>}</button>
            </div>
          </form>
        </Modal>
      ) : null}

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-surface-line bg-surface p-10 text-center">
          <p className="text-ink-muted">ยังไม่มีข้อมูลรีวิว</p>
          {canCreate ? (
            <button type="button" onClick={openCreate} className="btn-primary mt-4 inline-flex items-center gap-2">
              <Plus size={16} /> เพิ่มรีวิวแรก
            </button>
          ) : null}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((review) => (
            <div key={review.id} className="rounded-2xl border border-surface-line bg-surface p-5 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-brand-blue">
                    <MessageSquareText size={18} />
                    <span className="font-semibold">Booking #{review.booking_id}</span>
                  </div>
                  <p className="mt-2 text-sm text-ink-soft">{review.comment ?? "-"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 rounded-full bg-brand-blue-light px-2.5 py-1 text-sm font-semibold text-brand-blue">
                    <Star size={14} className="fill-current" />
                    {review.rating}/5
                  </div>
                  {canCreate ? (
                    <>
                      <button type="button" data-test={"review-edit-" + review.id} onClick={() => openEdit(review)} className="rounded-full p-2 hover:bg-surface-soft" aria-label="แก้ไข">
                        <Edit2 size={16} />
                      </button>
                      <button
                        type="button"
                        data-test={"review-delete-" + review.id}
                        onClick={() => handleDelete(review.id)}
                        disabled={deletingId === review.id}
                        className="rounded-full p-2 text-status-red hover:bg-status-red-bg disabled:opacity-50"
                        aria-label="ลบ"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div>
                  <p className="text-xs text-ink-muted">Caregiver ID</p>
                  <p className="mt-1 text-sm font-medium text-ink">#{review.caregiver_id}</p>
                </div>
                <div>
                  <p className="text-xs text-ink-muted">Booking ID</p>
                  <p className="mt-1 text-sm font-medium text-ink">#{review.booking_id}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
