// src/app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const user = await prisma.user.update({
      where: { id: params.id },
      data: {
        ...(body.name !== undefined && { name: body.name.trim().toUpperCase() }),
        ...(body.division !== undefined && { division: body.division }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      },
    });
    return NextResponse.json(user);
  } catch (err) {
    console.error("[PATCH /api/users/[id]]", err);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.user.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/users/[id]]", err);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
