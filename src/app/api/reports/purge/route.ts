// src/app/api/reports/purge/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/auth";

export async function DELETE(req: NextRequest) {
  try {
    // Auth check – only SUPER_ADMIN can purge
    const session = await getSessionFromCookies();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Hanya SUPER_ADMIN yang dapat menghapus semua laporan" },
        { status: 403 },
      );
    }

    // Require confirmation token in body
    const body = await req.json().catch(() => ({}));
    if (body.confirmToken !== "HAPUS_SEMUA_LAPORAN") {
      return NextResponse.json(
        { error: "Token konfirmasi tidak valid" },
        { status: 400 },
      );
    }

    // Delete in dependency order (children first)
    // ── Security report chain ────────────────────────────────────
    // SectionFinding → SectionEntry → ReportAreaVisit → SecurityReport
    await prisma.sectionFinding.deleteMany({});
    await prisma.sectionEntry.deleteMany({});
    await prisma.reportAreaVisit.deleteMany({});
    await prisma.securityReport.deleteMany({});

    // ── HSE report chain ─────────────────────────────────────────
    // HSEHazard → HSEAreaVisit → HSEReport
    await prisma.hSEHazard.deleteMany({});
    await prisma.hSEAreaVisit.deleteMany({});
    await prisma.hSEReport.deleteMany({});

    // ── Uploaded file records (metadata only, not actual files) ──
    await prisma.uploadedFile.deleteMany({});

    return NextResponse.json({
      ok: true,
      message: "Semua data laporan berhasil dihapus",
    });
  } catch (err) {
    console.error("[DELETE /api/reports/purge]", err);
    return NextResponse.json(
      { error: "Gagal menghapus data laporan" },
      { status: 500 },
    );
  }
}
