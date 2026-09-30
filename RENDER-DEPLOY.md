# Deploying the backend on Render (free)

Architecture: **Render** = Express API (`/backend`) · **Neon** = Postgres · **Vercel** = Next.js (`/frontend`).
Deploy order: database → Render → Vercel → back to Render (set FRONTEND_ORIGIN).

## 0. Before you push to GitHub
- `backend/.env` and `frontend/.env.local` in your zip hold REAL secrets. They are git-ignored now (root `.gitignore`), but do not upload them anywhere.
- Since they were in a zip you shared, rotate any you're worried about (Cloudinary secret, Resend key, JWT_SECRET, DB password).
- Push the whole folder (`backend/`, `frontend/`, `render.yaml`, `.github/`) to one GitHub repo.

## 1. Database (Neon)
1. neon.tech → create project → copy the **direct** connection string (turn OFF "Pooled connection").
2. It looks like `postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`.
   Pooled URLs (`-pooler` in the host) break `prisma migrate deploy`.

## 2. Render
1. dashboard.render.com → **New → Blueprint** → select your repo. It reads `render.yaml`.
2. Fill in the prompted env vars:
   | Var | Value |
   |---|---|
   | DATABASE_URL | Neon direct string from step 1 |
   | FRONTEND_ORIGIN | your Vercel URL (put a placeholder like `http://localhost:3000` first, fix in step 4) |
   | CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET | from Cloudinary |
   | RESEND_API_KEY, INQUIRY_NOTIFY_TO | optional (email alerts) |
   | ADMIN_EMAIL, ADMIN_PASSWORD | your admin login (used once, step 3) |
   | TURNSTILE_SECRET_KEY, RESEND_FROM_EMAIL | optional, leave blank |
   JWT_SECRET and CRON_SECRET are auto-generated — copy CRON_SECRET from the dashboard for step 5.
3. Deploy. The build runs `npm ci` → `prisma generate` → `prisma migrate deploy` (creates all tables).
4. Check `https://<your-service>.onrender.com/api/health` → `{"status":"ok"}`.

(Manual alternative to Blueprint: New → Web Service, Root Directory `backend`, Build `npm ci && npm run build`,
Start `npm start`, Health Check Path `/api/health`, and add `NODE_ENV=production` + the vars above.)

## 3. Create the admin user (one time, from your computer)
Render's free tier has no shell, so run the seed locally against the Neon DB:
```
cd backend
npm ci
DATABASE_URL="<neon direct string>" ADMIN_EMAIL="you@example.com" ADMIN_PASSWORD="strong-password" node prisma/seedAdmin.js
```
(On Windows PowerShell set the vars with `$env:DATABASE_URL="..."` first.) Optional sample listings: `npx prisma db seed`.

## 4. Vercel
Import the repo, **Root Directory = `frontend`**, env vars:
- `NEXT_PUBLIC_API_URL` = your Render URL (no trailing slash)
- `NEXT_PUBLIC_SITE_URL` = your Vercel/custom domain
Deploy, then go back to Render → Environment → set `FRONTEND_ORIGIN` to the exact Vercel URL (no trailing slash; comma-separate a custom domain + www) → it redeploys.

## 5. Scheduled jobs (GitHub Actions, already in `.github/workflows`)
Repo → Settings → Secrets → Actions: `API_URL` = Render URL, `CRON_SECRET` = value from Render.
These pings also keep the free service from sleeping mostly; first request after idle can still take ~30–60 s.

## Troubleshooting
- Admin login works but you're logged out on refresh → `NODE_ENV=production` missing on Render, or `FRONTEND_ORIGIN` doesn't exactly match the Vercel URL.
- CORS errors → same: FRONTEND_ORIGIN mismatch (https, no trailing slash).
- Build fails at `migrate deploy` → DATABASE_URL is the pooled string or missing `?sslmode=require`.
- Images don't upload → Cloudinary vars missing.
