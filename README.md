# 🛡️ Sistem Patrol – Mahkota Group

Platform pelaporan pemantauan patrol Security & EHS&FS berbasis web dengan fitur georeferencing, watermark, dan dashboard analytics.

**Stack**: Next.js 14 · TypeScript · Prisma ORM · MySQL · Tailwind CSS · Recharts · Cloudinary

---

## 📋 Fitur Sistem

### Security Patrol

| Fitur                       | Status | Keterangan                                              |
| --------------------------- | ------ | ------------------------------------------------------- |
| **Timestamp otomatis**      | ✅     | Dicatat saat form dibuka & foto diambil                 |
| **GPS Georeferencing**      | ✅     | Koordinat otomatis dari browser geolocation             |
| **Photo Watermark**         | ✅     | Timestamp + GPS + peta mini di setiap foto              |
| **Multi-area checklist**    | ✅     | Patroli multiple area dalam 1 laporan                   |
| **Section-based findings**  | ✅     | Multiple findings per section dengan foto masing-masing |
| **Status temuan**           | ✅     | NO_FINDING atau FINDING dengan deskripsi                |
| **Reference images**        | ✅     | Tonton panduan visual area & section sebelum patroli    |
| **Form timestamp tracking** | ✅     | Catat kapan form dibuka                                 |

### EHS&FS Patrol

| Fitur                     | Status | Keterangan                                    |
| ------------------------- | ------ | --------------------------------------------- |
| **Timestamp otomatis**    | ✅     | Dicatat saat form dibuka                      |
| **GPS Georeferencing**    | ✅     | Koordinat area dari browser geolocation       |
| **Multi-area kunjungan**  | ✅     | Multiple area per report                      |
| **Work activities**       | ✅     | Deskripsi kegiatan kerja area tersebut        |
| **Hazard identification** | ✅     | Multi-select dari 11 tipe bahaya K3           |
| **Evidence photos**       | ✅     | Photo watermarked per area visit              |
| **Additional photos**     | ✅     | Multiple supporting photos per area           |
| **Socialization notes**   | ✅     | Deskripsi K3 yang disampaikan ke karyawan     |
| **Digital signatures**    | ✅     | EHS&FS + witness signatures dengan canvas pad |
| **Reference images**      | ✅     | Panduan visual untuk setiap area              |

### Admin Panel

| Fitur                      | Status |
| -------------------------- | ------ |
| **Dashboard statistik**    | ✅     |
| **Chart visualization**    | ✅     |
| **Report filtering**       | ✅     |
| **Export Excel**           | ✅     |
| **Personel management**    | ✅     |
| **Area patrol management** | ✅     |
| **Section configuration**  | ✅     |
| **Reference image upload** | ✅     |
| **JWT authentication**     | ✅     |
| **Role-based access**      | ✅     |

---

## 🗂️ Struktur Project

```
patrol-system/
├── prisma/
│   ├── schema.prisma              # Skema database MySQL + seed
│   ├── seed.ts                    # Data awal (admin, areas, users)
│   └── migrations/                # Versi kontrol database
│       ├── 20260401164835_*.sql   # Security schema initial
│       ├── 20260402033844_*.sql   # Reference images support
│       └── 20260402043423_*.sql   # Area sections support
├── src/
│   ├── app/
│   │   ├── globals.css            # Tailwind + custom styles
│   │   ├── layout.tsx             # Root layout
│   │   ├── page.tsx               # Home (division selector)
│   │   │
│   │   ├── patrol/                # Patrol forms
│   │   │   ├── page.tsx           # Unified patrol form router
│   │   │   └── success/page.tsx   # Confirmation page
│   │   │
│   │   ├── admin/                 # Admin dashboard
│   │   │   ├── layout.tsx         # Admin layout + auth guard
│   │   │   ├── page.tsx           # Admin login form
│   │   │   ├── dashboard/page.tsx # Dashboard + stats
│   │   │   ├── areas/page.tsx     # Area & section management
│   │   │   ├── reports/page.tsx   # Report list & filtering
│   │   │   │   └── all/          # Report details & export
│   │   │   └── users/page.tsx     # Personnel management
│   │   │
│   │   └── api/                   # Backend routes
│   │       ├── auth/
│   │       │   ├── login/route.ts          # POST: authenticate admin
│   │       │   ├── logout/route.ts         # POST: clear session
│   │       │   └── session/route.ts        # GET: check auth status
│   │       │
│   │       ├── users/
│   │       │   ├── route.ts                # GET: list users (filter by division)
│   │       │   │                           # POST: create new user
│   │       │   └── [id]/route.ts           # PATCH: update user
│   │       │                               # DELETE: remove user
│   │       ├── areas/
│   │       │   ├── route.ts                # GET: list areas with sections
│   │       │   │                           # POST: create area
│   │       │   └── [id]/route.ts           # PATCH: update area
│   │       │                               # DELETE: remove area
│   │       ├── reports/
│   │       │   ├── route.ts                # GET: list all reports (with filters)
│   │       │   ├── security/route.ts       # POST: submit security report
│   │       │   ├── hse/route.ts            # POST: submit EHS&FS report
│   │       │   ├── purge/route.ts          # DELETE: admin cleanup
│   │       │   └── stats/route.ts          # GET: dashboard statistics
│   │       │
│   │       └── upload/route.ts             # Cloudinary upload handler
│   │
│   ├── components/
│   │   ├── patrol/
│   │   │   ├── SecurityPatrolForm.tsx      # 1049 lines - main form
│   │   │   │                               # - Multi-area selection
│   │   │   │                               # - Section-based findings
│   │   │   │                               # - Multiple photos per section
│   │   │   │                               # - Reference image lightbox
│   │   │   │                               # - GPS + timestamp watermark
│   │   │   │                               # - Real-time validation
│   │   │   │
│   │   │   ├── HSEPatrolForm.tsx           # 656 lines - main form
│   │   │   │                               # - Multi-area visits
│   │   │   │                               # - Work activities tracking
│   │   │   │                               # - Hazard multi-select (11 types)
│   │   │   │                               # - Evidence + additional photos
│   │   │   │                               # - Socialization description
│   │   │   │                               # - EHS&FS + witness signatures
│   │   │   │
│   │   │   ├── PhotoUpload.tsx             # Media capture component
│   │   │   │                               # - Webcam/camera integration
│   │   │   │                               # - Watermark preview
│   │   │   │                               # - GPS metadata
│   │   │   │
│   │   │   └── SignaturePad.tsx            # Canvas signature component
│   │   │                                   # - Draw signatures
│   │   │                                   # - Clear & confirm
│   │   │
│   │   └── admin/
│   │       └── AdminShell.tsx              # Sidebar navigation layout
│   │
│   ├── lib/
│   │   ├── prisma.ts                       # Prisma client singleton
│   │   ├── auth.ts                         # JWT token management
│   │   │                                   # - signToken()
│   │   │                                   # - verifyToken()
│   │   │                                   # - getSessionFromCookies()
│   │   │
│   │   ├── photoUtils.ts                   # Photo processing library
│   │   │                                   # - getCurrentPosition() → GPS
│   │   │                                   # - formatTimestamp()
│   │   │                                   # - fetchMapThumbnail()
│   │   │                                   # - drawPin() → map marker
│   │   │                                   # - applyWatermark() → HDR canvas
│   │   │                                   # - processPhoto() → upload-ready
│   │   │
│   │   ├── cloudinary.ts                   # Cloudinary integration
│   │   │                                   # - uploadToCloudinary()
│   │   │                                   # - HSE photo storage
│   │   │
│   │   └── exportExcel.ts                  # XLSX export utilities
│   │                                       # - generateExcelReport()
│   │                                       # - Multi-sheet (Security/HSE)
│   │
│   └── types/
│       └── index.ts                        # TypeScript interfaces & enums
│                                           # - PatrolDivision
│                                           # - UserDTO, AdminPayload
│                                           # - PatrolAreaDTO, AreaSectionDTO
│                                           # - SecurityReportDTO, HSEReportDTO
│                                           # - FindingEntry, HSEAreaVisitInput
│                                           # - HazardType enum (11 values)
│                                           # - HAZARD_OPTIONS constants
│
├── public/
│   └── uploads/                        # Local storage (Security reports)
│
├── next.config.mjs                     # Next.js configuration
├── tsconfig.json                       # TypeScript config
├── tailwind.config.ts                  # Tailwind CSS config
├── postcss.config.js                   # PostCSS config
├── package.json                        # Dependencies & scripts
└── .env.local (not committed)          # Environment variables
```

---

## 🚀 Setup & Instalasi

### Prasyarat

- **Node.js** >= 18 (rekomendasi 20+)
- **npm** atau **yarn**
- **MySQL** 8.0+ atau **MariaDB** 10.6+
- **Cloudinary account** (untuk EHS&FS report photos)

### 1. Clone & Install Dependencies

```bash
git clone <repo-url>
cd patrol-system
npm install
```

### 2. Setup Database MySQL

Buat database baru:

```sql
CREATE DATABASE patrol_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER 'patrol_user'@'localhost'
  IDENTIFIED BY 'SecurePassword123!';

GRANT ALL PRIVILEGES ON patrol_db.*
  TO 'patrol_user'@'localhost';

FLUSH PRIVILEGES;
```

### 3. Konfigurasi Environment Variables

Buat file `.env.local` di root project:

```bash
cp .env.local.example .env.local  # jika ada
```

Edit `.env.local`:

```env
# DATABASE
DATABASE_URL="mysql://patrol_user:SecurePassword123!@localhost:3306/patrol_db"

# JWT Secret (generate dengan: openssl rand -base64 32)
JWT_SECRET="your-random-secret-string-min-32-chars-here"

# Application URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Cloudinary (untuk HSE photo uploads)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
```

### 4. Sinkronisasi Database & Seed Data

```bash
# Sync schema ke database (tanpa file migration)
npm run db:push

# ATAU jika prefer menggunakan file migration (production-ready):
npm run db:migrate

# Isi data awal (admin, areas, sample users)
npm run db:seed

# Verifikasi dengan Prisma Studio (GUI)
npm run db:studio
```

**Default admin credentials setelah seed:**

- Username: `admin`
- Password: `Admin@ISA2024`

⚠️ **GANTI PASSWORD SEBELUM PRODUCTION!**

### 5. Jalankan Development Server

```bash
npm run dev
```

Buka: `http://localhost:3000`

---

## 📐 Database Schema Overview

### Users & Auth

```sql
-- Operator Patrol
users (id, name, division, isActive, createdAt)
  └─ Division: SECURITY | EHS&FS

-- Admin Access
admins (id, username, password, role, createdAt)
  └─ Role: SUPER_ADMIN | VIEWER
```

### Patrol Areas & Configuration

```sql
patrol_areas (id, name, code, isActive, referenceImageUrl1, referenceImageUrl2)
  └─ area_sections (id, areaId, order, name, description, referenceImageUrl1, referenceImageUrl2)
```

### Security Reports

```sql
security_reports (id, userId, patrolDate, patrolTime, latitude, longitude, selfiePhotoUrl)
  └─ report_area_visits (id, reportId, areaId, order)
     └─ section_entries (id, areaVisitId, areaSectionId)
        └─ section_findings (id, sectionEntryId, status, findingDescription, photoUrl,
                            photoTimestamp, photoLatitude, photoLongitude, order)
```

### EHS&FS Reports

```sql
hse_reports (id, userId, visitDate, visitTime, latitude, longitude,
             hseSignatureUrl, witnessSignatureUrl)
  └─ hse_area_visits (id, reportId, areaName, workActivities, hazardDescription,
                      socializationDescription, evidencePhotoUrl, evidencePhotoTimestamp)
     ├─ hse_hazards (id, areaVisitId, hazardType)
     │  └─ HazardType enum (11 types: TERJATUH, TERGELINCIR, TERKENA_BENDA_TAJAM, dst)
     │
     └─ hse_visit_photos (id, areaVisitId, photoUrl, description, photoTimestamp, order)
```

---

## 🌐 Deployment

### Option 1: VPS/Server (Recommended for Production)

**Setup Linux VPS:**

```bash
# Install Node.js & npm (Debian/Ubuntu)
curl -sL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MySQL
sudo apt-get install -y mysql-server

# Create app directory
mkdir -p /var/www/patrol-system
cd /var/www/patrol-system

# Clone & install
git clone <repo-url> .
npm install --production

# Build production
npm run build

# Setup PM2 for auto-restart
npm install -g pm2
pm2 start npm --name "patrol-system" -- start
pm2 startup
pm2 save
```

**Setup Reverse Proxy (Nginx):**

```nginx
server {
    listen 80;
    server_name patrol.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Enable HTTPS (SSL):**

```bash
# Using Certbot for Let's Encrypt
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d patrol.yourdomain.com
```

### Option 2: Vercel + PlanetScale (Serverless)

**Advantages:**

- Auto-scaling, zero server management
- Free tier tersedia
- Integrated with GitHub

**Setup Database:**

1. Daftar di [planetscale.com](https://planetscale.com)
2. Buat database MySQL baru
3. Klik **Connect** → pilih **Prisma**
4. Salin connection string yang diberikan
5. Update `prisma/schema.prisma`:

```prisma
datasource db {
  provider     = "mysql"
  url          = env("DATABASE_URL")
  relationMode = "prisma"  // Required untuk PlanetScale
}
```

**Deploy ke Vercel:**

```bash
# Option 1: Via GitHub
# Push repo ke GitHub, connect di vercel.com

# Option 2: Via Vercel CLI
npm i -g vercel
vercel
```

**Environment Variables (Vercel Dashboard):**

```env
DATABASE_URL=mysql://user:pass@server/db
JWT_SECRET=your-random-secret-min-32-chars
NEXT_PUBLIC_APP_URL=https://your-vercel-url.vercel.app
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

⚠️ **Note:** Vercel filesystem ephemeral → semua photos harus ke Cloudinary, bukan local storage.

### Other Options

- **Railway**: Easy setup, $5/month credit free
- **Render**: Similar to Railway
- **AWS Lightsail**: More control, entry-level VPS

---

## 📱 Cara Penggunaan Aplikasi

### 👨‍⚠️ Security Patrol User

**Flow:**

1. **Home** → Pilih **Security**
2. **Input Petugas** → Dropdown nama dari registered users
3. **Pilih Area** → Select area yang akan dipatroli
4. **Patrol ke Sections**:
   - Ambil selfie foto (GPS + watermark otomatis)
   - Untuk setiap **Section**:
     - Add multiple **Findings** (if ada temuan)
     - Untuk each finding: pilih status + deskripsi + photo
     - Photo akan di-watermark: timestamp, GPS, mini map
5. **Complete** → Lanjut area lain atau submit
6. **Submit** → Laporan tersimpan di database

**Data Captured:**

- User, timestamp form opened
- GPS location saat form dibuka
- Untuk setiap section:
  - Finding status (NO_FINDING / FINDING)
  - Deskripsi (jika FINDING)
  - Photo avec metadata: timestamp, GPS, latitude/longitude
  - Order/sequence

### 👷 EHS&FS Patrol User

**Flow:**

1. **Home** → Pilih **EHS&FS**
2. **Input Petugas** → Dropdown nama dari registered users
3. **Add Area Visits** → Bisa multiple area dalam 1 report:
   - Area name (bebas input atau dari dropdown area list)
   - Work activities: Apa kegiatan yang sedang dilakukan
   - Evidence photo: Foto utama area (watermarked)
   - Hazards: Multi-select dari 11 tipe (TERJATUH, TERGELINCIR, dll)
   - Hazard description: Detail bahaya yang ditemukan
   - Additional photos: Upload supporting photos (unlimited)
   - Socialization: Apa yang disampaikan ke karyawan tentang K3
4. **Signatures**:
   - Draw EHS&FS signature
   - Draw witness signature
5. **Submit** → Laporan + semua photos tersimpan (Cloudinary)

**Data Captured:**

- User, timestamp form opened, GPS location
- Per area visit:
  - Area name, work activities
  - Evidence photo (watermarked) avec GPS + timestamp
  - Selected hazards (enum dari 11 types)
  - Hazard description, socialization notes
  - Multiple supporting photos
  - Signature images

### 👨‍💼 Admin Panel: `/admin`

**Login Credentials:**

- Default: `admin` / `Admin@ISA2024`
- ⚠️ **Ganti password segera!**

**Features:**

#### 1. Dashboard

- Real-time statistics:
  - Total reports (Security vs EHS&FS)
  - Daily/Weekly/Monthly trend charts
  - Top performers
  - Recent reports
- Filter by period (daily, weekly, monthly, custom date range)

#### 2. Reports

- **Browse all reports** dengan filters:
  - Type (Security / EHS&FS)
  - Date range
  - User name
  - View count, findings count, etc
- **Detail report**:
  - View all photos in lightbox
  - View signatures
  - View all findings/hazards
  - Download report PDF
- **Export to Excel**:
  - Multi-sheet (Security, EHS&FS, Summary)
  - Including all photos, findings, signatures

#### 3. Personnel Management (`/admin/users`)

- **View all users** (Security & EHS&FS)
- **Add user**:
  - Name input
  - Division selection (SECURITY / EHS&FS)
- **Edit user**:
  - Update name
  - Toggle active/inactive status
- **Delete user** (soft/hard delete option)

#### 4. Area Management (`/admin/areas`)

- **View all areas** dengan sections
- **Add area**:
  - Area name (e.g., "Main Gate")
  - Area code (e.g., "MG-01")
  - Upload reference images (up to 2)
- **Edit area**:
  - Update name/code
  - Update reference images
  - Add/edit/delete sections
- **Section management**:
  - Each area bisa punya multiple sections
  - Section properties: name, description, order, reference images
  - Untuk Security: sections punya checklist items yang bisa di-inspect per finding

---

## 🔐 Security Best Practices

### Change Admin Password

**First time setup:**

```bash
# Generate bcrypt hash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('YourNewPassword123!', 12).then(h => console.log(h))"
```

**Update in database:**

```bash
npm run db:studio
# → admins table → update password field dengan hash baru
```

### Security Features Implemented

✅ **Passwords**: Bcrypt hashing (cost: 12)  
✅ **Sessions**: JWT dalam HttpOnly cookies (JavaScript-proof)  
✅ **Transport**: All cookies marked Secure (HTTPS-only in production)  
✅ **CSRF**: Built-in Next.js protection  
✅ **File uploads**: Type & size validation  
✅ **Input validation**: Via Prisma & form validation  
✅ **Geolocation**: HTTPS/localhost required + user permission

### Production Recommendations

🔒 Enforce HTTPS everywhere  
🔒 Add rate limiting to auth endpoints  
🔒 Setup WAF (Cloudflare, etc)  
🔒 Regular database backups  
🔒 Monitor error logs & alerts  
🔒 Use secrets management (HashiCorp Vault, etc)  
🔒 Enable audit logging for admin actions  
🔒 Setup automated security patches

---

## 📸 Photo & Media Management

### Security Reports (Local Storage)

- **Storage**: `public/uploads/` (local filesystem)
- **Format**: JPG, resized, watermarked dengan canvas
- **Metadata**: photoTimestamp, photoLatitude, photoLongitude di database
- **Watermark includes**:
  - Timestamp (formatted: "DD/MM/YYYY HH:mm:ss")
  - GPS coordinates
  - Mini map thumbnail
  - Optional selfie dari camera
- **Limitation**: Not persistent di Vercel (use Cloudinary if serverless)

### EHS&FS Reports (Cloudinary)

- **Storage**: Cloudinary (cloud-based)
- **Integration**: `@/lib/cloudinary.ts`
- **Upload types**:
  - Evidence photo (per area visit)
  - Additional photos (multiple per area visit)
- **Features**:
  - Auto-resize & optimize
  - CDN delivery
  - Secure URLs
  - Metadata preservation

---

## 🛠️ Useful Commands

```bash
# Development
npm run dev            # Start dev server (http://localhost:3000)
npm run build          # Production build

# Database
npm run db:push        # Sync schema (no migration file)
npm run db:migrate     # Create & run migration
npm run db:seed        # Populate initial data
npm run db:studio      # Prisma Studio GUI

# Linting
npm run lint           # Run ESLint

# Prisma
npx prisma generate    # Generate Prisma client
```

---

## ❓ Troubleshooting

**Prisma client error: "did not initialize yet"**

```bash
npx prisma generate
npm run build
```

**Database connection failed**

- Check `DATABASE_URL` in `.env.local`
- Verify MySQL running: `sudo service mysql status`
- Verify user permissions: `SHOW GRANTS FOR 'patrol_user'@'localhost';`

**Photos not displaying**

- Check `public/uploads/` exists (auto-created on first upload)
- Verify folder permissions: `chmod 755 public/uploads`
- Check localhost/HTTPS requirement (for GPS watermark)

**GPS coordinates not captured**

- Requires HTTPS (or `localhost` for dev)
- User must allow location permission
- Verify GPS enabled in browser settings

**Upload fails**

- Check file size limits (max size validation in code)
- Verify write permissions on `public/uploads/`
- For Cloudinary: verify API keys in `.env.local`

---

## 📚 Technologies Used

| Layer        | Technology                                     |
| ------------ | ---------------------------------------------- |
| **Frontend** | React 18, Next.js 14, TypeScript, Tailwind CSS |
| **Backend**  | Next.js API Routes, Node.js                    |
| **Database** | MySQL 8.0+ with Prisma ORM                     |
| **Auth**     | JWT, bcryptjs, HttpOnly cookies                |
| **Photos**   | Canvas API (watermarking), Cloudinary, Sharp   |
| **Charts**   | Recharts (dashboard analytics)                 |
| **Export**   | XLSX (Excel multi-sheet)                       |
| **Icons**    | Lucide React                                   |
| **Dates**    | date-fns                                       |
| **Other**    | uuid, multer, axios                            |

---

## 📄 License & Support

For questions or issues, please contact the development team or create an issue in the repository.

**Last Updated**: April 2026  
**Version**: 1.0.0
