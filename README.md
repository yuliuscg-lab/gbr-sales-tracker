# EventPulse — Event Management App

A full-stack **Event Management** platform built as a monorepo. Supports three user roles: **Customer**, **Organizer**, and **Admin** — each with their own dashboard and feature set.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Language** | TypeScript 7.0.2 (Strict Mode) |
| **Frontend** | Vite 8.1.4, React 19, React Router 8, Tailwind CSS 4, Shadcn/UI |
| **State & Data** | Zustand, TanStack Query v5, React Hook Form + Zod |
| **Backend** | Express.js 5 (Route → Controller → Service → Repository) |
| **Validation** | Zod |
| **ORM & DB** | Prisma 7.8, PostgreSQL (Neon.com) |
| **Auth** | JWT (Access + Refresh Token, HttpOnly Cookie) |
| **Image Upload** | Cloudinary (via Multer) |
| **Charts** | Recharts |

---

## Features

### Customer
- Browse & search events by category, city, and date
- View event details, ticket types, and venue info
- Purchase tickets with points redemption and coupon discounts
- Upload payment proof
- View order history and issued tickets

### Organizer
- Create, edit, and manage events with image upload
- Define ticket types and quotas
- View sales orders and verify payments
- Track revenue and sales statistics

### Admin
- Manage users, venues, and categories
- Monitor platform-wide orders and payments

---

## Project Structure

```
event-management/
├── backend/          # Express.js API server
│   ├── prisma/       # Prisma schema & migrations
│   └── src/
│       ├── config/
│       ├── controllers/
│       ├── middlewares/
│       ├── repositories/
│       ├── routes/
│       ├── schedulers/
│       ├── services/
│       ├── types/
│       ├── utils/
│       └── validation/
└── frontend/         # Vite + React SPA
    └── src/
        ├── api/
        ├── components/
        ├── hooks/
        ├── pages/
        │   ├── admin/
        │   ├── customer/
        │   └── organizer/
        ├── routes/
        ├── store/
        ├── types/
        └── validation/
```

---

## Getting Started

### Prerequisites

- Node.js >= 18
- PostgreSQL database (recommended: [Neon.com](https://neon.com) — free tier available)
- Cloudinary account (free tier) for image uploads

---

## Environment Variables

### 1. Backend — `backend/.env`

Copy `backend/.env.example` to `backend/.env` and fill in your values:

```bash
cp backend/.env.example backend/.env
```

| Variable | Description |
|---|---|
| `PORT` | Port the API server listens on (default: `5000`) |
| `NODE_ENV` | `development` or `production` |
| `DATABASE_URL` | Direct PostgreSQL URL — used for `prisma db push` |
| `APP_DATABASE_URL` | Pooler PostgreSQL URL — used for runtime queries |
| `JWT_ACCESS_SECRET` | Random secret for signing access tokens |
| `JWT_REFRESH_SECRET` | Random secret for signing refresh tokens |
| `JWT_ACCESS_EXPIRES_IN` | Access token TTL (e.g. `15m`) |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token TTL (e.g. `7d`) |
| `CLOUDINARY_CLOUD_NAME` | Your Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Your Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Your Cloudinary API secret |

> **Tip:** Generate strong JWT secrets with:
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```

### 2. Frontend — `frontend/.env`

Copy `frontend/.env.example` to `frontend/.env`:

```bash
cp frontend/.env.example frontend/.env
```

| Variable | Description |
|---|---|
| `VITE_API_URL` | Base URL of the backend API (default: `http://localhost:5000/api`) |

---

## Installation & Running

### Option A: Run Both from Root (Recommended)

```bash
# Install root dependencies
npm install

# Install sub-project dependencies
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# Run both concurrently from root
npm run dev
```

### Option B: Run Separately

**Backend:**
```bash
cd backend
npm install
npx prisma db push      # sync DB schema (first time only)
npm run dev             # starts on http://localhost:5000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev             # starts on http://localhost:5173
```

---

## Database Setup

This project uses **Prisma** with **PostgreSQL** (Neon.com recommended):

1. Create a free database at [neon.com](https://neon.com)
2. Copy both the **direct** and **pooler** connection strings into `backend/.env`
3. Push the schema:
   ```bash
   cd backend
   npx prisma db push
   ```
4. (Optional) Seed the database:
   ```bash
   npx prisma db seed
   ```

---

## Available Scripts

### Root
| Script | Description |
|---|---|
| `npm run dev` | Run frontend + backend concurrently |
| `npm run backend` | Run backend only |
| `npm run frontend` | Run frontend only |

### Backend (`backend/`)
| Script | Description |
|---|---|
| `npm run dev` | Development mode with auto-reload (tsx watch) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run start` | Run compiled production build |
| `npm run prisma:push` | Sync Prisma schema to DB |
| `npm run prisma:generate` | Regenerate Prisma client |

### Frontend (`frontend/`)
| Script | Description |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
