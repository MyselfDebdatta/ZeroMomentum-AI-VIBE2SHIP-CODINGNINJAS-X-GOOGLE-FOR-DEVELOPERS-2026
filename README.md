<div align="center">

# <img src="frontend/public/logo.png" alt="ZeroMomentum AI Logo" width="40" style="vertical-align: -8px; margin-right: 10px; border-radius: 8px;"> ZeroMomentum AI — The Deterministic Productivity Engine

**An active, multi-agent neural architecture designed to eradicate friction and mathematically enforce absolute focus.**

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TensorFlow.js](https://img.shields.io/badge/TensorFlow.js-FF6F00?style=for-the-badge&logo=tensorflow&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

[Report Bug](https://github.com/MyselfDebdatta/ZeroMomentum-AI/issues) · [Request Feature](https://github.com/MyselfDebdatta/ZeroMomentum-AI/issues)

</div>

---

**ZeroMomentum AI** is a highly interactive, space-themed productivity platform that completely reimagines how you work. Instead of relying on passive to-do lists, it acts as a ruthless, deterministic engine that actively monitors your psychological state via visual telemetry, deploys localized multi-agent intelligence, and guarantees execution. 

---

## 🏆 Hackathon Context

<div align="center">
  <img src="https://upload.wikimedia.org/wikipedia/commons/7/7b/Google_Developers_logo.svg" alt="Google for Developers" height="40" style="margin-right: 20px;">
  <span style="font-size: 24px; font-weight: bold; margin: 0 15px; color: #555;">&times;</span>
  <img src="https://www.codingninjas.com/assets-landing/images/CNLOGO.svg" alt="Coding Ninjas" height="40" style="margin-left: 20px;">
</div>

> [!NOTE]
> This platform was engineered exclusively for the **VIBE2SHIP HACKATHON / CONTEST**, a premier developer event organized by **CodingNinjas x Google for Developers 2026**.

> [!IMPORTANT]
> 👤 **Role & Authorship:** I am the **sole developer and exclusive contributor** to this project. I independently architected and engineered the entire full-stack platform from scratch—encompassing the machine vision telemetry, the multi-agent UI architecture, and the complex backend data persistence logic.
> 
> 🎯 **Objective:** The goal was to push the boundaries of browser-based AI by integrating real-time neural networks (TensorFlow.js) directly alongside a premium, highly animated (Framer Motion) user interface, delivering an "app-like" experience that solves the genuine human problem of context-switching and burnout.

---

## 🎯 Executive Overview

### 🚨 The Problem
Modern productivity is fundamentally broken. Knowledge workers are forced to juggle disparate applications for task management, calendar scheduling, habit tracking, and note-taking. This extreme context-switching severely drains cognitive bandwidth, introduces decision fatigue, and destroys the ability to maintain a 'flow state.' 

### 💡 The Solution
ZeroMomentum AI replaces passive data silos with an active, unified dashboard. It utilizes machine vision to track your physical presence and focus, mathematically enforces Pomodoro-style work blocks, and uses specialized AI agents to autonomously manage your schedule and evaluate your mental blockers.

### ✨ Tech Innovations
- **Live Visual Telemetry:** Utilizes a client-side BlazeFace TensorFlow model to track spatial coordinate geometry in real-time. It knows when you look away, lose focus, or leave your desk—and penalizes you accordingly.
- **Localized Multi-Agent Swarm:** Different AI personas (Code Engineer, Motivation Coach, Task Orchestrator) run in isolated memory buffers to assist you without crossing context streams.
- **Client-Side Privacy:** No video data is ever sent to a server. The facial telemetry is processed entirely in your local browser RAM.
- **Cinematic UI/UX:** Built with React 19, Tailwind v4, and Framer Motion to deliver a glassmorphic, space-age aesthetic with immersive micro-animations.

---

## 🧩 Core Product Modules

ZeroMomentum AI operates through a network of interconnected architectural modules:

1. **Visual Telemetry Dashboard:** The core HUD that taps into your webcam to ensure you are physically present and focused on the active task. *If you look away, the engine notices.*
2. **Deadlines & Analyzer:** Actively calculates deadline failure percentages in real-time, parsing inbox updates and executing emergency timeline recoveries.
3. **Timeblocks & Recovery:** Integrated Pomodoro engine featuring a strict 'Context Buffer'—a 5-minute cognitive reset protocol to prevent task-bleed when switching contexts.
4. **Habits Galaxy:** A 365-day spatial heatmap that visualizes your streaks and enforces daily consistency.
5. **AI Command Hub:** The central orchestrator interface where you communicate with your specialized AI agents.
6. **Communications Engine (Smart Inbox Sync):** A simulated environment where the AI parses inbound messages and autonomously converts them into actionable calendar events and deadlines.
7. **Evening Reflections:** Live psychological analysis heatmaps of your daily blockers and achievements.

---

## 🛠️ Tech Stack

| Category | Technology | Details |
| :--- | :--- | :--- |
| **Frontend Framework** | React 19 + Vite 8 | Ultra-fast rendering and modern React features. |
| **Styling & Animation** | Tailwind CSS v4 + Framer Motion | Premium glassmorphism, responsive grid layouts, and highly optimized fluid physics animations. |
| **Machine Vision** | TensorFlow.js + BlazeFace | In-browser, hardware-accelerated facial detection for flow-state tracking. |
| **State & Data** | Zustand + React Query | Global UI state management and asynchronous data fetching. |
| **Backend & DB** | Node.js + Prisma ORM + PostgreSQL | Robust API architecture ensuring that tasks, habits, and telemetry data are securely archived. |
| **3D Rendering** | Three.js + React Three Fiber | (Experimental) Rendering complex spatial data structures in the browser. |

---

## 🏗️ Architecture (High Level)
ZeroMomentum AI follows a modern Monorepo structure optimized for rapid iteration:
1. **Frontend Presentation Layer:** A highly dynamic Vite SPA that handles routing (React Router DOM), complex animations, and the TensorFlow execution loop.
2. **Backend Processing Layer:** A robust Express.js API that interfaces with Prisma. It securely handles CRUD operations for the AI Hub, Tasks, and Habit Tracking modules.
3. **Database Layer:** PostgreSQL database that acts as the single source of truth for the entire deterministic engine.

---

## 📂 Repository Structure

```
ZeroMomentum-AI/
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI elements (Modals, Sidebars, Cards)
│   │   ├── layouts/         # Structural wrappers (Dashboard Sidebar/Topbars)
│   │   ├── pages/           # Core modules (Landing, Dashboard, Habits Galaxy, etc.)
│   │   ├── store/           # Zustand global state configurations
│   │   └── main.tsx         # React application entry point
│   ├── package.json         # Frontend dependencies (TF.js, Framer, React 19)
│   └── tailwind.config.js   # Tailwind v4 theme extensions
├── backend/
│   ├── src/
│   │   ├── controllers/     # API request handlers
│   │   ├── routes/          # Express route definitions
│   │   └── server.ts        # Backend entry point
│   ├── prisma/              # Database schemas and migrations
│   └── package.json         # Backend dependencies
└── README.md                # You are here!
```

---

## ☁️ Google Cloud Deployment (Production)

The production build of ZeroMomentum AI is containerized via Docker and deployed entirely on Google Cloud infrastructure.

1. **Frontend (Vite/React)**: Hosted on **Google Cloud Run** using a custom Nginx container for blazing-fast static asset delivery and SPA routing.
2. **Backend (Node.js)**: Hosted as a separate microservice on **Google Cloud Run**, exposing port `8080` for API routing.
3. **Database**: Managed **Google Cloud SQL (PostgreSQL)** instance running in the `asia-south1` region, securely communicating with the backend via public IP auth limits.

To deploy manually via the Google Cloud CLI (`gcloud`):
```bash
# Deploy Backend
cd backend
gcloud run deploy zeromomentum-backend --source . --port 8080 --allow-unauthenticated

# Deploy Frontend
cd frontend
gcloud run deploy zeromomentum-frontend --source . --port 8080 --allow-unauthenticated
```

---

## 💻 Local Setup

Want to experience absolute focus? Follow these steps to spin up the entire architecture locally.

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [PostgreSQL](https://www.postgresql.org/) (Running on `localhost:5432`)
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/MyselfDebdatta/ZeroMomentum-AI.git
cd ZeroMomentum-AI
```

### 2. Backend Initialization
```bash
cd backend
npm install
```
*Make sure your local PostgreSQL server is running.* Add your `.env` file with your `DATABASE_URL`, then push the schema:
```bash
npx prisma db push
npm run dev
```
*The backend will boot up on `localhost:5000`.*

### 3. Frontend Initialization
Open a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
*The cinematic UI will boot up on `http://localhost:5173`. Ensure your webcam is enabled to test the Visual Telemetry features!*

---

## 🔒 Security & Privacy Notes
- **Zero Cloud Video:** The BlazeFace machine vision model runs entirely in your browser using WebGL. The system calculates spatial math, logs the telemetry point, and instantly discards the frame. Your video feed never touches a server.
- **Isolated AI Contexts:** To prevent hallucination and data leakage, AI agents are sandboxed into their respective modules.

---

## 📜 License
This project is licensed under the [MIT License](LICENSE). Copyright (c) 2026 Debdatta Panda

## 👨💻 Author
**Debdatta Panda**  
LinkedIn: [https://www.linkedin.com/in/debdatta-panda-dp11](https://www.linkedin.com/in/debdatta-panda-dp11)  
GitHub: [@MyselfDebdatta](https://github.com/MyselfDebdatta)  

<div align="center">
  <i>"Friction is eliminated. Momentum is inevitable."</i>
</div>
