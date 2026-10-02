# MediLink — AI-Powered Healthcare & Diagnostic Marketplace

MediLink is a unified full-stack healthcare ecosystem that bridges patients, medical specialists, multi-specialty clinics, and certified diagnostic laboratories. Built with **React 19, TypeScript, Vite, Tailwind CSS, Node.js + Express, Prisma Schema, Socket.IO, and Gemini AI**.

---

## 🌟 Key Architecture & Capabilities

### 1. Multi-Role RBAC Portals
MediLink provides 5 role-specific workspaces with secure backend JWT authorization:
- **Patient**: Health profile, specialist doctor search, instant appointment booking, real-time live OPD queue tracker with estimated call times, diagnostic test comparison, barcode specimen tracking, access to verified reports, and an AI report assistant.
- **Doctor**: Clinical profile, consultation fees, live queue management console ("Call Next Patient", adjust delay, pause/resume), diagnostic referral issuing, and authorized patient medical report review.
- **Clinic**: Facility profile, operating hours, specialist roster scheduling, and multi-wing queue monitoring.
- **Laboratory**: Test catalog pricing, promotional discounts, specimen barcode workflow (`COLLECTED` → `IN_TRANSIT` → `RECEIVED_AT_LAB` → `ANALYZING` → `REPORT_READY`), and publishing certified PDF reports.
- **Admin**: Executive command center, provider credential verification (approving/rejecting state licenses & CLIA numbers), user account suspension/reactivation, interactive analytics charts, and security audit trail.

### 2. Real-Time Live Queue & ETA (Socket.IO)
- When a patient books an appointment for today, the system automatically registers them into the doctor's active clinical queue and assigns a digital queue token (e.g. Token #4).
- The doctor's Live Queue Console allows one-click **"Call Next Patient"** which advances the queue, marks the current patient in room, and broadcasts updates over WebSockets without any page refresh.
- If an emergency case occurs, the doctor can add clinic delay (+5m, +10m, +15m) which automatically recalculates the ETA for all waiting patients and notifies them in real time.

### 3. Diagnostic Test Marketplace & Specimen Tracking
- Patients can compare diagnostic tests across accredited laboratories side-by-side by Price, Turnaround Time (TAT) guarantee (e.g., 12h vs 24h), Specimen type, and Home Phlebotomy availability.
- Every booking generates a sample chain-of-custody tracking record with a unique barcode (e.g. `SMP-BC-908123-LPD`) and cold-chain temperature monitoring.

### 4. AI Report Assistant ("Analyze Previous Report & Find Relevant Care")
Integrated seamlessly into the **Patient → Medical Reports** module:
- Patient uploads a previous medical/diagnostic PDF or chooses from pre-loaded clinical panels (Lipid Panel, CMP, Ferritin).
- The AI extracts available test names, values, units, biological reference ranges, and impression without hallucination.
- It summarizes findings in simple, compassionate language and highlights abnormal values against the reference ranges actually present on the report.
- It identifies matching medical specialists from MediLink's database with one-click **"View Doctor → Book Appointment"**.
- It matches relevant follow-up diagnostic tests with one-click **"Compare → Book Test"**.
- Prominently displays:
  > *"AI-generated information is for educational and healthcare-navigation purposes only. It is not a diagnosis or a substitute for professional medical advice."*
- Implemented via a provider-independent adapter (`AIReportService → AIProviderAdapter`) using `@google/genai` (`gemini-3.8-flash`) with automatic fallback to a deterministic mock AI provider when no key is set.

---

## 🔑 Demo Credentials (1-Click Switcher Available in UI)

| Role | Name | Email | Password |
| :--- | :--- | :--- | :--- |
| **Patient** | Johnathan Miller | `patient@medilink.com` | `Patient@123` |
| **Doctor** | Dr. Sarah Jenkins, MD, FACC | `doctor.sarah@medilink.com` | `Doctor@123` |
| **Clinic** | Metro Health Specialist Center | `admin@metroclinic.com` | `Clinic@123` |
| **Laboratory** | Precision Diagnostics & Pathology | `manager@precisionlab.com` | `Lab@123` |
| **Admin** | MediLink Platform Admin | `admin@medilink.com` | `Admin@123` |

*Note: You can switch between any of these roles in 1 click using the "Demo Role" button in the top navigation bar!*

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide React, Recharts, Motion.
- **Backend**: Node.js, Express, TypeScript (`tsx`), Socket.IO, Multer, JSON Web Tokens (JWT), Bcryptjs, Zod.
- **Database Architecture**: Normalized Prisma schema (`prisma/schema.prisma`) and relational JSON-backed persistence store (`server/db/store.ts`).
- **AI Integration**: `@google/genai` TypeScript SDK (`gemini-3.8-flash`) with telemetry header and resilient provider-independent mock fallback.

---

## 🚀 Setup & Execution

### Development
```bash
# Install dependencies
npm install

# Start development full-stack server (Port 3000)
npm run dev
```

### Production Build & Run
```bash
# Build the Vite frontend application
npm run build

# Start production server
npm run start
```
