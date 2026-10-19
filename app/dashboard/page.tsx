"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Clock, LogOut } from "lucide-react";
import DashboardCard from "@/components/DashboardCard";
import HealthCard from "@/components/HealthCard";
import HealthChart from "@/components/HealthChart";
import MedicationCard, { type MedicationItem } from "@/components/MedicationCard";
import AppointmentCard, { type AppointmentItem } from "@/components/AppointmentCard";
import CaregiverCard, { type CaregiverItem } from "@/components/CaregiverCard";
import HealthAlert, { type AlertItem } from "@/components/HealthAlert";
import StatusBadge from "@/components/StatusBadge";
import { elder as fallbackElder, type StatusLevel } from "@/data/mockData";
import { apiFetch, logoutRequest } from "@/lib/api";

type DashboardElder = {
  id: number | null;
  name: string;
  age: number;
  relation: string;
  avatar: string;
  statusLabel: string;
  status: StatusLevel;
  lastUpdated: string;
};

function computeAge(dateValue?: string | null): number {
  if (!dateValue) return fallbackElder.age;

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return fallbackElder.age;

  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
    age -= 1;
  }

  return age > 0 ? age : fallbackElder.age;
}

function buildHealthStats(record: any) {
  return [
    {
      id: "heart-rate",
      title: "อัตราการเต้นหัวใจ",
      value: String(record?.heart_rate ?? 72),
      unit: "BPM",
      status: "normal" as StatusLevel,
      statusLabel: "ปกติ",
      icon: "heart" as const,
    },
    {
      id: "blood-pressure",
      title: "ความดันโลหิต",
      value: `${record?.systolic ?? 120}/${record?.diastolic ?? 80}`,
      unit: "mmHg",
      status: "normal" as StatusLevel,
      statusLabel: "ปกติ",
      icon: "activity" as const,
    },
    {
      id: "temperature",
      title: "อุณหภูมิร่างกาย",
      value: (record?.temperature ?? 36.7).toFixed(1),
      unit: "°C",
      status: "normal" as StatusLevel,
      statusLabel: "ปกติ",
      icon: "thermometer" as const,
    },
    {
      id: "spo2",
      title: "ออกซิเจนในเลือด",
      value: String(record?.spo2 ?? 98),
      unit: "%",
      status: "normal" as StatusLevel,
      statusLabel: "ปกติ",
      icon: "droplets" as const,
    },
  ];
}

export default function DashboardPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [userName, setUserName] = useState("ผู้ใช้งาน");
  const [elderProfile, setElderProfile] = useState<DashboardElder>({
    id: null,
    name: fallbackElder.name,
    age: fallbackElder.age,
    relation: fallbackElder.relation,
    avatar: fallbackElder.avatar,
    statusLabel: fallbackElder.statusLabel,
    status: fallbackElder.status,
    lastUpdated: fallbackElder.lastUpdated,
  });
  const [healthSummary, setHealthSummary] = useState(buildHealthStats(null));
  const [medications, setMedications] = useState<MedicationItem[]>([]);
  const [appointment, setAppointment] = useState<AppointmentItem | null>(null);
  const [caregiver, setCaregiver] = useState<CaregiverItem | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const authData = await apiFetch("/api/auth/me");
        const fullName = [authData.first_name, authData.last_name].filter(Boolean).join(" ") || authData.username || "ผู้ใช้งาน";
        setUserName(fullName);

        const [summaryData, elderData] = await Promise.all([
          apiFetch("/api/dashboard/summary").catch(() => null),
          apiFetch("/api/elders").catch(() => null),
        ]);

        const latestFromSummary = summaryData?.latest_health_record ?? null;
        if (latestFromSummary) {
          setHealthSummary(buildHealthStats(latestFromSummary));
        }

        const elderItem = elderData?.items?.[0] ?? null;
        let elderId: number | null = null;
        if (elderItem) {
          elderId = elderItem.id;
          setElderProfile({
            id: elderItem.id,
            name: `${elderItem.first_name} ${elderItem.last_name}`,
            age: computeAge(elderItem.date_of_birth),
            relation: elderItem.relationship_type ?? "ผู้สูงอายุ",
            avatar: elderItem.gender === "male" ? "👴" : "👵",
            statusLabel: "สุขภาพคงที่",
            status: "normal",
            lastUpdated: elderItem.updated_at
              ? new Date(elderItem.updated_at).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })
              : "เมื่อสักครู่",
          });
        }

        if (elderId) {
          const [healthData, medsData, apptData, bookingData, alertsData] = await Promise.all([
            apiFetch(`/api/health-records?elder_id=${elderId}&size=1`).catch(() => null),
            apiFetch(`/api/medications?elder_id=${elderId}&size=3`).catch(() => null),
            apiFetch(`/api/appointments?elder_id=${elderId}&size=5`).catch(() => null),
            apiFetch(`/api/bookings?elder_id=${elderId}&size=1`).catch(() => null),
            apiFetch(`/api/health-alerts?elder_id=${elderId}&size=3`).catch(() => null),
          ]);

          const latestRecord = healthData?.items?.[0] ?? null;
          if (latestRecord) {
            setHealthSummary(buildHealthStats(latestRecord));
            setElderProfile((prev) => ({
              ...prev,
              lastUpdated: latestRecord.created_at
                ? new Date(latestRecord.created_at).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })
                : prev.lastUpdated,
            }));
          }

          setMedications(
            (medsData?.items ?? []).map((m: any) => ({
              id: m.id,
              name: m.name,
              dosage: m.dosage,
              time: m.time,
              frequency: m.frequency,
            }))
          );

          const upcomingAppointments = (apptData?.items ?? [])
            .filter((a: any) => a.appointment_date >= new Date().toISOString().slice(0, 10))
            .sort((a: any, b: any) => a.appointment_date.localeCompare(b.appointment_date));
          setAppointment(upcomingAppointments[0] ?? apptData?.items?.[0] ?? null);

          const latestBooking = bookingData?.items?.[0] ?? null;
          if (latestBooking?.caregiver_id) {
            const caregiverData = await apiFetch(`/api/caregivers/${latestBooking.caregiver_id}`).catch(() => null);
            if (caregiverData) {
              setCaregiver({
                id: caregiverData.id,
                name: caregiverData.name,
                rating: caregiverData.rating,
                experience: caregiverData.experience,
                hourly_rate: caregiverData.hourly_rate,
                verified: caregiverData.verified,
              });
            }
          }

          setAlerts(
            (alertsData?.items ?? []).map((a: any) => ({
              id: a.id,
              title: a.title,
              message: a.message,
              severity: a.severity,
            }))
          );
        }
      } catch {
        router.replace("/login");
        return;
      }

      setReady(true);
    }

    loadDashboardData();
  }, [router]);

  async function handleLogout() {
    await logoutRequest();
    router.replace("/login");
  }

  if (!ready) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      <DashboardCard>
        <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand-green-light text-3xl"
              aria-hidden="true"
            >
              {elderProfile.avatar}
            </div>
            <div>
              <h2 className="text-xl font-bold text-ink">{elderProfile.name}</h2>
              <p className="text-sm text-ink-muted">สวัสดี {userName} • อายุ {elderProfile.age} ปี</p>
              <div className="mt-2 flex items-center gap-3">
                <StatusBadge status={elderProfile.status} label={elderProfile.statusLabel} />
                <span className="flex items-center gap-1 text-xs text-ink-muted">
                  <Clock size={13} aria-hidden="true" />
                  อัปเดตล่าสุด {elderProfile.lastUpdated}
                </span>
              </div>
            </div>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Link href="/dashboard/health" className="btn-primary w-full text-center sm:w-auto">
              ดูข้อมูลสุขภาพ
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="btn-secondary inline-flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <LogOut size={16} aria-hidden="true" />
              ออกจากระบบ
            </button>
          </div>
        </div>
      </DashboardCard>

      <div>
        <h2 className="mb-3 text-lg font-bold text-ink">ภาพรวมสุขภาพ</h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {healthSummary.map((stat) => (
            <HealthCard
              key={stat.id}
              title={stat.title}
              value={stat.value}
              unit={stat.unit}
              status={stat.status}
              statusLabel={stat.statusLabel}
              icon={stat.icon}
            />
          ))}
        </div>
      </div>

      <HealthChart />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <MedicationCard items={medications} />
        <AppointmentCard appointment={appointment} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CaregiverCard caregiver={caregiver} />
        <HealthAlert items={alerts} />
      </div>
    </div>
  );
}
