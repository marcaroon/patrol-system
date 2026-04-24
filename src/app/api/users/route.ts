// src/app/api/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Division } from "@prisma/client";

// GET /api/users?division=SECURITY
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const division = searchParams.get("division") as Division | null;
    const activeOnly = searchParams.get("active") !== "false";

    const where: Record<string, unknown> = {};
    if (division) where.division = division;
    if (activeOnly) where.isActive = true;

    const users = await prisma.user.findMany({
      where,
      orderBy: { name: "asc" },
    });

    return NextResponse.json(users);
  } catch (err) {
    console.error("[GET /api/users]", err);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, division, username, password } = body;

    if (!name?.trim() || !division) {
      return NextResponse.json({ error: "name and division required" }, { status: 400 });
    }

    // Validate username/password jika diberikan
    if (username && !password) {
      return NextResponse.json({ error: "Password wajib jika username diisi" }, { status: 400 });
    }

    let hashedPassword: string | undefined;
    if (username && password) {
      if (password.length < 6) {
        return NextResponse.json({ error: "Password minimal 6 karakter" }, { status: 400 });
      }
      const bcrypt = await import("bcryptjs");
      hashedPassword = await bcrypt.hash(password, 12);
    }

    const user = await prisma.user.create({
      data: {
        name: name.trim().toUpperCase(),
        division,
        isActive: true,
        ...(username && { username: username.trim().toLowerCase() }),
        ...(hashedPassword && { password: hashedPassword }),
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e.code === "P2002") {
      return NextResponse.json({ error: "Username sudah digunakan" }, { status: 409 });
    }
    console.error("[POST /api/users]", err);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}