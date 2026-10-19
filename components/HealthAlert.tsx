import Link from "next/link";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import DashboardCard from "./DashboardCard";

export type AlertItem = {
  id: number;
  title: string;
  message: string;
  severity: string;
};

const iconBySeverity: Record<string, typeof AlertTriangle> = {
  critical: AlertTriangle,
  warning: AlertTriangle,
  normal: CheckCircle2,
  info: Info,
};

const colorBySeverity: Record<string, string> = {
  critical: "bg-status-red-bg text-status-red",
  warning: "bg-status-amber-bg text-status-amber",
  normal: "bg-status-green-bg text-status-green",
  info: "bg-brand-blue-light text-brand-blue",
};

export default function HealthAlert({ items }: { items: AlertItem[] }) {
  return (
    <DashboardCard title="การแจ้งเตือนสุขภาพ">
      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-surface-line p-4 text-center text-sm text-ink-muted">
          ไม่มีการแจ้งเตือน
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((alert) => {
            const Icon = iconBySeverity[alert.severity] ?? Info;
            return (
              <li key={alert.id} className="flex items-start gap-3 rounded-lg border border-surface-line p-3">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${colorBySeverity[alert.severity] ?? colorBySeverity.info}`}
                >
                  <Icon size={17} aria-hidden="true" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-ink">{alert.title}</p>
                  <p className="text-sm text-ink-soft">{alert.message}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <Link href="/dashboard/health" className="btn-ghost mt-3 block w-full text-center text-sm">
        ดูข้อมูลสุขภาพทั้งหมด
      </Link>
    </DashboardCard>
  );
}
