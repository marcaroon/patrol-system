// src/app/api/admin/accounts/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { AdminRole } from "@prisma/client";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSessionFromCookies();
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Prevent editing own account role
  if (params.id === session.id) {
    return NextResponse.json(
      { error: "Tidak bisa mengedit akun sendiri" },
      { status: 400 }
    );
  }

  const { username, password, role } = await req.json();
  const data: Record<string, unknown> = {};

  if (username !== undefined) {
    data.username = username.trim().toLowerCase();
  }
  if (role !== undefined) {
    const validRoles: AdminRole[] = [
      "SUPER_ADMIN",
      "VIEWER",
      "SECURITY_ADMIN",
      "HSE_ADMIN",
    ];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "Role tidak valid" }, { status: 400 });
    }
    data.role = role;
  }
  if (password) {
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password minimal 6 karakter" },
        { status: 400 }
      );
    }
    data.password = await bcrypt.hash(password, 12);
  }

  try {
    const admin = await prisma.admin.update({
      where: { id: params.id },
      data,
      select: { id: true, username: true, role: true, createdAt: true },
    });
    return NextResponse.json(admin);
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e.code === "P2002") {
      return NextResponse.json(
        { error: "Username sudah digunakan" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Gagal update" }, { status: 500 });
  }
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSessionFromCookies();
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  if (params.id === session.id) {
    return NextResponse.json(
      { error: "Tidak bisa menghapus akun sendiri" },
      { status: 400 }
    );
  }

  await prisma.admin.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}