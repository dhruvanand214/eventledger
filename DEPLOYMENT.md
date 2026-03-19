# EventLedger Deployment

## Architecture

- `frontend` -> Vercel
- `gateway-service` -> Railway Service
- `auth-service` -> Railway Service
- `session-service` -> Railway Service
- `order-service` -> Railway Service
- `exit-service` -> Railway Service
- `dashboard-service` -> Railway Service
- MongoDB -> MongoDB Atlas
- Redis -> Upstash / Redis Cloud / Railway Redis if available in your plan

MongoDB Atlas alone is not enough for this project. Redis is required for:

- auth token session validation
- active session storage
- pub/sub events for dashboard updates

## Environment Files

Use these templates:

- `frontend/.env.production.example`
- `gateway-service/.env.example`
- `auth-service/.env.example`
- `session-service/.env.example`
- `order-service/.env.example`
- `exit-service/.env.example`
- `dashboard-service/.env.example`

## Deploy Order

1. Create a MongoDB Atlas cluster.
2. Create one database user and whitelist Railway egress or allow access from anywhere for initial setup.
3. Copy the Atlas connection string into `MONGO_URI` for `auth-service`, `session-service`, `order-service`, and `exit-service`.
4. Create a managed Redis instance.
5. Copy the Redis connection string into `REDIS_URL` for `auth-service`, `session-service`, `order-service`, `exit-service`, and `dashboard-service`.
6. Generate one strong `JWT_SECRET` and use the exact same value in `auth-service`, `session-service`, `order-service`, and `exit-service`.
7. Deploy backend services on Railway first.
8. Deploy frontend on Vercel after Railway URLs are stable.

## Railway Services

Create 6 separate services from the same repo.

### `auth-service`

- Root Directory: `auth-service`
- Build Command: `npm install`
- Start Command: `npm start`
- Public Networking: enabled
- Environment:
  - `PORT=5001`
  - `MONGO_URI=...`
  - `JWT_SECRET=...`
  - `REDIS_URL=...`
  - `ADMIN_NAME=System Admin`
  - `ADMIN_EMAIL=admin@example.com`
  - `ADMIN_PASSWORD=Admin@123`

### `session-service`

- Root Directory: `session-service`
- Build Command: `npm install`
- Start Command: `npm start`
- Public Networking: enabled
- Environment:
  - `PORT=5002`
  - `MONGO_URI=...`
  - `JWT_SECRET=...`
  - `SESSION_TTL=43200`
  - `REDIS_URL=...`

### `order-service`

- Root Directory: `order-service`
- Build Command: `npm install`
- Start Command: `npm start`
- Public Networking: enabled
- Environment:
  - `PORT=5003`
  - `MONGO_URI=...`
  - `JWT_SECRET=...`
  - `REDIS_URL=...`

### `exit-service`

- Root Directory: `exit-service`
- Build Command: `npm install`
- Start Command: `npm start`
- Public Networking: enabled
- Environment:
  - `PORT=5004`
  - `MONGO_URI=...`
  - `JWT_SECRET=...`
  - `REDIS_URL=...`

### `dashboard-service`

- Root Directory: `dashboard-service`
- Build Command: `npm install`
- Start Command: `npm start`
- Public Networking: enabled
- Environment:
  - `PORT=5005`
  - `REDIS_URL=...`

### `gateway-service`

- Root Directory: `gateway-service`
- Build Command: `npm install`
- Start Command: `npm start`
- Public Networking: enabled
- Environment:
  - `PORT=5000`
  - `AUTH_SERVICE=https://your-auth-service.up.railway.app`
  - `SESSION_SERVICE=https://your-session-service.up.railway.app`
  - `ORDER_SERVICE=https://your-order-service.up.railway.app`
  - `EXIT_SERVICE=https://your-exit-service.up.railway.app`

## Vercel Frontend

Create one Vercel project with:

- Root Directory: `frontend`
- Framework: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`

Vercel environment variables:

- `VITE_API_URL=https://your-gateway-service.up.railway.app/api`
- `VITE_DASHBOARD_URL=https://your-dashboard-service.up.railway.app`

## After Deploy

1. Open the Railway `auth-service` shell or run locally against production DB.
2. Seed the admin user:

```bash
npm run seed-admin --prefix auth-service
```

This command uses:

- `MONGO_URI`
- `ADMIN_NAME`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

## Health Checks

Verify these URLs after deployment:

- `https://your-auth-service.up.railway.app/health`
- `https://your-session-service.up.railway.app/health`
- `https://your-order-service.up.railway.app/health`
- `https://your-exit-service.up.railway.app/health`
- `https://your-dashboard-service.up.railway.app/health`
- `https://your-gateway-service.up.railway.app/health`

## Notes

- Railway deployments use generated public domains; copy the final domain for each service into gateway and Vercel env vars.
- Socket.io client now reads `VITE_DASHBOARD_URL`; keep that URL public and stable.
- Frontend now reads `VITE_API_URL`; do not leave it pointed at localhost in production.
- If your Redis provider gives only host and port, you can still use `REDIS_HOST` and `REDIS_PORT`, but `REDIS_URL` is the preferred production setup.
