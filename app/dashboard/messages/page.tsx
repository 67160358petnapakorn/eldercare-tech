"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BellRing, CheckCheck, MessageSquareText } from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

async function fetchWithToken(path: string, init?: RequestInit) {
  const token = localStorage.getItem("eldercare_access_token");
  if (!token) throw new Error("missing-token");

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${token}`,
      ...(init?.method && init.method !== "GET" ? { "Content-Type": "application/json" } : {}),
    },
  });

  if (!response.ok) {
    throw new Error("request-failed");
  }

  return response.json();
}

export default function MessagesPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingId, setMarkingId] = useState<number | null>(null);

  async function loadMessages() {
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
    try {
      setMarkingId(id);
      await fetchWithToken(`/api/notifications/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ is_read: true }),
      });

      setItems((current) => current.map((item) => (item.id === id ? { ...item, is_read: true } : item)));
    } catch {
      router.replace("/login");
    } finally {
      setMarkingId(null);
    }
  }

  useEffect(() => {
    loadMessages();
  }, [router]);

  if (loading) {
    return <div className="text-ink-muted">กำลังโหลดข้อความ...</div>;
  }

  const unreadCount = items.filter((item) => !item.is_read).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-ink">ข้อความ</h2>
          <p className="mt-1 text-sm text-ink-soft">ติดตามการแจ้งเตือนและข้อความจากระบบ</p>
        </div>
        {unreadCount > 0 ? (
          <span className="rounded-full bg-brand-blue-light px-3 py-1 text-sm font-semibold text-brand-blue">
            {unreadCount} ยังไม่ได้อ่าน
          </span>
        ) : null}
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-surface-line bg-white p-6 text-ink-soft">
          ยังไม่มีข้อความในระบบตอนนี้
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-2xl border border-surface-line bg-white p-5 shadow-card">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-brand-blue-light p-2.5 text-brand-blue">
                  {item.is_read ? <CheckCheck size={18} /> : <MessageSquareText size={18} />}
                </div>

                <div className="flex-1">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="font-semibold text-ink">{item.title ?? "ข้อความจากระบบ"}</h3>
                      <p className="mt-1 text-xs uppercase tracking-wide text-ink-muted">{item.type ?? "notification"}</p>
                    </div>
                    {!item.is_read ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-status-red-bg px-2 py-1 text-xs font-medium text-status-red">
                        <BellRing size={12} /> ใหม่
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-status-green">อ่านแล้ว</span>
                    )}
                  </div>

                  <p className="mt-3 text-sm leading-6 text-ink-soft">{item.message}</p>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <p className="text-xs text-ink-muted">
                      {item.created_at ? new Date(item.created_at).toLocaleString("th-TH") : "เมื่อเร็ว ๆ นี้"}
                    </p>

                    {!item.is_read ? (
                      <button
                        type="button"
                        onClick={() => markAsRead(item.id)}
                        disabled={markingId === item.id}
                        className="text-sm font-medium text-brand-blue hover:underline disabled:opacity-60"
                      >
                        {markingId === item.id ? "กำลังบันทึก..." : "ทำเครื่องหมายว่าอ่านแล้ว"}
                      </button>
                    ) : null}
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
