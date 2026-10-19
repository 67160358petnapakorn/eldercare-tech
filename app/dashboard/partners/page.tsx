"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, Building2, Mail, MapPin, Phone } from "lucide-react";

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
    throw Object.assign(new Error("fetch-failed"), { status: response.status });
  }

  return response.json();
}

export default function PartnersPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWithToken("/api/partners?size=20")
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
    return <div className="text-ink-muted">กำลังโหลดข้อมูล partner...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-ink">Partner / หน่วยงานร่วมมือ</h2>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-surface-line bg-white p-6 text-ink-muted">
          ยังไม่มีข้อมูล partner
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((partner) => (
            <div key={partner.id} className="rounded-2xl border border-surface-line bg-white p-5 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-blue">{partner.type}</p>
                  <h3 className="mt-2 text-xl font-bold text-ink">{partner.name}</h3>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-green-light text-2xl">
                  <Building2 size={20} className="text-brand-green" />
                </div>
              </div>

              <div className="mt-4 space-y-2 text-sm text-ink-soft">
                {partner.address ? (
                  <div className="flex items-start gap-2">
                    <MapPin size={16} className="mt-0.5 text-brand-blue" />
                    <span>{partner.address}</span>
                  </div>
                ) : null}
                {partner.phone ? (
                  <div className="flex items-center gap-2">
                    <Phone size={16} className="text-brand-blue" />
                    <span>{partner.phone}</span>
                  </div>
                ) : null}
                {partner.email ? (
                  <div className="flex items-center gap-2">
                    <Mail size={16} className="text-brand-blue" />
                    <span>{partner.email}</span>
                  </div>
                ) : null}
              </div>

              {partner.description ? <p className="mt-4 text-sm text-ink-soft">{partner.description}</p> : null}

              {partner.verified ? (
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
