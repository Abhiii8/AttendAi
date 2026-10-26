<div align="center">

# 🎓 AttendAI
### Next-Generation Smart Biometric & Geofenced Attendance Platform

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-v18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-v5-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![MongoDB Atlas](https://img.shields.io/badge/MongoDB-Atlas_Cloud-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![face-api.js](https://img.shields.io/badge/Biometrics-face--api.js-FF6F00?style=for-the-badge&logo=tensorflow&logoColor=white)](https://justadudewhohacks.github.io/face-api.js/docs/index.html)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=for-the-badge)](CONTRIBUTING.md)

<p align="center">
  <b>AttendAI</b> is an enterprise-grade academic platform built to completely eradicate proxy attendance (buddy punching). <br />
  Powered by client-side deep neural networks, GPS geofencing, and rotating cryptographic tokens.
</p>

[Explore Documentation](#-system-architecture) • [Getting Started](#-installation--setup) • [Contributing Guide](#-contributing-guidelines) • [Report Bug](https://github.com/Abhiii8/AttendAi/issues)

</div>

---

## 📑 Table of Contents

- [Vision & Problem Statement](#-vision--problem-statement)
- [Key Features Matrix](#-key-features-matrix)
- [System Architecture](#-system-architecture)
- [Multi-Factor Verification Flow](#-multi-factor-verification-flow)
- [Role-Based Portals](#-role-based-portals)
- [Repository Structure](#-repository-structure)
- [Installation & Setup](#-installation--setup)
- [API Reference](#-api-reference)
- [Contributing Guidelines](#-contributing-guidelines)
- [Roadmap](#-roadmap)
- [License & Authors](#-license--authors)

---

## 💡 Vision & Problem Statement

Traditional university roll calls and static RFID badge scans suffer from three major vulnerabilities:
1. **Buddy Punching / Proxy Attendance:** Students hand badges to friends or share static QR code screenshots remotely.
2. **Administrative Time Loss:** Lecturers waste 10–15 minutes per lecture manually calling names.
3. **Data Fragmentation:** Paper logs or isolated spreadsheets make institutional analytics difficult.

> [!IMPORTANT]
> **How AttendAI Solves This:**
> AttendAI combines **4 simultaneous verification layers**:
> 1. **Live Biometric Facial Recognition** (128-dimensional Euclidean distance matching).
> 2. **GPS Geofencing** (Haversine distance calculation requiring physical presence within 100 meters).
> 3. **Dynamic Cryptographic Session Tokens** (expired after lecture window).
> 4. **Randomized 4-Digit In-Class PIN** (projected live on the whiteboard).

---

## 📊 Key Features Matrix

| Feature | Traditional Roll Call | Standard QR Systems | AttendAI Platform |
| :--- | :---: | :---: | :---: |
| **Proxy Elimination** | ❌ Easy to proxy | ❌ Screenshots shared | ✅ **100% Prevented** |
| **Verification Speed** | ⏱️ 10–15 minutes | ⚡ ~5 seconds | ⚡ **Instant (~3 seconds)** |
| **Physical Presence** | ⚠️ Unreliable | ❌ Can mark from home | ✅ **Enforced via GPS (100m)** |
| **Identity Verification**| 👁️ Manual inspection | ❌ None | 🤖 **AI Facial Embeddings** |
| **Reporting & Export** | 📄 Manual paperwork | ⚠️ Basic logs | 📊 **1-Click CSV & PDF Exports** |
| **Timetable Scheduling** | ❌ Separate systems | ❌ None | 📅 **Interactive Visual Grid** |

---

## 🏗 System Architecture

The application adopts a decoupled client-server architecture utilizing **MERN** (MongoDB, Express, React, Node.js).

```mermaid
flowchart TD
    subgraph Client [Frontend Layer - React + Vite]
        UI1[Faculty Portal]
        UI2[Student Portal]
        UI3[Admin Management Console]
        BIO[Client-Side face-api.js Engine]
        GEO[HTML5 Geolocation API]
    end

    subgraph Gateway [API Layer - Express & Node.js]
        AUTH[JWT Authentication & RBAC]
        ATT_CTRL[Attendance Controller]
        GEO_ALG[Haversine Distance Validator]
        FAC_ALG[Euclidean Distance Evaluator]
    end

    subgraph Data [Persistence Layer - MongoDB Atlas]
        U_COLL[(Users & Face Embeddings)]
        C_COLL[(Classes & Timetables)]
        A_COLL[(Attendance Sessions & Records)]
        D_COLL[(Departments & Subjects)]
    end

    Client -->|REST API over HTTPS + JWT| Gateway
    AUTH --> ATT_CTRL
    ATT_CTRL --> GEO_ALG
    ATT_CTRL --> FAC_ALG
    Gateway -->|Mongoose ODM| Data
```

---

## 🔄 Multi-Factor Verification Flow

```mermaid
sequenceDiagram
    autonumber
    actor Faculty
    actor Student
    participant Frontend as Student Device
    participant API as Backend Server
    participant DB as MongoDB Atlas

    Faculty->>API: POST /api/attendance/start (Class ID, GPS Lat/Lng)
    API->>DB: Store session with sessionToken & 4-digit PIN
    API-->>Faculty: Return Session active (Display PIN on classroom board)

    Student->>Frontend: Open "Mark Attendance"
    Frontend->>Frontend: Capture Webcam Selfie & extract 128D Face Embedding
    Frontend->>Frontend: Request Current GPS Coordinates
    Student->>Frontend: Enter 4-digit PIN shown on classroom board

    Frontend->>API: POST /api/attendance/mark (token, pin, coords, embedding)
    
    API->>DB: Retrieve session & student's registered face embedding
    API->>API: Validate PIN & Session Token
    API->>API: Calculate Geofence (Haversine formula <= 100m)
    API->>API: Calculate Biometric Match (Euclidean distance < 0.6)

    alt All Verifications Pass
        API->>DB: Update record status = "Present"
        API-->>Frontend: 200 OK (Attendance Recorded)
        Frontend-->>Student: Display Green Success Animation
    else Distance > 100m OR Face Mismatch
        API-->>Frontend: 400 Bad Request (Proxy / Spoofing Detected)
        Frontend-->>Student: Display Warning & Deny Entry
    end
```

---

## 👥 Role-Based Portals

<details>
<summary><b>🛡️ 1. Administrator Dashboard</b> (Click to expand)</summary>

* **System Overview:** Live statistical counters for total students, faculty members, registered departments, and subjects.
* **Academic Structure:** Add, edit, and organize university departments and academic courses.
* **User Provisioning:** Create faculty and student profiles with automated enrollment sequence generator (`2026001`, `2026002`, etc.).
* **Audit Logs:** Institutional visibility into attendance records across all departments.
</details>

<details>
<summary><b>👨‍🏫 2. Faculty Dashboard</b> (Click to expand)</summary>

* **Interactive Timetable:** Drag-and-drop / click-to-schedule weekly classes with room allocations.
* **1-Click Live Session:** Start a lecture session with automatic GPS geofencing radius locking.
* **Class Management:** Manage enrolled students and upload reference passport photos for facial recognition.
* **Session Analytics & Export:** View session-by-session student presence and download comprehensive CSV spreadsheets.
* **PDF Timetable Export:** Formatted high-definition print stylesheets for physical notice boards.
</details>

<details>
<summary><b>🎓 3. Student Dashboard</b> (Click to expand)</summary>

* **"Active Now" Card:** Automatically detects ongoing lectures for instant 1-click biometric check-in.
* **Webcam Face ID Scan:** Real-time AI face mesh detection with live landmark mapping.
* **Attendance History:** Chronological timeline tracking subject-wise attendance percentages with warning badges when below 75%.
</details>

---

## 🔒 Biometric Privacy & Security

> [!NOTE]
> **No Raw Photos Stored:**
> For maximum student privacy and compliance with data privacy regulations, AttendAI **never stores raw biometric photos** on the server.
>
> 1. The client's browser extracts a mathematical vector of **128 floating-point numbers** (face embedding).
> 2. Only this irreversible numeric array is saved in MongoDB.
> 3. Even in the event of a database compromise, original face photographs cannot be reconstructed from embeddings.

---

## 📁 Repository Structure

```text
Attendai/
├── backend/                  # Express REST API Server
│   ├── src/
│   │   ├── config/           # MongoDB Atlas & in-memory fallback config
│   │   ├── controllers/      # Auth, Admin, Class, and Attendance controllers
│   │   ├── middleware/       # JWT auth & RBAC route protection
│   │   ├── models/           # Mongoose schemas (User, Class, Attendance, etc.)
│   │   └── routes/           # RESTful API route definitions
│   ├── .env.example          # Environment variables template
│   ├── seed.js               # Admin account seed script
│   └── server.js             # Server entry point
├── frontend/                 # React + Vite Single Page Application
│   ├── public/               # Static assets & face-api.js neural weights
│   ├── src/
│   │   ├── assets/           # Project imagery & icons
│   │   ├── components/       # Reusable components & Glassmorphic Layout
│   │   ├── pages/            # Role-specific dashboard views & scanner
│   │   ├── services/         # Axios API communication wrappers
│   │   └── index.css         # Modern styling & animation keyframes
│   └── vite.config.js        # Vite build & network host configuration
├── docs/                     # Architectural documentation & UML specifications
├── .gitignore                # Production ignore rules (securing .env & node_modules)
├── run.bat                   # 1-Click concurrent runner for Windows
└── README.md                 # Project documentation
```

---

## 🚀 Installation & Setup

### Prerequisites
* [Node.js](https://nodejs.org/) (Version 18.0.0 or higher)
* [Git](https://git-scm.com/) installed
* A free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster (or local MongoDB)

### 1. Clone the Repository
```bash
git clone https://github.com/Abhiii8/AttendAi.git
cd AttendAi
```

### 2. Install Dependencies
```bash
# Install backend packages
cd backend
npm install

# Install frontend packages
cd ../frontend
npm install
cd ..
```

### 3. Environment Configuration
Create a `.env` file inside the `backend/` directory:

```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/attendai?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_here
```

> [!TIP]
> **MongoDB Network Access:** Make sure your current IP address is whitelisted in your **MongoDB Atlas > Security > Network Access** settings (or set to `0.0.0.0/0` for development).

### 4. Seed Default Admin Account (Optional)
```bash
cd backend
node seed.js
```

### 5. Run the Application
You can launch both the frontend and backend servers together using the Windows batch launcher:
```bash
.\run.bat
```
Or start them manually in separate terminal windows:

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

Open **`http://localhost:5173`** in your browser.

---

## 🌐 Mobile Testing (Camera & GPS)

Because laptop webcams are often stationary, testing student attendance works best on a mobile device:

1. Connect your computer and your phone to the same Wi-Fi network.
2. In your terminal, notice the **Network URL** generated by Vite (e.g. `http://192.168.1.X:5173`).
3. Open that URL on your phone's browser, grant camera and location permissions, and test live face verification!

---

## 🤝 Contributing Guidelines

We welcome contributions from the open-source community! Whether you want to fix a bug, add a new feature, or improve documentation, follow these steps:

### 1. Fork & Clone
1. Fork the project on GitHub: Click the **Fork** button at the top right of this page.
2. Clone your fork locally:
   ```bash
   git clone https://github.com/<your-username>/AttendAi.git
   cd AttendAi
   ```

### 2. Create a Feature Branch
Use descriptive branch names following standard conventions:
```bash
# For a new feature:
git checkout -b feature/dark-mode-toggle

# For a bug fix:
git checkout -b fix/camera-aspect-ratio
```

### 3. Commit Convention
Please adhere to the [Conventional Commits](https://www.conventionalcommits.org/) specification:
* `feat:` A new feature for the user
* `fix:` A bug fix
* `docs:` Documentation updates
* `refactor:` Code changes that neither fix a bug nor add a feature
* `perf:` Code changes that improve performance

Example:
```bash
git commit -m "feat(biometrics): add liveness detection blink counter"
```

### 4. Push & Open Pull Request
```bash
git push origin feature/dark-mode-toggle
```
1. Navigate to the original repository on GitHub.
2. Click **Compare & pull request**.
3. Provide a clear description of the problem solved, screenshots of UI changes, and testing steps.

---

## 🗺 Roadmap

- [x] MERN Foundation & Secure JWT RBAC
- [x] Client-side face embeddings extraction via `face-api.js`
- [x] Haversine GPS Geofencing radius validation
- [x] Interactive Faculty Timetable & PDF generator
- [x] 1-Click CSV attendance data export
- [ ] **Liveness Detection:** Blink and head-movement challenge to prevent photo spoofing.
- [ ] **Progressive Web App (PWA):** Installable offline app with push notifications when lecture starts.
- [ ] **Predictive AI Analytics:** Machine learning models forecasting at-risk students before final exams.

---

## 📜 License & Authors

Distributed under the **MIT License**. See `LICENSE` for more information.

* **Lead Maintainer:** [Abhi Patel](https://github.com/Abhiii8)
* **Organization:** AttendAI Open Source Initiative

<div align="center">
  <sub>Built with ❤️ for universities and academic institutions everywhere.</sub>
</div>
