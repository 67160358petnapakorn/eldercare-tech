"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, MapPin, Star, Clock3 } from "lucide-react";
import { API_BASE_URL, apiFetch as fetchWithToken } from "@/lib/api";
import PhotoUpload from "@/components/PhotoUpload";

export default function CaregiversPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [photoError, setPhotoError] = useState<Record<number, string>>({});

  useEffect(() => {
    Promise.all([fetchWithToken("/api/caregivers"), fetchWithToken("/api/auth/me")])
      .then(([data, me]) => {
        setItems(data.items ?? []);
        setCurrentUserId(me.id);
      })
      .catch(() => router.replace("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  async function handlePhotoUploaded(caregiverId: number, url: string) {
    setPhotoError((current) => ({ ...current, [caregiverId]: "" }));
    try {
      const updated = await fetchWithToken(`/api/caregivers/${caregiverId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photo_url: url }),
      });
      setItems((current) => current.map((it) => (it.id === caregiverId ? updated : it)));
    } catch (err: any) {
      setPhotoError((current) => ({ ...current, [caregiverId]: err?.message ?? "บันทึกรูปภาพไม่สำเร็จ" }));
    }
  }

  if (loading) {
    return <div className="text-ink-muted">กำลังโหลดข้อมูลผู้ดูแล...</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-ink">ผู้ดูแล</h2>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-surface-line bg-surface p-6 text-ink-muted">
          ยังไม่มีข้อมูลผู้ดูแล
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((caregiver) => {
            const isOwnProfile = caregiver.user_id === currentUserId;
            return (
              <div key={caregiver.id} className="rounded-2xl border border-surface-line bg-surface p-5 shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-blue">Caregiver</p>
                    <h3 className="mt-2 text-xl font-bold text-ink">{caregiver.name}</h3>
                  </div>
                  {isOwnProfile ? (
                    <PhotoUpload
                      photoUrl={caregiver.photo_url}
                      size={48}
                      fallback={
                        <span className="flex h-full w-full items-center justify-center bg-brand-blue-light text-2xl" aria-hidden="true">
                          👩‍⚕️
                        </span>
                      }
                      onUploaded={(url) => handlePhotoUploaded(caregiver.id, url)}
                      onError={(message) => setPhotoError((current) => ({ ...current, [caregiver.id]: message }))}
                    />
                  ) : (
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full">
                      {caregiver.photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={`${API_BASE_URL}${caregiver.photo_url}`} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-brand-blue-light text-2xl" aria-hidden="true">
                          👩‍⚕️
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {photoError[caregiver.id] ? (
                  <p className="mt-2 text-xs text-status-red">{photoError[caregiver.id]}</p>
                ) : null}

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
            );
          })}
        </div>
      )}
    </div>
  );
}
