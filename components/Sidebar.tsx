"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Leaf,
  LayoutDashboard,
  UserRound,
  HeartPulse,
  Pill,
  CalendarDays,
  Users,
  ClipboardList,
  Bell,
  MessageCircle,
  Settings,
  LogOut,
  Menu,
  X,
  Building2,
  FileText,
  Star,
  ShieldCheck,
} from "lucide-react";

const overviewLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
];

const careLinks = [
  { href: "/dashboard/elders", label: "ผู้สูงอายุ", icon: UserRound },
  { href: "/dashboard/health", label: "สุขภาพ", icon: HeartPulse },
  { href: "/dashboard/medications", label: "ยา", icon: Pill },
  { href: "/dashboard/appointments", label: "นัดหมาย", icon: CalendarDays },
  { href: "/dashboard/caregivers", label: "ผู้ดูแล", icon: Users },
  { href: "/dashboard/bookings", label: "การจอง", icon: ClipboardList },
  { href: "/dashboard/partners", label: "Partner", icon: Building2 },
  { href: "/dashboard/referrals", label: "Referral", icon: FileText },
  { href: "/dashboard/reviews", label: "Review", icon: Star },
];

const otherLinks = [
  { href: "/dashboard/notifications", label: "การแจ้งเตือน", icon: Bell },
  { href: "/dashboard/users", label: "ผู้ใช้งาน", icon: ShieldCheck },
  { href: "/dashboard/messages", label: "ข้อความ", icon: MessageCircle },
  { href: "/dashboard/settings", label: "ตั้งค่า", icon: Settings },
];

function NavGroup({
  label,
  links,
  onNavigate,
}: {
  label: string;
  links: typeof careLinks;
  onNavigate: () => void;
}) {
  return (
    <div>
      <p className="px-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
        {label}
      </p>
      <ul className="mt-2 flex flex-col gap-1">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                onClick={onNavigate}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[0.95rem] font-medium text-ink-soft transition-colors hover:bg-brand-blue-light hover:text-brand-blue"
              >
                <Icon size={19} aria-hidden="true" />
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function SidebarContent({ onNavigate }: { onNavigate: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <Link
        href="/"
        className="flex items-center gap-2 px-3 py-2 text-lg font-bold text-brand-blue"
      >
        <Leaf size={22} className="text-brand-green" aria-hidden="true" />
        Eldercare Tech
      </Link>

      <nav className="mt-6 flex flex-1 flex-col gap-6 overflow-y-auto">
        <NavGroup label="Overview" links={overviewLinks} onNavigate={onNavigate} />
        <NavGroup label="Care" links={careLinks} onNavigate={onNavigate} />
        <NavGroup label="Other" links={otherLinks} onNavigate={onNavigate} />
      </nav>

      <Link
        href="/login"
        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[0.95rem] font-medium text-status-red hover:bg-status-red-bg"
      >
        <LogOut size={19} aria-hidden="true" />
        ออกจากระบบ
      </Link>
    </div>
  );
}

export default function Sidebar({ onLogout }: { onLogout?: () => void }) {
  const [open, setOpen] = useState(false);

  const handleLogoutClick = () => {
    onLogout?.();
    setOpen(false);
  };

  function SidebarContentWithLogout({ onNavigate }: { onNavigate: () => void }) {
    return (
      <div className="flex h-full flex-col">
        <Link
          href="/"
          className="flex items-center gap-2 px-3 py-2 text-lg font-bold text-brand-blue"
        >
          <Leaf size={22} className="text-brand-green" aria-hidden="true" />
          Eldercare Tech
        </Link>

        <nav className="mt-6 flex flex-1 flex-col gap-6 overflow-y-auto">
          <NavGroup label="Overview" links={overviewLinks} onNavigate={onNavigate} />
          <NavGroup label="Care" links={careLinks} onNavigate={onNavigate} />
          <NavGroup label="Other" links={otherLinks} onNavigate={onNavigate} />
        </nav>

        <button
          type="button"
          onClick={handleLogoutClick}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[0.95rem] font-medium text-status-red hover:bg-status-red-bg"
        >
          <LogOut size={19} aria-hidden="true" />
          ออกจากระบบ
        </button>
      </div>
    );
  }

  return (
    <>
      <aside className="hidden w-72 shrink-0 border-r border-surface-line bg-white p-5 lg:block">
        <SidebarContentWithLogout onNavigate={() => {}} />
      </aside>

      <button
        className="fixed left-4 top-4 z-40 flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg border border-surface-line bg-white shadow-card lg:hidden"
        onClick={() => setOpen(true)}
        aria-label="เปิดเมนู"
      >
        <Menu size={22} className="text-ink" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-ink/30"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <aside className="absolute left-0 top-0 h-full w-72 bg-white p-5 shadow-lg">
            <button
              className="absolute right-4 top-4 cursor-pointer text-ink-muted"
              onClick={() => setOpen(false)}
              aria-label="ปิดเมนู"
            >
              <X size={22} />
            </button>
            <SidebarContentWithLogout onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}
    </>
  );
}
