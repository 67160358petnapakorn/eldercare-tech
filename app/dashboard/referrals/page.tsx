"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, ClipboardList, ShieldAlert } from "lucide-react";
import { apiFetch as fetchWithToken } from "@/lib/api";

export default function ReferralsPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWithToken("/api/referrals?size=20")
      .then((data) => setItems(data.items ?? []))
      .catch((error: any) => {
        if (error?.status === 401 || error?.status === 403) {
          router.replace("/login");
          return;
        }
        router.replace("/login");
      })
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return <div className="text-ink-muted">กำลังโหลดข้อมูล referral...</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-ink">Referral / การส่งต่อ</h2>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-surface-line bg-white p-6 text-ink-muted">
          ยังไม่มีข้อมูล referral
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-2xl border border-surface-line bg-white p-5 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-brand-blue">
                    <ClipboardList size={18} />
                    <span className="font-semibold">Elder #{item.elder_id} → Partner #{item.partner_id}</span>
                  </div>
                  <p className="mt-2 text-sm text-ink-soft">{item.reason}</p>
                </div>
                <span className="rounded-full bg-brand-blue-light px-2.5 py-1 text-xs font-medium text-brand-blue">
                  {item.status}
                </span>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-4">
                <div>
                  <p className="text-xs text-ink-muted">Priority</p>
                  <p className="mt-1 flex items-center gap-2 text-sm font-medium text-ink">
                    {item.priority === "urgent" || item.priority === "high" ? <ShieldAlert size={14} className="text-status-red" /> : <AlertTriangle size={14} className="text-brand-blue" />}
                    {item.priority}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-ink-muted">Symptoms</p>
                  <p className="mt-1 text-sm font-medium text-ink">{item.symptoms ?? "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-ink-muted">Consent</p>
                  <p className="mt-1 flex items-center gap-2 text-sm font-medium text-ink">
                    {item.consent ? <CheckCircle2 size={14} className="text-status-green" /> : <AlertTriangle size={14} className="text-status-red" />}
                    {item.consent ? "ยินยอม" : "ยังไม่ยินยอม"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-ink-muted">เผยแพร่ / สถานะ</p>
                  <p className="mt-1 text-sm font-medium text-ink">{item.status}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
