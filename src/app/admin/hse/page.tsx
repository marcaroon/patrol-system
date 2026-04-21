// src/app/admin/hse/page.tsx
"use client";
import { useCallback, useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import {
  Leaf,
  AlertTriangle,
  Loader2,
  FileText,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart2,
  MapPin,
} from "lucide-react";

type Period = "daily" | "weekly" | "monthly" | "yearly";
const PERIOD_LABELS: Record<Period, string> = {
  daily: "Hari Ini",
  weekly: "1 Minggu",
  monthly: "1 Bulan",
  yearly: "1 Tahun",
};
const HAZARD_LABELS: Record<string, string> = {
  TERJATUH: "Terjatuh",
  TERGELINCIR: "Tergelincir",
  TERKENA_BENDA_TAJAM: "Benda Tajam",
  TERBAKAR: "Kebakaran",
  TERSENGAT_LISTRIK: "Listrik",
  TERTIMPA_BENDA: "Tertimpa",
  TERHIRUP_GAS: "Gas Berbahaya",
  KONTAK_BAHAN_KIMIA: "Bahan Kimia",
  KEBISINGAN: "Kebisingan",
  KELELAHAN: "Kelelahan",
  LAINNYA: "Lainnya",
};
const TOOLTIP_STYLE = {
  contentStyle: {
    background: "#0f172a",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 12,
    color: "#fff",
    fontSize: 12,
  },
};

function computeTrend(arr: number[]): "up" | "down" | "flat" {
  if (arr.length < 2) return "flat";
  const half = Math.floor(arr.length / 2);
  const first = arr.slice(0, half).reduce((a, b) => a + b, 0);
  const last = arr.slice(half).reduce((a, b) => a + b, 0);
  if (last > first * 1.1) return "up";
  if (last < first * 0.9) return "down";
  return "flat";
}

function EmptyChart({ h = 180 }: { h?: number }) {
  return (
    <div className="flex items-center justify-center" style={{ height: h }}>
      <p className="text-gray-600 text-sm">Belum ada data</p>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  bg,
  border,
  sub,
  trend,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
  sub?: string;
  trend?: "up" | "down" | "flat";
}) {
  const TIcon =
    trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const tc =
    trend === "up"
      ? "text-green-400"
      : trend === "down"
        ? "text-red-400"
        : "text-gray-500";
  return (
    <div className={`rounded-2xl border p-4 ${bg} ${border}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-gray-400 text-xs mb-1">{label}</p>
          <p className={`text-3xl font-bold ${color}`}>{value}</p>
          {sub && <p className="text-gray-500 text-xs mt-1">{sub}</p>}
        </div>
        <div
          className={`w-9 h-9 rounded-xl ${bg} border ${border} flex items-center justify-center`}
        >
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
      </div>
      {trend && (
        <div
          className={`flex items-center gap-1 mt-2 ${tc} text-xs font-medium`}
        >
          <TIcon className="w-3 h-3" />
          <span>
            {trend === "up"
              ? "Meningkat"
              : trend === "down"
                ? "Menurun"
                : "Stabil"}
          </span>
        </div>
      )}
    </div>
  );
}

function PeriodSelector({
  value,
  onChange,
}: {
  value: Period;
  onChange: (p: Period) => void;
}) {
  return (
    <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
      {(["daily", "weekly", "monthly", "yearly"] as Period[]).map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${value === p ? "bg-emerald-600 text-white" : "text-gray-400 hover:text-white hover:bg-white/10"}`}
        >
          {PERIOD_LABELS[p]}
        </button>
      ))}
    </div>
  );
}

export default function HSEDashboardPage() {
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("weekly");

  const fetchStats = useCallback((p: Period) => {
    setLoading(true);
    fetch(`/api/reports/stats?period=${p}&type=HSE`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setStats(d))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchStats(period);
  }, [period, fetchStats]);

  const s = stats as {
    hseReports: number;
    reportsToday: number;
    periodData: { date: string; HSE: number }[];
    hazardDist: { type: string; count: number }[];
    byArea: { name: string; value: number }[];
  } | null;

  const hseTrend = s ? computeTrend(s.periodData.map((d) => d.HSE)) : "flat";

  return (
    <AdminShell requiredRoles={["SUPER_ADMIN", "VIEWER", "HSE_ADMIN"]}>
      <div className="space-y-6 pb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/20 flex items-center justify-center">
              <Leaf className="w-4 h-4 text-emerald-400" />
            </div>
            <h1 className="text-white text-2xl font-bold">Dashboard EHS&FS</h1>
          </div>
          <p className="text-gray-400 text-sm mt-1">
            Analitik laporan kunjungan EHS&FS
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
          </div>
        ) : !s ? (
          <div className="text-center py-20 text-gray-500">
            Gagal memuat data
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                label="Total Laporan EHS&FS"
                value={s.hseReports}
                icon={Leaf}
                color="text-emerald-400"
                bg="bg-emerald-500/10"
                border="border-emerald-500/20"
                sub={`${s.reportsToday} hari ini`}
                trend={hseTrend}
              />
              <StatCard
                label="Jenis Bahaya Teridentifikasi"
                value={s.hazardDist.length}
                icon={AlertTriangle}
                color="text-orange-400"
                bg="bg-orange-500/10"
                border="border-orange-500/20"
              />
            </div>

            <div className="flex items-center justify-between flex-wrap gap-3">
              <p className="text-white font-semibold text-sm flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-emerald-400" /> Laporan per
                Periode
              </p>
              <PeriodSelector value={period} onChange={setPeriod} />
            </div>

            <div className="card-dark p-4">
              <p className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-emerald-400" /> Laporan
                EHS&FS – {PERIOD_LABELS[period]}
              </p>
              {s.periodData.some((d) => d.HSE > 0) ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={s.periodData} barSize={9}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.05)"
                    />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: "#6b7280", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "#6b7280", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip {...TOOLTIP_STYLE} />
                    <Bar
                      dataKey="HSE"
                      name="EHS&FS"
                      fill="#22c55e"
                      radius={[3, 3, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart />
              )}
            </div>

            {s.hazardDist.length > 0 && (
              <div className="card-dark p-4">
                <p className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-400" /> Top
                  Potensi Bahaya – {PERIOD_LABELS[period]}
                </p>
                <ResponsiveContainer
                  width="100%"
                  height={Math.max(160, s.hazardDist.length * 38)}
                >
                  <BarChart
                    data={s.hazardDist.map((d) => ({
                      ...d,
                      label: HAZARD_LABELS[d.type] ?? d.type,
                    }))}
                    layout="vertical"
                    barSize={14}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.05)"
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      tick={{ fill: "#6b7280", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="label"
                      tick={{ fill: "#9ca3af", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      width={100}
                    />
                    <Tooltip {...TOOLTIP_STYLE} />
                    <Bar
                      dataKey="count"
                      name="Frekuensi"
                      fill="#fb923c"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {s.byArea.length > 0 && (
              <div className="card-dark p-4">
                <p className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" /> Kunjungan
                  per Area (Semua Waktu)
                </p>
                <ResponsiveContainer
                  width="100%"
                  height={Math.max(160, s.byArea.length * 44)}
                >
                  <BarChart data={s.byArea} layout="vertical" barSize={16}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.05)"
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      tick={{ fill: "#6b7280", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fill: "#9ca3af", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      width={180}
                    />
                    <Tooltip {...TOOLTIP_STYLE} />
                    <Bar
                      dataKey="value"
                      name="Kunjungan"
                      fill="#22c55e"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}
      </div>
    </AdminShell>
  );
}
