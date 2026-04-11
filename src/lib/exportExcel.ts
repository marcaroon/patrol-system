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
      interface FlatRow {
        areaName: string;
        sectionName: string;
        sectionFindingIdx: number;
        status: string;
        findingDesc: string | null | undefined;
        photoUrl: string;
        photoTimestamp: string;
        photoLatitude: number | null | undefined;
        photoLongitude: number | null | undefined;
      }
      const flat: FlatRow[] = [];
      r.areaVisits.forEach((av) => {
        av.sectionEntries.forEach((se) => {
          se.findings.forEach((f, fi) => {
            flat.push({
              areaName: av.areaName,
              sectionName: se.areaSectionName,
              sectionFindingIdx: fi,
              status:
                f.status === "NO_FINDING" ? "Tidak Ada Temuan" : "Ada Temuan",
              findingDesc: f.findingDescription,
              photoUrl: f.photoUrl,
              photoTimestamp: f.photoTimestamp,
              photoLatitude: f.photoLatitude,
              photoLongitude: f.photoLongitude,
            });
          });
        });
      });
      flat.sort(
        (a, b) =>
          new Date(a.photoTimestamp).getTime() -
          new Date(b.photoTimestamp).getTime(),
      );

      const firstTs = flat[0]?.photoTimestamp ?? null;
      const lastTs = flat.slice(-1)[0]?.photoTimestamp ?? null;
      const totalDur =
        r.formOpenedAt && r.selfiePhotoTimestamp
          ? formatDur(diffSeconds(r.formOpenedAt, r.selfiePhotoTimestamp))
          : "—";
      const inspDur =
        firstTs && lastTs ? formatDur(diffSeconds(firstTs, lastTs)) : "—";

      flat.forEach((row, idx) => {
        const prevTs = idx === 0 ? null : flat[idx - 1].photoTimestamp;
        secRows.push({
          "Tanggal Patroli": r.patrolDate,
          "Jam Mulai": r.patrolTime,
          "Nama Security": r.reportedBy,
          Area: row.areaName,
          "Bagian/Seksi": row.sectionName,
          "Temuan ke-": row.sectionFindingIdx + 1,
          "Urutan Aktual": idx + 1,
          Status: row.status,
          "Deskripsi Temuan": row.findingDesc ?? "-",
          "Waktu Foto": format(new Date(row.photoTimestamp), "HH:mm:ss"),
          "Durasi dari Sebelumnya": prevTs
            ? formatDur(diffSeconds(prevTs, row.photoTimestamp))
            : "—",
          "Durasi Inspeksi": inspDur,
          "Total Durasi Laporan": totalDur,
          "URL Foto": row.photoUrl,
          "Timestamp Lengkap": format(
            new Date(row.photoTimestamp),
            "dd/MM/yyyy HH:mm:ss",
          ),
          "Lat Foto": row.photoLatitude ?? "-",
          "Lon Foto": row.photoLongitude ?? "-",
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
          "URL Foto Evidence": v.evidencePhotoUrl,
          "Timestamp Foto Evidence": format(
            new Date(v.evidencePhotoTimestamp),
            "dd/MM/yyyy HH:mm:ss",
          ),
          "Jumlah Foto Area": v.visitPhotos?.length ?? 0,
          "Dibuat Pada": format(new Date(r.createdAt), "dd/MM/yyyy HH:mm:ss"),
        });
      });
    });
  if (hseRows.length > 0)
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(hseRows),
      "EHSNF Kunjungan",
    );

  // ── HSE Visit Photos sheet (NEW) ─────────────────────────────
  const hsePhotoRows: Record<string, string | number>[] = [];
  reports
    .filter((r): r is { type: "HSE" } & HSEReportDTO => r.type === "HSE")
    .forEach((r) => {
      r.areaVisits.forEach((v) => {
        if (!v.visitPhotos || v.visitPhotos.length === 0) return;
        v.visitPhotos.forEach((vp, vpIdx) => {
          hsePhotoRows.push({
            Tanggal: r.visitDate,
            Jam: r.visitTime,
            "Nama EHSNF": r.reportedBy,
            "Area Kunjungan": v.areaName,
            "No. Foto": vpIdx + 1,
            "Keterangan Foto": vp.description ?? "-",
            "URL Foto": vp.photoUrl,
            "Waktu Foto": format(new Date(vp.photoTimestamp), "HH:mm:ss"),
            "Timestamp Lengkap": format(
              new Date(vp.photoTimestamp),
              "dd/MM/yyyy HH:mm:ss",
            ),
            "Lat Foto": vp.photoLatitude ?? "-",
            "Lon Foto": vp.photoLongitude ?? "-",
          });
        });
      });
    });
  if (hsePhotoRows.length > 0)
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(hsePhotoRows),
      "EHSNF Foto Area",
    );

  // ── Summary sheet ────────────────────────────────────────────
  const sumRows = reports.map((r) => {
    let totalDur = "—",
      areas = "",
      totalFindings = 0,
      totalVisitPhotos = 0;
    if (r.type === "SECURITY") {
      const sr = r as { type: "SECURITY" } & SecurityReportDTO;
      if (sr.formOpenedAt && sr.selfiePhotoTimestamp)
        totalDur = formatDur(
          diffSeconds(sr.formOpenedAt, sr.selfiePhotoTimestamp),
        );
      areas = sr.areaVisits.map((av) => av.areaName).join(", ");
      totalFindings = sr.areaVisits.reduce(
        (acc, av) =>
          acc +
          av.sectionEntries.reduce(
            (s, se) =>
              s + se.findings.filter((f) => f.status === "FINDING").length,
            0,
          ),
        0,
      );
    } else {
      const hr = r as { type: "HSE" } & HSEReportDTO;
      areas = hr.areaVisits.map((av) => av.areaName).join(", ");
      totalVisitPhotos = hr.areaVisits.reduce(
        (acc, av) => acc + (av.visitPhotos?.length ?? 0),
        0,
      );
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
      "Jumlah Temuan (Security)": totalFindings,
      "Jumlah Foto Area (EHSNF)": totalVisitPhotos,
      "Total Durasi (Security)": totalDur,
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