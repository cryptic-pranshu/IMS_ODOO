# IMS Pro - Inventory Management System

**IMS Pro** is a high-performance, Full-Stack Inventory Management System (IMS) inspired by enterprise solutions like Odoo. It provides a centralized platform for real-time stock/receipts tracking, automated warehouse operations, and data-driven inventory intelligence.
This project solves a problem statement that we were given at our first Odoo-organized hackathon.
---

## 🚀 Live Demonstration

Experience the live system here: [IMS-ODOO](https://odooims.vercel.app/)

![IMS LIVE-VIEW](IMS-LIVE.png)
---

## 🌟 Key Features

### 📊 Intelligence Dashboard

* **Live KPI Cards**: Real-time tracking of Total Stock units, Low Stock alerts, and pending warehouse operations.
* **Animated Trend Graphs**: "DNA-wave" style visualization of Inbound vs. Outbound movements over a 7-day period using Recharts.
* **Live Activity Feed**: Immediate visibility into the most recent stock ledger entries directly from the database.

### 📦 Warehouse Operations

* **Automated Receipts**: Validate vendor shipments to instantly update inventory levels and log audit trails.
* **Delivery Orders**: Streamline customer shipments with automatic stock reduction upon validation.
* **Internal Transfers**: Track movement between locations (e.g., Warehouse A to Rack B) with full traceability.
* **Inventory Adjustments**: Manual override capabilities to sync physical stock counts with digital records.

### 🔐 Enterprise Architecture

* **Immutable Stock Ledger**: Every movement is recorded in a permanent ledger, ensuring a 100% accurate audit trail.
* **Session Persistence**: Custom Auth Guard logic using LocalStorage to maintain user sessions across browser refreshes.
* **Database Synchronization**: Powered by Neon PostgreSQL for low-latency, relational data management.

---

## 🛠️ Tech Stack

* **Frontend**: React 18, Vite, TypeScript, Tailwind CSS.
* **UI Components**: shadcn/ui, Lucide React (Icons), Recharts (Data Viz).
* **Backend**: Node.js, Express.js (Serverless Architecture).
* **Database**: PostgreSQL (Neon.tech) with `pg` connection pooling.
* **State Management**: Zustand with Persistence Middleware.

---

## 🚀 Installation & Setup

### 1. Prerequisites

* Node.js (v18+) & npm installed.
* A PostgreSQL database (Local or Neon.tech).

### 2. Clone & Install

```bash
git clone https://github.com/cryptic-pranshu/IMS_ODOO.git
cd IMS_ODOO
npm install

```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```env
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
PORT=3000

```

### 4. Running the Project

The system requires both the frontend and the backend server to be active.

**Start Backend Server (Port 3000):**

```bash
node server.cjs

```

**Start Frontend Development (New Terminal):**

```bash
npm run dev

```

---

## 📁 Project Structure

* `/src/pages`: UI Views (Dashboard, Products, Warehouse).
* `/src/stores`: Zustand state logic and Auth persistence.
* `server.cjs`: Express entry point for serverless functions.
* `kpiRoutes.cjs`: API endpoints for live data fetching.
* `db.cjs`: PostgreSQL connection and pooling logic.
* `vercel.json`: Deployment configuration for full-stack hosting.

**Thanks for reading, and going through the project, have a great day...!**
