# SHAMONS Poultry & Feeds — Kaltungo, Gombe State

A booking & ordering app for a local poultry/feed distributor. Customers browse
stock, book day-old chicks / birds / feed, and pay by bank transfer. Staff
manage stock, prices, and orders from a separate, non-public admin portal.

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS
- Supabase (Postgres + Auth) — product catalog, orders, stock alerts, and
  hatchery batches all live here; admin sign-in uses Supabase Auth

## First-time setup

### 1. Create a Supabase project

Go to [supabase.com](https://supabase.com), create a new project, and note
its **Project URL** and **anon public key** (Project Settings → API).

### 2. Load the database schema

In the Supabase dashboard, open **SQL Editor → New query**, paste in the
contents of [`supabase/schema.sql`](./supabase/schema.sql), and run it. This
creates the `products`, `orders`, `hatchery_batches`, and
`alert_subscriptions` tables with Row Level Security policies already
configured — customers can browse stock and place orders, but only admins can
read the full order list or change prices/stock.

Then run [`supabase/seed.sql`](./supabase/seed.sql) the same way to load the
starting product catalog and hatchery batches.

### 3. Create your admin account

In the Supabase dashboard: **Authentication → Users → Add user**, set an
email and password. Then, back in the SQL Editor, run:

```sql
insert into public.admin_users (id, full_name)
select id, 'Depot Admin' from auth.users where email = 'you@example.com';
```

(swap in the email you used). This is what actually grants admin rights —
having a login alone isn't enough, which is intentional.

### 4. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from step 1.

### 5. Install and run

```bash
npm install
npm run dev
```

## Admin access

The admin portal is **not linked from the storefront**. Staff sign in at:

```
https://your-deployed-domain.com/#/admin
```

(or `http://localhost:3000/#/admin` locally). Bookmark this — customers have
no way to discover or reach it from the regular site.

## Bank / payment details

Depot contact info and bank transfer details in `src/data/initialData.ts`
(`DEPOT_INFO`) are intentionally hardcoded rather than admin-editable — this
is a single local distributor, not a multi-tenant platform, so these are
effectively static configuration. Update that file directly and redeploy if
they change.

## Known limitations / next steps

- **Bulk broadcast** (Price Manager → Broadcast tab) records a message
  locally but does not yet send real email/SMS/WhatsApp — that needs a
  delivery provider wired up (e.g. a Supabase Edge Function calling an
  email/SMS API).
- **Product images** are seeded as empty; upload photos via Supabase Storage
  and set each product's `image_url`.
- No automated tests yet.

---

## This version: clean "Overview" dashboard

This is a variant of the base app with one addition: a new **Overview** tab
in the Admin Portal (now the default tab on login) — a clean, minimal
dashboard styled after a card-based analytics UI:

- 4 stat cards (Total Revenue, Orders, New Customers, Cancellation Rate),
  each with a soft-colored icon badge and a real week-over-week % change pill
- A weekly sales bar chart for the last 7 days

All numbers are computed live from real order/customer data in Supabase
(last 7 days vs. the 7 days before that) — nothing here is hardcoded or
placeholder.

## Customer-facing storefront, also cleaned up

The storefront (Header, Hero/welcome section, product catalog, product
cards) got the same treatment:

- Dropped the dark emerald gradient hero for a clean white welcome section
  with a greeting, quick-action buttons, and pastel-icon highlight cards
- Lightened the header's top bar and removed heavy dark accents
- Softened the category filter pills and swapped the dark "trust banner" at
  the bottom of the catalog for a light card
- Lightened product card badges/overlays to match

All functionality (cart, checkout, tracking, alerts) is unchanged — this is
a visual pass only.

Everything else (schema, security, other admin tabs) is
identical to the base version — see `SUPABASE_SETUP.md` for setup, it
applies the same way here.
