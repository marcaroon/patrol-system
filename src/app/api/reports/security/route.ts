// src/app/api/reports/security/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CheckStatus } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userId,
      areaId,
      patrolDate,
      patrolTime,
      latitude,
      longitude,
      checklist,
      selfiePhotoUrl,
      selfiePhotoTimestamp,
    } = body;

    if (!userId || !areaId || !patrolDate || !patrolTime || !Array.isArray(checklist)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate all entries have required fields
    for (const entry of checklist) {
      if (!entry.checklistItemId || !entry.status || !entry.photoUrl) {
        return NextResponse.json(
          { error: "Each checklist entry must have checklistItemId, status, and photoUrl" },
          { status: 400 }
        );
      }
    }

    const report = await prisma.securityReport.create({
      data: {
        userId,
        areaId,
        patrolDate,
        patrolTime,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        selfiePhotoUrl: selfiePhotoUrl ?? null,
        selfiePhotoTimestamp: selfiePhotoTimestamp ? new Date(selfiePhotoTimestamp) : null,
        checklist: {
          create: checklist.map(
            (entry: {
              checklistItemId: string;
              status: string;
              findingDescription?: string;
              photoUrl: string;
              photoTimestamp: string;
              photoLatitude?: number;
              photoLongitude?: number;
            }) => ({
              checklistItemId: entry.checklistItemId,
              status: entry.status as CheckStatus,
              findingDescription: entry.findingDescription ?? null,
              photoUrl: entry.photoUrl,
              photoTimestamp: new Date(entry.photoTimestamp),
              photoLatitude: entry.photoLatitude ?? null,
              photoLongitude: entry.photoLongitude ?? null,
            })
          ),
        },
      },
      include: { user: true, area: true },
    });

    return NextResponse.json({ id: report.id }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/reports/security]", err);
    return NextResponse.json({ error: "Failed to submit security report" }, { status: 500 });
  }
}