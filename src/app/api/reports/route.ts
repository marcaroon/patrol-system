// src/app/api/reports/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { ReportDTO, SecurityReportDTO, HSEReportDTO } from "@/types";

// GET /api/reports?type=SECURITY|HSE&start=yyyy-MM-dd&end=yyyy-MM-dd&name=xxx
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");       // SECURITY | HSE | null
    const start = searchParams.get("start");      // yyyy-MM-dd
    const end = searchParams.get("end");          // yyyy-MM-dd
    const name = searchParams.get("name");        // search by person name

    const reports: ReportDTO[] = [];

    // ── Security Reports ───────────────────────────────────────
    if (!type || type === "SECURITY") {
      const where: Record<string, unknown> = {};
      if (start || end) {
        where.patrolDate = {
          ...(start && { gte: start }),
          ...(end && { lte: end }),
        };
      }
      if (name) {
        where.user = { name: { contains: name } };
      }

      const secReports = await prisma.securityReport.findMany({
        where,
        include: {
          user: true,
          area: true,
          checklist: {
            include: { checklistItem: true },
            orderBy: { checklistItem: { order: "asc" } },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      secReports.forEach((r) => {
        const dto: { type: "SECURITY" } & SecurityReportDTO = {
          type: "SECURITY",
          id: r.id,
          reportedBy: r.user.name,
          userId: r.userId,
          area: { id: r.area.id, name: r.area.name, code: r.area.code },
          patrolDate: r.patrolDate,
          patrolTime: r.patrolTime,
          latitude: r.latitude,
          longitude: r.longitude,
          checklist: r.checklist.map((c) => ({
            id: c.id,
            checklistItemId: c.checklistItemId,
            checklistItemLabel: c.checklistItem.label,
            status: c.status as "NO_FINDING" | "FINDING",
            findingDescription: c.findingDescription,
            photoUrl: c.photoUrl,
            photoTimestamp: c.photoTimestamp.toISOString(),
            photoLatitude: c.photoLatitude,
            photoLongitude: c.photoLongitude,
          })),
          createdAt: r.createdAt.toISOString(),
        };
        reports.push(dto);
      });
    }

    // ── HSE Reports ────────────────────────────────────────────
    if (!type || type === "HSE") {
      const where: Record<string, unknown> = {};
      if (start || end) {
        where.visitDate = {
          ...(start && { gte: start }),
          ...(end && { lte: end }),
        };
      }
      if (name) {
        where.user = { name: { contains: name } };
      }

      const hseReports = await prisma.hSEReport.findMany({
        where,
        include: {
          user: true,
          areaVisits: {
            include: { hazards: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      hseReports.forEach((r) => {
        const dto: { type: "HSE" } & HSEReportDTO = {
          type: "HSE",
          id: r.id,
          reportedBy: r.user.name,
          userId: r.userId,
          visitDate: r.visitDate,
          visitTime: r.visitTime,
          latitude: r.latitude,
          longitude: r.longitude,
          hseSignatureUrl: r.hseSignatureUrl,
          witnessSignatureUrl: r.witnessSignatureUrl,
          areaVisits: r.areaVisits.map((v) => ({
            id: v.id,
            areaName: v.areaName,
            workActivities: v.workActivities,
            hazards: v.hazards.map((h) => h.hazardType) as import("@/types").HazardType[],
            hazardDescription: v.hazardDescription,
            socializationDescription: v.socializationDescription,
            evidencePhotoUrl: v.evidencePhotoUrl,
            evidencePhotoTimestamp: v.evidencePhotoTimestamp.toISOString(),
            evidencePhotoLatitude: v.evidencePhotoLatitude,
            evidencePhotoLongitude: v.evidencePhotoLongitude,
          })),
          createdAt: r.createdAt.toISOString(),
        };
        reports.push(dto);
      });
    }

    // Sort combined result by createdAt desc
    reports.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json(reports);
  } catch (err) {
    console.error("[GET /api/reports]", err);
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}
