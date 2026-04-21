// prisma/add-admin-accounts.ts
import { PrismaClient, AdminRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Menambah akun admin baru...");

  const newAdmins = [
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

  for (const acc of newAdmins) {
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
      console.log(`✅ ${acc.username} berhasil dibuat (role: ${acc.role})`);
    } else {
      console.log(`⏭️  ${acc.username} sudah ada, dilewati`);
    }
  }

  console.log("Selesai — data lama tidak tersentuh");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
