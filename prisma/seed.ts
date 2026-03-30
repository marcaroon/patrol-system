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
    console.log("✅ Admin created: admin / Admin@ISA2024");
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
    console.log("✅ Viewer created: viewer / Viewer@ISA2024");
  }

  // ── Default KCP Area ────────────────────────────────────────
  const existingArea = await prisma.patrolArea.findUnique({
    where: { code: "KCP" },
  });
  if (!existingArea) {
    await prisma.patrolArea.create({
      data: {
        name: "KCP (Kernel Crushing Plant)",
        code: "KCP",
        isActive: true,
        checklistItems: {
          create: [
            { order: 1, label: "Pastikan Valve Pemuatan Tertutup Rapat", description: "Cek kondisi valve pemuatan" },
            { order: 2, label: "Pastikan Kondisi Valve Tangki Tertutup", description: "Cek semua valve tangki" },
            { order: 3, label: "Pastikan Valve Penjualan Tertutup", description: "Cek valve penjualan" },
            { order: 4, label: "Pastikan Valve Drain Tertutup & Tergembok", description: "Cek valve drain beserta gembok" },
            { order: 5, label: "Pastikan Manhole Tidak Terdapat Kebocoran", description: "Inspeksi visual manhole" },
            { order: 6, label: "Pastikan Sepanjang Pinggiran Dasar Tangki Tidak Ada Kebocoran", description: "Keliling dasar tangki" },
            { order: 7, label: "Pastikan Kondisi Manhole Tangki Atas Terkunci", description: "Cek kunci manhole tangki atas" },
            { order: 8, label: "Pastikan Kondisi Lubang Sounding Tertutup", description: "Cek lubang sounding" },
            { order: 9, label: "Pastikan Gate Bund Wall Tertutup Rapat", description: "Cek gate bund wall" },
            { order: 10, label: "Pastikan Pipa Warna Kuning Tidak Bocor", description: "Inspeksi pipa kuning" },
            { order: 11, label: "Pastikan Mesin First & Second Press Mati Ketika Operasional Off", description: "Cek status mesin press" },
            { order: 12, label: "Pastikan Tidak Ada Yang Tidak Bekerja di Area Workshop (1)", description: "Patroli area workshop bagian 1" },
            { order: 13, label: "Pastikan Tidak Ada Yang Tidak Bekerja di Area Workshop (2)", description: "Patroli area workshop bagian 2" },
            { order: 14, label: "Pastikan Tidak Ada yang Tidak Bekerja di Area Panel Atas Lt. 2 (1)", description: "Patroli panel atas lantai 2 bagian 1" },
            { order: 15, label: "Pastikan Tidak Ada yang Tidak Bekerja di Area Panel Atas Lt. 2 (2)", description: "Patroli panel atas lantai 2 bagian 2" },
          ],
        },
      },
    });
    console.log("✅ KCP area created with 15 checklist items");
  }

  // ── Sample Security Users ───────────────────────────────────
  const securityNames = [
    "ABDUL NAJIB", "AGUNG MARSUSLIS", "AL HAFIZ", "ANDRE YULI PUTRA",
    "BENNY FRANSASTIU", "DIKI RIYANDI", "DODI WIJAYA", "EKO RAMADANI",
  ];
  for (const name of securityNames) {
    const exists = await prisma.user.findFirst({ where: { name, division: Division.SECURITY } });
    if (!exists) {
      await prisma.user.create({ data: { name, division: Division.SECURITY, isActive: true } });
    }
  }
  console.log("✅ Sample Security users created");

  // ── Sample HSE Users ────────────────────────────────────────
  const hseNames = ["HSE OFFICER 1", "HSE OFFICER 2"];
  for (const name of hseNames) {
    const exists = await prisma.user.findFirst({ where: { name, division: Division.HSE } });
    if (!exists) {
      await prisma.user.create({ data: { name, division: Division.HSE, isActive: true } });
    }
  }
  console.log("✅ Sample HSE users created");

  console.log("🎉 Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
