# Zee Zafra Properties

Personal real estate brand site — two independently deployed apps:

- `backend/` — Node.js + Express + Prisma → PostgreSQL, deployed on Render
- `frontend/` — Next.js (App Router) + Tailwind CSS, deployed on Vercel

The frontend only ever talks to the backend through `NEXT_PUBLIC_API_URL`.
Never hardcode the Render URL into frontend code.

## Phase 1 — Foundation

Both apps exist, deploy successfully, and can talk to each other via one
`GET /api/health` route.

See `references/roadmap.md` in the skill (or ask Claude) for what Phase 2
onward adds.
