# Getting this running

## 1. Create a Supabase project
https://supabase.com/dashboard → New project. Free tier is enough to start.

## 2. Run the database setup
In the Supabase dashboard: **SQL Editor → New query**.
1. Paste and run `supabase/schema.sql` (tables, security policies).
2. Paste and run `supabase/seed.sql` (loads your starting product catalog
   and hatchery batches — the data that used to be hardcoded in the app).

## 3. Create your admin login
**Authentication → Users → Add user** — set an email + password for
yourself (and anyone else who should manage the store).

Then, back in **SQL Editor**, grant that account admin rights:
```sql
insert into public.admin_users (id, full_name)
select id, 'Your Name' from auth.users where email = 'you@example.com';
```
Without this step, that login can sign in but the app will reject it as
"not authorized for admin access" — that's intentional, it's what stops
a random signup from getting into the dashboard.

## 4. Connect the app to your project
Project Settings → API gives you two values you need:
- Project URL
- `anon` `public` key

Copy `.env.example` to `.env.local` and fill them in:
```
VITE_SUPABASE_URL="https://xxxxxxxx.supabase.co"
VITE_SUPABASE_ANON_KEY="ey..."
```

## 5. Install and run
```
npm install
npm run dev
```

## 6. Where things are
- **Storefront**: the normal site — customers never see any admin link.
- **Admin dashboard**: `yoursite.com/#/admin` — bookmark this for staff.
  It is not linked from anywhere in the customer-facing UI on purpose.
- **Bank transfer details** (`src/data/initialData.ts`): left as plain
  hardcoded config, as requested — this is a single local distributor,
  not a multi-tenant app, so there's no reason to put it in a database.

## What changed from the original zip
- Product catalog, orders, hatchery batches, and stock-alert subscriptions
  now live in Supabase instead of the browser's localStorage — so every
  device sees the same live data, and clearing your browser no longer
  wipes your store.
- Admin login used to accept the literal passcode `shamon123` (or even
  just `admin`) as a fallback, and that fallback fired *every time*
  because the app was calling a `/api/admin/login` endpoint that didn't
  exist. That's replaced with real Supabase Auth + an explicit
  `admin_users` allow-list.
- ~16 other admin actions (restock, price edits, approve/cancel orders,
  broadcast, bank details) were quietly calling other nonexistent
  `/api/admin/*` endpoints with a hardcoded `Bearer shamon123` token.
  Removed; those actions now write straight to Supabase.
- Removed four unused legacy components that duplicated the real
  booking/tracking/registration flows and carried the same hardcoded
  fake-API pattern (they weren't reachable by users, but they were dead
  weight with the same problem).
- Fixed a pre-existing bug where `Header.tsx`'s props didn't match what
  `App.tsx` was actually passing it (unrelated to this request, but the
  app wouldn't have compiled correctly).
- Removed the unused `@google/genai` / Express / dotenv dependencies that
  were leftover AI Studio boilerplate never actually used by the app.

## Known gaps / next steps
- **Broadcast messaging** (Admin → Broadcast tab) records the message but
  does not actually send email/SMS/WhatsApp — that never worked in the
  original either (it also called a nonexistent endpoint). Wiring real
  delivery needs an email/SMS provider behind a Supabase Edge Function.
- **Bank details editing** in the admin dashboard is session-only (by
  design, since the bank account is static config per your instructions).
  To change it permanently, edit `DEPOT_INFO` in `src/data/initialData.ts`
  and redeploy.
- **Product images**: seeded from `public/product-images/` (moved there from
  the old bundled JS imports) — stable paths like `/product-images/doc-noiler.jpg`.
  To swap a photo, drop a new file into that folder and update the product's
  `image_url` (in `supabase/seed.sql` or via the Admin Portal), or move to a
  Supabase Storage bucket if you want non-developers to upload photos directly.
- I wasn't able to run `npm install` / `npm run build` in this sandbox
  (no network access here), so please run a build locally before
  deploying to catch anything I couldn't verify:
  ```
  npm install
  npx tsc --noEmit
  npm run build
  ```
