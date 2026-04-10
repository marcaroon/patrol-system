// src/app/api/reports/stats/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  format,
  subDays,
  subMonths,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  endOfMonth,
  endOfWeek,
} from "date-fns";

type Period = "daily" | "weekly" | "monthly";

function getPeriodRange(period: Period): { start: Date; end: Date } {
  const now = new Date();
  switch (period) {
    case "daily":
      return { start: subDays(now, 6), end: now };
    case "weekly":
      return { start: subDays(now, 48), end: now }; // ~7 weeks
    case "monthly":
      return { start: subMonths(now, 11), end: now };
  }
}

function safeDuration(formOpenedAt: Date | null, selfieTs: Date | null): number | null {
  if (!formOpenedAt || !selfieTs) return null;
  const minutes = Math.round((selfieTs.getTime() - formOpenedAt.getTime()) / 60000);
  if (minutes <= 0 || minutes >= 600) return null; // filter outliers
  return minutes;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const period = (searchParams.get("period") ?? "daily") as Period;
    const today = format(new Date(), "yyyy-MM-dd");

    // ── Base counts ──────────────────────────────────────────────
    const [
      totalSecurity,
      totalHSE,
      securityToday,
      hseToday,
      totalFindings,
      securityByAreaAll,
    ] = await Promise.all([
      prisma.securityReport.count(),
      prisma.hSEReport.count(),
      prisma.securityReport.count({ where: { patrolDate: today } }),
      prisma.hSEReport.count({ where: { visitDate: today } }),
      prisma.sectionFinding.count({ where: { status: "FINDING" } }),
      prisma.reportAreaVisit.groupBy({ by: ["areaId"], _count: { id: true } }),
    ]);

    const allAreaIds = securityByAreaAll.map((r) => r.areaId);
    const allAreas = await prisma.patrolArea.findMany({
      where: { id: { in: allAreaIds } },
      select: { id: true, name: true },
    });
    const areaMap = Object.fromEntries(allAreas.map((a) => [a.id, a.name]));

    // ── Last 7 days (always) ─────────────────────────────────────
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

    // ── Period range ─────────────────────────────────────────────
    const { start, end } = getPeriodRange(period);
    const periodStartStr = format(start, "yyyy-MM-dd");
    const periodEndStr = format(end, "yyyy-MM-dd");

    // ── Period-bucketed report counts ────────────────────────────
    let periodData: { date: string; Security: number; HSE: number }[] = [];

    if (period === "daily") {
      const days = eachDayOfInterval({ start, end });
      periodData = await Promise.all(
        days.map(async (day) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const [sec, hse] = await Promise.all([
            prisma.securityReport.count({ where: { patrolDate: dateStr } }),
            prisma.hSEReport.count({ where: { visitDate: dateStr } }),
          ]);
          return { date: format(day, "dd/MM"), Security: sec, HSE: hse };
        })
      );
    } else if (period === "weekly") {
      const weeks = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 });
      periodData = await Promise.all(
        weeks.map(async (weekStart) => {
          const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
          const s = format(weekStart, "yyyy-MM-dd");
          const e2 = format(weekEnd, "yyyy-MM-dd");
          const [sec, hse] = await Promise.all([
            prisma.securityReport.count({ where: { patrolDate: { gte: s, lte: e2 } } }),
            prisma.hSEReport.count({ where: { visitDate: { gte: s, lte: e2 } } }),
          ]);
          return { date: format(weekStart, "dd/MM"), Security: sec, HSE: hse };
        })
      );
    } else {
      const months = eachMonthOfInterval({ start, end });
      periodData = await Promise.all(
        months.map(async (monthStart) => {
          const monthEnd = endOfMonth(monthStart);
          const s = format(monthStart, "yyyy-MM-dd");
          const e2 = format(monthEnd, "yyyy-MM-dd");
          const [sec, hse] = await Promise.all([
            prisma.securityReport.count({ where: { patrolDate: { gte: s, lte: e2 } } }),
            prisma.hSEReport.count({ where: { visitDate: { gte: s, lte: e2 } } }),
          ]);
          return { date: format(monthStart, "MMM yy"), Security: sec, HSE: hse };
        })
      );
    }

    // ── Patrol time analytics ────────────────────────────────────
    const secReportsWithTime = await prisma.securityReport.findMany({
      where: {
        patrolDate: { gte: periodStartStr, lte: periodEndStr },
        formOpenedAt: { not: null },
        selfiePhotoTimestamp: { not: null },
      },
      select: {
        formOpenedAt: true,
        selfiePhotoTimestamp: true,
        patrolDate: true,
      },
    });

    const durations = secReportsWithTime
      .map((r) => safeDuration(r.formOpenedAt, r.selfiePhotoTimestamp))
      .filter((d): d is number => d !== null);

    const avgPatrolMinutes =
      durations.length > 0
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
        : 0;
    const totalPatrolMinutes = durations.reduce((a, b) => a + b, 0);
    const minPatrol = durations.length > 0 ? Math.min(...durations) : 0;
    const maxPatrol = durations.length > 0 ? Math.max(...durations) : 0;

    const durationBuckets = [
      { label: "<15m", min: 0, max: 15 },
      { label: "15-30m", min: 15, max: 30 },
      { label: "30-60m", min: 30, max: 60 },
      { label: "1-2j", min: 60, max: 120 },
      { label: ">2j", min: 120, max: 9999 },
    ];
    const durationDist = durationBuckets.map((b) => ({
      label: b.label,
      count: durations.filter((d) => d >= b.min && d < b.max).length,
    }));

    // Patrol time trend
    let patrolTimeTrend: { date: string; avgMinutes: number; count: number }[] = [];
    if (period === "daily") {
      patrolTimeTrend = eachDayOfInterval({ start, end }).map((day) => {
        const dateStr = format(day, "yyyy-MM-dd");
        const dayDurs = secReportsWithTime
          .filter((r) => r.patrolDate === dateStr)
          .map((r) => safeDuration(r.formOpenedAt, r.selfiePhotoTimestamp))
          .filter((d): d is number => d !== null);
        return {
          date: format(day, "dd/MM"),
          avgMinutes: dayDurs.length > 0 ? Math.round(dayDurs.reduce((a, b) => a + b, 0) / dayDurs.length) : 0,
          count: dayDurs.length,
        };
      });
    } else if (period === "weekly") {
      patrolTimeTrend = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 }).map((weekStart) => {
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
        const s = format(weekStart, "yyyy-MM-dd");
        const e2 = format(weekEnd, "yyyy-MM-dd");
        const wDurs = secReportsWithTime
          .filter((r) => r.patrolDate >= s && r.patrolDate <= e2)
          .map((r) => safeDuration(r.formOpenedAt, r.selfiePhotoTimestamp))
          .filter((d): d is number => d !== null);
        return {
          date: format(weekStart, "dd/MM"),
          avgMinutes: wDurs.length > 0 ? Math.round(wDurs.reduce((a, b) => a + b, 0) / wDurs.length) : 0,
          count: wDurs.length,
        };
      });
    } else {
      patrolTimeTrend = eachMonthOfInterval({ start, end }).map((monthStart) => {
        const monthEnd = endOfMonth(monthStart);
        const s = format(monthStart, "yyyy-MM-dd");
        const e2 = format(monthEnd, "yyyy-MM-dd");
        const mDurs = secReportsWithTime
          .filter((r) => r.patrolDate >= s && r.patrolDate <= e2)
          .map((r) => safeDuration(r.formOpenedAt, r.selfiePhotoTimestamp))
          .filter((d): d is number => d !== null);
        return {
          date: format(monthStart, "MMM yy"),
          avgMinutes: mDurs.length > 0 ? Math.round(mDurs.reduce((a, b) => a + b, 0) / mDurs.length) : 0,
          count: mDurs.length,
        };
      });
    }

    // ── Findings analytics ───────────────────────────────────────
    const allFindingsInPeriod = await prisma.sectionFinding.findMany({
      where: {
        sectionEntry: {
          areaVisit: {
            report: {
              patrolDate: { gte: periodStartStr, lte: periodEndStr },
            },
          },
        },
      },
      select: {
        status: true,
        photoTimestamp: true,
        sectionEntry: {
          select: {
            areaVisit: {
              select: { areaId: true },
            },
          },
        },
      },
    });

    const totalFindingsInPeriod = allFindingsInPeriod.filter((f) => f.status === "FINDING").length;
    const totalInspectionsInPeriod = allFindingsInPeriod.length;
    const findingRate =
      totalInspectionsInPeriod > 0
        ? Math.round((totalFindingsInPeriod / totalInspectionsInPeriod) * 1000) / 10
        : 0;

    // Findings count per area
    const findingsCountByArea: Record<string, number> = {};
    const visitsCountByArea: Record<string, number> = {};
    allFindingsInPeriod.forEach((f) => {
      const aId = f.sectionEntry.areaVisit.areaId;
      if (f.status === "FINDING") findingsCountByArea[aId] = (findingsCountByArea[aId] ?? 0) + 1;
      visitsCountByArea[aId] = (visitsCountByArea[aId] ?? 0) + 1;
    });

    const findingsByArea = Object.keys({ ...findingsCountByArea, ...visitsCountByArea }).map((aId) => ({
      name: areaMap[aId] ?? "Unknown",
      findings: findingsCountByArea[aId] ?? 0,
      inspections: visitsCountByArea[aId] ?? 0,
    })).sort((a, b) => b.findings - a.findings);

    // Findings trend
    let findingsTrend: { date: string; findings: number; clear: number }[] = [];
    const makeFindingBucket = (items: typeof allFindingsInPeriod) => ({
      findings: items.filter((f) => f.status === "FINDING").length,
      clear: items.filter((f) => f.status === "NO_FINDING").length,
    });

    if (period === "daily") {
      findingsTrend = eachDayOfInterval({ start, end }).map((day) => {
        const dayStart = new Date(day); dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(day); dayEnd.setHours(23, 59, 59, 999);
        const items = allFindingsInPeriod.filter(
          (f) => f.photoTimestamp >= dayStart && f.photoTimestamp <= dayEnd
        );
        return { date: format(day, "dd/MM"), ...makeFindingBucket(items) };
      });
    } else if (period === "weekly") {
      findingsTrend = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 }).map((weekStart) => {
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
        const items = allFindingsInPeriod.filter(
          (f) => f.photoTimestamp >= weekStart && f.photoTimestamp <= weekEnd
        );
        return { date: format(weekStart, "dd/MM"), ...makeFindingBucket(items) };
      });
    } else {
      findingsTrend = eachMonthOfInterval({ start, end }).map((monthStart) => {
        const monthEnd = endOfMonth(monthStart);
        const items = allFindingsInPeriod.filter(
          (f) => f.photoTimestamp >= monthStart && f.photoTimestamp <= monthEnd
        );
        return { date: format(monthStart, "MMM yy"), ...makeFindingBucket(items) };
      });
    }

    // ── HSE Hazard distribution ──────────────────────────────────
    const hseHazards = await prisma.hSEHazard.findMany({
      where: {
        areaVisit: {
          report: { visitDate: { gte: periodStartStr, lte: periodEndStr } },
        },
      },
      select: { hazardType: true },
    });
    const hazardDist: Record<string, number> = {};
    hseHazards.forEach((h) => {
      hazardDist[h.hazardType] = (hazardDist[h.hazardType] ?? 0) + 1;
    });
    const hazardDistData = Object.entries(hazardDist)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // ── Peak patrol hour ─────────────────────────────────────────
    const allSecReportsInPeriod = await prisma.securityReport.findMany({
      where: { patrolDate: { gte: periodStartStr, lte: periodEndStr } },
      select: { patrolTime: true },
    });
    const hourBuckets: number[] = new Array(24).fill(0);
    allSecReportsInPeriod.forEach((r) => {
      const hour = parseInt(r.patrolTime.split(":")[0], 10);
      if (!isNaN(hour) && hour >= 0 && hour < 24) hourBuckets[hour]++;
    });
    const peakHours = Array.from({ length: 24 }, (_, h) => ({
      hour: `${h.toString().padStart(2, "0")}:00`,
      count: hourBuckets[h],
    }));

    return NextResponse.json({
      // Legacy fields (keep backward compat)
      totalReports: totalSecurity + totalHSE,
      securityReports: totalSecurity,
      hseReports: totalHSE,
      totalFindings,
      reportsToday: securityToday + hseToday,
      last7Days,
      byArea: securityByAreaAll.map((r) => ({
        name: areaMap[r.areaId] ?? "Unknown",
        value: r._count?.id ?? 0,
      })),
      // New fields
      period,
      periodData,
      patrolTimeStats: {
        avg: avgPatrolMinutes,
        total: totalPatrolMinutes,
        min: minPatrol,
        max: maxPatrol,
        count: durations.length,
        durationDist,
        trend: patrolTimeTrend,
      },
      findingsByArea,
      findingsTrend,
      findingRate,
      totalFindingsInPeriod,
      hazardDist: hazardDistData,
      peakHours,
    });
  } catch (err) {
    console.error("[GET /api/reports/stats]", err);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}