import Link from "next/link";
import { BadgeCheck, Star, Wallet } from "lucide-react";
import DashboardCard from "./DashboardCard";

export type CaregiverItem = {
  id: number;
  name: string;
  rating: number;
  experience: number;
  hourly_rate: number;
  verified: boolean;
};

export default function CaregiverCard({ caregiver }: { caregiver: CaregiverItem | null }) {
  return (
    <DashboardCard title="ผู้ดูแลของคุณ">
      {!caregiver ? (
        <p className="rounded-lg border border-dashed border-surface-line p-4 text-center text-sm text-ink-muted">
          ยังไม่มีผู้ดูแลที่จองไว้
        </p>
      ) : (
        <div className="flex items-center gap-4">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-green-light text-2xl"
            aria-hidden="true"
          >
            🧑‍⚕️
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="font-semibold text-ink">{caregiver.name}</p>
              {caregiver.verified && (
                <BadgeCheck size={17} className="text-brand-blue" aria-label="ผ่านการตรวจสอบแล้ว" />
              )}
            </div>
            <div className="mt-1 flex items-center gap-3 text-sm text-ink-soft">
              <span className="flex items-center gap-1">
                <Star size={14} className="fill-status-amber text-status-amber" aria-hidden="true" />
                {caregiver.rating.toFixed(1)}
              </span>
            </div>
            <p className="mt-0.5 text-sm text-ink-muted">ประสบการณ์ {caregiver.experience} ปี</p>
          </div>
        </div>
      )}

      {caregiver ? (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-surface-soft px-3 py-2 text-sm text-ink-soft">
          <Wallet size={15} className="text-ink-muted" aria-hidden="true" />
          ค่าบริการ {caregiver.hourly_rate.toLocaleString("th-TH")} บาท/ชั่วโมง
        </div>
      ) : null}

      <Link href="/dashboard/caregivers" className="btn-secondary mt-4 block w-full text-center">
        ดูผู้ดูแล
      </Link>
    </DashboardCard>
  );
}
