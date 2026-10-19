"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, HeartPulse, Thermometer, Droplets } from "lucide-react";
import { apiFetch as fetchWithToken } from "@/lib/api";

export default function HealthPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWithToken("/api/health-records")
      .then((data) => setItems(data.items ?? []))
      .catch(() => router.replace("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return <div className="text-ink-muted">กำลังโหลดข้อมูลสุขภาพ...</div>;
  }

  const cards = items[0]
    ? [
        { id: "heart", label: "อัตราการเต้นหัวใจ", value: `${items[0].heart_rate ?? 0} BPM`, icon: HeartPulse },
        { id: "bp", label: "ความดันโลหิต", value: `${items[0].systolic ?? 0}/${items[0].diastolic ?? 0} mmHg`, icon: Activity },
        { id: "temp", label: "อุณหภูมิ", value: `${(items[0].temperature ?? 0).toFixed(1)} °C`, icon: Thermometer },
        { id: "spo2", label: "ออกซิเจนในเลือด", value: `${items[0].spo2 ?? 0} %`, icon: Droplets },
      ]
    : [];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-ink">สุขภาพ</h2>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-surface-line bg-white p-6 text-ink-muted">
          ยังไม่มีข้อมูลสุขภาพ
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {cards.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.id} className="rounded-2xl border border-surface-line bg-white p-5 shadow-card">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-ink-muted">{card.label}</span>
                    <div className="rounded-lg bg-brand-blue-light p-2 text-brand-blue">
                      <Icon size={18} />
                    </div>
                  </div>
                  <p className="mt-4 text-2xl font-bold text-ink">{card.value}</p>
                </div>
              );
            })}
          </div>

          <div className="rounded-2xl border border-surface-line bg-white p-5 shadow-card">
            <h3 className="text-lg font-bold text-ink">ข้อมูลล่าสุด</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div><span className="text-sm text-ink-muted">น้ำหนัก</span><p className="text-lg font-semibold text-ink">{items[0].weight ?? "-"} kg</p></div>
              <div><span className="text-sm text-ink-muted">ระดับน้ำตาล</span><p className="text-lg font-semibold text-ink">{items[0].blood_sugar ?? "-"} mg/dL</p></div>
              <div><span className="text-sm text-ink-muted">การนอน</span><p className="text-lg font-semibold text-ink">{items[0].sleep_hours ?? "-"} ชั่วโมง</p></div>
              <div><span className="text-sm text-ink-muted">กิจกรรม</span><p className="text-lg font-semibold text-ink">{items[0].activity ?? "-"} steps</p></div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
