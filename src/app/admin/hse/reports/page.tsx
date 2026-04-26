// src/app/admin/hse/reports/page.tsx
"use client";
import { useEffect, useState, useCallback } from "react";
import AdminShell from "@/components/admin/AdminShell";
import type { HSEReportDTO } from "@/types";
import { HAZARD_OPTIONS } from "@/types";
import { exportReportsToExcel } from "@/lib/exportExcel";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  FileText,
  Filter,
  Download,
  Leaf,
  Loader2,
  X,
  MapPin,
  ChevronDown,
  ChevronUp,
  Camera,
  Image as ImageIcon,
} from "lucide-react";

export default function HSEReportsPage() {
  const [reports, setReports] = useState<({ type: "HSE" } & HSEReportDTO)[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchName, setSearchName] = useState("");

  const fetchReports = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams({ type: "HSE" });
    if (startDate) p.set("start", startDate);
    if (endDate) p.set("end", endDate);
    if (searchName) p.set("name", searchName);
    const data = await fetch(`/api/reports?${p}`).then((r) => r.json());
    setReports(data);
    setLoading(false);
  }, [startDate, endDate, searchName]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleExport = () => {
    if (!reports.length) {
      alert("Tidak ada data");
      return;
    }
    exportReportsToExcel(reports);
  };

  return (
    <AdminShell requiredRoles={["SUPER_ADMIN", "VIEWER", "HSE_ADMIN", "HSE_VIEWER"]}>
      <div className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-white text-2xl font-bold">Laporan EHS&FS</h1>
            <p className="text-gray-400 text-sm mt-0.5">
              {reports.length} laporan ditemukan
            </p>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <Download className="w-4 h-4" /> Export Excel
          </button>
        </div>

        <div className="card-dark p-4 space-y-3">
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Filter className="w-4 h-4" />
            <span className="font-medium">Filter</span>
            {(startDate || endDate || searchName) && (
              <button
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                  setSearchName("");
                }}
                className="ml-auto text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Reset
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                Dari Tanggal
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
                className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
                className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
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
              const totalVisitPhotos = report.areaVisits.reduce(
                (acc, av) => acc + (av.visitPhotos?.length ?? 0),
                0,
              );
              return (
                <div
                  key={report.id}
                  className="card-dark rounded-2xl overflow-hidden"
                >
                  <div
                    className="flex items-center gap-3 p-4 cursor-pointer hover:bg-white/5 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : report.id)}
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <Leaf className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-semibold truncate">
                        {report.reportedBy}
                      </p>
                      <p className="text-gray-400 text-xs mt-0.5">
                        {format(new Date(report.visitDate), "dd MMM yyyy", {
                          locale: localeId,
                        })}{" "}
                        · {report.visitTime} WIB
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {totalVisitPhotos > 0 && (
                        <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">
                          <ImageIcon className="w-3 h-3" />
                          {totalVisitPhotos} foto
                        </span>
                      )}
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
                          <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                          GPS: {report.latitude?.toFixed(6)},{" "}
                          {report.longitude?.toFixed(6)}
                        </p>
                      )}
                      {report.areaVisits.map((visit, i) => (
                        <div
                          key={i}
                          className="rounded-xl p-3 bg-white/5 border border-white/10 space-y-3"
                        >
                          <p className="text-emerald-400 text-sm font-semibold">
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
                              <p className="text-gray-500">Potensi Bahaya</p>
                              <div className="flex flex-wrap gap-1 mt-0.5">
                                {visit.hazards.map((h) => (
                                  <span
                                    key={h}
                                    className="px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 text-xs"
                                  >
                                    {HAZARD_OPTIONS.find((o) => o.value === h)
                                      ?.label ?? h}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div>
                              <p className="text-gray-500">Deskripsi Bahaya</p>
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
                            <div>
                              <p className="text-xs text-gray-500 mb-1.5 flex items-center gap-1">
                                <Camera className="w-3 h-3" /> Foto Evidence
                              </p>
                              <a
                                href={visit.evidencePhotoUrl}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <img
                                  src={visit.evidencePhotoUrl}
                                  alt="Evidence"
                                  className="w-full h-36 object-cover rounded-lg border border-white/10 hover:opacity-80 transition-opacity"
                                />
                              </a>
                            </div>
                          )}
                          {visit.visitPhotos &&
                            visit.visitPhotos.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-gray-400 mb-2 flex items-center gap-1.5">
                                  <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />{" "}
                                  Foto Area ({visit.visitPhotos.length} foto)
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                  {visit.visitPhotos.map((vp, vpIdx) => (
                                    <div
                                      key={vp.id}
                                      className="rounded-xl overflow-hidden border border-white/10 bg-white/3"
                                    >
                                      <a
                                        href={vp.photoUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="block"
                                      >
                                        <img
                                          src={vp.photoUrl}
                                          alt={`Foto area ${vpIdx + 1}`}
                                          className="w-full h-28 object-cover hover:opacity-80 transition-opacity"
                                        />
                                      </a>
                                      <div className="p-2">
                                        <span className="text-[10px] font-mono text-gray-500">
                                          {format(
                                            new Date(vp.photoTimestamp),
                                            "HH:mm:ss",
                                          )}
                                        </span>
                                        {vp.description && (
                                          <p className="text-xs text-gray-300 leading-snug mt-1 line-clamp-2">
                                            {vp.description}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                        </div>
                      ))}
                      {(report.hseSignatureUrl ||
                        report.witnessSignatureUrl) && (
                        <div className="grid grid-cols-2 gap-3">
                          {report.hseSignatureUrl && (
                            <div>
                              <p className="text-xs text-gray-400 mb-1">
                                TTD EHS&FS
                              </p>
                              <img
                                src={report.hseSignatureUrl}
                                alt="TTD EHS&FS"
                                className="h-16 object-contain bg-white rounded-lg p-1"
                              />
                            </div>
                          )}
                          {report.witnessSignatureUrl && (
                            <div>
                              <p className="text-xs text-gray-400 mb-1">
                                TTD Saksi
                              </p>
                              <img
                                src={report.witnessSignatureUrl}
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
              );
            })}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
