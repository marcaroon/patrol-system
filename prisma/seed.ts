// prisma/seed.ts
import { PrismaClient, AdminRole, Division } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ── Admins ──────────────────────────────────────────────────
  const adminAccounts = [
    {
      username: "admin",
      password: "Admin@ISA2024",
      role: AdminRole.SUPER_ADMIN,
    },
    {
      username: "viewer",
      password: "Viewer@ISA2024",
      role: AdminRole.VIEWER,
    },
    {
      username: "security_admin",
      password: "Security@ISA2024",
      role: AdminRole.SECURITY_ADMIN,
    },
    {
      username: "hse_admin",
      password: "HSE@ISA2024",
      role: AdminRole.HSE_ADMIN,
    },
  ];

  for (const acc of adminAccounts) {
    const existing = await prisma.admin.findUnique({
      where: { username: acc.username },
    });
    if (!existing) {
      await prisma.admin.create({
        data: {
          username: acc.username,
          password: await bcrypt.hash(acc.password, 12),
          role: acc.role,
        },
      });
      console.log(`✅ ${acc.username} created (role: ${acc.role})`);
    }
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
  console.log("");
  console.log("📋 Admin accounts:");
  console.log("  admin          / Admin@ISA2024    → SUPER_ADMIN (full access)");
  console.log("  viewer         / Viewer@ISA2024   → VIEWER (read-only all)");
  console.log("  security_admin / Security@ISA2024 → SECURITY_ADMIN (security only)");
  console.log("  hse_admin      / HSE@ISA2024      → HSE_ADMIN (HSE only)");
  console.log("⚠️  Change all passwords before production!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());