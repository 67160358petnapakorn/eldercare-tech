"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarCheck2, UserRound, ClipboardList, Clock3, Plus, Trash2, Loader2, Edit2, Save, QrCode, CheckCircle2, X } from "lucide-react";
import { apiFetch as fetchWithToken } from "@/lib/api";
import Modal from "@/components/Modal";

type Payment = {
  id: number;
  booking_id: number;
  amount: number;
  currency: string;
  status: "pending" | "paid" | "cancelled";
  qr_payload: string;
  qr_image: string | null;
  paid_at: string | null;
};

const emptyForm = {
  elder_id: "",
  caregiver_id: "",
  date: "",
  start_time: "09:00",
  end_time: "13:00",
  service_type: "elder_care",
  note: "",
  status: "pending",
};

export default function BookingsPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [elders, setElders] = useState<any[]>([]);
  const [caregivers, setCaregivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState<any>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [paymentsByBooking, setPaymentsByBooking] = useState<Record<number, Payment | null>>({});
  const [activePaymentBookingId, setActivePaymentBookingId] = useState<number | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  async function loadBookings() {
    try {
      const [bookingData, elderData, caregiverData] = await Promise.all([
        fetchWithToken("/api/bookings?size=50"),
        fetchWithToken("/api/elders?size=100"),
        fetchWithToken("/api/caregivers?size=100"),
      ]);
      setItems(bookingData.items ?? []);
      setElders(elderData.items ?? []);
      setCaregivers(caregiverData.items ?? []);
    } catch {
      router.replace("/login");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBookings();
  }, [router]);

  function elderName(elderId: number) {
    const elder = elders.find((e) => e.id === elderId);
    return elder ? `${elder.first_name} ${elder.last_name}` : `#${elderId}`;
  }

  function caregiverName(caregiverId: number) {
    const caregiver = caregivers.find((c) => c.id === caregiverId);
    return caregiver ? caregiver.name : `#${caregiverId}`;
  }

  function startCreate() {
    if (elders.length === 0 || caregivers.length === 0) {
      window.alert("ต้องมีข้อมูลผู้สูงอายุและผู้ดูแลอย่างน้อยอย่างละ 1 รายการก่อนจึงจะสร้างการจองได้");
      return;
    }
    setEditingId(null);
    setForm({ ...emptyForm, elder_id: elders[0].id, caregiver_id: caregivers[0].id });
    setShowForm(true);
    setError("");
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

  async function openPayment(bookingId: number) {
    setActivePaymentBookingId(bookingId);
    setPaymentError("");
    setPaymentLoading(true);
    try {
      let payment: Payment | null = paymentsByBooking[bookingId] ?? (await fetchWithToken(`/api/bookings/${bookingId}/payment`));
      if (!payment) {
        payment = await fetchWithToken(`/api/bookings/${bookingId}/payment`, { method: "POST" });
      }
      setPaymentsByBooking((current) => ({ ...current, [bookingId]: payment }));
    } catch (err: any) {
      setPaymentError(err?.message ?? "ไม่สามารถสร้าง QR ชำระเงินได้");
    } finally {
      setPaymentLoading(false);
    }
  }

  function closePayment() {
    setActivePaymentBookingId(null);
    setPaymentError("");
  }

  async function confirmPayment() {
    if (!activePaymentBookingId) return;
    const payment = paymentsByBooking[activePaymentBookingId];
    if (!payment) return;

    setConfirming(true);
    setPaymentError("");
    try {
      const updated = await fetchWithToken(`/api/payments/${payment.id}/confirm`, { method: "POST" });
      setPaymentsByBooking((current) => ({ ...current, [activePaymentBookingId]: updated }));
    } catch (err: any) {
      setPaymentError(err?.message ?? "ยืนยันการชำระเงินไม่สำเร็จ");
    } finally {
      setConfirming(false);
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm("ยืนยันลบการจองนี้?")) return;
    setDeletingId(id);
    try {
      await fetchWithToken(`/api/bookings/${id}`, { method: "DELETE" });
      setItems((current) => current.filter((item) => item.id !== id));
    } catch (err: any) {
      window.alert(err?.message ?? "ลบไม่สำเร็จ");
    } finally {
      setDeletingId(null);
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
        <Modal title={editingId ? "แก้ไขการจอง" : "เพิ่มการจอง"} onClose={cancelForm}>
        <form onSubmit={handleSubmit} data-test="booking-form">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1 text-sm text-ink-soft">
              <span>ผู้สูงอายุ</span>
              <select data-test="booking-input-elder-id" value={form.elder_id} onChange={(e) => setForm((c: any) => ({ ...c, elder_id: Number(e.target.value) }))} className="input-field" required>
                {elders.map((elder) => (
                  <option key={elder.id} value={elder.id}>{elder.first_name} {elder.last_name}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-sm text-ink-soft">
              <span>ผู้ดูแล</span>
              <select data-test="booking-input-caregiver-id" value={form.caregiver_id} onChange={(e) => setForm((c: any) => ({ ...c, caregiver_id: Number(e.target.value) }))} className="input-field" required>
                {caregivers.map((caregiver) => (
                  <option key={caregiver.id} value={caregiver.id}>{caregiver.name}</option>
                ))}
              </select>
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

          {error ? <p className="mt-4 rounded-lg border border-status-red/30 bg-status-red-bg px-3 py-2 text-sm text-status-red">{error}</p> : null}

          <div className="mt-5 flex justify-end gap-3">
            <button type="button" data-test="booking-cancel-btn" onClick={cancelForm} className="btn-secondary">ยกเลิก</button>
            <button data-test="booking-submit-btn" type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
              {saving ? <Loader2 size={16} className="animate-spin" /> : editingId ? <Save size={16} /> : <Plus size={16} />}
              {saving ? "กำลังบันทึก..." : editingId ? "บันทึกการแก้ไข" : "บันทึก"}
            </button>
          </div>
        </form>
        </Modal>
      ) : null}

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-surface-line bg-surface p-10 text-center">
          <p className="text-ink-muted">ยังไม่มีข้อมูลการจอง</p>
          <button type="button" onClick={startCreate} className="btn-primary mt-4 inline-flex items-center gap-2">
            <Plus size={16} /> เพิ่มการจองแรก
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((booking) => (
            <div key={booking.id} className="rounded-2xl border border-surface-line bg-surface p-5 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-brand-blue">
                    <ClipboardList size={18} />
                    <span className="font-semibold">{booking.service_type}</span>
                  </div>
                  <p className="mt-2 text-sm text-ink-soft">{elderName(booking.elder_id)} • {booking.note ?? "-"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-brand-blue-light px-2.5 py-1 text-xs font-medium text-brand-blue">{booking.status}</span>
                  {paymentsByBooking[booking.id]?.status === "paid" ? (
                    <span className="flex items-center gap-1 rounded-full bg-status-green-bg px-2.5 py-1 text-xs font-medium text-status-green">
                      <CheckCircle2 size={13} />
                      ชำระแล้ว
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openPayment(booking.id)}
                      className="flex items-center gap-1 rounded-full bg-status-amber-bg px-2.5 py-1 text-xs font-medium text-status-amber hover:brightness-95"
                    >
                      <QrCode size={13} />
                      ชำระเงิน
                    </button>
                  )}
                  <button type="button" data-test={"booking-edit-" + booking.id} onClick={() => startEdit(booking)} className="rounded-full p-2 hover:bg-surface-soft" aria-label="แก้ไข">
                    <Edit2 size={16} />
                  </button>
                  <button
                    type="button"
                    data-test={"booking-delete-" + booking.id}
                    onClick={() => handleDelete(booking.id)}
                    disabled={deletingId === booking.id}
                    className="rounded-full p-2 text-status-red hover:bg-status-red-bg disabled:opacity-50"
                    aria-label="ลบการจอง"
                  >
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
                  <p className="mt-1 flex items-center gap-2 text-sm font-medium text-ink"><UserRound size={14} />{caregiverName(booking.caregiver_id)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activePaymentBookingId !== null ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={closePayment}>
          <div
            className="w-full max-w-sm rounded-2xl bg-surface p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-ink">ชำระเงินผ่าน PromptPay</h3>
              <button type="button" onClick={closePayment} className="rounded-full p-1.5 text-ink-soft hover:bg-surface-soft" aria-label="ปิด">
                <X size={18} />
              </button>
            </div>

            {paymentLoading ? (
              <div className="flex flex-col items-center gap-2 py-10 text-ink-muted">
                <Loader2 size={24} className="animate-spin" />
                กำลังสร้าง QR...
              </div>
            ) : paymentError ? (
              <p className="mt-4 rounded-lg border border-status-red/30 bg-status-red-bg px-3 py-2 text-sm text-status-red">{paymentError}</p>
            ) : (() => {
              const payment = paymentsByBooking[activePaymentBookingId];
              if (!payment) return null;

              if (payment.status === "paid") {
                return (
                  <div className="flex flex-col items-center gap-3 py-8 text-center">
                    <CheckCircle2 size={48} className="text-status-green" />
                    <p className="text-lg font-semibold text-ink">ชำระเงินสำเร็จ</p>
                    <p className="text-ink-muted">{payment.amount.toLocaleString("th-TH")} {payment.currency}</p>
                  </div>
                );
              }

              return (
                <div className="mt-4 flex flex-col items-center gap-3">
                  <p className="text-2xl font-bold text-ink">
                    {payment.amount.toLocaleString("th-TH")} <span className="text-base font-medium text-ink-muted">{payment.currency}</span>
                  </p>
                  {payment.qr_image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={payment.qr_image} alt="PromptPay QR" className="h-56 w-56 rounded-xl border border-surface-line p-2" />
                  ) : null}
                  <p className="text-center text-xs text-ink-muted">
                    สแกนด้วยแอปธนาคารเพื่อชำระเงิน — ตัวอย่างสาธิต ยังไม่เชื่อมระบบธนาคารจริง
                  </p>
                  <button
                    type="button"
                    onClick={confirmPayment}
                    disabled={confirming}
                    className="btn-primary mt-2 w-full"
                  >
                    {confirming ? "กำลังยืนยัน..." : "ฉันชำระเงินแล้ว"}
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      ) : null}
    </div>
  );
}
