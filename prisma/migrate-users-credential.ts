// prisma/migrate-users-credential.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/**
 * Generate username dari nama lengkap:
 * "ABDUL NAJIB" → "abdul_najib"
 * "HSE OFFICER 1" → "hse_officer_1"
 */
function generateUsername(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")        // spasi → underscore
    .replace(/[^a-z0-9_]/g, ""); // hapus karakter selain huruf, angka, underscore
}

/**
 * Generate password dari nama:
 * "ABDUL NAJIB" → "abdul123"
 * "HSE OFFICER 1" → "hse123"
 */
function generatePassword(name: string): string {
  const firstName = name.trim().split(/\s+/)[0].toLowerCase();
  return `${firstName}123`;
}

async function main() {
  console.log("🔄 Memulai migrasi kredensial user...\n");

  // Ambil semua user yang belum punya username
  const users = await prisma.user.findMany({
    where: {
      username: null,
    },
    orderBy: { name: "asc" },
  });

  if (users.length === 0) {
    console.log("✅ Semua user sudah memiliki username. Tidak ada yang perlu dimigrasi.");
    return;
  }

  console.log(`📋 Ditemukan ${users.length} user tanpa kredensial:\n`);

  const results: {
    name: string;
    division: string;
    username: string;
    password: string;
    status: string;
  }[] = [];

  for (const user of users) {
    let username = generateUsername(user.name);
    const password = generatePassword(user.name);

    // Cek apakah username sudah dipakai, jika iya tambahkan suffix
    const existing = await prisma.user.findUnique({
      where: { username },
    });

    if (existing && existing.id !== user.id) {
      // Tambahkan angka suffix jika username sudah ada
      let suffix = 2;
      while (true) {
        const candidate = `${username}_${suffix}`;
        const conflict = await prisma.user.findUnique({
          where: { username: candidate },
        });
        if (!conflict) {
          username = candidate;
          break;
        }
        suffix++;
      }
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    try {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          username,
          password: hashedPassword,
        },
      });

      results.push({
        name: user.name,
        division: user.division,
        username,
        password, // plain text untuk ditampilkan sekali ini
        status: "✅ Berhasil",
      });
    } catch (err) {
      results.push({
        name: user.name,
        division: user.division,
        username,
        password,
        status: "❌ Gagal",
      });
      console.error(`Error pada user ${user.name}:`, err);
    }
  }

  // Tampilkan hasil dalam tabel
  console.log("─".repeat(80));
  console.log(
    "NAMA".padEnd(25) +
    "DIVISI".padEnd(12) +
    "USERNAME".padEnd(20) +
    "PASSWORD".padEnd(15) +
    "STATUS"
  );
  console.log("─".repeat(80));

  results.forEach((r) => {
    console.log(
      r.name.padEnd(25) +
      r.division.padEnd(12) +
      r.username.padEnd(20) +
      r.password.padEnd(15) +
      r.status
    );
  });

  console.log("─".repeat(80));
  console.log(`\n✅ Migrasi selesai! ${results.filter(r => r.status.includes("✅")).length} user berhasil dimigrasi.`);
  console.log("\n⚠️  PENTING: Simpan daftar kredensial di atas sebelum ditutup!");
  console.log("⚠️  Password di atas hanya ditampilkan sekali ini saja.\n");
}

main()
  .catch((e) => {
    console.error("❌ Error saat migrasi:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());