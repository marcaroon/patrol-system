// src/app/api/reports/security/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CheckStatus } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userId,
      patrolDate,
      patrolTime,
      formOpenedAt,
      latitude,
      longitude,
      selfiePhotoUrl,
      selfiePhotoTimestamp,
      areaVisits,
    } = body;

    if (
      !userId ||
      !patrolDate ||
      !patrolTime ||
      !Array.isArray(areaVisits) ||
      areaVisits.length === 0
    )
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );

    const report = await prisma.securityReport.create({
      data: {
        userId,
        patrolDate,
        patrolTime,
        formOpenedAt: formOpenedAt ? new Date(formOpenedAt) : null,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        selfiePhotoUrl: selfiePhotoUrl ?? null,
        selfiePhotoTimestamp: selfiePhotoTimestamp
          ? new Date(selfiePhotoTimestamp)
          : null,
        areaVisits: {
          create: areaVisits.map(
            (visit: {
              areaId: string;
              order: number;
              sectionEntries: {
                areaSectionId: string;
                findings: {
                  status: string;
                  findingDescription?: string;
                  photoUrl: string;
                  photoTimestamp: string;
                  photoLatitude?: number;
                  photoLongitude?: number;
                  order: number;
                }[];
              }[];
            }) => ({
              area: { connect: { id: visit.areaId } },
              order: visit.order,
              sectionEntries: {
                create: visit.sectionEntries.map((se) => ({
                  areaSection: { connect: { id: se.areaSectionId } },
                  findings: {
                    create: se.findings.map((f) => ({
                      status: f.status as CheckStatus,
                      findingDescription: f.findingDescription ?? null,
                      photoUrl: f.photoUrl,
                      photoTimestamp: new Date(f.photoTimestamp),
                      photoLatitude: f.photoLatitude ?? null,
                      photoLongitude: f.photoLongitude ?? null,
                      order: f.order,
                    })),
                  },
                })),
              },
            }),
          ),
        },
      },
    });
    return NextResponse.json({ id: report.id }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/reports/security]", err);
    return NextResponse.json(
      { error: "Failed to submit security report" },
      { status: 500 },
    );
  }
}