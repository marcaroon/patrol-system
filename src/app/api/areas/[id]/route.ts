// src/app/api/areas/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

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
      where: { id },
      data: updateData,
    });

    if (Array.isArray(sections)) {
      const existing = await prisma.areaSection.findMany({
        where: { areaId: id },
        select: { id: true },
      });
      const existingIds = new Set(existing.map((s) => s.id));

      const incomingExistingIds = new Set(
        sections
          .map((s: { tempId: string }) => s.tempId)
          .filter((tid: string) => existingIds.has(tid)),
      );

      const toDelete = Array.from(existingIds).filter(
        (sid) => !incomingExistingIds.has(sid),
      );
      if (toDelete.length > 0) {
        const linked = await prisma.sectionEntry.findMany({
          where: { areaSectionId: { in: toDelete } },
          select: { areaSectionId: true },
        });
        const linkedIds = new Set(linked.map((e) => e.areaSectionId));
        const safe = toDelete.filter((sid) => !linkedIds.has(sid));
        if (safe.length > 0)
          await prisma.areaSection.deleteMany({ where: { id: { in: safe } } });
      }

      for (let idx = 0; idx < sections.length; idx++) {
        const s = sections[idx] as {
          tempId: string;
          name: string;
          description?: string;
          referenceImageUrl1?: string;
          referenceImageUrl2?: string;
        };
        const data = {
          order: idx + 1,
          name: s.name.trim(),
          description: s.description?.trim() ?? null,
          referenceImageUrl1: s.referenceImageUrl1?.trim() || null,
          referenceImageUrl2: s.referenceImageUrl2?.trim() || null,
        };
        if (existingIds.has(s.tempId)) {
          await prisma.areaSection.update({ where: { id: s.tempId }, data });
        } else {
          await prisma.areaSection.create({
            data: { areaId: id, ...data },
          });
        }
      }
    }

    const area = await prisma.patrolArea.findUnique({
      where: { id },
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

// Kode unik untuk area sentinel "deleted"
const DELETED_AREA_CODE = "__DELETED__";

async function getOrCreateDeletedSentinel(): Promise<string> {
  // Cari atau buat area sentinel untuk menampung referensi laporan lama
  let sentinel = await prisma.patrolArea.findUnique({
    where: { code: DELETED_AREA_CODE },
  });

  if (!sentinel) {
    sentinel = await prisma.patrolArea.create({
      data: {
        name: "[Area Dihapus]",
        code: DELETED_AREA_CODE,
        isActive: false,
      },
    });
  }

  return sentinel.id;
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    // 1. Pastikan area ada
    const area = await prisma.patrolArea.findUnique({
      where: { id },
      select: { id: true, name: true, code: true },
    });

    if (!area) {
      return NextResponse.json(
        { error: "Area tidak ditemukan" },
        { status: 404 },
      );
    }

    // Jangan hapus sentinel itu sendiri
    if (area.code === DELETED_AREA_CODE) {
      return NextResponse.json(
        { error: "Area ini tidak bisa dihapus" },
        { status: 400 },
      );
    }

    // 2. Cek apakah ada laporan yang mereferensikan area ini
    const linkedVisitsCount = await prisma.reportAreaVisit.count({
      where: { areaId: id },
    });

    if (linkedVisitsCount > 0) {
      // Ada laporan terkait — pindahkan referensi ke sentinel sebelum hapus
      const sentinelId = await getOrCreateDeletedSentinel();

      await prisma.$transaction(async (tx) => {
        // Pindahkan semua report_area_visits ke sentinel area
        await tx.reportAreaVisit.updateMany({
          where: { areaId: id },
          data: { areaId: sentinelId },
        });

        // Hapus sections area ini (yang tidak punya sectionEntry terkait)
        // Section yang masih direferensikan oleh sectionEntry tidak bisa dihapus
        // — biarkan cascade dari area delete yang handle
        // Tapi karena section mungkin direferensikan, kita orphan-kan dulu
        // dengan update sectionEntry yang referensikan section ini
        // agar point ke sentinel section (atau biarkan, karena section
        // akan ikut terhapus dengan area via onDelete: Cascade)
        //
        // Masalah: sectionEntry masih referensikan areaSectionId yang akan dihapus
        // Solusi: hapus/update sectionEntry yang terkait section area ini

        const sections = await tx.areaSection.findMany({
          where: { areaId: id },
          select: { id: true },
        });
        const sectionIds = sections.map((s) => s.id);

        if (sectionIds.length > 0) {
          // Cari reportAreaVisit yang sudah kita pindahkan ke sentinel
          // dan hapus sectionEntries yang masih mereferensikan section lama
          // (karena section akan ikut terhapus)
          const sectionEntries = await tx.sectionEntry.findMany({
            where: { areaSectionId: { in: sectionIds } },
            select: { id: true },
          });
          const sectionEntryIds = sectionEntries.map((se) => se.id);

          if (sectionEntryIds.length > 0) {
            // Hapus findings dulu (cascade harusnya handle ini, tapi explicit lebih aman)
            await tx.sectionFinding.deleteMany({
              where: { sectionEntryId: { in: sectionEntryIds } },
            });
            // Hapus section entries
            await tx.sectionEntry.deleteMany({
              where: { id: { in: sectionEntryIds } },
            });
          }
        }

        // Sekarang hapus area (sections akan cascade delete)
        await tx.patrolArea.delete({ where: { id } });
      });
    } else {
      // Tidak ada laporan terkait — hapus langsung
      await prisma.patrolArea.delete({ where: { id } });
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error("[DELETE /api/areas/[id]]", err);
    const e = err as { code?: string };
    if (e.code === "P2003" || e.code === "P2014") {
      return NextResponse.json(
        {
          error:
            "Gagal menghapus area karena masih ada data terkait. Coba nonaktifkan area ini.",
        },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Failed to delete area" },
      { status: 500 },
    );
  }
}