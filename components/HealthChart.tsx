"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import DashboardCard from "./DashboardCard";

type RangeKey = "today" | "week" | "month";

export type HealthRecordLite = {
  heart_rate: number;
  created_at: string;
};

const ranges: { key: RangeKey; label: string; days: number }[] = [
  { key: "today", label: "วันนี้", days: 1 },
  { key: "week", label: "7 วัน", days: 7 },
  { key: "month", label: "30 วัน", days: 30 },
];

function bucketRecords(records: HealthRecordLite[], range: RangeKey) {
  const config = ranges.find((r) => r.key === range)!;
  const cutoff = Date.now() - config.days * 24 * 60 * 60 * 1000;

  return records
    .filter((r) => new Date(r.created_at).getTime() >= cutoff)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map((r) => ({
      time:
        range === "today"
          ? new Date(r.created_at).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })
          : new Date(r.created_at).toLocaleDateString("th-TH", { day: "2-digit", month: "2-digit" }),
      value: r.heart_rate,
    }));
}

// Recharts renders raw SVG with color values passed as JS props, not CSS
// classes — `stroke="#E3E9EC"` can't follow a `.dark` class the way
// `className="stroke-surface-line"` could elsewhere in the app. Resolve the
// actual theme CSS variables at render time instead, and re-read them
// whenever the theme toggle flips the `dark` class.
function useChartColors() {
  const [colors, setColors] = useState({ line: "#E3E9EC", muted: "#7C8993", blue: "#1E6FA8", surface: "#FFFFFF", ink: "#1F2A33" });

  useEffect(() => {
    function read() {
      const style = getComputedStyle(document.documentElement);
      const rgb = (name: string, fallback: string) => {
        const raw = style.getPropertyValue(name).trim();
        return raw ? `rgb(${raw.replace(/\s+/g, ",")})` : fallback;
      };
      setColors({
        line: rgb("--color-surface-line", "#E3E9EC"),
        muted: rgb("--color-ink-muted", "#7C8993"),
        blue: rgb("--color-brand-blue", "#1E6FA8"),
        surface: rgb("--color-surface", "#FFFFFF"),
        ink: rgb("--color-ink", "#1F2A33"),
      });
    }
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return colors;
}

export default function HealthChart({ records }: { records: HealthRecordLite[] }) {
  const [activeRange, setActiveRange] = useState<RangeKey>("today");
  const colors = useChartColors();
  const data = bucketRecords(records, activeRange);

  return (
    <DashboardCard title="แนวโน้มสุขภาพ">
      <div
        role="tablist"
        aria-label="ช่วงเวลาแนวโน้มสุขภาพ"
        className="mb-5 inline-flex rounded-lg bg-surface-soft p-1"
      >
        {ranges.map((r) => (
          <button
            key={r.key}
            role="tab"
            aria-selected={activeRange === r.key}
            onClick={() => setActiveRange(r.key)}
            className={`cursor-pointer rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeRange === r.key
                ? "bg-surface text-brand-blue shadow-card"
                : "text-ink-muted hover:text-ink-soft"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="h-64 w-full">
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-ink-muted">
            ยังไม่มีข้อมูลสุขภาพในช่วงนี้
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.line} />
              <XAxis
                dataKey="time"
                tick={{ fill: colors.muted, fontSize: 12 }}
                axisLine={{ stroke: colors.line }}
                tickLine={false}
              />
              <YAxis
                domain={["dataMin - 5", "dataMax + 5"]}
                tick={{ fill: colors.muted, fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={36}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 10,
                  border: `1px solid ${colors.line}`,
                  background: colors.surface,
                  color: colors.ink,
                  fontSize: 13,
                }}
                formatter={(value: number) => [`${value} BPM`, "อัตราการเต้นหัวใจ"]}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={colors.blue}
                strokeWidth={2.5}
                dot={{ r: 3, fill: colors.blue }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </DashboardCard>
  );
}
