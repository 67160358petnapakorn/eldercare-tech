import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { notifications } from "@/data/mockData";
import DashboardCard from "./DashboardCard";

const iconByLevel = {
  warning: AlertTriangle,
  normal: CheckCircle2,
  critical: AlertTriangle,
};

const colorByLevel = {
  warning: "bg-status-amber-bg text-status-amber",
  normal: "bg-status-green-bg text-status-green",
  critical: "bg-status-red-bg text-status-red",
};

export default function HealthAlert() {
  return (
    <DashboardCard title="การแจ้งเตือน">
      <ul className="flex flex-col gap-3">
        {notifications.map((n) => {
          const Icon = iconByLevel[n.level];
          return (
            <li
              key={n.id}
              className="flex items-start gap-3 rounded-lg border border-surface-line p-3"
            >
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${colorByLevel[n.level]}`}
              >
                <Icon size={17} aria-hidden="true" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-ink">{n.title}</p>
                <p className="text-sm text-ink-soft">{n.message}</p>
              </div>
              <button className="btn-ghost !px-3 !py-1.5 text-sm">
                ดูรายละเอียด
              </button>
            </li>
          );
        })}
      </ul>
    </DashboardCard>
  );
}
