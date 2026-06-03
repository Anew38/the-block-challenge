# The Block — Buyer-Side Auction Prototype

A frontend prototype of the **buyer side** of a vehicle auction marketplace, built for the
OPENLANE coding challenge. Browse a catalog of 200 vehicles, drill into a detailed lot view,
and place bids in a live-feeling auction — with bid validation, reserve/buy-now handling, and
state that persists across reloads.

The original challenge brief is preserved in [`CHALLENGE.md`](CHALLENGE.md).

## How to Run

Requires **Node.js 20+** (see [`.nvmrc`](.nvmrc)).

```bash
npm install
npm run dev
```

Then open the printed local URL (default <http://localhost:5173>).

Other scripts:

```bash
npm run build        # type-check (tsc -b) + production build
npm run preview      # serve the production build locally
npm run test         # run the unit/component tests once
npm run test:watch   # tests in watch mode
npm run lint         # ESLint
npm run format       # Prettier write
```

## Time Spent

Roughly the 3–4 hour spirit of the challenge. I front-loaded a short planning pass (data model,
data flow, scope) so the build itself stayed focused, then spent the bulk of the time on the
core browse → detail → bid workflow and polish, and the remainder on tests and this README.

## Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Routing:** React Router v6 (two primary routes: inventory list, vehicle detail)
- **State:** Zustand with the `persist` middleware (bid overlay persisted to `localStorage`)
- **Styling:** Tailwind CSS v4
- **Testing:** Vitest + React Testing Library
- **Tooling:** ESLint, Prettier, `clsx`, `lucide-react`
- **Backend / Database:** none — frontend-only, the dataset is the source of truth

## What I Built

The core buyer journey, end to end:

- **Inventory browse** — responsive grid of vehicle cards (hero image, year/make/model/trim,
  odometer, location, condition grade, current/starting bid, bid count, auction status +
  live countdown).
- **Search & filters** — debounced free-text search plus filters for make, body style,
  province, title status, auction status, price range, and minimum condition grade. Sort by
  ending-soon / price / year / odometer / condition, with a live result count and clear-all.
- **Vehicle detail** — image gallery, full spec sheet, condition block (grade, report, damage
  notes, title status), location + selling dealership, auction details (starting / reserve /
  buy-now), and the bid panel.
- **Bidding (the core)** — place a bid with tiered minimum-increment validation, a reserve-met
  indicator, optional Buy Now, and a running bid history. Current bid and count update
  instantly and persist to `localStorage`.
- **Live simulation** — auction countdowns are normalized relative to "now", and live lots
  occasionally draw simulated rival bids so the experience feels active.
- **Responsive** desktop + mobile layouts, code-split routes with skeleton loading states, and
  a 404 route.

## Architecture & Notable Decisions

- **Normalize at the boundary.** The raw dataset is snake_case; it's parsed once into a
  camelCase, immutable in-memory `Vehicle` catalog (`src/data/`). Components never touch raw
  JSON.
- **Bid state is a thin, persisted overlay.** Zustand stores only a per-vehicle `BidState`
  overlay (current bid, count, history, reserve-met), keyed by id. Base vehicle data stays
  immutable, so `localStorage` stays lean and the dataset is re-seedable. The store wires the
  UI to pure logic; it holds no derived data.
- **Money rules are pure and isolated.** All bid validation lives in `src/features/bidding/bidLogic.ts`
  with no React or store dependencies — the riskiest code is the easiest to test. A bid must
  clear `max(currentBid, startingBid)` plus a **tiered increment** (small steps on cheap lots,
  larger as the money grows) and stay strictly below buy-now.
- **Timing is derived, not stored.** `auction_start` timestamps are synthetic, so they're
  remapped onto a rolling window around "now" to produce a realistic live/scheduled/ended mix
  on every load, while preserving relative ordering so "ending soon" stays meaningful. Each
  lot's duration is derived deterministically from its id (stable hash), so reloads are
  consistent.
- **Live simulation defers to the store.** The simulation hook only decides *when* and *how
  much* to nudge a rival bid; the same `applyRivalBid` action enforces the raise-only and
  below-buy-now rules, keeping a single source of truth for money mutations.
- **Code-split routes** with matching skeletons keep the initial bundle small and the
  perceived load fast.

### Folder structure

```text
src/
  app/            router, layout shell, 404
  components/     shared primitives (Button, Badge, Stat, EmptyState, Skeleton, StatusBadge)
  features/
    inventory/    InventoryPage, FilterBar, SearchInput, VehicleCard, filters/selectors
    vehicle/      VehicleDetailPage, ImageGallery, SpecSheet, ConditionPanel, AuctionDetails, BidPanel, BidHistory
    bidding/      auctionStore (persisted), bidLogic (pure), useLiveAuction
  data/           vehicles.json, loader, normalize, timing, types
  lib/            format, constants (increment tiers), useNow
  styles/         Tailwind entry
tests/            bidLogic.test.ts, VehicleCard.test.tsx
```

## Assumptions and Scope

- **Frontend-only.** `src/data/vehicles.json` is the source of truth; bids live in client state
  and persist to `localStorage`. No backend, auth, or accounts (all explicitly out of scope per
  the brief).
- **Synthetic timestamps** are treated as scheduling hints and normalized relative to "now," as
  the brief permits.
- **Single buyer.** There's no notion of multiple real users; rival activity is simulated.

Intentionally **deferred** to respect the time box: watchlist/favorites, proxy/max auto-bids,
image zoom/lightbox, vehicle comparison, a real backend/websockets, list virtualization (200
rows render fine), a deep accessibility audit, and end-to-end tests.

## Testing

Focused on the highest-risk and highest-value surfaces rather than blanket coverage:

- **`bidLogic.test.ts`** — unit tests for the pure bid validation: tiered increments, the
  starting-bid floor, buy-now ceiling, reserve-met logic, and invalid-input handling.
- **`VehicleCard.test.tsx`** — a component smoke test verifying a card renders the key
  buyer-facing fields.

Run with `npm run test`.

## What I'd Do With More Time

- Wire a real backend + websockets so bids and "live" state are genuinely shared, replacing the
  client-side simulation.
- Add a watchlist and proxy/max auto-bidding (common, high-value buyer features).
- Virtualize the inventory grid to scale well beyond a few hundred lots.
- Image lightbox/zoom and richer condition media.
- A proper accessibility pass (focus management, ARIA on interactive auction controls) and
  end-to-end coverage of the browse → bid flow.
