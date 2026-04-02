// src/app/admin/reports/page.tsx
"use client";
import { useEffect, useState, useCallback } from "react";
import AdminShell from "@/components/admin/AdminShell";
import type {
  ReportDTO,
  SecurityReportDTO,
  HSEReportDTO,
  ReportAreaVisitDTO,
  SectionFindingDTO,
} from "@/types";
import { HAZARD_OPTIONS } from "@/types";
import { exportReportsToExcel } from "@/lib/exportExcel";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  FileText,
  Filter,
  Download,
  Shield,
  Leaf,
  Loader2,
  X,
  AlertTriangle,
  CheckCircle,
  MapPin,
  ChevronDown,
  ChevronUp,
  Clock,
  Flag,
  Timer,
  Camera,
  Layers,
} from "lucide-react";

// ── Duration helpers ─────────────────────────────────────────────
function diffSeconds(a: string, b: string) {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 1000);
}
function formatDur(secs: number): string {
  if (secs < 0) return "—";
  const m = Math.floor(secs / 60),
    s = secs % 60;
  return m === 0 ? `${s}d` : `${m}m ${s}d`;
}

// ── Flatten all findings across all area visits, sorted by time ──
interface FlatFinding extends SectionFindingDTO {
  areaName: string;
  areaCode: string;
  sectionName: string;
  findingIndex: number; // index within that section (0 = first)
  totalInSection: number; // total findings in that section
}

function allFindingsSorted(areaVisits: ReportAreaVisitDTO[]): FlatFinding[] {
  const flat: FlatFinding[] = [];
  areaVisits.forEach((av) => {
    av.sectionEntries.forEach((se) => {
      se.findings.forEach((f, fi) => {
        flat.push({
          ...f,
          areaName: av.areaName,
          areaCode: av.areaCode,
          sectionName: se.areaSectionName,
          findingIndex: fi,
          totalInSection: se.findings.length,
        });
      });
    });
  });
  return flat.sort(
    (a, b) =>
      new Date(a.photoTimestamp).getTime() -
      new Date(b.photoTimestamp).getTime(),
  );
}

// ── Timeline component ───────────────────────────────────────────
function PatrolTimeline({
  report,
}: {
  report: { type: "SECURITY" } & SecurityReportDTO;
}) {
  const allFindings = allFindingsSorted(report.areaVisits);

  const formOpenedAt = report.formOpenedAt ?? null;
  const firstTs = allFindings.length > 0 ? allFindings[0].photoTimestamp : null;
  const lastTs =
    allFindings.length > 0
      ? allFindings[allFindings.length - 1].photoTimestamp
      : null;
  const selfieTs = report.selfiePhotoTimestamp ?? null;

  const inspectionDur = firstTs && lastTs ? diffSeconds(firstTs, lastTs) : null;
  const totalDur =
    formOpenedAt && selfieTs ? diffSeconds(formOpenedAt, selfieTs) : null;

  return (
    <div className="mt-3">
      {/* Summary bar */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
          <Timer className="w-3.5 h-3.5 text-blue-400" /> Timeline Patrol
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          {inspectionDur !== null && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/20 border border-blue-500/30">
              <Layers className="w-3 h-3 text-blue-400" />
              <span className="text-xs font-bold text-blue-300">
                Inspeksi: {formatDur(inspectionDur)}
              </span>
            </div>
          )}
          {totalDur !== null && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30">
              <Timer className="w-3 h-3 text-emerald-400" />
              <span className="text-xs font-bold text-emerald-300">
                Total: {formatDur(totalDur)}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="relative">
        {/* Vertical guide line */}
        <div className="absolute left-[19px] top-5 bottom-5 w-px bg-gradient-to-b from-blue-500/50 via-white/10 to-emerald-500/50" />

        <div className="space-y-1">
          {/* ── Phase 1: Form opened ── */}
          {formOpenedAt && (
            <div className="flex items-start gap-3 pb-2">
              <div className="relative z-10 w-10 h-10 rounded-full bg-slate-600 border-2 border-slate-400 flex items-center justify-center flex-shrink-0">
                <Clock className="w-4 h-4 text-white" />
              </div>
              <div className="pt-1.5">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Form Dibuka
                </p>
                <p className="text-xs text-gray-500">
                  {format(new Date(formOpenedAt), "HH:mm:ss")} WIB
                </p>
                {firstTs && (
                  <p className="text-[10px] text-gray-600 mt-0.5">
                    Persiapan: {formatDur(diffSeconds(formOpenedAt, firstTs))}{" "}
                    sebelum foto pertama
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ── Phase 2: All findings in chronological order ── */}
          {allFindings.map((finding, idx) => {
            const prevTs =
              idx === 0
                ? (formOpenedAt ?? firstTs)
                : allFindings[idx - 1].photoTimestamp;
            const durSecs = prevTs
              ? diffSeconds(prevTs, finding.photoTimestamp)
              : null;
            const isFinding = finding.status === "FINDING";
            const isAdditional = finding.findingIndex > 0;

            return (
              <div key={finding.id} className="flex items-start gap-3 group">
                {/* Node column */}
                <div className="flex flex-col items-center flex-shrink-0 w-10">
                  {durSecs !== null && idx > 0 && (
                    <div className="relative z-10 -mt-0.5 mb-0.5">
                      <span className="text-[9px] font-mono text-gray-600 bg-slate-900 px-1 rounded border border-white/5 whitespace-nowrap">
                        +{formatDur(durSecs)}
                      </span>
                    </div>
                  )}
                  <div
                    className={`relative z-10 w-8 h-8 rounded-full border-2 flex items-center justify-center shadow-sm ${
                      isFinding
                        ? "bg-red-900/60 border-red-500"
                        : "bg-green-900/60 border-green-500"
                    }`}
                  >
                    {isFinding ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                    ) : (
                      <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                    )}
                  </div>
                </div>

                {/* Content */}
                <div
                  className={`flex-1 rounded-xl p-3 mb-1.5 border ${
                    isFinding
                      ? "bg-red-500/5 border-red-500/20"
                      : "bg-green-500/5 border-green-500/10"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-semibold leading-snug">
                        {finding.sectionName}
                        {isAdditional && (
                          <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-orange-500/20 text-orange-300 font-medium">
                            +{finding.findingIndex + 1}
                          </span>
                        )}
                      </p>
                      <p className="text-gray-500 text-[10px]">
                        {finding.areaName}
                      </p>
                    </div>
                    <span
                      className={`flex-shrink-0 text-[11px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                        isFinding
                          ? "bg-red-500/20 border-red-500/30 text-red-300"
                          : "bg-green-500/20 border-green-500/30 text-green-300"
                      }`}
                    >
                      {format(new Date(finding.photoTimestamp), "HH:mm:ss")}
                    </span>
                  </div>
                  {durSecs !== null && (
                    <p className="text-[10px] text-gray-600 mt-0.5 flex items-center gap-1">
                      <Clock className="w-2 h-2" />
                      {idx === 0
                        ? "Checkpoint pertama"
                        : `+${formatDur(durSecs)} dari sebelumnya`}
                    </p>
                  )}
                  {isFinding && finding.findingDescription && (
                    <div className="mt-2 pt-1.5 border-t border-red-500/20">
                      <p className="text-red-300 text-xs">
                        {finding.findingDescription}
                      </p>
                    </div>
                  )}
                  {finding.photoLatitude && (
                    <p className="text-gray-600 text-[10px] mt-1 flex items-center gap-1">
                      <MapPin className="w-2 h-2" />
                      {finding.photoLatitude.toFixed(5)},{" "}
                      {finding.photoLongitude?.toFixed(5)}
                    </p>
                  )}
                  {finding.photoUrl && (
                    <a
                      href={finding.photoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block mt-2"
                    >
                      <img
                        src={finding.photoUrl}
                        alt="foto"
                        className="w-16 h-16 object-cover rounded-lg border border-white/10 hover:opacity-80 transition-opacity"
                      />
                    </a>
                  )}
                </div>
              </div>
            );
          })}

          {/* ── Phase 3: Selfie end ── */}
          {selfieTs && (
            <div className="flex items-start gap-3 pt-1">
              <div className="flex flex-col items-center flex-shrink-0 w-10">
                {lastTs && (
                  <div className="relative z-10 -mt-0.5 mb-0.5">
                    <span className="text-[9px] font-mono text-gray-600 bg-slate-900 px-1 rounded border border-white/5 whitespace-nowrap">
                      +{formatDur(diffSeconds(lastTs, selfieTs))}
                    </span>
                  </div>
                )}
                <div className="relative z-10 w-10 h-10 rounded-full bg-emerald-700 border-2 border-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-900/40">
                  <Camera className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="flex-1 rounded-xl p-3 border bg-emerald-500/10 border-emerald-500/30">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                      Patrol Selesai – Selfie Penutup
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {format(new Date(selfieTs), "HH:mm:ss")} WIB
                    </p>
                    {totalDur !== null && (
                      <p className="text-[11px] font-bold text-emerald-400 mt-1 flex items-center gap-1">
                        <Timer className="w-3 h-3" /> Total laporan:{" "}
                        {formatDur(totalDur)}
                      </p>
                    )}
                  </div>
                  {report.selfiePhotoUrl && (
                    <a
                      href={report.selfiePhotoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-shrink-0"
                    >
                      <img
                        src={report.selfiePhotoUrl}
                        alt="Selfie"
                        className="w-16 h-16 object-cover rounded-xl border-2 border-emerald-500/40 hover:opacity-80 transition-opacity"
                      />
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Fallback end */}
          {!selfieTs && lastTs && (
            <div className="flex items-start gap-3 pt-1">
              <div className="relative z-10 w-10 h-10 rounded-full bg-gray-700 border-2 border-gray-500 flex items-center justify-center">
                <Flag className="w-4 h-4 text-gray-300" />
              </div>
              <div className="pt-2">
                <p className="text-xs text-gray-500">Akhir entri</p>
                <p className="text-xs text-gray-400">
                  {format(new Date(lastTs), "HH:mm:ss")} WIB
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────
export default function ReportsPage() {
  const [reports, setReports] = useState<ReportDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchName, setSearchName] = useState("");

  const fetchReports = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams();
    if (typeFilter !== "ALL") p.set("type", typeFilter);
    if (startDate) p.set("start", startDate);
    if (endDate) p.set("end", endDate);
    if (searchName) p.set("name", searchName);
    const data = await fetch(`/api/reports?${p}`).then((r) => r.json());
    setReports(data);
    setLoading(false);
  }, [typeFilter, startDate, endDate, searchName]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const clearFilters = () => {
    setTypeFilter("ALL");
    setStartDate("");
    setEndDate("");
    setSearchName("");
  };
  const hasFilters = typeFilter !== "ALL" || startDate || endDate || searchName;

  const handleExport = () => {
    if (!reports.length) {
      alert("Tidak ada data");
      return;
    }
    exportReportsToExcel(reports);
  };

  const getDate = (r: ReportDTO) =>
    r.type === "SECURITY"
      ? (r as SecurityReportDTO).patrolDate
      : (r as HSEReportDTO).visitDate;
  const getTime = (r: ReportDTO) =>
    r.type === "SECURITY"
      ? (r as SecurityReportDTO).patrolTime
      : (r as HSEReportDTO).visitTime;

  const getFindingCount = (r: { type: "SECURITY" } & SecurityReportDTO) =>
    r.areaVisits.reduce(
      (acc, av) =>
        acc +
        av.sectionEntries.reduce(
          (s, se) =>
            s + se.findings.filter((f) => f.status === "FINDING").length,
          0,
        ),
      0,
    );

  const getTotalDur = (
    r: { type: "SECURITY" } & SecurityReportDTO,
  ): string | null => {
    const fo = r.formOpenedAt,
      st = r.selfiePhotoTimestamp;
    if (!fo || !st) return null;
    return formatDur(diffSeconds(fo, st));
  };

  return (
    <AdminShell>
      <div className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-white text-2xl font-bold">Laporan Patrol</h1>
            <p className="text-gray-400 text-sm mt-0.5">
              {reports.length} laporan ditemukan
            </p>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <Download className="w-4 h-4" /> Export Excel
          </button>
        </div>

        {/* Filters */}
        <div className="card-dark p-4 space-y-3">
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Filter className="w-4 h-4" />
            <span className="font-medium">Filter</span>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="ml-auto text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Reset
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Tipe</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
              >
                <option value="ALL">Semua</option>
                <option value="SECURITY">Security</option>
                <option value="HSE">HSE</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                Dari Tanggal
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                Sampai Tanggal
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                Nama Petugas
              </label>
              <input
                type="text"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                placeholder="Cari nama..."
                className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-green-400 animate-spin" />
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>Tidak ada laporan ditemukan</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => {
              const isExpanded = expandedId === report.id;
              const isSec = report.type === "SECURITY";
              const sr = report as { type: "SECURITY" } & SecurityReportDTO;
              const hr = report as { type: "HSE" } & HSEReportDTO;
              const totalDur = isSec ? getTotalDur(sr) : null;
              const findingCount = isSec ? getFindingCount(sr) : 0;
              const areaNames = isSec
                ? sr.areaVisits.map((av) => av.areaName).join(", ")
                : "";

              return (
                <div
                  key={report.id}
                  className="card-dark rounded-2xl overflow-hidden"
                >
                  <div
                    className="flex items-center gap-3 p-4 cursor-pointer hover:bg-white/5 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : report.id)}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isSec
                          ? "bg-blue-500/20 border border-blue-500/20"
                          : "bg-green-500/20 border border-green-500/20"
                      }`}
                    >
                      {isSec ? (
                        <Shield className="w-5 h-5 text-blue-400" />
                      ) : (
                        <Leaf className="w-5 h-5 text-green-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            isSec
                              ? "bg-blue-500/20 text-blue-400"
                              : "bg-green-500/20 text-green-400"
                          }`}
                        >
                          {report.type}
                        </span>
                        <p className="text-white text-sm font-semibold truncate">
                          {report.reportedBy}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap mt-0.5">
                        <p className="text-gray-400 text-xs">
                          {format(new Date(getDate(report)), "dd MMM yyyy", {
                            locale: localeId,
                          })}{" "}
                          · {getTime(report)} WIB
                        </p>
                        {isSec && areaNames && (
                          <p className="text-gray-500 text-xs truncate max-w-[200px]">
                            · {areaNames}
                          </p>
                        )}
                        {totalDur && (
                          <span className="flex items-center gap-1 text-[11px] text-blue-300 font-mono">
                            <Timer className="w-3 h-3" />
                            {totalDur}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isSec &&
                        (findingCount > 0 ? (
                          <span className="badge-finding">
                            <AlertTriangle className="w-3 h-3" />
                            {findingCount} Temuan
                          </span>
                        ) : (
                          <span className="badge-ok">
                            <CheckCircle className="w-3 h-3" />
                            Clear
                          </span>
                        ))}
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-white/10 p-4 space-y-4">
                      {(report.latitude || report.longitude) && (
                        <p className="text-xs text-gray-400 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-green-400" />
                          GPS: {report.latitude?.toFixed(6)},{" "}
                          {report.longitude?.toFixed(6)}
                        </p>
                      )}

                      {isSec && <PatrolTimeline report={sr} />}

                      {!isSec && (
                        <div className="space-y-3">
                          {hr.areaVisits.map((visit, i) => (
                            <div
                              key={i}
                              className="rounded-xl p-3 bg-white/5 border border-white/10 space-y-2"
                            >
                              <p className="text-green-400 text-sm font-semibold">
                                {visit.areaName}
                              </p>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                  <p className="text-gray-500">Kegiatan</p>
                                  <p className="text-gray-200">
                                    {visit.workActivities}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-gray-500">
                                    Potensi Bahaya
                                  </p>
                                  <div className="flex flex-wrap gap-1 mt-0.5">
                                    {visit.hazards.map((h) => (
                                      <span
                                        key={h}
                                        className="px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 text-xs"
                                      >
                                        {HAZARD_OPTIONS.find(
                                          (o) => o.value === h,
                                        )?.label ?? h}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <p className="text-gray-500">
                                    Deskripsi Bahaya
                                  </p>
                                  <p className="text-gray-200">
                                    {visit.hazardDescription}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-gray-500">Sosialisasi</p>
                                  <p className="text-gray-200">
                                    {visit.socializationDescription}
                                  </p>
                                </div>
                              </div>
                              {visit.evidencePhotoUrl && (
                                <a
                                  href={visit.evidencePhotoUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  <img
                                    src={visit.evidencePhotoUrl}
                                    alt="Evidence"
                                    className="w-full h-32 object-cover rounded-lg border border-white/10 hover:opacity-80 transition-opacity"
                                  />
                                </a>
                              )}
                            </div>
                          ))}
                          {(hr.hseSignatureUrl || hr.witnessSignatureUrl) && (
                            <div className="grid grid-cols-2 gap-3">
                              {hr.hseSignatureUrl && (
                                <div>
                                  <p className="text-xs text-gray-400 mb-1">
                                    TTD HSE
                                  </p>
                                  <img
                                    src={hr.hseSignatureUrl}
                                    alt="TTD HSE"
                                    className="h-16 object-contain bg-white rounded-lg p-1"
                                  />
                                </div>
                              )}
                              {hr.witnessSignatureUrl && (
                                <div>
                                  <p className="text-xs text-gray-400 mb-1">
                                    TTD Saksi
                                  </p>
                                  <img
                                    src={hr.witnessSignatureUrl}
                                    alt="TTD Saksi"
                                    className="h-16 object-contain bg-white rounded-lg p-1"
                                  />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
