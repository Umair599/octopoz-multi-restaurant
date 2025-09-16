# Multi-Restaurant Starter (local)

## Prereqs

- Node 18+
- npm

## Backend

1. `cd backend`
2. `npm install`
3. Copy `.env.example` to `.env` and adjust if needed
4. Run migrations: `npm run migrate`
5. Seed demo data: `npm run seed`
6. Start backend: `npm run start`

Backend runs at `http://localhost:4000`

Default users created by seed:

- super: email `super@octopoz.example`, password `password`
- restaurant admin: `admin@demo.example`, password `password`

## Frontend

1. `cd frontend`
2. `npm install`
3. `npm run dev`

Open `http://localhost:5173`.

Login with the demo accounts above.

---

## Notes & Next steps

- This starter intentionally uses SQLite + local uploads for ease of running. For production:
- Switch DB to Postgres (update knexfile)
- Use S3 for file storage and presigned URLs
- Harden auth (refresh tokens, httpOnly cookies)
- Add tests, CI, RBAC checks, RLS, and monitoring

Enjoy — this is a functional baseline to extend into a production-ready multi-tenant system.
