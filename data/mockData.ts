// Mock data for Eldercare Tech — Phase 1 (UI only, no backend)

export type StatusLevel = "normal" | "warning" | "critical";

export interface Elder {
  id: string;
  name: string;
  age: number;
  relation: string;
  avatar: string;
  statusLabel: string;
  status: StatusLevel;
  lastUpdated: string;
}

export const elder: Elder = {
  id: "elder-01",
  name: "คุณแม่สมใจ",
  age: 68,
  relation: "มารดา",
  avatar: "👵",
  statusLabel: "สุขภาพคงที่",
  status: "normal",
  lastUpdated: "2 นาทีที่แล้ว",
};

export interface VitalStat {
  id: string;
  title: string;
  value: string;
  unit: string;
  status: StatusLevel;
  statusLabel: string;
  icon: "heart" | "activity" | "thermometer" | "droplets";
}

export const healthStats: VitalStat[] = [
  {
    id: "heart-rate",
    title: "อัตราการเต้นหัวใจ",
    value: "72",
    unit: "BPM",
    status: "normal",
    statusLabel: "ปกติ",
    icon: "heart",
  },
  {
    id: "blood-pressure",
    title: "ความดันโลหิต",
    value: "125/80",
    unit: "mmHg",
    status: "normal",
    statusLabel: "ปกติ",
    icon: "activity",
  },
  {
    id: "temperature",
    title: "อุณหภูมิร่างกาย",
    value: "36.7",
    unit: "°C",
    status: "normal",
    statusLabel: "ปกติ",
    icon: "thermometer",
  },
  {
    id: "spo2",
    title: "ออกซิเจนในเลือด",
    value: "98",
    unit: "%",
    status: "normal",
    statusLabel: "ปกติ",
    icon: "droplets",
  },
];

export interface HeartRatePoint {
  time: string;
  value: number;
}

export const heartRateToday: HeartRatePoint[] = [
  { time: "08:00", value: 70 },
  { time: "10:00", value: 72 },
  { time: "12:00", value: 75 },
  { time: "14:00", value: 71 },
  { time: "16:00", value: 73 },
  { time: "18:00", value: 72 },
];

export const heartRateWeek: HeartRatePoint[] = [
  { time: "จ.", value: 71 },
  { time: "อ.", value: 73 },
  { time: "พ.", value: 70 },
  { time: "พฤ.", value: 74 },
  { time: "ศ.", value: 72 },
  { time: "ส.", value: 69 },
  { time: "อา.", value: 72 },
];

export const heartRateMonth: HeartRatePoint[] = [
  { time: "สัปดาห์ 1", value: 72 },
  { time: "สัปดาห์ 2", value: 74 },
  { time: "สัปดาห์ 3", value: 70 },
  { time: "สัปดาห์ 4", value: 73 },
];

export interface Medication {
  id: string;
  time: string;
  name: string;
  dosage: string;
  taken: boolean;
}

export const medications: Medication[] = [
  {
    id: "med-01",
    time: "08:00",
    name: "Amlodipine",
    dosage: "1 เม็ด",
    taken: true,
  },
  {
    id: "med-02",
    time: "12:00",
    name: "Metformin",
    dosage: "1 เม็ด",
    taken: false,
  },
  {
    id: "med-03",
    time: "20:00",
    name: "Atorvastatin",
    dosage: "1 เม็ด",
    taken: false,
  },
];

export interface Appointment {
  id: string;
  date: string;
  hospital: string;
  doctor: string;
  department: string;
  time: string;
}

export const nextAppointment: Appointment = {
  id: "apt-01",
  date: "20 สิงหาคม 2026",
  hospital: "ABC Hospital",
  doctor: "นพ. สมชาย ใจดี",
  department: "แผนกหัวใจ",
  time: "10:30 น.",
};

export interface Caregiver {
  id: string;
  name: string;
  avatar: string;
  verified: boolean;
  rating: number;
  reviews: number;
  experienceYears: number;
  todaySchedule: string;
}

export const caregiver: Caregiver = {
  id: "cg-01",
  name: "คุณสุภาวดี รักษาดี",
  avatar: "👩‍⚕️",
  verified: true,
  rating: 4.9,
  reviews: 128,
  experienceYears: 5,
  todaySchedule: "09:00 - 13:00",
};

export interface Notification {
  id: string;
  level: StatusLevel;
  title: string;
  message: string;
}

export const notifications: Notification[] = [
  {
    id: "n-01",
    level: "warning",
    title: "แจ้งเตือนการรับประทานยา",
    message: "ถึงเวลารับประทานยาเวลา 20:00 น.",
  },
  {
    id: "n-02",
    level: "normal",
    title: "สถานะสุขภาพ",
    message: "ข้อมูลสุขภาพล่าสุดอยู่ในระดับปกติ",
  },
];

export const currentUser = {
  firstName: "สมชาย",
  lastName: "ใจดี",
  role: "Family",
  avatar: "🧑",
  todayTasksCount: 3,
};
