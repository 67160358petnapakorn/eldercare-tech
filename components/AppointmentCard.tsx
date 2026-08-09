import { CalendarDays, Building2, Stethoscope, Clock3 } from "lucide-react";
import { nextAppointment } from "@/data/mockData";
import DashboardCard from "./DashboardCard";

export default function AppointmentCard() {
  return (
    <DashboardCard title="นัดหมายถัดไป">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-brand-blue-light text-brand-blue">
          <CalendarDays size={22} aria-hidden="true" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-ink">{nextAppointment.date}</p>
          <div className="mt-2 flex flex-col gap-1.5 text-sm text-ink-soft">
            <span className="flex items-center gap-2">
              <Building2 size={15} className="text-ink-muted" aria-hidden="true" />
              {nextAppointment.hospital}
            </span>
            <span className="flex items-center gap-2">
              <Stethoscope size={15} className="text-ink-muted" aria-hidden="true" />
              {nextAppointment.doctor} • {nextAppointment.department}
            </span>
            <span className="flex items-center gap-2">
              <Clock3 size={15} className="text-ink-muted" aria-hidden="true" />
              {nextAppointment.time}
            </span>
          </div>
        </div>
      </div>
      <button className="btn-secondary mt-4 w-full">ดูรายละเอียด</button>
    </DashboardCard>
  );
}
