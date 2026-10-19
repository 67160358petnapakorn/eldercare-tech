import Link from "next/link";
import { Pill } from "lucide-react";
import DashboardCard from "./DashboardCard";

export type MedicationItem = {
  id: number;
  name: string;
  dosage: string;
  time: string;
  frequency: string;
};

export default function MedicationCard({ items }: { items: MedicationItem[] }) {
  return (
    <DashboardCard title="ยาที่ต้องดูแล">
      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-surface-line p-4 text-center text-sm text-ink-muted">
          ยังไม่มีรายการยา
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((med) => (
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
              <span className="text-sm font-medium text-ink-muted">{med.frequency}</span>
            </li>
          ))}
        </ul>
      )}
      <Link href="/dashboard/medications" className="btn-secondary mt-4 block w-full text-center">
        ดูตารางยาทั้งหมด
      </Link>
    </DashboardCard>
  );
}
