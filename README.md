# Travel Agent Demo — Dynamic Flight Ticketing

Public demo for a travel-agent consultancy: simulated flight inventory with **rule-based dynamic pricing** in AUD. Prices rise with recent demand and low remaining seats. Checkout locks a quote for 15 minutes.

## Stack

- Next.js (App Router) + TypeScript + Tailwind
- Prisma 7 + PostgreSQL
- Zod validation
- Deploy target: Railway (web service + Postgres). No Docker required for deploy.

## Setup

1. Copy env file and set values:

```bash
cp .env.example .env
```

2. Set `DATABASE_URL` to your Postgres connection string (Railway Postgres or any Postgres).
3. Set `ADMIN_PASSWORD` for `/admin`.

4. Install and prepare the database:

```bash
npm install
npx prisma migrate deploy
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Useful scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Local Next.js server |
| `npm run db:seed` | Reseed flights + default PricingConfig |
| `npm run db:deploy` | Apply migrations (`prisma migrate deploy`) |
| `npm run db:studio` | Prisma Studio |

## How pricing works

Pricing is **automatic**. Admins only set each flight’s **base ticket price** in AUD.

```text
displayPrice = clamp(
  basePrice × (1 + 8% agency fee) × demandMultiplier × scarcityMultiplier,
  basePrice,
  basePrice × (1 + 25% max)
)
```

- **Demand** (last 45 min): views, holds, and purchases raise price
- **Scarcity**: fewer seats left raises price
- Customers search **one way** or **round trip**; round-trip totals both live legs
- Money is stored as integer cents; UI formats AUD

### Admin

- Add / edit flights (route, times, seats, base price)
- Hide/show flights
- View bookings
- No pricing-math config — the system adjusts fares automatically

## Demo routes to try

Seeded examples (dates are relative to seed time — pick a date within ~2 weeks):

- `SYD` → `MEL`
- `MEL` → `BNE`
- `SYD` → `SIN`
- `MEL` → `LAX`

## Railway deploy

1. Create a Railway project.
2. Add a **PostgreSQL** plugin.
3. Add a **Web** service from this GitHub repo.
4. Set variables on the web service:
   - `DATABASE_URL` — from the Postgres plugin
   - `ADMIN_PASSWORD` — choose a strong password
5. Set the release / deploy command to run migrations before start, e.g.:

```bash
npx prisma migrate deploy && npm run start
```

Or configure Railway’s **Release Command** as `npx prisma migrate deploy` and **Start Command** as `npm run start`.

6. Seed once after first deploy (one-off):

```bash
npm run db:seed
```

(Run locally against the Railway `DATABASE_URL`, or use Railway’s shell/run.)

Build already runs `prisma generate` via the `build` script.

## Out of scope (MVP)

- Real airline / GDS APIs
- Stripe payments
- User accounts
- ML pricing

## Claim note for temporary Prisma DB

If you used `create-db` for a temporary Postgres instance during local setup, claim or replace it with Railway Postgres before the temp DB expires.
