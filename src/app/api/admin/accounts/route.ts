// src/app/api/admin/accounts/route.ts
// Manage admin accounts — only SUPER_ADMIN
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { AdminRole } from "@prisma/client";

export async function GET() {
  const session = await getSessionFromCookies();
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const admins = await prisma.admin.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      username: true,
      role: true,
      createdAt: true,
    },
  });

  return NextResponse.json(admins);
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromCookies();
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { username, password, role } = await req.json();

  if (!username?.trim() || !password || !role) {
    return NextResponse.json(
      { error: "username, password, dan role wajib diisi" },
      { status: 400 },
    );
  }

  const validRoles: AdminRole[] = [
    "SUPER_ADMIN",
    "VIEWER",
    "SECURITY_ADMIN",
    "HSE_ADMIN",
    "SECURITY_VIEWER",
    "HSE_VIEWER",
  ];

  if (!validRoles.includes(role)) {
    return NextResponse.json({ error: "Role tidak valid" }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: "Password minimal 6 karakter" },
      { status: 400 },
    );
  }

  try {
    const admin = await prisma.admin.create({
      data: {
        username: username.trim().toLowerCase(),
        password: await bcrypt.hash(password, 12),
        role,
      },
      select: { id: true, username: true, role: true, createdAt: true },
    });
    return NextResponse.json(admin, { status: 201 });
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e.code === "P2002") {
      return NextResponse.json(
        { error: "Username sudah digunakan" },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: "Gagal membuat akun" }, { status: 500 });
  }
}
