"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { apiFetch, getAccessToken, logoutRequest } from "@/lib/api";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState({
    firstName: "ผู้ใช้งาน",
    role: "Family",
    avatar: "🧑",
  });
  const [careItemCount, setCareItemCount] = useState<number | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!getAccessToken()) {
      router.replace("/login");
      return;
    }

    async function loadUser() {
      try {
        const data = await apiFetch("/api/auth/me");
        const firstName = data.first_name || data.username || "ผู้ใช้งาน";
        setUser({
          firstName,
          role: data.role ? data.role.charAt(0).toUpperCase() + data.role.slice(1) : "Family",
          avatar: data.role === "admin" ? "🛡️" : data.role === "caregiver" ? "👩‍⚕️" : "🧑",
        });
      } catch {
        // apiFetch already clears tokens and redirects to /login on auth failure
        return;
      }

      try {
        const [summary, notifications] = await Promise.all([
          apiFetch("/api/dashboard/summary"),
          apiFetch("/api/notifications?size=50"),
        ]);
        setCareItemCount(summary?.counts?.elders ?? 0);
        const unread = (notifications?.items ?? []).filter((n: { is_read: boolean }) => !n.is_read).length;
        setUnreadCount(unread);
      } catch {
        // dashboard chrome degrades gracefully without summary/notification counts
      }
    }

    loadUser();
  }, [router]);

  async function handleLogout() {
    await logoutRequest();
    router.replace("/login");
  }

  return (
    <div className="flex min-h-screen bg-surface-soft">
      <Sidebar onLogout={handleLogout} />

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-surface-line bg-white/90 px-5 py-4 backdrop-blur sm:px-8">
          <div className="flex items-center justify-between gap-4 pl-14 lg:pl-0">
            <div>
              <h1 className="text-lg font-bold text-ink sm:text-xl">
                สวัสดี คุณ{user.firstName} 👋
              </h1>
              <p className="text-sm text-ink-muted">
                {careItemCount === null
                  ? "กำลังโหลดข้อมูล..."
                  : `วันนี้คุณมีรายการดูแล ${careItemCount} รายการ`}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/dashboard/notifications")}
                className="relative cursor-pointer rounded-full p-2 text-ink-soft hover:bg-surface-soft"
                aria-label={unreadCount > 0 ? `การแจ้งเตือน (${unreadCount} รายการใหม่)` : "การแจ้งเตือน"}
              >
                <Bell size={22} />
                {unreadCount > 0 ? (
                  <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-status-red" />
                ) : null}
              </button>

              <div className="flex items-center gap-2.5">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-blue-light text-xl"
                  aria-hidden="true"
                >
                  {user.avatar}
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-semibold text-ink">{user.firstName}</p>
                  <p className="text-xs text-ink-muted">{user.role}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 px-5 py-6 sm:px-8">{children}</main>
      </div>
    </div>
  );
}
