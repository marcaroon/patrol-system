// src/app/admin/dashboard/page.tsx
"use client";
import { useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import type { DashboardStats } from "@/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  FileText,
  Shield,
  Leaf,
  AlertTriangle,
  Calendar,
  TrendingUp,
  Loader2,
} from "lucide-react";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports/stats")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch stats");
        return r.json();
      })
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setStats(d);
      })
      .catch((err) => {
        console.error("Error fetching stats:", err);
        setStats(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const cards = stats
    ? [
        {
          label: "Total Laporan",
          value: stats.totalReports,
          icon: FileText,
          color: "text-blue-400",
          bg: "bg-blue-500/10",
          border: "border-blue-500/20",
        },
        {
          label: "Laporan Hari Ini",
          value: stats.reportsToday,
          icon: Calendar,
          color: "text-green-400",
          bg: "bg-green-500/10",
          border: "border-green-500/20",
        },
        {
          label: "Total Security",
          value: stats.securityReports,
          icon: Shield,
          color: "text-indigo-400",
          bg: "bg-indigo-500/10",
          border: "border-indigo-500/20",
        },
        {
          label: "Total HSE",
          value: stats.hseReports,
          icon: Leaf,
          color: "text-emerald-400",
          bg: "bg-emerald-500/10",
          border: "border-emerald-500/20",
        },
        {
          label: "Total Temuan",
          value: stats.totalFindings,
          icon: AlertTriangle,
          color: "text-orange-400",
          bg: "bg-orange-500/10",
          border: "border-orange-500/20",
        },
        {
          label: "Area Patroli",
          value: stats.byArea?.length ?? 0,
          icon: TrendingUp,
          color: "text-purple-400",
          bg: "bg-purple-500/10",
          border: "border-purple-500/20",
        },
      ]
    : [];

  const pieData = stats
    ? [
        { name: "Security", value: stats.securityReports, color: "#3b82f6" },
        { name: "HSE", value: stats.hseReports, color: "#22c55e" },
      ]
    : [];

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-white text-2xl font-bold">Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">
            Ringkasan laporan patrol Security & HSE
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-green-400 animate-spin" />
          </div>
        ) : (
          stats && (
            <>
              {/* Stat cards */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {cards.map((c) => (
                  <div
                    key={c.label}
                    className={`rounded-2xl border p-4 ${c.bg} ${c.border}`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-gray-400 text-xs mb-1">{c.label}</p>
                        <p className={`text-3xl font-bold ${c.color}`}>
                          {c.value}
                        </p>
                      </div>
                      <div
                        className={`w-9 h-9 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center`}
                      >
                        <c.icon className={`w-4 h-4 ${c.color}`} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Bar chart */}
                <div className="lg:col-span-2 card-dark p-4">
                  <h2 className="text-white font-semibold text-sm mb-4">
                    Laporan 7 Hari Terakhir
                  </h2>
                  {stats.last7Days && stats.last7Days.length > 0 ? (
                    <ResponsiveContainer width="100%" height={210}>
                      <BarChart data={stats.last7Days} barSize={10} barGap={4}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="rgba(255,255,255,0.05)"
                        />
                        <XAxis
                          dataKey="date"
                          tick={{ fill: "#6b7280", fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fill: "#6b7280", fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                          allowDecimals={false}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "#1e293b",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: 12,
                            color: "#fff",
                          }}
                        />
                        <Legend
                          wrapperStyle={{ color: "#9ca3af", fontSize: 12 }}
                        />
                        <Bar
                          dataKey="Security"
                          fill="#3b82f6"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="HSE"
                          fill="#22c55e"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[210px] flex items-center justify-center">
                      <p className="text-gray-500 text-sm">
                        Belum ada data laporan
                      </p>
                    </div>
                  )}
                </div>

                {/* Pie chart */}
                <div className="card-dark p-4">
                  <h2 className="text-white font-semibold text-sm mb-4">
                    Distribusi Laporan
                  </h2>
                  {stats.totalReports > 0 ? (
                    <ResponsiveContainer width="100%" height={210}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {pieData.map((e, i) => (
                            <Cell key={i} fill={e.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            background: "#1e293b",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: 12,
                            color: "#fff",
                          }}
                        />
                        <Legend
                          wrapperStyle={{ color: "#9ca3af", fontSize: 12 }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[210px] flex items-center justify-center">
                      <p className="text-gray-500 text-sm">Belum ada laporan</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Area bar */}
              {stats.byArea && stats.byArea.length > 0 && (
                <div className="card-dark p-4">
                  <h2 className="text-white font-semibold text-sm mb-4">
                    Laporan per Area Patrol
                  </h2>
                  <ResponsiveContainer
                    width="100%"
                    height={Math.max(160, stats.byArea.length * 44)}
                  >
                    <BarChart
                      data={stats.byArea}
                      layout="vertical"
                      barSize={16}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(255,255,255,0.05)"
                        horizontal={false}
                      />
                      <XAxis
                        type="number"
                        tick={{ fill: "#6b7280", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        tick={{ fill: "#9ca3af", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        width={200}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "#1e293b",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: 12,
                          color: "#fff",
                        }}
                      />
                      <Bar
                        dataKey="value"
                        name="Laporan"
                        fill="#6366f1"
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          )
        )}
      </div>
    </AdminShell>
  );
}
