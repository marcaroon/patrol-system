// src/app/api/areas/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/areas?active=true
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get("active") !== "false";

    const areas = await prisma.patrolArea.findMany({
      where: activeOnly ? { isActive: true } : {},
      include: {
        checklistItems: { orderBy: { order: "asc" } },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(areas);
  } catch (err) {
    console.error("[GET /api/areas]", err);
    return NextResponse.json({ error: "Failed to fetch areas" }, { status: 500 });
  }
}

// POST /api/areas
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, code, checklistItems } = body;

    if (!name?.trim() || !code?.trim()) {
      return NextResponse.json({ error: "name and code required" }, { status: 400 });
    }
    if (!Array.isArray(checklistItems) || checklistItems.length === 0) {
      return NextResponse.json({ error: "at least 1 checklist item required" }, { status: 400 });
    }

    const area = await prisma.patrolArea.create({
      data: {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        isActive: true,
        checklistItems: {
          create: checklistItems.map(
            (item: { label: string; description?: string }, idx: number) => ({
              order: idx + 1,
              label: item.label.trim(),
              description: item.description?.trim() ?? null,
            })
          ),
        },
      },
      include: { checklistItems: { orderBy: { order: "asc" } } },
    });

    return NextResponse.json(area, { status: 201 });
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e.code === "P2002") {
      return NextResponse.json({ error: "Kode area sudah digunakan" }, { status: 409 });
    }
    console.error("[POST /api/areas]", err);
    return NextResponse.json({ error: "Failed to create area" }, { status: 500 });
  }
}
