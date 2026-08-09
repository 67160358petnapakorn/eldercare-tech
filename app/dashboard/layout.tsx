import { Bell } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { currentUser } from "@/data/mockData";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-surface-soft">
      <Sidebar />

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-surface-line bg-white/90 px-5 py-4 backdrop-blur sm:px-8">
          <div className="flex items-center justify-between gap-4 pl-14 lg:pl-0">
            <div>
              <h1 className="text-lg font-bold text-ink sm:text-xl">
                สวัสดี คุณ{currentUser.firstName} 👋
              </h1>
              <p className="text-sm text-ink-muted">
                วันนี้คุณมีรายการดูแล {currentUser.todayTasksCount} รายการ
              </p>
            </div>

            <div className="flex items-center gap-4">
              <button
                className="relative cursor-pointer rounded-full p-2 text-ink-soft hover:bg-surface-soft"
                aria-label="การแจ้งเตือน"
              >
                <Bell size={22} />
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-status-red" />
              </button>

              <div className="flex items-center gap-2.5">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-blue-light text-xl"
                  aria-hidden="true"
                >
                  {currentUser.avatar}
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-semibold text-ink">
                    {currentUser.firstName}
                  </p>
                  <p className="text-xs text-ink-muted">{currentUser.role}</p>
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
