// src/app/api/reports/stats/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { format, subDays } from "date-fns";
import type { DashboardStats } from "@/types";

export async function GET() {
  try {
    const today = format(new Date(), "yyyy-MM-dd");

    const [
      totalSecurity,
      totalHSE,
      securityToday,
      hseToday,
      findings,
      securityByArea,
    ] = await Promise.all([
      prisma.securityReport.count(),
      prisma.hSEReport.count(),
      prisma.securityReport.count({ where: { patrolDate: today } }),
      prisma.hSEReport.count({ where: { visitDate: today } }),
      prisma.checklistEntry.count({ where: { status: "FINDING" } }),
      prisma.securityReport.groupBy({
        by: ["areaId"],
        _count: { id: true },
      }),
    ]);

    // Resolve area names for byArea
    const areaIds = securityByArea.map((r) => r.areaId);
    const areas = await prisma.patrolArea.findMany({
      where: { id: { in: areaIds } },
      select: { id: true, name: true },
    });
    const areaMap = Object.fromEntries(areas.map((a) => [a.id, a.name]));

    // Last 7 days daily breakdown
    const last7Days = await Promise.all(
      Array.from({ length: 7 }, async (_, i) => {
        const date = format(subDays(new Date(), 6 - i), "yyyy-MM-dd");
        const label = format(subDays(new Date(), 6 - i), "dd/MM");
        const [sec, hse] = await Promise.all([
          prisma.securityReport.count({ where: { patrolDate: date } }),
          prisma.hSEReport.count({ where: { visitDate: date } }),
        ]);
        return { date: label, Security: sec, HSE: hse };
      })
    );

    const stats: DashboardStats = {
      totalReports: totalSecurity + totalHSE,
      securityReports: totalSecurity,
      hseReports: totalHSE,
      totalFindings: findings,
      reportsToday: securityToday + hseToday,
      last7Days,
      byArea: securityByArea.map((r) => ({
        name: areaMap[r.areaId] ?? "Unknown",
        value: r._count.id,
      })),
    };

    return NextResponse.json(stats);
  } catch (err) {
    console.error("[GET /api/reports/stats]", err);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
