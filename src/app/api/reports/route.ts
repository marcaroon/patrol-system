// src/app/api/reports/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { ReportDTO, SecurityReportDTO, HSEReportDTO } from "@/types";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const start = searchParams.get("start");
    const end = searchParams.get("end");
    const name = searchParams.get("name");

    const reports: ReportDTO[] = [];

    if (!type || type === "SECURITY") {
      const where: Record<string, unknown> = {};
      if (start || end)
        where.patrolDate = {
          ...(start && { gte: start }),
          ...(end && { lte: end }),
        };
      if (name) where.user = { name: { contains: name } };

      const secReports = await prisma.securityReport.findMany({
        where,
        include: {
          user: true,
          areaVisits: {
            orderBy: { order: "asc" },
            include: {
              area: true,
              sectionEntries: {
                include: {
                  areaSection: true,
                  findings: { orderBy: { order: "asc" } },
                },
              },
            },
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
          patrolDate: r.patrolDate,
          patrolTime: r.patrolTime,
          formOpenedAt: r.formOpenedAt?.toISOString() ?? null,
          latitude: r.latitude,
          longitude: r.longitude,
          selfiePhotoUrl: r.selfiePhotoUrl,
          selfiePhotoTimestamp: r.selfiePhotoTimestamp?.toISOString() ?? null,
          areaVisits: r.areaVisits.map((av) => ({
            id: av.id,
            areaId: av.areaId,
            areaName: av.area.name,
            areaCode: av.area.code,
            order: av.order,
            sectionEntries: av.sectionEntries.map((se) => ({
              id: se.id,
              areaSectionId: se.areaSectionId,
              areaSectionName: se.areaSection.name,
              findings: se.findings.map((f) => ({
                id: f.id,
                status: f.status as "NO_FINDING" | "FINDING",
                findingDescription: f.findingDescription,
                photoUrl: f.photoUrl,
                photoTimestamp: f.photoTimestamp.toISOString(),
                photoLatitude: f.photoLatitude,
                photoLongitude: f.photoLongitude,
                order: f.order,
              })),
            })),
          })),
          createdAt: r.createdAt.toISOString(),
        };
        reports.push(dto);
      });
    }

    if (!type || type === "HSE") {
      const where: Record<string, unknown> = {};
      if (start || end)
        where.visitDate = {
          ...(start && { gte: start }),
          ...(end && { lte: end }),
        };
      if (name) where.user = { name: { contains: name } };

      const hseReports = await prisma.hSEReport.findMany({
        where,
        include: {
          user: true,
          areaVisits: {
            include: {
              hazards: true,
              visitPhotos: { orderBy: { order: "asc" } }, // ← include visit photos
            },
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
            hazards: v.hazards.map(
              (h) => h.hazardType,
            ) as import("@/types").HazardType[],
            hazardDescription: v.hazardDescription,
            socializationDescription: v.socializationDescription,
            evidencePhotoUrl: v.evidencePhotoUrl,
            evidencePhotoTimestamp: v.evidencePhotoTimestamp.toISOString(),
            evidencePhotoLatitude: v.evidencePhotoLatitude,
            evidencePhotoLongitude: v.evidencePhotoLongitude,
            visitPhotos: v.visitPhotos.map((vp) => ({
              id: vp.id,
              photoUrl: vp.photoUrl,
              description: vp.description,
              photoTimestamp: vp.photoTimestamp.toISOString(),
              photoLatitude: vp.photoLatitude,
              photoLongitude: vp.photoLongitude,
              order: vp.order,
            })),
          })),
          createdAt: r.createdAt.toISOString(),
        };
        reports.push(dto);
      });
    }

    reports.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    return NextResponse.json(reports);
  } catch (err) {
    console.error("[GET /api/reports]", err);
    return NextResponse.json(
      { error: "Failed to fetch reports" },
      { status: 500 },
    );
  }
}