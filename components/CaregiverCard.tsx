import { BadgeCheck, Star, Clock3 } from "lucide-react";
import { caregiver } from "@/data/mockData";
import DashboardCard from "./DashboardCard";

export default function CaregiverCard() {
  return (
    <DashboardCard title="ผู้ดูแลของคุณแม่">
      <div className="flex items-center gap-4">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-green-light text-2xl"
          aria-hidden="true"
        >
          {caregiver.avatar}
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <p className="font-semibold text-ink">{caregiver.name}</p>
            {caregiver.verified && (
              <BadgeCheck
                size={17}
                className="text-brand-blue"
                aria-label="ผ่านการตรวจสอบแล้ว"
              />
            )}
          </div>
          <div className="mt-1 flex items-center gap-3 text-sm text-ink-soft">
            <span className="flex items-center gap-1">
              <Star size={14} className="fill-status-amber text-status-amber" aria-hidden="true" />
              {caregiver.rating} ({caregiver.reviews} รีวิว)
            </span>
          </div>
          <p className="mt-0.5 text-sm text-ink-muted">
            ประสบการณ์ {caregiver.experienceYears} ปี
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-lg bg-surface-soft px-3 py-2 text-sm text-ink-soft">
        <Clock3 size={15} className="text-ink-muted" aria-hidden="true" />
        วันนี้ {caregiver.todaySchedule}
      </div>

      <button className="btn-secondary mt-4 w-full">ดู Profile</button>
    </DashboardCard>
  );
}
