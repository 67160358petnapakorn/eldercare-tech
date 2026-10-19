"use client";

import { useEffect, useState } from "react";
import { apiFetch, getAccessToken } from "@/lib/api";

type RealPreview = {
  name: string;
  age: number;
  heartRate: number | null;
  medsCount: number;
  nextAppointmentDate: string | null;
};

function computeAge(dateValue?: string | null): number {
  if (!dateValue) return 0;
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) age -= 1;
  return age;
}

export default function LandingElderPreview() {
  const [real, setReal] = useState<RealPreview | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    async function load() {
      if (!getAccessToken()) {
        setChecked(true);
        return;
      }
      try {
        const elderData = await apiFetch("/api/elders?size=1");
        const elder = elderData?.items?.[0];
        if (!elder) {
          setChecked(true);
          return;
        }

        const [healthData, medsData, apptData] = await Promise.all([
          apiFetch(`/api/health-records?elder_id=${elder.id}&size=1`).catch(() => null),
          apiFetch(`/api/medications?elder_id=${elder.id}&size=50`).catch(() => null),
          apiFetch(`/api/appointments?elder_id=${elder.id}&size=50`).catch(() => null),
        ]);

        const upcoming = (apptData?.items ?? [])
          .filter((a: any) => a.appointment_date >= new Date().toISOString().slice(0, 10))
          .sort((a: any, b: any) => a.appointment_date.localeCompare(b.appointment_date))[0];

        setReal({
          name: `${elder.first_name} ${elder.last_name}`,
          age: computeAge(elder.date_of_birth),
          heartRate: healthData?.items?.[0]?.heart_rate ?? null,
          medsCount: medsData?.items?.length ?? 0,
          nextAppointmentDate: upcoming?.appointment_date ?? null,
        });
      } catch {
        // not logged in, token expired, or request failed — fall back to the example card
      } finally {
        setChecked(true);
      }
    }
    load();
  }, []);

  // Avoid a flash of the example card for logged-in users while the real
  // data is still loading.
  if (!checked) {
    return <div className="card h-[21rem] animate-pulse p-5" aria-hidden="true" />;
  }

  if (real) {
    return (
      <div className="card p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-ink">{real.name}</p>
            <p className="text-sm text-ink-muted">อายุ {real.age} ปี</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-status-green-bg px-3 py-1 text-sm font-medium text-status-green">
            🟢 สุขภาพคงที่
          </span>
        </div>

        <div className="mt-5 rounded-lg border border-surface-line p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-ink-muted">อัตราการเต้นหัวใจ</p>
            <p className="text-sm font-semibold text-status-green">{real.heartRate ? "ปกติ" : "ยังไม่มีข้อมูล"}</p>
          </div>
          <div className="mt-2 flex items-end gap-2">
            <span className="text-3xl font-bold text-ink">{real.heartRate ?? "-"}</span>
            <span className="pb-1 text-sm text-ink-muted">BPM</span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-surface-soft p-3">
            <p className="text-xs text-ink-muted">รายการยา</p>
            <p className="mt-1 text-sm font-semibold text-ink">{real.medsCount} รายการ</p>
          </div>
          <div className="rounded-lg bg-surface-soft p-3">
            <p className="text-xs text-ink-muted">นัดหมายถัดไป</p>
            <p className="mt-1 text-sm font-semibold text-ink">
              {real.nextAppointmentDate ? new Date(real.nextAppointmentDate).toLocaleDateString("th-TH") : "ไม่มีนัดหมาย"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card relative p-5">
      <span className="absolute -top-3 right-4 rounded-full bg-status-amber px-3 py-1 text-xs font-semibold text-white shadow">
        ตัวอย่าง
      </span>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-ink">คุณแม่สมใจ</p>
          <p className="text-sm text-ink-muted">อายุ 68 ปี</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-status-green-bg px-3 py-1 text-sm font-medium text-status-green">
          🟢 สุขภาพคงที่
        </span>
      </div>

      <div className="mt-5 rounded-lg border border-surface-line p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-ink-muted">อัตราการเต้นหัวใจ</p>
          <p className="text-sm font-semibold text-status-green">ปกติ</p>
        </div>
        <div className="mt-2 flex items-end gap-2">
          <span className="text-3xl font-bold text-ink">72</span>
          <span className="pb-1 text-sm text-ink-muted">BPM</span>
        </div>
        <svg viewBox="0 0 200 40" className="mt-3 h-10 w-full text-brand-blue" aria-hidden="true">
          <polyline
            className="pulse-line"
            points="0,20 30,20 40,6 50,34 60,20 90,20 100,10 110,30 120,20 200,20"
          />
        </svg>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-surface-soft p-3">
          <p className="text-xs text-ink-muted">ยาวันนี้</p>
          <p className="mt-1 text-sm font-semibold text-ink">1 / 3 รายการ</p>
        </div>
        <div className="rounded-lg bg-surface-soft p-3">
          <p className="text-xs text-ink-muted">นัดหมายถัดไป</p>
          <p className="mt-1 text-sm font-semibold text-ink">20 ส.ค. 2569</p>
        </div>
      </div>
    </div>
  );
}
