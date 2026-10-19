"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, UserCircle2 } from "lucide-react";
import { apiFetch as fetchWithToken } from "@/lib/api";

export default function UsersPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    fetchWithToken("/api/users?size=20")
      .then((data) => setItems(data.items ?? []))
      .catch((error: any) => {
        if (error?.status === 401 || error?.status === 403) {
          setAccessDenied(true);
          return;
        }
        router.replace("/login");
      })
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return <div className="text-ink-muted">กำลังโหลดข้อมูลผู้ใช้งาน...</div>;
  }

  if (accessDenied) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
        <div className="flex items-center gap-2 font-semibold">
          <ShieldCheck size={18} />
          คุณไม่มีสิทธิ์เข้าถึงหน้า user management
        </div>
        <p className="mt-2 text-sm">เฉพาะ admin เท่านั้นที่สามารถดูข้อมูลผู้ใช้งานได้</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-ink">Users / ผู้ใช้งาน</h2>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-surface-line bg-surface p-6 text-ink-muted">
          ยังไม่มีข้อมูลผู้ใช้งาน
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((user) => (
            <div key={user.id} className="rounded-2xl border border-surface-line bg-surface p-5 shadow-card">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-blue-light text-brand-blue">
                    <UserCircle2 size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-ink">
                      {user.first_name || user.username} {user.last_name || ""}
                    </h3>
                    <p className="text-sm text-ink-muted">{user.email}</p>
                  </div>
                </div>
                <span className="rounded-full bg-brand-green-light px-2.5 py-1 text-xs font-medium text-status-green">
                  {user.role}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
