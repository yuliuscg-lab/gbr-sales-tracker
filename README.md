# 🎣 GBR Sales Tracker (Bait & Tackle Tracker)

Aplikasi manajemen operasional penjualan, pencatatan piutang (bon tempo), pelacakan pengiriman, dan pemantauan laba rugi (*Profit & Loss*) yang dirancang khusus untuk UMKM toko & distributor umpan pancing.

---

## 📌 Ringkasan Proyek

**GBR Sales Tracker** dibangun dengan pendekatan arsitektur modular berlapis (*Route → Controller → Service → Repository*) untuk memastikan keandalan data transaksi, pemisahan tanggung jawab kode yang bersih, serta kecepatan respon antarmuka kasir dan pemilik toko.

### Fitur Utama:
1. **Dashboard Eksekutif & Finansial:**
   * Ringkasan KPI: Omzet kotor (*Gross Revenue*), realisasi kas tertagih (*Realized Revenue*), estimasi Laba Bersih (*Net Profit*), arus kas keluar (*Cash Out*), dan saldo total piutang beredar.
   * Grafik tren bulanan 12 bulan (Omzet vs Laba Bersih) tanpa dependensi chart berat.
   * Top 15 produk terlaris berdasarkan kuantitas & kontribusi omzet.
   * Indikator tindakan cepat: Pesanan perlu dikirim (*Pending Delivery*) & Top 5 pelanggan dengan piutang terbesar.
2. **Katalog Produk & Konversi Multi-Satuan (UOM):**
   * Dukungan satuan dasar (*Base UOM*, misal: Pcs) dan satuan grosir/kemasan bertingkat (*Secondary UOM*, misal: Pack, Dus) lengkap dengan rasio konversi otomatis.
   * Penetapan harga jual grosir yang fleksibel per satuan kemasan.
   * Tooltip kalkulasi HPP otomatis saat input transaksi.
3. **Manajemen Order & Penjualan (Invoicing):**
   * Pembuatan nota penjualan dinamis dengan validasi skema Zod.
   * Penanganan status pembayaran: `PAID`, `PARTIALLY_PAID`, `UNPAID`, dan `CANCELLED`.
   * Penanganan status logistik pengiriman: `NOT_SHIPPED` dan `SHIPPED`.
4. **Pelacakan Piutang & Pembayaran (Bon Tracker):**
   * Pencatatan cicilan/pelunasan bon pelanggan via Tunai maupun Transfer.
   * Pelacakan jatuh tempo (*Due Date*) dan batas bon pelanggan.
5. **Pencatatan Pengeluaran & Arus Kas (Expenses):**
   * Pemisahan biaya operasional toko (*Operational Expense*) dan belanja modal persediaan/kulakan (*Material Purchase*).
   * Sinkronisasi langsung ke perhitungan Laba Bersih periode berjalan.
6. **Autentikasi & Keamanan:**
   * Akses berbasis JWT dengan mekanisme token rotasi: *in-memory* Access Token (Zustand) dan *HttpOnly secure cookie* Refresh Token.

---

## 🛠️ Tech Stack

### Frontend
* **Framework / Bundler:** [React](https://react.dev/) + [Vite](https://vitejs.dev/) (TypeScript)
* **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
* **State & Data Fetching:** [Zustand](https://zustand-demo.pmnd.rs/) (Auth State) & [@tanstack/react-query](https://tanstack.com/query/latest) (Server State)
* **Form & Validasi:** [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
* **HTTP Client:** [Axios](https://axios-http.com/) (Interceptors untuk silent token refresh)
* **Icons:** [Lucide React](https://lucide.dev/)

### Backend
* **Runtime:** [Node.js](https://nodejs.org/) (Express.js v5)
* **Bahasa:** TypeScript
* **ORM:** [Prisma ORM v5](https://www.prisma.io/)
* **Database:** [Neon PostgreSQL](https://neon.tech/) (Serverless Postgres with Connection Pooling)
* **Keamanan & Utilitas:** `bcrypt`, `jsonwebtoken`, `cookie-parser`, `cors`

---

## 📁 Struktur Direktori

```text
gbr-sales-tracker/
├── package.json                 # Skrip concurrently untuk root runner
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma        # Definisi data model (User, Customer, Product, Order, Expense, dll.)
│   │   └── migrations/
│   ├── src/
│   │   ├── config/              # Inisialisasi Prisma Client & environment
│   │   ├── controllers/         # Handler HTTP request & response
│   │   ├── errors/              # Custom AppError & handler
│   │   ├── middlewares/         # JWT Auth, error middleware
│   │   ├── repositories/        # Query database murni via Prisma
│   │   ├── routes/              # Deklarasi router endpoint API
│   │   ├── services/            # Business logic, validasi aturan bisnis, kalkulasi finansial
│   │   ├── types/               # TypeScript interfaces & DTO
│   │   ├── utils/               # Format response standar, password hash
│   │   └── server.ts            # Entrypoint Express app
│   ├── .env
│   ├── package.json
│   └── tsconfig.json
└── frontend/
    ├── src/
    │   ├── api/                 # Axios client, auth service, & endpoint helpers
    │   ├── components/          # Reusable UI primitives, modal, layout shell
    │   ├── hooks/               # Custom React hooks
    │   ├── pages/               # Tampilan halaman utama (Dashboard, Orders, Products, Customers, Expenses)
    │   ├── routes/              # ProtectedRoute guard & React Router mapping
    │   ├── store/               # Zustand store (authStore)
    │   ├── types/               # Type definitions frontend
    │   ├── validation/          # Zod schemas untuk form input
    │   ├── App.tsx              # Session bootstrap check & root layout
    │   └── main.tsx
    ├── .env
    ├── package.json
    ├── tailwind.config.js / vite.config.ts
    └── tsconfig.json
```

---

## 🚀 Panduan Memulai (Local Development)

### 1. Prasyarat
* Node.js v18+ atau v20+
* Akun database PostgreSQL di [Neon](https://neon.tech/)

### 2. Kloning Repositori
```bash
git clone https://github.com/username/gbr-sales-tracker.git
cd gbr-sales-tracker
```

### 3. Konfigurasi Environment Variables

#### Backend (`backend/.env`):
```env
PORT=5000
NODE_ENV=development

# Neon Connection Strings
DATABASE_URL="postgresql://user:password@ep-xyz-pooler.region.aws.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://user:password@ep-xyz.region.aws.neon.tech/neondb?sslmode=require"

# JWT Config
JWT_ACCESS_SECRET="ganti_dengan_access_secret_acak"
JWT_REFRESH_SECRET="ganti_dengan_refresh_secret_acak"
```

#### Frontend (`frontend/.env`):
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### 4. Instalasi Dependensi

Jalankan instalasi di root folder dan masing-masing sub-folder:
```bash
# Root dependencies (concurrently)
npm install

# Backend dependencies & Prisma setup
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init_schema
cd ..

# Frontend dependencies
cd frontend
npm install
cd ..
```

### 5. Menjalankan Aplikasi Secara Bersamaan

Dari direktori root proyek, jalankan:
```bash
npm run dev
```

* Backend API: `http://localhost:5000`
* Frontend App: `http://localhost:5173`

---

## 📦 Panduan Skrip NPM

| Lokasi | Perintah | Deskripsi |
| :--- | :--- | :--- |
| **Root** | `npm run dev` | Menjalankan backend dan frontend secara paralel menggunakan `concurrently` |
| **Backend** | `npm run dev` | Menjalankan Express backend dalam mode watch (`tsx`) |
| **Backend** | `npm run build` | Melakukan kompilasi TypeScript ke JavaScript (`dist/`) |
| **Backend** | `npx prisma studio` | Membuka antarmuka tabel database Prisma di browser |
| **Frontend** | `npm run dev` | Menjalankan server dev Vite SPA |
| **Frontend** | `npm run build` | Mengompilasi berkas statis frontend siap produksi (`dist/`) |

---

## 🌐 Arsitektur Deployment Rekomendasi

Aplikasi ini dirancang untuk biaya efisien, performa tinggi, dan stabilitas operasional UMKM:

1. **Frontend (Vite + React):**
   * Dihosting di **Vercel** / **Cloudflare Pages** (Gratis).
   * Konfigurasi rewrites client-side routing pada `vercel.json`:
     ```json
     {
       "rewrites": [{ "source": "/(.*)", "destination": "/" }]
     }
     ```
2. **Backend (Express.js 5 + Prisma):**
   * Dihosting di **Cloud VPS Linux (Ubuntu)** menggunakan **PM2** sebagai process supervisor dan **Nginx** sebagai reverse proxy + SSL Let's Encrypt.
   * Ringan dan tanpa jeda *cold start*.
3. **Database:**
   * **Neon PostgreSQL** serverless instance dengan *connection pooling*.

---

## 📄 Lisensi

Hak Cipta © 2026 GBR Sales Tracker. Didistribusikan di bawah lisensi internal / kepemilikan pribadi untuk operasional toko.