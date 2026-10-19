"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, LogOut } from "lucide-react";
import DashboardCard from "@/components/DashboardCard";
import HealthCard from "@/components/HealthCard";
import HealthChart from "@/components/HealthChart";
import MedicationCard from "@/components/MedicationCard";
import AppointmentCard from "@/components/AppointmentCard";
import CaregiverCard from "@/components/CaregiverCard";
import HealthAlert from "@/components/HealthAlert";
import StatusBadge from "@/components/StatusBadge";
import { elder as fallbackElder, healthStats as fallbackHealthStats, type StatusLevel } from "@/data/mockData";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

type DashboardElder = {
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
  const stats = [
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
      value: String(record?.temperature ?? 36.7),
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

  return stats;
}

export default function DashboardPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [userName, setUserName] = useState("ผู้ใช้งาน");
  const [elderProfile, setElderProfile] = useState<DashboardElder>({
    name: fallbackElder.name,
    age: fallbackElder.age,
    relation: fallbackElder.relation,
    avatar: fallbackElder.avatar,
    statusLabel: fallbackElder.statusLabel,
    status: fallbackElder.status,
    lastUpdated: fallbackElder.lastUpdated,
  });
  const [healthSummary, setHealthSummary] = useState(fallbackHealthStats);

  useEffect(() => {
    const token = localStorage.getItem("eldercare_access_token");
    if (!token) {
      router.replace("/login");
      return;
    }

    async function loadDashboardData() {
      try {
        const authResponse = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!authResponse.ok) {
          throw new Error("Unauthorized");
        }

        const authData = await authResponse.json();
        const fullName = [authData.first_name, authData.last_name].filter(Boolean).join(" ") || authData.username || "ผู้ใช้งาน";
        setUserName(fullName);

        const summaryResponse = await fetch(`${API_BASE_URL}/api/dashboard/summary`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (summaryResponse.ok) {
          const summaryData = await summaryResponse.json();
          const latestRecord = summaryData?.latest_health_record ?? null;

          if (latestRecord) {
            setHealthSummary(buildHealthStats(latestRecord));
            setElderProfile((prev) => ({
              ...prev,
              statusLabel: "สุขภาพคงที่",
              status: "normal",
              lastUpdated: latestRecord.created_at ? new Date(latestRecord.created_at).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" }) : prev.lastUpdated,
            }));
          }
        }

        const elderResponse = await fetch(`${API_BASE_URL}/api/elders`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (elderResponse.ok) {
          const elderData = await elderResponse.json();
          const elderItem = elderData?.items?.[0] ?? null;

          if (elderItem) {
            setElderProfile({
              name: `${elderItem.first_name} ${elderItem.last_name}`,
              age: computeAge(elderItem.date_of_birth),
              relation: elderItem.relationship_type ?? "ผู้สูงอายุ",
              avatar: elderItem.gender === "male" ? "👴" : "👵",
              statusLabel: "สุขภาพคงที่",
              status: "normal",
              lastUpdated: elderItem.updated_at ? new Date(elderItem.updated_at).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" }) : "เมื่อสักครู่",
            });
          }
        }

        const healthResponse = await fetch(`${API_BASE_URL}/api/health-records`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (healthResponse.ok) {
          const healthData = await healthResponse.json();
          const latestRecord = healthData?.items?.[0] ?? null;

          if (latestRecord) {
            setHealthSummary(buildHealthStats(latestRecord));
            setElderProfile((prev) => ({
              ...prev,
              statusLabel: "สุขภาพคงที่",
              status: "normal",
              lastUpdated: latestRecord.created_at ? new Date(latestRecord.created_at).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" }) : prev.lastUpdated,
            }));
          }
        }
      } catch {
        localStorage.removeItem("eldercare_access_token");
        localStorage.removeItem("eldercare_token_type");
        router.replace("/login");
        return;
      }

      setReady(true);
    }

    loadDashboardData();
  }, [router]);

  function handleLogout() {
    localStorage.removeItem("eldercare_access_token");
    localStorage.removeItem("eldercare_token_type");
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
            <button className="btn-primary w-full sm:w-auto">ดูข้อมูลสุขภาพ</button>
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
        <MedicationCard />
        <AppointmentCard />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CaregiverCard />
        <HealthAlert />
      </div>
    </div>
  );
}
