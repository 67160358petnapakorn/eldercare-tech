"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquareText, Star } from "lucide-react";

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

export default function ReviewsPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWithToken("/api/reviews?size=20")
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
    return <div className="text-ink-muted">กำลังโหลดข้อมูลรีวิว...</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-ink">Review / ความประทับใจ</h2>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-surface-line bg-white p-6 text-ink-muted">
          ยังไม่มีข้อมูลรีวิว
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((review) => (
            <div key={review.id} className="rounded-2xl border border-surface-line bg-white p-5 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-brand-blue">
                    <MessageSquareText size={18} />
                    <span className="font-semibold">Booking #{review.booking_id}</span>
                  </div>
                  <p className="mt-2 text-sm text-ink-soft">{review.comment ?? "-"}</p>
                </div>
                <div className="flex items-center gap-1 rounded-full bg-brand-blue-light px-2.5 py-1 text-sm font-semibold text-brand-blue">
                  <Star size={14} className="fill-current" />
                  {review.rating}/5
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div>
                  <p className="text-xs text-ink-muted">Caregiver ID</p>
                  <p className="mt-1 text-sm font-medium text-ink">#{review.caregiver_id}</p>
                </div>
                <div>
                  <p className="text-xs text-ink-muted">Booking ID</p>
                  <p className="mt-1 text-sm font-medium text-ink">#{review.booking_id}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
