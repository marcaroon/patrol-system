import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE admins 
      MODIFY COLUMN role 
      ENUM('SUPER_ADMIN', 'VIEWER', 'SECURITY_ADMIN', 'HSE_ADMIN') 
      NOT NULL DEFAULT 'VIEWER'
    `);
    console.log("✅ Enum role berhasil diupdate");
  } catch (e) {
    console.log("⚠️  Mungkin sudah diupdate sebelumnya:", e);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
