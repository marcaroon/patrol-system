// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signToken, COOKIE_NAME, getDefaultDashboard } from "@/lib/auth";
import type { AdminRoleType } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: "Username dan password wajib diisi" }, { status: 400 });
    }

    const admin = await prisma.admin.findUnique({ where: { username: username.trim() } });
    if (!admin) {
      return NextResponse.json({ error: "Username tidak ditemukan" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) {
      return NextResponse.json({ error: "Password salah" }, { status: 401 });
    }

    const role = admin.role as AdminRoleType;

    const token = await signToken({
      id: admin.id,
      username: admin.username,
      role,
    });

    const res = NextResponse.json({
      ok: true,
      username: admin.username,
      role,
      redirectTo: getDefaultDashboard(role),
    });

    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 8, // 8 hours
      path: "/",
    });

    return res;
  } catch (err) {
    console.error("[auth/login]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}