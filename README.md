<p align="center">
  <img src="https://img.shields.io/badge/MediVault-Emergency%20Medical%20System-2563eb?style=for-the-badge&logo=shield&logoColor=white" alt="MediVault" />
</p>

<h1 align="center">MediVault — Emergency Medical System</h1>

<p align="center">
  A secure, real-time emergency medical information system that enables patients to share critical health data with hospital staff through time-limited, auditable access codes.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?logo=supabase&logoColor=white" />
  <img src="https://img.shields.io/badge/JWT-Auth-orange?logo=jsonwebtokens&logoColor=white" />
  <img src="https://img.shields.io/badge/Deployed-Netlify%20+%20Render-00C7B7?logo=netlify&logoColor=white" />
</p>

---

## Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [API Endpoints](#-api-endpoints)
- [Database Schema](#-database-schema)
- [Deployment](#-deployment)
- [Security](#-security)
- [Screenshots](#-screenshots)

---

## Overview

**MediVault** solves a critical problem in emergency medicine: how to give hospital staff **instant, secure access** to a patient's vital health data (blood type, allergies, medications, conditions) — without compromising privacy.

Patients generate a **6-digit time-limited access code** or **QR code** that hospital staff can use to view their emergency medical profile. Every access is logged and auditable. Access auto-expires after **15 minutes**, and patients can revoke access at any time.

---

## Key Features

### Patient Side
| Feature | Description |
|---------|-------------|
| **Secure Registration & Login** | Email/password authentication with bcrypt hashing and JWT tokens |
| **OTP Verification** | Email-based OTP for account verification and password recovery |
| **Medical Profile** | Store blood type, allergies, medications, conditions, emergency contacts |
| **Emergency Access Codes** | Generate time-limited 6-digit codes with QR code support |
| **Access History** | Full audit log of who accessed your data, when, and from which hospital |
| **Auto-Revocation** | Access codes expire automatically after 15 minutes |
| **Manual Revoke** | Instantly revoke active access at any time |

### Hospital Staff Side
| Feature | Description |
|---------|-------------|
| **Staff Portal** | Dedicated interface requiring hospital credentials (name, ID, department) |
| **Code / QR Entry** | Enter 6-digit code manually or scan QR using device camera |
| **Patient Data View** | Immediate view of critical medical data (blood type, allergies, medications, conditions) |
| **Doctor Notes & Prescriptions** | Add new medications, diagnoses, and clinical notes to the patient's record |
| **Live Countdown** | Real-time session timer with auto-close on expiry |
| **Full Audit Trail** | All access and prescription updates are logged |

---

## Architecture

```
┌───────────────────┐       HTTPS        ┌───────────────────┐       SQL        ┌──────────────────┐
│                   │ ─────────────────▶  │                   │ ──────────────▶  │                  │
│   React Frontend  │                     │   Express Backend │                  │    Supabase      │
│   (Netlify)       │ ◀─────────────────  │   (Render)        │ ◀──────────────  │    PostgreSQL    │
│                   │     JSON + JWT      │                   │    Rows/JSONB    │                  │
└───────────────────┘                     └───────────────────┘                  └──────────────────┘
```

---

## Tech Stack

### Frontend
- **React 19** — Component-based UI
- **React Router v7** — Client-side routing
- **Axios** — HTTP client with JWT interceptors
- **html5-qrcode** — QR code scanning via device camera
- **qrcode** — QR code generation

### Backend
- **Express 5** — REST API server
- **Supabase JS** — Database client (PostgreSQL)
- **bcryptjs** — Password hashing (12 rounds)
- **jsonwebtoken** — JWT authentication (7-day expiry)
- **cors** — Cross-origin resource sharing
- **dotenv** — Environment variable management

### Database
- **Supabase (PostgreSQL)** — Tables: `users`, `patients`, `emergency_tokens`, `access_logs`, `otps`

### Deployment
- **Netlify** — Frontend hosting with SPA routing
- **Render** — Backend hosting with auto-deploy

---

## Project Structure

```
emergency-medical-system/
├── client/                        # React Frontend
│   ├── public/
│   │   └── _redirects             # Netlify SPA routing
│   ├── src/
│   │   ├── api/
│   │   │   └── api.js             # Axios instance with JWT interceptor
│   │   ├── pages/
│   │   │   ├── Login.jsx          # Login with email/password & OTP
│   │   │   ├── Register.jsx       # Multi-step registration
│   │   │   ├── Dashboard.jsx      # Main hub with action cards
│   │   │   ├── Profile.jsx        # View/edit emergency profile
│   │   │   ├── MedicalDetails.jsx # Update medical information
│   │   │   ├── Emergency.jsx      # Generate access codes & QR
│   │   │   ├── AccessHistory.js   # View access audit logs
│   │   │   ├── Staff.jsx          # Hospital staff portal
│   │   │   └── Settings.jsx       # Account settings
│   │   ├── App.jsx                # Router configuration
│   │   └── index.css              # Global styles
│   ├── netlify.toml               # Netlify build config
│   └── package.json
│
├── server/                        # Express Backend
│   ├── config/
│   │   └── supabase.js            # Supabase client initialization
│   ├── controllers/
│   │   ├── authController.js      # Signup, login, OTP, password reset
│   │   ├── emergencyController.js # Access codes, revoke, doctor notes
│   │   └── profileController.js   # Profile management
│   ├── middleware/
│   │   └── authMiddleware.js      # JWT verification middleware
│   ├── models/
│   │   └── Patient.js             # Schema documentation
│   ├── routes/
│   │   ├── authRoutes.js          # /api/auth/*
│   │   ├── emergencyRoutes.js     # /api/emergency/*
│   │   ├── patientRoutes.js       # /api/patients/*
│   │   └── profileRoutes.js       # /api/profile/*
│   ├── server.js                  # Express app entry point
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## Getting Started

### Prerequisites

- **Node.js** v18+
- **npm** v9+
- A **Supabase** project ([supabase.com](https://supabase.com))

### 1. Clone the Repository

```bash
git clone https://github.com/ak5869/MediVault-Emergency.git
cd MediVault-Emergency
```

### 2. Set Up the Backend

```bash
cd server
npm install
```

Create a `.env` file in the `server/` directory:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
JWT_SECRET=your-secure-secret-key
PORT=5000
CLIENT_URL=http://localhost:3000
```

Start the server:

```bash
npm start
```

The API will be running at `http://localhost:5000`.

### 3. Set Up the Frontend

```bash
cd ../client
npm install
npm start
```

The app will open at `http://localhost:3000`.

### 4. Set Up the Database

Run the following SQL in your **Supabase SQL Editor**:

```sql
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  email       TEXT        UNIQUE NOT NULL,
  password    TEXT        NOT NULL,
  phone       TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Patients table (medical profiles)
CREATE TABLE IF NOT EXISTS patients (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        REFERENCES users(id),
  name              TEXT        NOT NULL,
  blood_group       TEXT,
  date_of_birth     DATE,
  gender            TEXT,
  height_cm         NUMERIC,
  weight_kg         NUMERIC,
  allergies         TEXT[],
  conditions        TEXT[],
  medications       JSONB,
  emergency_contact JSONB,
  attendance        INTEGER     DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- Emergency access tokens
CREATE TABLE IF NOT EXISTS emergency_tokens (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        REFERENCES users(id),
  code        TEXT        NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  is_active   BOOLEAN     DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Access audit logs
CREATE TABLE IF NOT EXISTS access_logs (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        REFERENCES users(id),
  hospital_name   TEXT,
  hospital_id     TEXT,
  doctor_name     TEXT,
  department      TEXT,
  staff_id        TEXT,
  method          TEXT,
  status          TEXT,
  notes           TEXT,
  accessed_at     TIMESTAMPTZ DEFAULT now()
);

-- OTPs for verification
CREATE TABLE IF NOT EXISTS otps (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        REFERENCES users(id),
  otp         TEXT        NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);
```

---

## API Endpoints

### Authentication — `/api/auth`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/register` | Create a new account |
| `POST` | `/login` | Login with email & password |
| `POST` | `/send-otp` | Send OTP to email |
| `POST` | `/verify-otp` | Verify OTP and get token |
| `POST` | `/forgot-password` | Reset password |
| `POST` | `/check-email` | Check if email exists |

### Patients — `/api/patients`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Get all patients (filter by `?user_id=`) |
| `POST` | `/add` | Create a new patient record |
| `POST` | `/save` | Upsert patient data (insert or update) |

### Emergency — `/api/emergency`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/generate` | Generate a 6-digit access code |
| `POST` | `/access` | Validate code & retrieve patient data |
| `POST` | `/revoke` | Revoke active access codes |
| `POST` | `/add-notes` | Add doctor prescriptions & notes |
| `GET` | `/history` | Get access audit history |

### Profile — `/api/profile`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Get user profile |

---

## 🗄 Database Schema

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────────┐
│    users      │     │    patients       │     │ emergency_tokens │
├──────────────┤     ├──────────────────┤     ├──────────────────┤
│ id (PK)      │◀────│ user_id (FK)     │     │ id (PK)          │
│ name         │     │ id (PK)          │     │ user_id (FK)     │──▶ users.id
│ email        │     │ name             │     │ code             │
│ password     │     │ blood_group      │     │ expires_at       │
│ phone        │     │ allergies[]      │     │ is_active        │
│ created_at   │     │ conditions[]     │     │ created_at       │
└──────────────┘     │ medications{}    │     └──────────────────┘
       │             │ emergency_contact│
       │             │ created_at       │     ┌──────────────────┐
       │             │ updated_at       │     │   access_logs    │
       │             └──────────────────┘     ├──────────────────┤
       │                                      │ id (PK)          │
       │                                      │ user_id (FK)     │──▶ users.id
       │              ┌──────────────────┐    │ hospital_name    │
       │              │      otps        │    │ doctor_name      │
       │              ├──────────────────┤    │ department       │
       └──────────────│ user_id (FK)     │    │ method           │
                      │ id (PK)          │    │ status           │
                      │ otp              │    │ notes            │
                      │ expires_at       │    │ accessed_at      │
                      │ created_at       │    └──────────────────┘
                      └──────────────────┘
```

---

## Deployment

| Component | Platform | URL |
|-----------|----------|-----|
| **Frontend** | Netlify | [Deploy on Netlify](https://netlify.com) |
| **Backend** | Render | [Deploy on Render](https://render.com) |
| **Database** | Supabase | [supabase.com](https://supabase.com) |

### Environment Variables

**Render (Backend):**
| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Your Supabase anonymous key |
| `JWT_SECRET` | Secret key for JWT signing |
| `PORT` | `10000` (Render default) |
| `CLIENT_URL` | Your Netlify frontend URL |

**Netlify (Frontend):**
| Variable | Description |
|----------|-------------|
| `REACT_APP_API_URL` | Your Render backend URL + `/api` |

---

## Security

- **Passwords** are hashed using `bcryptjs` with 12 salt rounds
- **JWT tokens** expire after 7 days and are attached via Authorization header
- **Emergency access codes** auto-expire after 15 minutes
- **Expired tokens** are automatically cleaned up every 60 seconds by a server-side scheduler
- **CORS** is restricted to the configured client origin only
- **All access events** are logged in the `access_logs` table with timestamps, staff details, and hospital information
- **OTPs** expire after 10 minutes and are deleted after use

---

## Screenshots

> Screenshots can be added here to showcase the application's UI.

| Screen | Description |
|--------|-------------|
| Login | Secure login with email/password and OTP options |
| Dashboard | Central hub with quick-action cards |
| Emergency Access | Generate QR codes and 6-digit access codes |
| Staff Portal | Hospital staff credential entry and patient data view |
| Access History | Full audit trail of data access events |

---

## Contributors

- **Abhiram K** — [@ak5869](https://github.com/ak5869)

---

## License

This project is for educational purposes as part of the Full Stack Development course at SRM University.

---

<p align="center">
  Built with ❤️ for secure emergency healthcare
</p>
