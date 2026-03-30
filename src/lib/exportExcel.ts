// src/lib/exportExcel.ts
import * as XLSX from "xlsx";
import type { ReportDTO, SecurityReportDTO, HSEReportDTO } from "@/types";
import { HAZARD_OPTIONS } from "@/types";
import { format } from "date-fns";

export function exportReportsToExcel(reports: ReportDTO[], filename?: string) {
  const wb = XLSX.utils.book_new();

  // ── Security Sheet ───────────────────────────────────────────
  const securityRows: Record<string, string | number>[] = [];
  reports
    .filter((r): r is { type: "SECURITY" } & SecurityReportDTO => r.type === "SECURITY")
    .forEach((r) => {
      r.checklist.forEach((item) => {
        securityRows.push({
          "Tanggal Patroli": r.patrolDate,
          "Jam Mulai": r.patrolTime,
          "Nama Security": r.reportedBy,
          "Area Patrol": r.area.name,
          "Item Checklist": item.checklistItemLabel,
          Status: item.status === "NO_FINDING" ? "Tidak Ada Temuan" : "Ada Temuan",
          "Deskripsi Temuan": item.findingDescription ?? "-",
          "Latitude Laporan": r.latitude ?? "-",
          "Longitude Laporan": r.longitude ?? "-",
          "URL Foto": item.photoUrl,
          "Timestamp Foto": format(new Date(item.photoTimestamp), "dd/MM/yyyy HH:mm:ss"),
          "Lat Foto": item.photoLatitude ?? "-",
          "Lon Foto": item.photoLongitude ?? "-",
          "Dibuat Pada": format(new Date(r.createdAt), "dd/MM/yyyy HH:mm:ss"),
        });
      });
    });

  if (securityRows.length > 0) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(securityRows), "Security Patrol");
  }

  // ── HSE Sheet ────────────────────────────────────────────────
  const hseRows: Record<string, string | number>[] = [];
  reports
    .filter((r): r is { type: "HSE" } & HSEReportDTO => r.type === "HSE")
    .forEach((r) => {
      r.areaVisits.forEach((visit) => {
        hseRows.push({
          "Tanggal Kunjungan": r.visitDate,
          "Jam Kunjungan": r.visitTime,
          "Nama HSE": r.reportedBy,
          "Area Kunjungan": visit.areaName,
          "Kegiatan/Pekerjaan": visit.workActivities,
          "Potensi Bahaya": visit.hazards
            .map((h) => HAZARD_OPTIONS.find((o) => o.value === h)?.label ?? h)
            .join("; "),
          "Deskripsi Bahaya": visit.hazardDescription,
          "Deskripsi Sosialisasi": visit.socializationDescription,
          "URL Foto Evidence": visit.evidencePhotoUrl,
          "Timestamp Foto": format(new Date(visit.evidencePhotoTimestamp), "dd/MM/yyyy HH:mm:ss"),
          "Lat Foto": visit.evidencePhotoLatitude ?? "-",
          "Lon Foto": visit.evidencePhotoLongitude ?? "-",
          "Dibuat Pada": format(new Date(r.createdAt), "dd/MM/yyyy HH:mm:ss"),
        });
      });
    });

  if (hseRows.length > 0) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(hseRows), "HSE Kunjungan");
  }

  // ── Summary Sheet ────────────────────────────────────────────
  const summaryRows = reports.map((r) => ({
    ID: r.id,
    Tipe: r.type,
    "Dilaporkan Oleh": r.reportedBy,
    Tanggal: r.type === "SECURITY" ? r.patrolDate : r.visitDate,
    "Dibuat Pada": format(new Date(r.createdAt), "dd/MM/yyyy HH:mm:ss"),
    GPS: r.latitude && r.longitude ? `${r.latitude.toFixed(6)}, ${r.longitude.toFixed(6)}` : "-",
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryRows), "Ringkasan");

  XLSX.writeFile(
    wb,
    filename ?? `Laporan_Patrol_${format(new Date(), "yyyyMMdd_HHmm")}.xlsx`
  );
}
