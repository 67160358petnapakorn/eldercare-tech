"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, MapPin, Star, Clock3 } from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

async function fetchWithToken(path: string) {
  const token = localStorage.getItem("eldercare_access_token");
  if (!token) throw new Error("missing-token");

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("fetch-failed");
  }

  return response.json();
}

export default function CaregiversPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWithToken("/api/caregivers")
      .then((data) => setItems(data.items ?? []))
      .catch(() => router.replace("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return <div className="text-ink-muted">กำลังโหลดข้อมูลผู้ดูแล...</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-ink">ผู้ดูแล</h2>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-surface-line bg-white p-6 text-ink-muted">
          ยังไม่มีข้อมูลผู้ดูแล
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((caregiver) => (
            <div key={caregiver.id} className="rounded-2xl border border-surface-line bg-white p-5 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-blue">Caregiver</p>
                  <h3 className="mt-2 text-xl font-bold text-ink">{caregiver.name}</h3>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-blue-light text-2xl">
                  👩‍⚕️
                </div>
              </div>

              <div className="mt-4 space-y-2 text-sm text-ink-soft">
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-brand-blue" />
                  {caregiver.location ?? "ไม่ระบุพื้นที่"}
                </div>
                <div className="flex items-center gap-2">
                  <Clock3 size={16} className="text-brand-blue" />
                  {caregiver.experience ?? 0} ปี ประสบการณ์
                </div>
                <div className="flex items-center gap-2">
                  <Star size={16} className="text-brand-blue" />
                  {caregiver.rating ?? 0} / 5
                </div>
              </div>

              {caregiver.verified ? (
                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-status-green-bg px-2.5 py-1 text-xs font-medium text-status-green">
                  <BadgeCheck size={14} />
                  Verified
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
