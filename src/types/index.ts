// src/types/index.ts

export type PatrolDivision = "SECURITY" | "HSE";

export interface UserDTO {
  id: string;
  name: string;
  division: PatrolDivision;
  isActive: boolean;
  createdAt: string;
}

export interface PatrolAreaDTO {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  checklistItems: ChecklistItemDTO[];
  createdAt: string;
}

export interface ChecklistItemDTO {
  id: string;
  order: number;
  label: string;
  description?: string | null;
}

export interface PhotoMeta {
  url: string;
  timestamp: string;      // ISO string
  latitude?: number;
  longitude?: number;
}

// ── Security ────────────────────────────────────────────────────
export interface SecurityChecklistEntry {
  checklistItemId: string;
  status: "NO_FINDING" | "FINDING";
  findingDescription?: string;
  photo: PhotoMeta;
}

export interface SecurityReportDTO {
  id: string;
  reportedBy: string;
  userId: string;
  area: { id: string; name: string; code: string };
  patrolDate: string;
  patrolTime: string;
  latitude?: number | null;
  longitude?: number | null;
  checklist: {
    id: string;
    checklistItemId: string;
    checklistItemLabel: string;
    status: "NO_FINDING" | "FINDING";
    findingDescription?: string | null;
    photoUrl: string;
    photoTimestamp: string;
    photoLatitude?: number | null;
    photoLongitude?: number | null;
  }[];
  createdAt: string;
}

// ── HSE ─────────────────────────────────────────────────────────
export type HazardType =
  | "TERJATUH" | "TERGELINCIR" | "TERKENA_BENDA_TAJAM"
  | "TERBAKAR" | "TERSENGAT_LISTRIK" | "TERTIMPA_BENDA"
  | "TERHIRUP_GAS" | "KONTAK_BAHAN_KIMIA" | "KEBISINGAN"
  | "KELELAHAN" | "LAINNYA";

export const HAZARD_OPTIONS: { value: HazardType; label: string }[] = [
  { value: "TERJATUH",           label: "Terjatuh dari Ketinggian" },
  { value: "TERGELINCIR",        label: "Tergelincir / Terpeleset" },
  { value: "TERKENA_BENDA_TAJAM",label: "Terkena Benda Tajam / Terpotong" },
  { value: "TERBAKAR",           label: "Kebakaran / Terbakar" },
  { value: "TERSENGAT_LISTRIK",  label: "Tersengat Listrik" },
  { value: "TERTIMPA_BENDA",     label: "Tertimpa Benda / Material" },
  { value: "TERHIRUP_GAS",       label: "Terhirup Gas Berbahaya" },
  { value: "KONTAK_BAHAN_KIMIA", label: "Kontak Bahan Kimia" },
  { value: "KEBISINGAN",         label: "Kebisingan Berlebih" },
  { value: "KELELAHAN",          label: "Kelelahan / Ergonomi Buruk" },
  { value: "LAINNYA",            label: "Lainnya" },
];

export interface HSEAreaVisitInput {
  areaName: string;
  workActivities: string;
  hazards: HazardType[];
  hazardDescription: string;
  socializationDescription: string;
  evidencePhoto: PhotoMeta;
}

export interface HSEReportDTO {
  id: string;
  reportedBy: string;
  userId: string;
  visitDate: string;
  visitTime: string;
  latitude?: number | null;
  longitude?: number | null;
  hseSignatureUrl?: string | null;
  witnessSignatureUrl?: string | null;
  areaVisits: {
    id: string;
    areaName: string;
    workActivities: string;
    hazards: HazardType[];
    hazardDescription: string;
    socializationDescription: string;
    evidencePhotoUrl: string;
    evidencePhotoTimestamp: string;
    evidencePhotoLatitude?: number | null;
    evidencePhotoLongitude?: number | null;
  }[];
  createdAt: string;
}

export type ReportDTO =
  | ({ type: "SECURITY" } & SecurityReportDTO)
  | ({ type: "HSE" } & HSEReportDTO);

// ── Dashboard ───────────────────────────────────────────────────
export interface DashboardStats {
  totalReports: number;
  securityReports: number;
  hseReports: number;
  totalFindings: number;
  reportsToday: number;
  last7Days: { date: string; Security: number; HSE: number }[];
  byArea: { name: string; value: number }[];
}
