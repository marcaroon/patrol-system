// src/app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { v4 as uuid } from "uuid";

export const config = { api: { bodyParser: false } };

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only images allowed" }, { status: 400 });
    }

    if (file.size > 15 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 15MB)" }, { status: 400 });
    }

    const subdir = (formData.get("subdir") as string) ?? "general";
    const ext = file.type === "image/png" ? ".png" : ".jpg";
    const filename = `${uuid()}${ext}`;

    // Create upload dir if needed
    const uploadRoot = path.join(process.cwd(), "public", "uploads", subdir);
    if (!existsSync(uploadRoot)) {
      await mkdir(uploadRoot, { recursive: true });
    }

    const filePath = path.join(uploadRoot, filename);
    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    // Public URL (served by Next.js static files)
    const url = `/uploads/${subdir}/${filename}`;

    return NextResponse.json({ url });
  } catch (err) {
    console.error("[upload] error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
