// src/app/api/areas/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PATCH /api/areas/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const body = await req.json();
    const { name, code, isActive, checklistItems } = body;

    // ── Update area basic fields ────────────────────────────────
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name.trim();
    if (code !== undefined) updateData.code = code.trim().toUpperCase();
    if (isActive !== undefined) updateData.isActive = isActive;

    await prisma.patrolArea.update({
      where: { id: params.id },
      data: updateData,
    });

    // ── Smart checklist upsert (avoids FK violation) ───────────
    if (Array.isArray(checklistItems)) {
      // Each item from the form has a `tempId`:
      //   - Real UUID matching an existing DB row → UPDATE
      //   - Short random string from uid()        → CREATE

      const existingItems = await prisma.checklistItem.findMany({
        where: { areaId: params.id },
        select: { id: true },
      });
      const existingIds = new Set(existingItems.map((i) => i.id));

      // Which existing IDs are still present in the incoming form data
      const incomingExistingIds = new Set(
        checklistItems
          .map((i: { tempId: string }) => i.tempId)
          .filter((tid: string) => existingIds.has(tid)),
      );

      // 1. Remove items that were deleted in the form —
      //    but ONLY if they have no checklist_entries (safe to delete).
      //    Items linked to existing reports are kept to preserve data integrity.
      const toDelete = [...existingIds].filter(
        (id) => !incomingExistingIds.has(id),
      );
      if (toDelete.length > 0) {
        const linkedEntries = await prisma.checklistEntry.findMany({
          where: { checklistItemId: { in: toDelete } },
          select: { checklistItemId: true },
        });
        const linkedIds = new Set(linkedEntries.map((e) => e.checklistItemId));
        const safeToDelete = toDelete.filter((id) => !linkedIds.has(id));
        if (safeToDelete.length > 0) {
          await prisma.checklistItem.deleteMany({
            where: { id: { in: safeToDelete } },
          });
        }
      }

      // 2. Update existing / create new items in order
      for (let idx = 0; idx < checklistItems.length; idx++) {
        const item = checklistItems[idx] as {
          tempId: string;
          label: string;
          description?: string;
          referenceImageUrl?: string;
        };

        const data = {
          order: idx + 1,
          label: item.label.trim(),
          description: item.description?.trim() ?? null,
          referenceImageUrl: item.referenceImageUrl?.trim() ?? null,
        };

        if (existingIds.has(item.tempId)) {
          await prisma.checklistItem.update({
            where: { id: item.tempId },
            data,
          });
        } else {
          await prisma.checklistItem.create({
            data: { areaId: params.id, ...data },
          });
        }
      }
    }

    // Return the updated area with all its items
    const area = await prisma.patrolArea.findUnique({
      where: { id: params.id },
      include: { checklistItems: { orderBy: { order: "asc" } } },
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

// DELETE /api/areas/[id]
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
