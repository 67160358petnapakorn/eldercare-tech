import { Clock } from "lucide-react";
import DashboardCard from "@/components/DashboardCard";
import HealthCard from "@/components/HealthCard";
import HealthChart from "@/components/HealthChart";
import MedicationCard from "@/components/MedicationCard";
import AppointmentCard from "@/components/AppointmentCard";
import CaregiverCard from "@/components/CaregiverCard";
import HealthAlert from "@/components/HealthAlert";
import StatusBadge from "@/components/StatusBadge";
import { elder, healthStats } from "@/data/mockData";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      {/* Elder profile */}
      <DashboardCard>
        <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand-green-light text-3xl"
              aria-hidden="true"
            >
              {elder.avatar}
            </div>
            <div>
              <h2 className="text-xl font-bold text-ink">{elder.name}</h2>
              <p className="text-sm text-ink-muted">อายุ {elder.age} ปี</p>
              <div className="mt-2 flex items-center gap-3">
                <StatusBadge status={elder.status} label={elder.statusLabel} />
                <span className="flex items-center gap-1 text-xs text-ink-muted">
                  <Clock size={13} aria-hidden="true" />
                  อัปเดตล่าสุด {elder.lastUpdated}
                </span>
              </div>
            </div>
          </div>
          <button className="btn-primary w-full sm:w-auto">
            ดูข้อมูลสุขภาพ
          </button>
        </div>
      </DashboardCard>

      {/* Health overview */}
      <div>
        <h2 className="mb-3 text-lg font-bold text-ink">ภาพรวมสุขภาพ</h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {healthStats.map((stat) => (
            <HealthCard
              key={stat.id}
              title={stat.title}
              value={stat.value}
              unit={stat.unit}
              status={stat.status}
              statusLabel={stat.statusLabel}
              icon={stat.icon}
            />
          ))}
        </div>
      </div>

      {/* Trend chart */}
      <HealthChart />

      {/* Medication + Appointment */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <MedicationCard />
        <AppointmentCard />
      </div>

      {/* Caregiver + Alerts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CaregiverCard />
        <HealthAlert />
      </div>
    </div>
  );
}
