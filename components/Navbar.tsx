"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Leaf } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

const navLinks = [
  { href: "/#home", label: "หน้าหลัก" },
  { href: "/#features", label: "บริการ" },
  { href: "/#caregivers", label: "ผู้ดูแล" },
  { href: "/#about", label: "เกี่ยวกับเรา" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-surface-line bg-surface/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold text-brand-blue">
          <Leaf size={22} className="text-brand-green" aria-hidden="true" />
          Eldercare Tech
        </Link>

        <nav aria-label="เมนูหลัก" className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-[0.95rem] font-medium text-ink-soft transition-colors hover:text-brand-blue"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          <Link href="/login" className="btn-ghost">
            เข้าสู่ระบบ
          </Link>
          <Link href="/register" className="btn-primary">
            สมัครใช้งาน
          </Link>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            className="cursor-pointer text-ink"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "ปิดเมนู" : "เปิดเมนู"}
            aria-expanded={open}
          >
            {open ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </div>

      {open && (
        <nav
          aria-label="เมนูมือถือ"
          className="flex flex-col gap-1 border-t border-surface-line px-5 pb-5 pt-3 md:hidden"
        >
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-3 text-[0.95rem] font-medium text-ink-soft hover:bg-surface-soft"
            >
              {link.label}
            </a>
          ))}
          <div className="mt-2 flex flex-col gap-2">
            <Link href="/login" className="btn-secondary w-full" onClick={() => setOpen(false)}>
              เข้าสู่ระบบ
            </Link>
            <Link href="/register" className="btn-primary w-full" onClick={() => setOpen(false)}>
              สมัครใช้งาน
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
