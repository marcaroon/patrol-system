// prisma/seed.ts
import { PrismaClient, AdminRole, Division } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ── Admins ──────────────────────────────────────────────────
  const existingAdmin = await prisma.admin.findUnique({
    where: { username: "admin" },
  });
  if (!existingAdmin) {
    await prisma.admin.create({
      data: {
        username: "admin",
        password: await bcrypt.hash("Admin@ISA2024", 12),
        role: AdminRole.SUPER_ADMIN,
      },
    });
    console.log("✅ Admin created");
  }
  const existingViewer = await prisma.admin.findUnique({
    where: { username: "viewer" },
  });
  if (!existingViewer) {
    await prisma.admin.create({
      data: {
        username: "viewer",
        password: await bcrypt.hash("Viewer@ISA2024", 12),
        role: AdminRole.VIEWER,
      },
    });
    console.log("✅ Viewer created");
  }

  // ── KCP Area with sections ───────────────────────────────────
  const existingArea = await prisma.patrolArea.findUnique({
    where: { code: "KCP" },
  });
  if (!existingArea) {
    await prisma.patrolArea.create({
      data: {
        name: "KCP (Kernel Crushing Plant)",
        code: "KCP",
        isActive: true,
        sections: {
          create: [
            {
              order: 1,
              name: "Bagian Depan",
              description: "Inspeksi area depan KCP",
            },
            {
              order: 2,
              name: "Sisi Kanan",
              description: "Inspeksi sisi kanan bangunan",
            },
            {
              order: 3,
              name: "Sisi Kiri",
              description: "Inspeksi sisi kiri bangunan",
            },
            {
              order: 4,
              name: "Bagian Belakang",
              description: "Inspeksi area belakang KCP",
            },
            {
              order: 5,
              name: "Bagian Proses",
              description: "Inspeksi area mesin dan proses produksi",
            },
          ],
        },
      },
    });
    console.log("✅ KCP area created with 5 sections");
  }

  // ── Security Users ───────────────────────────────────────────
  const securityNames = [
    "ABDUL NAJIB",
    "AGUNG MARSUSLIS",
    "AL HAFIZ",
    "ANDRE YULI PUTRA",
    "BENNY FRANSASTIU",
    "DIKI RIYANDI",
    "DODI WIJAYA",
    "EKO RAMADANI",
  ];
  for (const name of securityNames) {
    const exists = await prisma.user.findFirst({
      where: { name, division: Division.SECURITY },
    });
    if (!exists)
      await prisma.user.create({
        data: { name, division: Division.SECURITY, isActive: true },
      });
  }
  console.log("✅ Security users seeded");

  // ── HSE Users ────────────────────────────────────────────────
  const hseNames = ["HSE OFFICER 1", "HSE OFFICER 2"];
  for (const name of hseNames) {
    const exists = await prisma.user.findFirst({
      where: { name, division: Division.HSE },
    });
    if (!exists)
      await prisma.user.create({
        data: { name, division: Division.HSE, isActive: true },
      });
  }
  console.log("✅ HSE users seeded");

  console.log("🎉 Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
