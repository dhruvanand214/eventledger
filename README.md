# EventLedger

> **Role-based venue & event management platform** — QR-based guest sessions, live dashboards, multi-tenant support, and end-to-end billing.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-eventledger.vercel.app-22c55e?style=flat)](https://eventledger.vercel.app)
![Tech](https://img.shields.io/badge/Stack-MERN%20%2B%20Redis%20%2B%20Microservices-3B82F6?style=flat)

---

## What it solves

In most clubs and private events, guest spending is tracked manually or across disconnected tools — causing slow service, billing confusion, and zero visibility for owners.

EventLedger replaces that with a **single connected workflow**: a guest arrives, gets a QR code, every order is tracked against that QR in real time, and the bill is generated and closed at exit. Owners watch it all happen live on a dashboard.

---

## Architecture

This system is split into **6 independent microservices** behind an API gateway:

```
                        ┌─────────────────┐
                        │   React Client  │
                        └────────┬────────┘
                                 │
                        ┌────────▼────────┐
                        │  Gateway Service │  ← Routes all client requests
                        └────────┬────────┘
          ┌──────────────────────┼──────────────────────┐
          │              │       │         │             │
    ┌─────▼──┐   ┌───────▼─┐ ┌──▼──────┐ ┌▼────────┐ ┌─▼──────────┐
    │  Auth  │   │ Session │ │  Order  │ │  Exit   │ │ Dashboard  │
    │Service │   │ Service │ │ Service │ │ Service │ │  Service   │
    └────────┘   └─────────┘ └─────────┘ └─────────┘ └────────────┘
         │                                                   │
    ┌────▼────┐                                    ┌─────────▼──────┐
    │  Redis  │ ← Session store + pub/sub          │   Socket.IO    │ ← Live events
    └─────────┘                                    └────────────────┘
         │
    ┌────▼──────┐
    │  MongoDB  │ ← Persistent data (Atlas)
    └───────────┘
```

| Service | Responsibility |
|---|---|
| `gateway-service` | Reverse proxy — routes frontend requests to backend services |
| `auth-service` | Login, roles, club ownership, event binding, JWT + Redis token sessions |
| `session-service` | Creates and manages active guest sessions with QR codes |
| `order-service` | Menu data and order items attached to sessions |
| `exit-service` | Closes sessions, stores history, generates invoice summaries |
| `dashboard-service` | Delivers real-time events to the frontend via Socket.IO |

---

## Key Features

- ⚡ **QR-based guest session engine** — entry staff generate a QR; bartenders and exit staff scan the same QR
- 🔴 **Live owner dashboard** — real-time revenue, active sessions, and order data via Socket.IO
- 👥 **Multi-role access control** — admin · owner · entry · bartender · exit (JWT + Redis)
- 🏢 **Multi-tenant** — multiple clubs/venues, each fully isolated with their own staff and menus
- 📋 **Dynamic menu management** — categories, items, CSV/text upload
- 🧾 **Invoice generation and printing** — full billing lifecycle per guest
- 🔐 **Token-based session expiry** — Redis-backed auth session validation

---

## Role Flow

```
Admin
  └── Creates Owners (one per club/venue)

Owner
  └── Creates Staff · Manages Menu · Views Live Dashboard

Entry Staff
  └── Creates guest session → System generates QR code

Bartender
  └── Scans QR → Adds menu items → Running tab updates live

Exit Staff
  └── Scans QR → Generates invoice → Marks bill paid → Closes session
```

---

## Performance Highlights

| Metric | Before | After | How |
|---|---|---|---|
| Search query latency | 1.2s | **< 200ms** | Compound MongoDB indexes + pipeline rewrite |
| Auth overhead | Session polling | **Real-time** | Redis pub/sub + Socket.IO |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| Backend | Node.js + Express (per service) |
| Database | MongoDB Atlas |
| Cache / Sessions | Redis |
| Real-time | Socket.IO |
| Auth | JWT + Redis token validation |
| Deployment | Railway (backend) · Vercel (frontend) |

---

## Running Locally

```bash
# Install all dependencies from project root
npm install

# Start all services concurrently
npm run dev
```

Each service has its own `.env` file. Check the example env files before running — local and production values differ.

---

## Deployment

- **Frontend** → Vercel
- **Backend services** → Railway (each service deployed independently)
- **Database** → MongoDB Atlas
- **Redis** → Required and must be reachable by all backend services

---

## Who this is for

Clubs · Bars · Private events · Weddings · Corporate parties · Pop-up venues · Seasonal events

Any environment where multiple staff roles need to coordinate guest billing in real time.