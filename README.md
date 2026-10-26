# 🎓 AttendAI - Smart Biometric Attendance System

AttendAI is a modern, next-generation smart attendance platform designed to completely eliminate proxy attendance and buddy punching. Built with the **MERN** stack, it combines **Deep Learning Facial Recognition**, **GPS Geofencing**, and **Dynamic Single-Use QR Codes / PINs** for seamless and secure attendance management.

---

## 🚀 Key Features

* **🤖 Deep Learning Biometrics**: In-browser facial verification powered by `face-api.js` and TensorFlow.js. Stores 128-dimensional Euclidean face embeddings to verify live selfies against enrolled student profiles.
* **📍 GPS Geofencing**: Enforces that students are physically inside the classroom (e.g. 100m radius of the instructor's device) via HTML5 Geolocation.
* **🔐 Dynamic Multi-Factor Verification**: Single-use cryptographic session tokens and randomized rotating PIN codes prevent spoofing and link-sharing.
* **👨‍🏫 Interactive Timetable & Live Sessions**: Faculty can manage weekly lecture schedules, launch live attendance sessions, and export timetables to PDF.
* **📊 Analytics & Export**: Real-time attendance rate tracking, student timeline history, and 1-click CSV reports.
* **🛡️ Role-Based Access Control (RBAC)**: Secure JWT authentication with separate role portals for **Admin**, **Faculty**, and **Students**.

---

## 🛠 Tech Stack

* **Frontend**: React (Vite), Tailwind CSS, Lucide Icons, `face-api.js`
* **Backend**: Node.js, Express.js, JWT, Bcrypt
* **Database**: MongoDB Atlas (with Mongoose ORM)

---

## 📦 Getting Started

### 1. Prerequisites
* [Node.js](https://nodejs.org/) (v18+)
* [MongoDB Atlas](https://www.mongodb.com/atlas) account or local MongoDB

### 2. Installation

Clone the repository:
```bash
git clone https://github.com/Abhiii8/AttendAi.git
cd AttendAi
```

Install dependencies for root, backend, and frontend:
```bash
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..
```

### 3. Environment Configuration

Create a `.env` file in the `backend/` directory based on `backend/.env.example`:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
```

### 4. Running the Application

You can start both backend and frontend concurrently with `run.bat` (on Windows) or manually:

**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📄 License
This project is licensed under the MIT License.
