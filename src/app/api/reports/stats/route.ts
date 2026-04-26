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
type ReportType = "SECURITY" | "HSE" | "ALL";

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
    return Array.from({ length: 24 }, (_, h) => {
      const rs = new Date(start);
      rs.setHours(h, 0, 0, 0);
      const re = new Date(start);
      re.setHours(h, 59, 59, 999);
      return { label: `${h.toString().padStart(2, "0")}:00`, rangeStart: rs, rangeEnd: re };
    });
  }

  if (period === "weekly") {
    return Array.from({ length: 7 }, (_, i) => {
      const rs = startOfDay(subDays(now, 6 - i));
      const re = endOfDay(rs);
      return { label: format(rs, "dd/MM"), rangeStart: rs, rangeEnd: re };
    });
  }

  if (period === "monthly") {
    return eachWeekOfInterval({ start, end }, { weekStartsOn: 1 }).map((ws) => {
      const we = endOfWeek(ws, { weekStartsOn: 1 });
      return {
        label: format(ws, "dd/MM"),
        rangeStart: ws,
        rangeEnd: we > now ? now : we,
      };
    });
  }

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
    const typeParam = (searchParams.get("type") ?? "ALL").toUpperCase() as ReportType;
    const today = format(new Date(), "yyyy-MM-dd");
    const { start, end } = getPeriodRange(period);
    const periodStartStr = format(start, "yyyy-MM-dd");
    const periodEndStr = format(end, "yyyy-MM-dd");

    const includeSecurity = typeParam === "ALL" || typeParam === "SECURITY";
    const includeHSE = typeParam === "ALL" || typeParam === "HSE";

    // ── 1. All-time totals ────────────────────────────────────────
    const [totalSecurity, totalHSE, securityToday, hseToday, totalFindings] =
      await Promise.all([
        includeHSE ? Promise.resolve(0) : Promise.resolve(0), // placeholder
        includeHSE ? Promise.resolve(0) : Promise.resolve(0), // placeholder
        Promise.resolve(0),
        Promise.resolve(0),
        Promise.resolve(0),
      ]);

    const [
      totalSecurityCount,
      totalHSECount,
      securityTodayCount,
      hseTodayCount,
      totalFindingsCount,
    ] = await Promise.all([
      includeHSE || includeSecurity ? prisma.securityReport.count() : Promise.resolve(0),
      includeHSE ? prisma.hSEReport.count() : Promise.resolve(0),
      includeHSE || includeSecurity ? prisma.securityReport.count({ where: { patrolDate: today } }) : Promise.resolve(0),
      includeHSE ? prisma.hSEReport.count({ where: { visitDate: today } }) : Promise.resolve(0),
      includeHSE || includeSecurity ? prisma.sectionFinding.count({ where: { status: "FINDING" } }) : Promise.resolve(0),
    ]);

    void totalSecurity; void totalHSE; void securityToday; void hseToday; void totalFindings;

    // ── 2. All-time area visit groupBy ────────────────────────────
    const securityByAreaAll = includeHSE || includeHSE // always fetch for byArea
      ? await prisma.reportAreaVisit.groupBy({
          by: ["areaId"],
          _count: { id: true },
        })
      : [];

    const allAreaIds = securityByAreaAll.map((r) => r.areaId);
    const allAreas = allAreaIds.length > 0
      ? await prisma.patrolArea.findMany({
          where: { id: { in: allAreaIds } },
          select: { id: true, name: true },
        })
      : [];
    const areaMap = Object.fromEntries(allAreas.map((a) => [a.id, a.name]));

    // ── 3. Period raw data ────────────────────────────────────────
    const [secReports, hseReports, findingsRaw, hseHazards] = await Promise.all([
      includeHSE || includeHSE
        ? prisma.securityReport.findMany({
            where: { patrolDate: { gte: periodStartStr, lte: periodEndStr } },
            select: {
              patrolDate: true,
              patrolTime: true,
              formOpenedAt: true,
              selfiePhotoTimestamp: true,
            },
          })
        : Promise.resolve([]),
      includeHSE
        ? prisma.hSEReport.findMany({
            where: { visitDate: { gte: periodStartStr, lte: periodEndStr } },
            select: { visitDate: true },
          })
        : Promise.resolve([]),
      includeHSE || includeHSE
        ? prisma.sectionFinding.findMany({
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
          })
        : Promise.resolve([]),
      includeHSE
        ? prisma.hSEHazard.findMany({
            where: {
              areaVisit: {
                report: { visitDate: { gte: periodStartStr, lte: periodEndStr } },
              },
            },
            select: { hazardType: true },
          })
        : Promise.resolve([]),
    ]);

    // ── 4. last-7-days bar data ───────────────────────────────────
    const last7DaysWindow = await Promise.all(
      Array.from({ length: 7 }, async (_, i) => {
        const d = format(subDays(new Date(), 6 - i), "yyyy-MM-dd");
        const [s, h] = await Promise.all([
          includeHSE || includeHSE
            ? prisma.securityReport.count({ where: { patrolDate: d } })
            : Promise.resolve(0),
          includeHSE
            ? prisma.hSEReport.count({ where: { visitDate: d } })
            : Promise.resolve(0),
        ]);
        return { date: format(new Date(d), "dd/MM"), Security: s, HSE: h };
      }),
    );

    // ── 5. Build period chart buckets ────────────────────────────
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

    // ── 6. Patrol time stats ──────────────────────────────────────
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

    // ── 7. Findings analytics ─────────────────────────────────────
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

    // ── 8. HSE hazard distribution ────────────────────────────────
    const hazardDistMap: Record<string, number> = {};
    hseHazards.forEach((h) => {
      hazardDistMap[h.hazardType] = (hazardDistMap[h.hazardType] ?? 0) + 1;
    });
    const hazardDistData = Object.entries(hazardDistMap)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // ── 9. Peak hours ─────────────────────────────────────────────
    const hourBuckets: number[] = new Array(24).fill(0);
    secReports.forEach((r) => {
      const h = parseInt(r.patrolTime.split(":")[0], 10);
      if (!isNaN(h) && h >= 0 && h < 24) hourBuckets[h]++;
    });
    const peakHours = Array.from({ length: 24 }, (_, h) => ({
      hour: `${h.toString().padStart(2, "0")}:00`,
      count: hourBuckets[h],
    }));

    // ── HSE: peak hours from visitTime ────────────────────────────
    if (includeHSE && !includeHSE) {
      // only HSE mode: override peakHours with HSE visit times
      // (handled in dashboard page directly)
    }

    const hseReportsAllTime = includeHSE
      ? await prisma.hSEReport.findMany({
          where: { visitDate: { gte: periodStartStr, lte: periodEndStr } },
          select: { visitTime: true },
        })
      : [];

    const hseHourBuckets: number[] = new Array(24).fill(0);
    hseReportsAllTime.forEach((r) => {
      const h = parseInt(r.visitTime.split(":")[0], 10);
      if (!isNaN(h) && h >= 0 && h < 24) hseHourBuckets[h]++;
    });
    const hsePeakHours = Array.from({ length: 24 }, (_, h) => ({
      hour: `${h.toString().padStart(2, "0")}:00`,
      count: hseHourBuckets[h],
    }));

    // For HSE-only, use HSE peak hours; for ALL use security; for SECURITY-only use security
    const finalPeakHours = typeParam === "HSE" ? hsePeakHours : peakHours;

    // ── HSE: byArea from hse_area_visits ─────────────────────────
    let hseByArea: { name: string; value: number }[] = [];
    if (includeHSE) {
      const hseAreaGroups = await prisma.hSEAreaVisit.groupBy({
        by: ["areaName"],
        _count: { id: true },
      });
      hseByArea = hseAreaGroups
        .map((g) => ({ name: g.areaName, value: g._count.id }))
        .sort((a, b) => b.value - a.value);
    }

    const finalByArea = typeParam === "HSE"
      ? hseByArea
      : securityByAreaAll.map((r) => ({
          name: areaMap[r.areaId] ?? "Unknown",
          value: r._count?.id ?? 0,
        }));

    const reportsToday = (typeParam === "HSE" ? hseTodayCount : 0) +
      (typeParam === "ALL" || typeParam === "SECURITY" ? securityTodayCount : 0);

    return NextResponse.json({
      totalReports: totalSecurityCount + totalHSECount,
      securityReports: totalSecurityCount,
      hseReports: totalHSECount,
      totalFindings: totalFindingsCount,
      reportsToday,
      last7Days: last7DaysWindow,
      byArea: finalByArea,
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
      peakHours: finalPeakHours,
    });
  } catch (err) {
    console.error("[GET /api/reports/stats]", err);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 },
    );
  }
}