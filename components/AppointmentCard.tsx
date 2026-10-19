import Link from "next/link";
import { CalendarDays, Building2, Stethoscope, Clock3 } from "lucide-react";
import DashboardCard from "./DashboardCard";

export type AppointmentItem = {
  id: number;
  hospital_name: string;
  doctor_name: string;
  department: string;
  appointment_date: string;
  appointment_time: string;
};

export default function AppointmentCard({ appointment }: { appointment: AppointmentItem | null }) {
  return (
    <DashboardCard title="นัดหมายถัดไป">
      {!appointment ? (
        <p className="rounded-lg border border-dashed border-surface-line p-4 text-center text-sm text-ink-muted">
          ไม่มีนัดหมายที่กำลังจะถึง
        </p>
      ) : (
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-brand-blue-light text-brand-blue">
            <CalendarDays size={22} aria-hidden="true" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-ink">{appointment.appointment_date}</p>
            <div className="mt-2 flex flex-col gap-1.5 text-sm text-ink-soft">
              <span className="flex items-center gap-2">
                <Building2 size={15} className="text-ink-muted" aria-hidden="true" />
                {appointment.hospital_name}
              </span>
              <span className="flex items-center gap-2">
                <Stethoscope size={15} className="text-ink-muted" aria-hidden="true" />
                {appointment.doctor_name} • {appointment.department}
              </span>
              <span className="flex items-center gap-2">
                <Clock3 size={15} className="text-ink-muted" aria-hidden="true" />
                {appointment.appointment_time}
              </span>
            </div>
          </div>
        </div>
      )}
      <Link href="/dashboard/appointments" className="btn-secondary mt-4 block w-full text-center">
        ดูรายละเอียด
      </Link>
    </DashboardCard>
  );
}
