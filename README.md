# Travel Agent Demo — Dynamic Flight Ticketing

Public demo for a travel-agent consultancy: simulated flight inventory with **rule-based dynamic pricing** in AUD. Prices rise with recent demand and low remaining seats. Checkout locks a quote for 15 minutes.

## Stack

- Next.js (App Router) + TypeScript + Tailwind
- Prisma 7 + PostgreSQL
- Zod validation
- Deploy target: Vercel (app) + hosted Postgres (Neon/Supabase/Railway). No Docker required.

## Setup

1. Copy env file and set values:

```bash
cp .env.example .env
```

2. Set `DATABASE_URL` to your Postgres connection string.
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
- Price analytics by destination / ticket type / route

## Demo routes to try

Seeded examples (dates are relative to seed time — pick a date within ~2 weeks):

- `SYD` → `MEL`
- `MEL` → `BNE`
- `SYD` → `SIN`
- `MEL` → `LAX`

## Vercel deploy

1. Push this repo to GitHub.
2. Import the project in Vercel.
3. Create a hosted Postgres database and set:
   - `DATABASE_URL`
   - `ADMIN_PASSWORD`
4. Recommended build command:

```bash
prisma generate && prisma migrate deploy && next build
```

5. After first deploy, seed once:

```bash
npm run db:seed
```

(Use your production `DATABASE_URL` locally for that one-off seed.)

## Out of scope (MVP)

- Real airline / GDS APIs
- Stripe payments
- User accounts
- ML pricing
