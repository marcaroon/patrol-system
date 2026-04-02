// src/app/api/areas/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get("active") !== "false";
    const areas = await prisma.patrolArea.findMany({
      where: activeOnly ? { isActive: true } : {},
      include: { sections: { orderBy: { order: "asc" } } },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(areas);
  } catch (err) {
    console.error("[GET /api/areas]", err);
    return NextResponse.json(
      { error: "Failed to fetch areas" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, code, sections } = body;
    if (!name?.trim() || !code?.trim())
      return NextResponse.json(
        { error: "name and code required" },
        { status: 400 },
      );
    if (!Array.isArray(sections) || sections.length === 0)
      return NextResponse.json(
        { error: "at least 1 section required" },
        { status: 400 },
      );

    const area = await prisma.patrolArea.create({
      data: {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        isActive: true,
        sections: {
          create: sections.map(
            (
              s: {
                name: string;
                description?: string;
                referenceImageUrl?: string;
              },
              idx: number,
            ) => ({
              order: idx + 1,
              name: s.name.trim(),
              description: s.description?.trim() ?? null,
              referenceImageUrl: s.referenceImageUrl?.trim() ?? null,
            }),
          ),
        },
      },
      include: { sections: { orderBy: { order: "asc" } } },
    });
    return NextResponse.json(area, { status: 201 });
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e.code === "P2002")
      return NextResponse.json(
        { error: "Kode area sudah digunakan" },
        { status: 409 },
      );
    console.error("[POST /api/areas]", err);
    return NextResponse.json(
      { error: "Failed to create area" },
      { status: 500 },
    );
  }
}
