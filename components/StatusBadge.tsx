import { CheckCircle2, AlertTriangle, AlertOctagon } from "lucide-react";
import type { StatusLevel } from "@/data/mockData";

interface StatusBadgeProps {
  status: StatusLevel;
  label: string;
}

const statusConfig: Record<
  StatusLevel,
  { bg: string; text: string; icon: React.ElementType }
> = {
  normal: {
    bg: "bg-status-green-bg",
    text: "text-status-green",
    icon: CheckCircle2,
  },
  warning: {
    bg: "bg-status-amber-bg",
    text: "text-status-amber",
    icon: AlertTriangle,
  },
  critical: {
    bg: "bg-status-red-bg",
    text: "text-status-red",
    icon: AlertOctagon,
  },
};

export default function StatusBadge({ status, label }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${config.bg} ${config.text}`}
    >
      <Icon size={14} aria-hidden="true" />
      {label}
    </span>
  );
}
