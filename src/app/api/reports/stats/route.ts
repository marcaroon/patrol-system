// src/app/api/reports/stats/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  format,
  subDays,
  subWeeks,
  subMonths,
  subYears,
  eachWeekOfInterval,
  eachMonthOfInterval,
  endOfMonth,
  endOfWeek,
  startOfDay,
  endOfDay,
} from "date-fns";

type Period = "daily" | "weekly" | "monthly" | "yearly";

function getPeriodRange(period: Period): { start: Date; end: Date } {
  const now = new Date();
  switch (period) {
    case "daily":
      return { start: startOfDay(now), end: endOfDay(now) };
    case "weekly":
      return { start: subWeeks(now, 1), end: now };
    case "monthly":
      return { start: subMonths(now, 1), end: now };
    case "yearly":
      return { start: subYears(now, 1), end: now };
  }
}

type Bucket = {
  label: string;
  rangeStart: Date;
  rangeEnd: Date;
};

function getPeriodBuckets(period: Period, start: Date, end: Date): Bucket[] {
  const now = new Date();

  if (period === "daily") {
    // 24 hourly buckets for today
    return Array.from({ length: 24 }, (_, h) => {
      const rs = new Date(start);
      rs.setHours(h, 0, 0, 0);
      const re = new Date(start);
      re.setHours(h, 59, 59, 999);
      return { label: `${h.toString().padStart(2, "0")}:00`, rangeStart: rs, rangeEnd: re };
    });
  }

  if (period === "weekly") {
    // last 7 days
    return Array.from({ length: 7 }, (_, i) => {
      const rs = startOfDay(subDays(now, 6 - i));
      const re = endOfDay(rs);
      return { label: format(rs, "dd/MM"), rangeStart: rs, rangeEnd: re };
    });
  }

  if (period === "monthly") {
    // weekly buckets over last ~4 weeks
    return eachWeekOfInterval({ start, end }, { weekStartsOn: 1 }).map((ws) => {
      const we = endOfWeek(ws, { weekStartsOn: 1 });
      return {
        label: format(ws, "dd/MM"),
        rangeStart: ws,
        rangeEnd: we > now ? now : we,
      };
    });
  }

  // yearly: monthly buckets
  return eachMonthOfInterval({ start, end }).map((ms) => {
    const me = endOfMonth(ms);
    return {
      label: format(ms, "MMM yy"),
      rangeStart: ms,
      rangeEnd: me > now ? now : me,
    };
  });
}

function safeDuration(fo: Date | null, st: Date | null): number | null {
  if (!fo || !st) return null;
  const m = Math.round((st.getTime() - fo.getTime()) / 60000);
  return m > 0 && m < 600 ? m : null;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const period = (searchParams.get("period") ?? "weekly") as Period;
    const today = format(new Date(), "yyyy-MM-dd");
    const { start, end } = getPeriodRange(period);
    const periodStartStr = format(start, "yyyy-MM-dd");
    const periodEndStr = format(end, "yyyy-MM-dd");

    // ── 1. All-time totals (5 lightweight COUNT queries) ─────────
    const [totalSecurity, totalHSE, securityToday, hseToday, totalFindings] =
      await Promise.all([
        prisma.securityReport.count(),
        prisma.hSEReport.count(),
        prisma.securityReport.count({ where: { patrolDate: today } }),
        prisma.hSEReport.count({ where: { visitDate: today } }),
        prisma.sectionFinding.count({ where: { status: "FINDING" } }),
      ]);

    // ── 2. All-time area visit groupBy (for bottom chart) ────────
    const securityByAreaAll = await prisma.reportAreaVisit.groupBy({
      by: ["areaId"],
      _count: { id: true },
    });
    const allAreaIds = securityByAreaAll.map((r) => r.areaId);
    const allAreas = await prisma.patrolArea.findMany({
      where: { id: { in: allAreaIds } },
      select: { id: true, name: true },
    });
    const areaMap = Object.fromEntries(allAreas.map((a) => [a.id, a.name]));

    // ── 3. Period raw data (4 queries, all in parallel) ──────────
    const [secReports, hseReports, findingsRaw, hseHazards] = await Promise.all([
      // Security reports: only the fields we need
      prisma.securityReport.findMany({
        where: { patrolDate: { gte: periodStartStr, lte: periodEndStr } },
        select: {
          patrolDate: true,
          patrolTime: true,
          formOpenedAt: true,
          selfiePhotoTimestamp: true,
        },
      }),
      // HSE reports
      prisma.hSEReport.findMany({
        where: { visitDate: { gte: periodStartStr, lte: periodEndStr } },
        select: { visitDate: true },
      }),
      // Section findings with area link for trend + by-area
      prisma.sectionFinding.findMany({
        where: {
          sectionEntry: {
            areaVisit: {
              report: { patrolDate: { gte: periodStartStr, lte: periodEndStr } },
            },
          },
        },
        select: {
          status: true,
          photoTimestamp: true,
          sectionEntry: { select: { areaVisit: { select: { areaId: true } } } },
        },
      }),
      // HSE hazards
      prisma.hSEHazard.findMany({
        where: {
          areaVisit: {
            report: { visitDate: { gte: periodStartStr, lte: periodEndStr } },
          },
        },
        select: { hazardType: true },
      }),
    ]);

    // ── 4. last-7-days bar data (in-memory from secReports / hseReports
    //       but we need all 7 days even if period ≠ weekly, so keep a
    //       separate small in-memory calc using the all-time scan would be
    //       heavy; use a tiny raw SQL for this legacy field only) ────────
    // We'll build it from the weekly window regardless of current period.
    const last7DaysWindow = await Promise.all(
      Array.from({ length: 7 }, async (_, i) => {
        const d = format(subDays(new Date(), 6 - i), "yyyy-MM-dd");
        const [s, h] = await Promise.all([
          prisma.securityReport.count({ where: { patrolDate: d } }),
          prisma.hSEReport.count({ where: { visitDate: d } }),
        ]);
        return { date: format(new Date(d), "dd/MM"), Security: s, HSE: h };
      }),
    );

    // ── 5. Build period chart buckets (all in-memory) ─────────────
    const buckets = getPeriodBuckets(period, start, end);

    const periodData = buckets.map(({ label, rangeStart, rangeEnd }) => {
      const rsStr = format(rangeStart, "yyyy-MM-dd");
      const reStr = format(rangeEnd, "yyyy-MM-dd");

      if (period === "daily") {
        const h = rangeStart.getHours();
        return {
          date: label,
          Security: secReports.filter(
            (r) => parseInt(r.patrolTime.split(":")[0], 10) === h,
          ).length,
          HSE: 0,
        };
      }

      return {
        date: label,
        Security: secReports.filter(
          (r) => r.patrolDate >= rsStr && r.patrolDate <= reStr,
        ).length,
        HSE: hseReports.filter(
          (r) => r.visitDate >= rsStr && r.visitDate <= reStr,
        ).length,
      };
    });

    // ── 6. Patrol time stats (in-memory) ─────────────────────────
    const durations = secReports
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

    const patrolTimeTrend = buckets.map(({ label, rangeStart, rangeEnd }) => {
      const rsStr = format(rangeStart, "yyyy-MM-dd");
      const reStr = format(rangeEnd, "yyyy-MM-dd");
      const slice = secReports.filter(
        (r) => r.patrolDate >= rsStr && r.patrolDate <= reStr,
      );
      const sd = slice
        .map((r) => safeDuration(r.formOpenedAt, r.selfiePhotoTimestamp))
        .filter((d): d is number => d !== null);
      return {
        date: label,
        avgMinutes:
          sd.length > 0
            ? Math.round(sd.reduce((a, b) => a + b, 0) / sd.length)
            : 0,
        count: sd.length,
      };
    });

    // ── 7. Findings analytics (in-memory) ────────────────────────
    const totalFindingsInPeriod = findingsRaw.filter(
      (f) => f.status === "FINDING",
    ).length;
    const totalInspectionsInPeriod = findingsRaw.length;
    const findingRate =
      totalInspectionsInPeriod > 0
        ? Math.round(
            (totalFindingsInPeriod / totalInspectionsInPeriod) * 1000,
          ) / 10
        : 0;

    const findingsCountByArea: Record<string, number> = {};
    const visitsCountByArea: Record<string, number> = {};
    findingsRaw.forEach((f) => {
      const aId = f.sectionEntry.areaVisit.areaId;
      if (f.status === "FINDING")
        findingsCountByArea[aId] = (findingsCountByArea[aId] ?? 0) + 1;
      visitsCountByArea[aId] = (visitsCountByArea[aId] ?? 0) + 1;
    });
    const findingsByArea = Object.keys({
      ...findingsCountByArea,
      ...visitsCountByArea,
    })
      .map((aId) => ({
        name: areaMap[aId] ?? "Unknown",
        findings: findingsCountByArea[aId] ?? 0,
        inspections: visitsCountByArea[aId] ?? 0,
      }))
      .sort((a, b) => b.findings - a.findings);

    const findingsTrend = buckets.map(({ label, rangeStart, rangeEnd }) => {
      const items = findingsRaw.filter(
        (f) => f.photoTimestamp >= rangeStart && f.photoTimestamp <= rangeEnd,
      );
      return {
        date: label,
        findings: items.filter((f) => f.status === "FINDING").length,
        clear: items.filter((f) => f.status === "NO_FINDING").length,
      };
    });

    // ── 8. HSE hazard distribution (in-memory) ───────────────────
    const hazardDistMap: Record<string, number> = {};
    hseHazards.forEach((h) => {
      hazardDistMap[h.hazardType] = (hazardDistMap[h.hazardType] ?? 0) + 1;
    });
    const hazardDistData = Object.entries(hazardDistMap)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // ── 9. Peak hours (in-memory) ─────────────────────────────────
    const hourBuckets: number[] = new Array(24).fill(0);
    secReports.forEach((r) => {
      const h = parseInt(r.patrolTime.split(":")[0], 10);
      if (!isNaN(h) && h >= 0 && h < 24) hourBuckets[h]++;
    });
    const peakHours = Array.from({ length: 24 }, (_, h) => ({
      hour: `${h.toString().padStart(2, "0")}:00`,
      count: hourBuckets[h],
    }));

    return NextResponse.json({
      totalReports: totalSecurity + totalHSE,
      securityReports: totalSecurity,
      hseReports: totalHSE,
      totalFindings,
      reportsToday: securityToday + hseToday,
      last7Days: last7DaysWindow,
      byArea: securityByAreaAll.map((r) => ({
        name: areaMap[r.areaId] ?? "Unknown",
        value: r._count?.id ?? 0,
      })),
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
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 },
    );
  }
}