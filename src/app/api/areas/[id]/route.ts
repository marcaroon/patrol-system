// src/app/api/areas/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PATCH /api/areas/[id]
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { name, code, isActive, checklistItems } = body;

    // Update area basic info
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name.trim();
    if (code !== undefined) updateData.code = code.trim().toUpperCase();
    if (isActive !== undefined) updateData.isActive = isActive;

    // If checklist items are provided, replace them all
    if (Array.isArray(checklistItems)) {
      // Delete existing items first
      await prisma.checklistItem.deleteMany({ where: { areaId: params.id } });

      updateData.checklistItems = {
        create: checklistItems.map(
          (item: { label: string; description?: string }, idx: number) => ({
            order: idx + 1,
            label: item.label.trim(),
            description: item.description?.trim() ?? null,
          })
        ),
      };
    }

    const area = await prisma.patrolArea.update({
      where: { id: params.id },
      data: updateData,
      include: { checklistItems: { orderBy: { order: "asc" } } },
    });

    return NextResponse.json(area);
  } catch (err) {
    console.error("[PATCH /api/areas/[id]]", err);
    return NextResponse.json({ error: "Failed to update area" }, { status: 500 });
  }
}

// DELETE /api/areas/[id]
export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.patrolArea.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/areas/[id]]", err);
    return NextResponse.json({ error: "Failed to delete area" }, { status: 500 });
  }
}
