// src/lib/exportExcel.ts
import * as XLSX from "xlsx";
import type { ReportDTO, SecurityReportDTO, HSEReportDTO } from "@/types";
import { HAZARD_OPTIONS } from "@/types";
import { format } from "date-fns";

function diffSeconds(a: string, b: string) {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 1000);
}
function formatDur(s: number): string {
  if (s < 0) return "—";
  const m = Math.floor(s / 60),
    r = s % 60;
  return m === 0 ? `${r} detik` : `${m} menit ${r} detik`;
}

export function exportReportsToExcel(reports: ReportDTO[], filename?: string) {
  const wb = XLSX.utils.book_new();

  // ── Security sheet ───────────────────────────────────────────
  const secRows: Record<string, string | number>[] = [];
  reports
    .filter(
      (r): r is { type: "SECURITY" } & SecurityReportDTO =>
        r.type === "SECURITY",
    )
    .forEach((r) => {
      const allEntries = r.areaVisits
        .flatMap((av) =>
          av.sectionEntries.map((se) => ({ ...se, areaName: av.areaName })),
        )
        .sort(
          (a, b) =>
            new Date(a.photoTimestamp).getTime() -
            new Date(b.photoTimestamp).getTime(),
        );

      const firstTs = allEntries[0]?.photoTimestamp ?? null;
      const lastTs =
        r.selfiePhotoTimestamp ??
        allEntries.slice(-1)[0]?.photoTimestamp ??
        null;
      const totalDur =
        r.formOpenedAt && r.selfiePhotoTimestamp
          ? formatDur(diffSeconds(r.formOpenedAt, r.selfiePhotoTimestamp))
          : "—";
      const inspDur =
        firstTs && lastTs ? formatDur(diffSeconds(firstTs, lastTs)) : "—";

      allEntries.forEach((se, idx) => {
        const prevTs = idx === 0 ? null : allEntries[idx - 1].photoTimestamp;
        secRows.push({
          "Tanggal Patroli": r.patrolDate,
          "Jam Mulai": r.patrolTime,
          "Nama Security": r.reportedBy,
          Area: se.areaName,
          "Bagian/Seksi": se.areaSectionName,
          "Urutan Aktual": idx + 1,
          Status:
            se.status === "NO_FINDING" ? "Tidak Ada Temuan" : "Ada Temuan",
          "Deskripsi Temuan": se.findingDescription ?? "-",
          "Waktu Foto": format(new Date(se.photoTimestamp), "HH:mm:ss"),
          "Durasi dari Sebelumnya": prevTs
            ? formatDur(diffSeconds(prevTs, se.photoTimestamp))
            : "—",
          "Durasi Inspeksi": inspDur,
          "Total Durasi Laporan": totalDur,
          "URL Foto": se.photoUrl,
          "Timestamp Lengkap": format(
            new Date(se.photoTimestamp),
            "dd/MM/yyyy HH:mm:ss",
          ),
          "Lat Foto": se.photoLatitude ?? "-",
          "Lon Foto": se.photoLongitude ?? "-",
          "URL Selfie Penutup": r.selfiePhotoUrl ?? "-",
          "Waktu Selfie": r.selfiePhotoTimestamp
            ? format(new Date(r.selfiePhotoTimestamp), "HH:mm:ss")
            : "-",
          "Form Dibuka": r.formOpenedAt
            ? format(new Date(r.formOpenedAt), "HH:mm:ss")
            : "-",
          "Dibuat Pada": format(new Date(r.createdAt), "dd/MM/yyyy HH:mm:ss"),
        });
      });
    });
  if (secRows.length > 0)
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(secRows),
      "Security Patrol",
    );

  // ── HSE sheet ────────────────────────────────────────────────
  const hseRows: Record<string, string | number>[] = [];
  reports
    .filter((r): r is { type: "HSE" } & HSEReportDTO => r.type === "HSE")
    .forEach((r) => {
      r.areaVisits.forEach((v) => {
        hseRows.push({
          Tanggal: r.visitDate,
          Jam: r.visitTime,
          "Nama HSE": r.reportedBy,
          Area: v.areaName,
          Kegiatan: v.workActivities,
          "Potensi Bahaya": v.hazards
            .map((h) => HAZARD_OPTIONS.find((o) => o.value === h)?.label ?? h)
            .join("; "),
          "Deskripsi Bahaya": v.hazardDescription,
          Sosialisasi: v.socializationDescription,
          "URL Foto": v.evidencePhotoUrl,
          "Timestamp Foto": format(
            new Date(v.evidencePhotoTimestamp),
            "dd/MM/yyyy HH:mm:ss",
          ),
          "Dibuat Pada": format(new Date(r.createdAt), "dd/MM/yyyy HH:mm:ss"),
        });
      });
    });
  if (hseRows.length > 0)
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(hseRows),
      "HSE Kunjungan",
    );

  // ── Summary sheet ────────────────────────────────────────────
  const sumRows = reports.map((r) => {
    let totalDur = "—",
      areas = "";
    if (r.type === "SECURITY") {
      const sr = r as { type: "SECURITY" } & SecurityReportDTO;
      if (sr.formOpenedAt && sr.selfiePhotoTimestamp)
        totalDur = formatDur(
          diffSeconds(sr.formOpenedAt, sr.selfiePhotoTimestamp),
        );
      areas = sr.areaVisits.map((av) => av.areaName).join(", ");
    }
    return {
      ID: r.id,
      Tipe: r.type,
      "Dilaporkan Oleh": r.reportedBy,
      Tanggal:
        r.type === "SECURITY"
          ? (r as SecurityReportDTO).patrolDate
          : (r as HSEReportDTO).visitDate,
      Area: areas,
      "Total Durasi": totalDur,
      "Dibuat Pada": format(new Date(r.createdAt), "dd/MM/yyyy HH:mm:ss"),
    };
  });
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(sumRows),
    "Ringkasan",
  );

  XLSX.writeFile(
    wb,
    filename ?? `Laporan_Patrol_${format(new Date(), "yyyyMMdd_HHmm")}.xlsx`,
  );
}
