"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BellRing, Dot } from "lucide-react";

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

export default function NotificationsPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadNotifications() {
    try {
      const data = await fetchWithToken("/api/notifications?size=20");
      setItems(data.items ?? []);
    } catch {
      router.replace("/login");
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(id: number) {
    const token = localStorage.getItem("eldercare_access_token");
    if (!token) {
      router.replace("/login");
      return;
    }

    const response = await fetch(`${API_BASE_URL}/api/notifications/${id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ is_read: true }),
    });

    if (response.ok) {
      setItems((current) => current.map((item) => (item.id === id ? { ...item, is_read: true } : item)));
    }
  }

  async function markAllAsRead() {
    const unreadIds = items.filter((item) => !item.is_read).map((item) => item.id);

    await Promise.all(unreadIds.map((id) => markAsRead(id)));
  }

  useEffect(() => {
    loadNotifications();
  }, [router]);

  if (loading) {
    return <div className="text-ink-muted">กำลังโหลดการแจ้งเตือน...</div>;
  }

  const unreadCount = items.filter((item) => !item.is_read).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-ink">การแจ้งเตือน</h2>
        {unreadCount > 0 ? (
          <button type="button" onClick={markAllAsRead} className="btn-secondary text-sm">
            อ่านทั้งหมด ({unreadCount})
          </button>
        ) : null}
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-surface-line bg-white p-6 text-ink-muted">
          ยังไม่มีการแจ้งเตือน
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-2xl border border-surface-line bg-white p-5 shadow-card">
              <div className="flex items-start gap-3">
                <div className="mt-1 rounded-full bg-brand-blue-light p-2 text-brand-blue">
                  <BellRing size={16} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-ink">{item.title}</h3>
                    {!item.is_read ? <Dot className="text-status-red" size={18} /> : null}
                  </div>
                  <p className="mt-2 text-sm text-ink-soft">{item.message}</p>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <p className="text-xs text-ink-muted">{item.type ?? "notification"}</p>
                    {!item.is_read ? (
                      <button
                        type="button"
                        onClick={() => markAsRead(item.id)}
                        className="text-sm font-medium text-brand-blue hover:underline"
                      >
                        ทำเครื่องหมายว่าอ่านแล้ว
                      </button>
                    ) : (
                      <span className="text-xs font-medium text-status-green">อ่านแล้ว</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
