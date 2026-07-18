# Amplify — Back-office Dashboard

Web app for the two teams running the **Amplify** affiliate program:

- the **affiliate team** reviews and approves/rejects commissions (with a full audit trail),
- the **finance team** batches approved commissions into payouts, exports the payment run as CSV, and marks batches paid.

Part of a three-repo system — see the [backend README](https://github.com/rahulkumar345/affiliate-backend#readme) for the full product story and architecture:

| Repo | What it is |
|---|---|
| [affiliate-backend](https://github.com/rahulkumar345/affiliate-backend) | API, referral tracking, commission engine, payouts (Node/Express/MongoDB) |
| **[affiliate-dashboard](https://github.com/rahulkumar345/affiliate-dashboard)** (this repo) | Back-office web app (React + Vite) |
| [affiliate-app](https://github.com/rahulkumar345/affiliate-app) | Affiliate mobile app (React Native / Expo) |

## Live demo

**https://affiliate-dashboard-roan-eta.vercel.app** — backed by the deployed API at `https://amplify-affiliate-api.onrender.com`. Log in with the demo accounts below. (Free-tier note: if the API has been idle, the first login takes ~50 s while it wakes.)

## Quickstart

Prereq: the [backend](https://github.com/rahulkumar345/affiliate-backend) running and seeded (startup order: MongoDB → backend → this dashboard).

```bash
npm install
cp .env.example .env      # VITE_API_URL=http://localhost:4000 by default
npm run dev               # http://localhost:5173
```

Sign in with the seeded team accounts:

| Role | Email | Password | Can do |
|---|---|---|---|
| admin (affiliate team) | `admin@amplify.dev` | `Admin123!` | everything, incl. approve/reject + program settings |
| finance | `finance@amplify.dev` | `Finance123!` | payouts (create batch, mark paid, CSV); commissions are read-only |

Affiliate logins are rejected here — affiliates live in the mobile app.

## Pages

- **Overview** — growth metrics (affiliates, clicks, conversions, click→order rate) and money metrics (pending review, approved-owed, in payout batches, paid out), plus the latest commissions.
- **Commissions** — filter by status; approve/reject one-by-one or in bulk (with notes); expand any row for its full audit history (who moved it, when, why). Invalid transitions are refused by the backend's state machine.
- **Payouts** — "Ready to pay" balances (approved total ≥ minimum), one-click batch creation, CSV export of the pending payment run, mark-paid with a payment reference.
- **Affiliates** — everyone in the program with their funnel (clicks → conversions) and earnings split; copy/open their share links.
- **Program settings** — commission rate and minimum payout (admin-editable; applies to new conversions only).

## Configuration

| Var | Purpose | Default |
|---|---|---|
| `VITE_API_URL` | Base URL of the affiliate-backend API | `http://localhost:4000` |

## Build & deploy

```bash
npm run build             # outputs dist/
```

Deploys anywhere static hosting exists. For **Vercel**: import the repo, set `VITE_API_URL` to the deployed backend URL — `vercel.json` (SPA rewrites) is included.
