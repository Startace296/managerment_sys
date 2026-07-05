# Frontend — HR Management

React 18 + TypeScript + Vite + Tailwind CSS v4 + Motion (the new framer-motion).
Matches the `managerment_sys/backend` backend 100% (Express + TypeORM, `/api/v1`).

## Run

```bash
# 1. Start the backend first on port 3000
cd backend && npm run dev

# 2. Frontend
cd frontend
npm install
npm run dev
# -> http://localhost:5173
```

Vite is already configured with a proxy `/api` → `http://localhost:3000` in
`vite.config.ts`, so **no CORS setup needed** and no `.env` file for the
frontend. If the backend runs on a different port, update `target` in
`vite.config.ts`.

## Quick test flow

1. **Register** the first account — the system automatically assigns the
   `admin` role to the first user in the DB, every user after that is always
   `employee` (role selection was removed from registration to close the
   self-promotion-to-admin hole).
2. **Sign in** → Dashboard (numbers come from `GET /dashboard/stats`,
   computed over the full dataset, not capped at 100 records).
3. **Departments** tab: create a few departments (only admins can
   create/edit/delete).
4. **Register** another account (defaults to role `employee`).
5. **Employees** tab → "Add employee", pick an account from the dropdown
   (list comes from `GET /users/available` — only shows accounts without a
   profile yet) + employee code + salary + date of birth/hire date, pick a
   department.
6. Test **search / status filter / pagination** on both tabs.
7. In the employee edit modal, an admin can change the **account role**
   (employee/manager/admin) via `PATCH /users/:id/role`.
8. Sign in with an `employee` account → the add/edit/delete buttons hide
   automatically (matches the backend's `authorize` middleware).

## Already included

- **Full auth**: access + refresh tokens, automatically calls `/auth/refresh`
  when the access token expires (401) then retries the request — multiple
  concurrent 401s only trigger a single refresh. Session restored via
  `/auth/me` on reload.
- **Role-based UI**: employee is read-only; manager can add/edit employees;
  admin additionally gets delete + department CRUD.
- **Toast** notifications for every request, surfacing the exact Zod error
  message from the backend.
- **Motion**: page transitions, staggered table rows, spring modal, sliding
  nav pill (layoutId), animated progress bars, ambient blobs on the login
  page.
- 350ms debounce while typing in search boxes, VND currency formatting,
  localized date formatting.

## Structure

```
src/
├── lib/          # api.ts (axios + refresh interceptor), types.ts
├── context/      # AuthContext
├── components/   # Layout (sidebar), Toast, ui.tsx (Button/Modal/Badge/...)
└── pages/        # AuthPage, Dashboard, Employees, Departments
```

## Also completed

- `GET /users/available` (admin/manager) so the "Add employee" form can pick
  a user from a dropdown instead of typing an ID by hand.
- `GET /dashboard/stats` so the Dashboard doesn't have to pull 100 employees
  and aggregate them client-side.
- `PATCH /users/:id/role` (admin) to change an account's role, replacing
  self-selected role at registration.
- Blocked the client from sending `role` at register time: the first user is
  automatically admin, every user after that is always employee.
