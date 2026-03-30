# 🛡️ Sistem Patrol – PT Intan Sejati Andalan

Platform pelaporan pemantauan patrol Security & HSE.
**Stack**: Next.js 14 · TypeScript · Prisma ORM · MySQL · Tailwind CSS

---

## 📋 Fitur Sistem

| Fitur | Security | HSE |
|---|---|---|
| Timestamp otomatis | ✅ | ✅ |
| GPS koordinat otomatis | ✅ | ✅ |
| Foto + watermark GPS & timestamp | ✅ | ✅ |
| Checklist per item | ✅ | — |
| Deskripsi temuan | ✅ | — |
| Multi-area kunjungan | — | ✅ |
| Multi-select potensi bahaya | — | ✅ |
| Deskripsi sosialisasi K3 | — | ✅ |
| Tanda tangan digital | — | ✅ |

**Admin Panel**:
- Dashboard statistik + grafik (Recharts)
- Laporan dengan filter tipe / tanggal / nama
- Export Excel multi-sheet (Security, HSE, Ringkasan)
- Manajemen personel Security & HSE
- Manajemen area patrol + checklist (tambah/edit/hapus)
- Autentikasi JWT HttpOnly cookie

---

## 🗂️ Struktur Project

```
patrol-system/
├── prisma/
│   ├── schema.prisma       # Skema database MySQL
│   └── seed.ts             # Data awal (admin, area KCP, user contoh)
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Halaman utama
│   │   ├── patrol/
│   │   │   ├── page.tsx                # Form patrol (Security/HSE)
│   │   │   └── success/page.tsx        # Halaman sukses
│   │   ├── admin/
│   │   │   ├── page.tsx                # Login admin
│   │   │   ├── dashboard/page.tsx      # Dashboard statistik
│   │   │   ├── reports/page.tsx        # Daftar & detail laporan
│   │   │   ├── users/page.tsx          # Manajemen personel
│   │   │   └── areas/page.tsx          # Manajemen area patrol
│   │   └── api/
│   │       ├── upload/route.ts         # Upload foto (lokal)
│   │       ├── auth/
│   │       │   ├── login/route.ts
│   │       │   ├── logout/route.ts
│   │       │   └── session/route.ts
│   │       ├── users/
│   │       │   ├── route.ts            # GET list, POST create
│   │       │   └── [id]/route.ts       # PATCH, DELETE
│   │       ├── areas/
│   │       │   ├── route.ts            # GET list, POST create
│   │       │   └── [id]/route.ts       # PATCH, DELETE
│   │       └── reports/
│   │           ├── route.ts            # GET all reports (filter)
│   │           ├── security/route.ts   # POST security report
│   │           ├── hse/route.ts        # POST HSE report
│   │           └── stats/route.ts      # GET dashboard stats
│   ├── components/
│   │   ├── patrol/
│   │   │   ├── SecurityPatrolForm.tsx
│   │   │   ├── HSEPatrolForm.tsx
│   │   │   ├── PhotoUpload.tsx         # Upload + watermark
│   │   │   └── SignaturePad.tsx        # Canvas TTD
│   │   └── admin/
│   │       └── AdminShell.tsx          # Sidebar layout
│   ├── lib/
│   │   ├── prisma.ts       # Prisma client singleton
│   │   ├── auth.ts         # JWT sign/verify
│   │   ├── photoUtils.ts   # Canvas watermark + GPS (client)
│   │   └── exportExcel.ts  # Export XLSX
│   └── types/
│       └── index.ts        # TypeScript types & constants
└── public/
    └── uploads/            # Foto yang diupload (gitignored)
```

---

## 🚀 Setup & Instalasi

### Prasyarat
- Node.js >= 18
- MySQL 8.0+ (atau MariaDB 10.6+)
- npm atau yarn

### 1. Clone & Install

```bash
git clone <repo-url>
cd patrol-system
npm install
```

### 2. Buat Database MySQL

```sql
CREATE DATABASE patrol_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'patrol_user'@'localhost' IDENTIFIED BY 'patrol_pass_kuat';
GRANT ALL PRIVILEGES ON patrol_db.* TO 'patrol_user'@'localhost';
FLUSH PRIVILEGES;
```

### 3. Konfigurasi Environment

Salin `.env.local.example` menjadi `.env.local`:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
# Sesuaikan dengan kredensial MySQL Anda
DATABASE_URL="mysql://patrol_user:patrol_pass_kuat@localhost:3306/patrol_db"

# Ganti dengan string random panjang (minimal 32 karakter)
JWT_SECRET="isi-dengan-random-string-panjang-dan-unik-disini-123"

NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Jalankan Migrasi & Seed

```bash
# Push skema ke database
npm run db:push

# Atau jika ingin pakai migrations (lebih proper untuk production):
npm run db:migrate

# Isi data awal (admin, area KCP, contoh user)
npm run db:seed
```

### 5. Jalankan Development

```bash
npm run dev
```

Buka: `http://localhost:3000`

---

## 🌐 Deploy ke Vercel + PlanetScale / Railway / Aiven (MySQL Cloud)

### Opsi Database MySQL Cloud (Gratis):

| Provider | Free Tier | Catatan |
|---|---|---|
| **PlanetScale** | 5GB, 1B row reads/bulan | Recommended, serverless MySQL |
| **Railway** | $5 credit/bulan | Mudah setup |
| **Aiven** | Trial 30 hari | MySQL standard |
| **Clever Cloud** | 10MB MySQL gratis | Sangat terbatas |
| **FreeSQLDatabase** | 5MB | Untuk testing saja |

### Setup PlanetScale (Direkomendasikan)

1. Daftar di [planetscale.com](https://planetscale.com)
2. Buat database baru
3. Klik **Connect** → pilih **Prisma**
4. Salin `DATABASE_URL` yang diberikan
5. Update `prisma/schema.prisma` untuk PlanetScale:

```prisma
datasource db {
  provider     = "mysql"
  url          = env("DATABASE_URL")
  relationMode = "prisma"  // Tambahkan ini untuk PlanetScale
}
```

6. Push schema: `npx prisma db push`
7. Seed: `npm run db:seed`

### Deploy ke Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login & deploy
vercel

# Atau push ke GitHub dan connect di vercel.com
```

**Set Environment Variables di Vercel Dashboard:**
- `DATABASE_URL` → connection string MySQL cloud
- `JWT_SECRET` → random string panjang

### Upload Foto di Vercel

> ⚠️ **Penting**: Vercel adalah serverless, filesystem-nya **ephemeral** (tidak persisten).
> Foto yang diupload akan hilang setelah redeployment.
>
> **Solusi untuk production:**
> Gunakan cloud storage seperti **Cloudflare R2** (gratis 10GB) atau **AWS S3**.
>
> Untuk sekarang, sistem menyimpan foto ke `public/uploads/` yang berfungsi di development
> dan VPS, tapi **tidak di Vercel** untuk jangka panjang.

**Untuk deploy ke VPS/Server (lebih disarankan untuk production):**

```bash
npm run build
npm start
# Atau gunakan PM2:
pm2 start npm --name "patrol" -- start
```

---

## 📱 Cara Penggunaan

### Pengguna Lapangan (Security / HSE)

1. Buka URL aplikasi di browser HP
2. Pilih divisi (**Security** atau **HSE**)
3. Pilih nama dari dropdown
4. Isi form sesuai panduan
5. Upload foto – otomatis diberi **watermark timestamp + koordinat GPS**
6. Submit laporan

### Admin

1. Buka `[URL]/admin`
2. Login: `admin` / `Admin@ISA2024` *(ganti segera!)*
3. **Dashboard**: Lihat statistik & grafik laporan
4. **Laporan**: Filter, lihat detail foto & TTD, export Excel
5. **Personel**: Tambah/edit/nonaktifkan Security & HSE
6. **Area Patrol**: Tambah area baru, kelola item checklist

---

## 🔒 Keamanan

### Ganti Password Admin Setelah Deploy

1. Buka Prisma Studio: `npm run db:studio`
2. Buka tabel `admins`
3. Generate bcrypt hash baru:
   ```bash
   node -e "const b=require('bcryptjs');b.hash('PasswordBaru123',12).then(console.log)"
   ```
4. Update field `password` dengan hash baru

### Catatan Keamanan Production

- ✅ Password di-hash dengan **bcrypt** (cost factor 12)
- ✅ Session via **JWT** HttpOnly cookie (tidak bisa diakses JavaScript)
- ✅ Cookie `Secure: true` di production (HTTPS only)
- ⚠️ Firestore rules: Tambahkan rate limiting di middleware jika perlu
- ⚠️ Upload: Validasi tipe & ukuran file sudah ada, tambahkan virus scan untuk production

---

## 🛠️ Perintah Berguna

```bash
npm run dev          # Development server
npm run build        # Build production
npm run db:push      # Sync schema ke DB tanpa migration file
npm run db:migrate   # Buat & jalankan migration file
npm run db:seed      # Isi data awal
npm run db:studio    # Buka Prisma Studio (GUI database)
```

---

## ❓ Troubleshooting

**`@prisma/client did not initialize yet`**
```bash
npx prisma generate
```

**Koneksi MySQL gagal**
- Periksa `DATABASE_URL` di `.env.local`
- Pastikan MySQL service berjalan: `sudo service mysql start`
- Pastikan user memiliki privileges yang benar

**Foto tidak muncul**
- Pastikan folder `public/uploads/` ada (dibuat otomatis saat pertama upload)
- Periksa write permission folder tersebut

**GPS tidak tersedia**
- Browser harus dibuka via HTTPS atau `localhost`
- User harus memberi izin lokasi
