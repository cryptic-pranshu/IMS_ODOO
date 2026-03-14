# Core Inventory Management System (IMS)

A professional, high-fidelity Full-Stack Inventory Management System inspired by Odoo, featuring a modern "Midnight Dark" Enterprise UI. This system is designed to digitize and streamline all stock-related operations, replacing manual tracking with a centralized, real-time solution.

## 🌟 Key Features

- **Dashboard KPIs**: Real-time snapshots of Total Products, Low Stock, Pending Receipts, and Pending Deliveries.
- **Core Operations**: 
  - **Receipts**: Validate incoming stock from vendors to automatically increase inventory levels.
  - **Delivery Orders**: Process outgoing shipments to customers with automatic stock reduction.
  - **Internal Transfers**: Log and track stock movements between warehouses (e.g., Warehouse 1 to Warehouse 2).
  - **Adjustments**: Manually sync physical counts with system records.
- **Stock Ledger**: A comprehensive, immutable log of every movement (Incoming, Outgoing, and Internal).
- **Product Management**: Support for SKUs, Categories, and Unit of Measure tracking.

## 🛠️ Tech Stack

- **Frontend**: React, Vite, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui (Midnight Dark Theme)
- **Database**: PostgreSQL (Local/Docker)
- **Deployment**: Vercel

## 🚀 Local Development

### Prerequisites

- Node.js & npm installed
- PostgreSQL database (Local or Docker)

### Setup

1. **Clone the repository:**
   ```sh
   git clone [https://github.com/cryptic-pranshu/IMS_ODOO.git](https://github.com/cryptic-pranshu/IMS_ODOO.git)
   cd IMS_ODOO
