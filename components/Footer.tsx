import Link from "next/link";
import { Leaf } from "lucide-react";

const footerLinks = [
  { href: "/#about", label: "เกี่ยวกับเรา" },
  { href: "/#features", label: "บริการ" },
  { href: "/privacy", label: "ความเป็นส่วนตัว" },
  { href: "/contact", label: "ติดต่อเรา" },
];

export default function Footer() {
  return (
    <footer className="border-t border-surface-line bg-white">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-5 py-10 text-center sm:px-8">
        <div className="flex items-center gap-2 text-lg font-bold text-brand-blue">
          <Leaf size={20} className="text-brand-green" aria-hidden="true" />
          Eldercare Tech
        </div>
        <p className="text-sm text-ink-muted">ดูแลคนที่คุณรัก แม้อยู่ไกลกัน</p>

        <nav aria-label="ลิงก์ท้ายหน้า" className="flex flex-wrap justify-center gap-x-6 gap-y-2">
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-ink-soft hover:text-brand-blue"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <p className="mt-2 text-xs text-ink-muted">© 2026 Eldercare Tech</p>
      </div>
    </footer>
  );
}
