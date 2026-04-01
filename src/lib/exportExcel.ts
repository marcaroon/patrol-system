// src/lib/exportExcel.ts
import * as XLSX from "xlsx";
import type { ReportDTO, SecurityReportDTO, HSEReportDTO } from "@/types";
import { HAZARD_OPTIONS } from "@/types";
import { format } from "date-fns";

function diffSeconds(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 1000);
}

function formatDuration(totalSecs: number): string {
  if (totalSecs < 0) return "—";
  const m = Math.floor(totalSecs / 60);
  const s = totalSecs % 60;
  if (m === 0) return `${s} detik`;
  return `${m} menit ${s} detik`;
}

export function exportReportsToExcel(reports: ReportDTO[], filename?: string) {
  const wb = XLSX.utils.book_new();

  // ── Security Sheet ───────────────────────────────────────────
  const securityRows: Record<string, string | number>[] = [];
  reports
    .filter((r): r is { type: "SECURITY" } & SecurityReportDTO => r.type === "SECURITY")
    .forEach((r) => {
      // Sort checklist by actual photo time for consistent export order
      const sorted = [...r.checklist].sort(
        (a, b) => new Date(a.photoTimestamp).getTime() - new Date(b.photoTimestamp).getTime()
      );
      const firstTs = sorted.length > 0 ? sorted[0].photoTimestamp : null;
      const lastTs = r.selfiePhotoTimestamp ?? (sorted.length > 0 ? sorted[sorted.length - 1].photoTimestamp : null);
      const totalDur = firstTs && lastTs ? formatDuration(diffSeconds(firstTs, lastTs)) : "—";

      sorted.forEach((item, idx) => {
        const prevTs = idx === 0 ? null : sorted[idx - 1].photoTimestamp;
        const durFromPrev = prevTs
          ? formatDuration(diffSeconds(prevTs, item.photoTimestamp))
          : "—";

        securityRows.push({
          "Tanggal Patroli": r.patrolDate,
          "Jam Mulai": r.patrolTime,
          "Nama Security": r.reportedBy,
          "Area Patrol": r.area.name,
          "Urutan Aktual": idx + 1,
          "Item Checklist": item.checklistItemLabel,
          Status: item.status === "NO_FINDING" ? "Tidak Ada Temuan" : "Ada Temuan",
          "Deskripsi Temuan": item.findingDescription ?? "-",
          "Waktu Foto (Checkpoint)": format(new Date(item.photoTimestamp), "HH:mm:ss"),
          "Durasi dari Checkpoint Sebelumnya": durFromPrev,
          "Total Durasi Patrol": totalDur,
          "Latitude Laporan": r.latitude ?? "-",
          "Longitude Laporan": r.longitude ?? "-",
          "URL Foto": item.photoUrl,
          "Timestamp Foto Lengkap": format(new Date(item.photoTimestamp), "dd/MM/yyyy HH:mm:ss"),
          "Lat Foto": item.photoLatitude ?? "-",
          "Lon Foto": item.photoLongitude ?? "-",
          "URL Selfie Penutup": r.selfiePhotoUrl ?? "-",
          "Waktu Selfie Penutup": r.selfiePhotoTimestamp
            ? format(new Date(r.selfiePhotoTimestamp), "HH:mm:ss")
            : "-",
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
  const summaryRows = reports.map((r) => {
    let totalDur = "—";
    if (r.type === "SECURITY") {
      const sr = r as { type: "SECURITY" } & SecurityReportDTO;
      const sorted = [...sr.checklist].sort(
        (a, b) => new Date(a.photoTimestamp).getTime() - new Date(b.photoTimestamp).getTime()
      );
      const firstTs = sorted.length > 0 ? sorted[0].photoTimestamp : null;
      const lastTs = sr.selfiePhotoTimestamp ?? (sorted.length > 0 ? sorted[sorted.length - 1].photoTimestamp : null);
      if (firstTs && lastTs) totalDur = formatDuration(diffSeconds(firstTs, lastTs));
    }

    return {
      ID: r.id,
      Tipe: r.type,
      "Dilaporkan Oleh": r.reportedBy,
      Tanggal: r.type === "SECURITY" ? r.patrolDate : (r as HSEReportDTO).visitDate,
      "Total Durasi Patrol": totalDur,
      "Dibuat Pada": format(new Date(r.createdAt), "dd/MM/yyyy HH:mm:ss"),
      GPS: r.latitude && r.longitude ? `${r.latitude.toFixed(6)}, ${r.longitude.toFixed(6)}` : "-",
    };
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryRows), "Ringkasan");

  XLSX.writeFile(
    wb,
    filename ?? `Laporan_Patrol_${format(new Date(), "yyyyMMdd_HHmm")}.xlsx`
  );
}