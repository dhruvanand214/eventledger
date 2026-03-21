# EventLedger

EventLedger is a role-based event and venue operations platform for managing guest sessions from entry to billing.

In simple terms, it helps a club, event, or function run a controlled guest flow:

- entry staff create a guest session and generate a QR code
- bartenders scan the QR and add items to that guest's running tab
- exit staff scan the same QR, generate the final bill, and close the session
- owners watch live activity, revenue, sessions, and menu data
- admins create owners for different clubs or events

## What Problem It Solves

In many events and private venues, guest spending is tracked manually or across disconnected tools. That usually causes:

- slow service
- billing confusion
- weak visibility for owners
- poor coordination between entry, bar, and exit counters

EventLedger keeps all of that connected through one live workflow.

## How It Works

The app is built around a QR-based session.

1. A guest arrives at the entry desk.
2. Entry staff creates a session using the guest name.
3. The system generates a QR code for that guest.
4. Bartenders scan the QR and add menu items.
5. The running total stays attached to that session.
6. At exit, staff scan the same QR, generate the invoice, and mark the bill as paid.

This creates a simple end-to-end lifecycle for each guest.

## Roles In The System

- `admin`
  Creates owners and controls top-level access.

- `owner`
  Manages a club or event, creates staff, manages menus, and views live summaries.

- `entry`
  Creates customer sessions and prints QR codes.

- `bartender`
  Scans QR codes, handles multiple active guests, and adds menu items to their tabs.

- `exit`
  Scans active sessions, generates invoices, collects payment, and closes sessions.

## Clubs And Events

The system supports more than one club or venue.

That means:

- Club 1 has its own owner and staff
- Club 2 has a different owner and staff
- sessions, menus, and events are scoped to the correct club

It also supports two owner types:

- `one_time`
  Useful for temporary events, parties, weddings, functions, or short-run gatherings.

- `full_time`
  Useful for permanent clubs, bars, lounges, or venues operating continuously.

For one-time events, the owner can end the event and later start a new one.
For full-time venues, the owner sees daily summaries instead of temporary event closure flow.

## Main Features

- QR-based session generation
- live guest tab management
- dynamic menu categories and menu items
- CSV or text-based menu upload
- staff creation under the correct owner and club
- live owner dashboard
- invoice generation and printing
- session expiry and token-based access control
- multi-club support
- one-time and full-time venue modes

## Project Structure

This project is split into multiple services.

- `frontend`
  React app used by all roles.

- `gateway-service`
  API gateway that forwards frontend requests to backend services.

- `auth-service`
  Login, registration, user roles, club ownership, event binding, and token session control.

- `session-service`
  Creates and manages active customer sessions.

- `order-service`
  Stores menu data and order items added during a session.

- `exit-service`
  Closes sessions, stores completed history, and generates summary data.

- `dashboard-service`
  Delivers real-time events to the frontend using sockets.

## Tech Stack

- React + Vite frontend
- Node.js + Express backend services
- MongoDB Atlas for persistent data
- Redis for active sessions, auth session validation, and event pub/sub
- Socket.IO for live dashboard updates
- Railway for backend deployment
- Vercel for frontend deployment

## Running Locally

Install dependencies, then run all services together from the project root:

```bash
npm install
npm run dev
```

Each service also has its own `.env` file. Local and production values are different, so check the example env files before running.

## Deployment

Deployment notes live in:

- [DEPLOYMENT.md](D:\github\eventledger\DEPLOYMENT.md)

The short version:

- frontend goes to Vercel
- backend services go to Railway
- MongoDB lives in Atlas
- Redis is required and must be available to the backend services

## Who This Is For

EventLedger is useful for:

- clubs
- bars
- private events
- weddings
- corporate parties
- seasonal venues
- pop-up service environments

If there is a need to track guest spending with multiple staff roles and a live running bill, this system fits that workflow.

## Current Direction

The product is evolving toward a more polished multi-tenant venue platform with:

- stronger club separation
- better owner dashboards
- improved menu management
- smoother deployment flow
- cleaner production hosting setup

## License

This repository includes a [LICENSE](D:\github\eventledger\LICENSE) file.
