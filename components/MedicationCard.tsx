import { Pill, CheckCircle2, Clock } from "lucide-react";
import { medications } from "@/data/mockData";
import DashboardCard from "./DashboardCard";

export default function MedicationCard() {
  return (
    <DashboardCard title="ยาวันนี้">
      <ul className="flex flex-col gap-3">
        {medications.map((med) => (
          <li
            key={med.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-surface-line p-3"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-green-light text-brand-green">
                <Pill size={18} aria-hidden="true" />
              </div>
              <div>
                <p className="font-semibold text-ink">{med.name}</p>
                <p className="text-sm text-ink-muted">
                  {med.time} น. • {med.dosage}
                </p>
              </div>
            </div>
            {med.taken ? (
              <span className="inline-flex items-center gap-1 text-sm font-medium text-status-green">
                <CheckCircle2 size={16} aria-hidden="true" />
                รับประทานแล้ว
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-sm font-medium text-ink-muted">
                <Clock size={16} aria-hidden="true" />
                รอรับประทาน
              </span>
            )}
          </li>
        ))}
      </ul>
      <button className="btn-secondary mt-4 w-full">ดูตารางยาทั้งหมด</button>
    </DashboardCard>
  );
}
