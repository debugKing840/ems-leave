# EMS Leave Management System

A full-featured Employee Leave Management System built with **Next.js** and **Supabase**.

## Features

- Login and role-based access control
- Employee creation by role hierarchy
- Leave application form with working-day counter (weekends excluded)
- **My Leave Requests** — view your history, cancel pending requests
- Supervisor / Manager / HR approvals with comments
- **Dashboard leave balance cards** — see your remaining days at a glance
- Approved leave calendar
- Leave reports
- Leave type settings (HR/admin)
- Supabase database schema with row-level security, triggers, and leave balances

## Roles

| Role | Can create | Can approve |
|------|-----------|-------------|
| `super_admin` | manager, hr | all levels |
| `manager` | supervisor, staff | supervisor level |
| `hr` | supervisor, staff | final approval |
| `supervisor` | staff | first-level |
| `staff` | — | — |

---

## 1. Install dependencies

```bash
npm install
```

## 2. Create a Supabase project

Go to [supabase.com](https://supabase.com), create a new project, then copy your credentials:

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

## 3. Run the database schema

In Supabase → **SQL Editor**, paste and run the contents of:

```
supabase/schema.sql
```

This creates all tables, enums, RLS policies, triggers, and seeds default leave types.

## 4. Create the first Super Admin

1. In Supabase → **Authentication → Users**, manually add a user (email + password).
2. Back in the SQL Editor, run:

```sql
select public.bootstrap_super_admin('your-email@example.com');
```

## 5. Run locally

```bash
npm run dev
```

Open **http://localhost:3000** — you'll be redirected to `/login`.

---

## Main Pages

| Page | Path | Who can see |
|------|------|-------------|
| Login | `/login` | Everyone |
| Dashboard | `/dashboard` | Everyone (shows your leave balances) |
| Apply Leave | `/leave/apply` | Everyone |
| My Requests | `/leave/my-requests` | Everyone (cancel pending requests here) |
| Approvals | `/leave/approvals` | Supervisors, Managers, HR, Super Admin |
| Calendar | `/leave/calendar` | Everyone |
| Reports | `/leave/reports` | Managers, HR, Super Admin |
| Employees | `/employees` | Everyone (creation restricted by role) |
| Leave Types | `/settings/leave-types` | HR, Super Admin |

---

## Recommended next upgrades

- [ ] Email notifications after submission / approval
- [ ] Public holiday exclusion from working-day counter
- [ ] Document upload for sick / maternity / paternity leave
- [ ] PDF or Excel export of reports
- [ ] Department-scoped approval routing
- [ ] Annual leave balance auto-reset via cron / Edge Function
