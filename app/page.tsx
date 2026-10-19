import Link from "next/link";
import {
  ShieldCheck,
  HeartPulse,
  Pill,
  Calendar,
  Building2,
  UserPlus,
  Search,
  MonitorSmartphone,
  Lock,
  Users,
  Handshake,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LandingElderPreview from "@/components/LandingElderPreview";

const features = [
  {
    icon: ShieldCheck,
    title: "Verified Caregiver",
    description: "ค้นหาผู้ดูแลที่ผ่านการตรวจสอบประวัติ",
  },
  {
    icon: HeartPulse,
    title: "Health Monitoring",
    description: "ติดตามข้อมูลสุขภาพของคนที่คุณรัก",
  },
  {
    icon: Pill,
    title: "Medication",
    description: "จัดการตารางยาและแจ้งเตือนการรับประทานยา",
  },
  {
    icon: Calendar,
    title: "Appointment",
    description: "จัดการนัดหมายแพทย์ได้ง่าย",
  },
  {
    icon: Building2,
    title: "Hospital Partner",
    description: "เชื่อมต่อคลินิกและโรงพยาบาลเมื่อจำเป็น",
  },
];

const steps = [
  {
    icon: UserPlus,
    title: "เพิ่มคนที่คุณรัก",
    description: "เพิ่มข้อมูลผู้สูงอายุเข้าสู่ระบบ",
  },
  {
    icon: Search,
    title: "เลือกบริการที่ต้องการ",
    description: "ค้นหาและจองผู้ดูแลตามความต้องการ",
  },
  {
    icon: MonitorSmartphone,
    title: "ติดตามได้ทุกที่",
    description: "ดูสุขภาพ ยา นัดหมาย และการดูแลจาก Dashboard",
  },
];

const trustItems = [
  { icon: ShieldCheck, label: "Verified Caregiver" },
  { icon: Lock, label: "Secure Health Data" },
  { icon: Users, label: "Family Access Control" },
  { icon: Handshake, label: "Trusted Healthcare Partners" },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <section id="home" className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <span className="inline-block rounded-full bg-brand-blue-light px-4 py-1.5 text-sm font-medium text-brand-blue">
                Eldercare Technology
              </span>
              <h1 className="mt-5 text-4xl font-bold leading-tight text-ink sm:text-5xl">
                ดูแลคนที่คุณรัก แม้อยู่ไกลกัน
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">
                แพลตฟอร์มดูแลผู้สูงอายุที่ช่วยให้คุณค้นหาผู้ดูแล
                ติดตามสุขภาพ จัดการยา และนัดหมายแพทย์ได้ในที่เดียว
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/register" className="btn-primary">
                  เริ่มดูแลครอบครัว
                </Link>
                <Link href="/#caregivers" className="btn-secondary">
                  ค้นหาผู้ดูแล
                </Link>
              </div>
            </div>

            {/* Dashboard preview: real data for a logged-in user with an
                elder on file, otherwise the labeled example card below */}
            <div className="relative">
              <LandingElderPreview />
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="bg-surface py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <h2 className="text-center text-3xl font-bold text-ink">
              ทุกเรื่องการดูแล อยู่ในที่เดียว
            </h2>
            <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
              {features.map((feature) => (
                <div key={feature.title} className="card p-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-blue-light text-brand-blue">
                    <feature.icon size={22} aria-hidden="true" />
                  </div>
                  <h3 className="mt-4 font-semibold text-ink">{feature.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="caregivers" className="py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <h2 className="text-center text-3xl font-bold text-ink">
              เริ่มดูแลได้ง่ายใน 3 ขั้นตอน
            </h2>
            <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3">
              {steps.map((step, index) => (
                <div key={step.title} className="text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-green-light text-brand-green">
                    <step.icon size={26} aria-hidden="true" />
                  </div>
                  <p className="mt-4 text-sm font-semibold text-brand-blue">
                    ขั้นตอนที่ {index + 1}
                  </p>
                  <h3 className="mt-1 text-lg font-bold text-ink">{step.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Trust */}
        <section id="about" className="bg-surface py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <h2 className="text-center text-3xl font-bold text-ink">
              ความปลอดภัยและความใส่ใจคือสิ่งสำคัญ
            </h2>
            <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {trustItems.map((item) => (
                <div
                  key={item.label}
                  className="card flex items-center gap-3 p-5"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-green-light text-brand-green">
                    <item.icon size={20} aria-hidden="true" />
                  </div>
                  <p className="font-medium text-ink">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-brand-blue py-16 sm:py-20">
          <div className="mx-auto max-w-3xl px-5 text-center sm:px-8">
            <h2 className="text-3xl font-bold text-white">
              เริ่มต้นดูแลคนที่คุณรักวันนี้
            </h2>
            <p className="mt-4 text-lg text-white/90">
              ไม่ว่าคุณจะอยู่ใกล้หรือไกล Eldercare Tech
              ช่วยให้คุณดูแลครอบครัวได้ง่ายขึ้น
            </p>
            <Link
              href="/register"
              className="btn mt-8 inline-flex bg-surface text-brand-blue hover:bg-surface-soft"
            >
              เริ่มใช้งานฟรี
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
