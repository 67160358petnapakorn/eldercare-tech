"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  heartRateToday,
  heartRateWeek,
  heartRateMonth,
} from "@/data/mockData";
import DashboardCard from "./DashboardCard";

type RangeKey = "today" | "week" | "month";

const ranges: { key: RangeKey; label: string; data: typeof heartRateToday }[] = [
  { key: "today", label: "วันนี้", data: heartRateToday },
  { key: "week", label: "7 วัน", data: heartRateWeek },
  { key: "month", label: "30 วัน", data: heartRateMonth },
];

export default function HealthChart() {
  const [activeRange, setActiveRange] = useState<RangeKey>("today");
  const current = ranges.find((r) => r.key === activeRange)!;

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
                ? "bg-white text-brand-blue shadow-card"
                : "text-ink-muted hover:text-ink-soft"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={current.data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E3E9EC" />
            <XAxis
              dataKey="time"
              tick={{ fill: "#7C8993", fontSize: 12 }}
              axisLine={{ stroke: "#E3E9EC" }}
              tickLine={false}
            />
            <YAxis
              domain={["dataMin - 5", "dataMax + 5"]}
              tick={{ fill: "#7C8993", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={36}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 10,
                border: "1px solid #E3E9EC",
                fontSize: 13,
              }}
              formatter={(value: number) => [`${value} BPM`, "อัตราการเต้นหัวใจ"]}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#1E6FA8"
              strokeWidth={2.5}
              dot={{ r: 3, fill: "#1E6FA8" }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </DashboardCard>
  );
}
