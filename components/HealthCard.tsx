import { Heart, Activity, Thermometer, Droplets } from "lucide-react";
import type { StatusLevel } from "@/data/mockData";
import StatusBadge from "./StatusBadge";

const iconMap = {
  heart: Heart,
  activity: Activity,
  thermometer: Thermometer,
  droplets: Droplets,
};

interface HealthCardProps {
  title: string;
  value: string;
  unit: string;
  status: StatusLevel;
  statusLabel: string;
  icon: keyof typeof iconMap;
}

export default function HealthCard({
  title,
  value,
  unit,
  status,
  statusLabel,
  icon,
}: HealthCardProps) {
  const Icon = iconMap[icon];

  return (
    <div className="card flex flex-col gap-3 p-5">
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-blue-light text-brand-blue">
          <Icon size={20} aria-hidden="true" />
        </div>
        <StatusBadge status={status} label={statusLabel} />
      </div>
      <div>
        <p className="text-sm text-ink-muted">{title}</p>
        <p className="mt-1 flex items-baseline gap-1.5">
          <span className="text-2xl font-bold text-ink">{value}</span>
          <span className="text-sm text-ink-soft">{unit}</span>
        </p>
      </div>
    </div>
  );
}
