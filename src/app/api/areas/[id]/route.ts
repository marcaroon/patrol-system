// src/app/api/areas/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const body = await req.json();
    const {
      name,
      code,
      isActive,
      sections,
      referenceImageUrl1,
      referenceImageUrl2,
    } = body;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name.trim();
    if (code !== undefined) updateData.code = code.trim().toUpperCase();
    if (isActive !== undefined) updateData.isActive = isActive;
    if (referenceImageUrl1 !== undefined)
      updateData.referenceImageUrl1 = referenceImageUrl1?.trim() || null;
    if (referenceImageUrl2 !== undefined)
      updateData.referenceImageUrl2 = referenceImageUrl2?.trim() || null;

    await prisma.patrolArea.update({
      where: { id: params.id },
      data: updateData,
    });

    if (Array.isArray(sections)) {
      const existing = await prisma.areaSection.findMany({
        where: { areaId: params.id },
        select: { id: true },
      });
      const existingIds = new Set(existing.map((s) => s.id));

      const incomingExistingIds = new Set(
        sections
          .map((s: { tempId: string }) => s.tempId)
          .filter((tid: string) => existingIds.has(tid)),
      );

      // Delete removed sections only if no SectionEntry references them
      const toDelete = [...existingIds].filter(
        (id) => !incomingExistingIds.has(id),
      );
      if (toDelete.length > 0) {
        const linked = await prisma.sectionEntry.findMany({
          where: { areaSectionId: { in: toDelete } },
          select: { areaSectionId: true },
        });
        const linkedIds = new Set(linked.map((e) => e.areaSectionId));
        const safe = toDelete.filter((id) => !linkedIds.has(id));
        if (safe.length > 0)
          await prisma.areaSection.deleteMany({ where: { id: { in: safe } } });
      }

      // Upsert
      for (let idx = 0; idx < sections.length; idx++) {
        const s = sections[idx] as {
          tempId: string;
          name: string;
          description?: string;
        };
        const data = {
          order: idx + 1,
          name: s.name.trim(),
          description: s.description?.trim() ?? null,
        };
        if (existingIds.has(s.tempId)) {
          await prisma.areaSection.update({ where: { id: s.tempId }, data });
        } else {
          await prisma.areaSection.create({
            data: { areaId: params.id, ...data },
          });
        }
      }
    }

    const area = await prisma.patrolArea.findUnique({
      where: { id: params.id },
      include: { sections: { orderBy: { order: "asc" } } },
    });
    return NextResponse.json(area);
  } catch (err) {
    console.error("[PATCH /api/areas/[id]]", err);
    return NextResponse.json(
      { error: "Failed to update area" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await prisma.patrolArea.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/areas/[id]]", err);
    return NextResponse.json(
      { error: "Failed to delete area" },
      { status: 500 },
    );
  }
}
