# 🏡 Fractional Land Ownership dApp (Powered by Arweave AO)

This project demonstrates a simple decentralized application (dApp) for **fractional land ownership**.  
It uses a **React + Vite frontend** and a **Node.js backend (simulated AO agent)** for managing land registration, share distribution, and buying/selling land shares.

Future versions can connect directly to **Arweave AO** for full decentralization.

---

## ✨ What is Fractional Land Ownership?

In real life, buying a full property can be very expensive.  
**Fractional ownership** means **splitting one property** into many small parts called **shares**.

- Each person can buy 1 or more shares.
- Multiple owners together share the ownership of the same land.
- Owners can transfer, sell, or earn rental income from their shares.

In this project:
- A **land parcel** is divided into **multiple shares** (e.g., 100 shares).
- Each share can be owned by a different person.
- Buying a share gives you partial ownership of that land.

---

## 🛠️ How This Project Works

### 🏢 Backend (Simulated AO Agent)

- Built using **Node.js + Express**.
- Manages **land registration**, **share ownership**, and **purchase logic**.
- Runs on `http://localhost:5000`.

**Core APIs:**
| Endpoint | Action |
|:---|:---|
| POST `/register` | Register a new land with total shares |
| POST `/buy` | Buy a share of a specific land |
| GET `/land/:landId` | View details of a land and its shares |

---

### 🖥️ Frontend (React + Vite)

- User-friendly interface to interact with the backend.
- Allows users to:
  - **Register New Land**
  - **View Available Lands**
  - **Buy Land Shares**
  - **View Their Owned Shares**

- Runs on `http://localhost:5173`.

---

## ⚡ How Fractional Ownership Happens (Flow)

1. **Land Owner** registers a new land:
   - Provides land ID (e.g., "land-123")
   - Provides location (e.g., "Mumbai")
   - Decides how many total shares (e.g., 100 shares)

2. **System splits** the land into shares:
   - Share IDs like `share-1`, `share-2`, ..., `share-100` are created.
   - Initially, all shares are **unowned** (no buyer yet).

3. **Users** visit the marketplace:
   - They can **buy available shares**.
   - Once bought, their wallet address (or user ID) is saved as the share's owner.

4. **Share Ownership Records**:
   - Stored by the backend server (in-memory for now).
   - Later, it can be permanently stored on **Arweave** and managed by real **AO Agents**.

---

## 🧱 Project Structure

| Folder/File | Purpose |
|:---|:---|
| `fractional-land-frontend/` | React Frontend (Vite, TypeScript) |
| `fractional-land-agent/` | Node.js Backend (Simulated AO Agent) |

---

## 🚀 How to Run Locally

### 1. Start Backend (AO Agent Server)

```bash
cd fractional-land-agent
npm install
node index.js

