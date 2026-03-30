// src/app/api/reports/hse/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { HazardType } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userId,
      visitDate,
      visitTime,
      latitude,
      longitude,
      hseSignatureUrl,
      witnessSignatureUrl,
      areaVisits,
    } = body;

    if (!userId || !visitDate || !visitTime || !Array.isArray(areaVisits) || areaVisits.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const report = await prisma.hSEReport.create({
      data: {
        userId,
        visitDate,
        visitTime,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        hseSignatureUrl: hseSignatureUrl ?? null,
        witnessSignatureUrl: witnessSignatureUrl ?? null,
        areaVisits: {
          create: areaVisits.map(
            (visit: {
              areaName: string;
              workActivities: string;
              hazards: string[];
              hazardDescription: string;
              socializationDescription: string;
              evidencePhotoUrl: string;
              evidencePhotoTimestamp: string;
              evidencePhotoLatitude?: number;
              evidencePhotoLongitude?: number;
            }) => ({
              areaName: visit.areaName,
              workActivities: visit.workActivities,
              hazardDescription: visit.hazardDescription,
              socializationDescription: visit.socializationDescription,
              evidencePhotoUrl: visit.evidencePhotoUrl,
              evidencePhotoTimestamp: new Date(visit.evidencePhotoTimestamp),
              evidencePhotoLatitude: visit.evidencePhotoLatitude ?? null,
              evidencePhotoLongitude: visit.evidencePhotoLongitude ?? null,
              hazards: {
                create: visit.hazards.map((h: string) => ({
                  hazardType: h as HazardType,
                })),
              },
            })
          ),
        },
      },
    });

    return NextResponse.json({ id: report.id }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/reports/hse]", err);
    return NextResponse.json({ error: "Failed to submit HSE report" }, { status: 500 });
  }
}
