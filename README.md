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

### Run on a phone (same Wi‑Fi)

The app is a responsive web UI — use a mobile browser on the same network as your dev machine.

1. **Install and start the dev server on your computer**, binding to the network (not only `localhost`):

   ```bash
   npm install
   npm run dev -- --host
   ```

   Vite prints a **Network** URL (for example `http://192.168.1.42:5173`). Use that on your phone, not `localhost`.

2. **Find your computer’s LAN IP** if you need it manually:

   - **macOS:** `ipconfig getifaddr en0` (Wi‑Fi is often `en0`; use `en1` if that returns nothing)
   - **Windows:** `ipconfig` and look for **IPv4 Address** on your Wi‑Fi adapter
   - **Linux:** `hostname -I` or `ip addr`

3. **Connect your phone to the same Wi‑Fi** as the computer running Vite.

4. **On the phone**, open Safari or Chrome and go to `http://<your-computer-ip>:5173` (match the port Vite prints).

5. **If the page does not load**, check that your OS firewall allows incoming connections on that port, and that VPN or “client isolation” on the router is not blocking device-to-device traffic.

To try the **production build** on a phone instead:

```bash
npm run build
npm run preview -- --host
```

Then open the printed Network URL on the phone the same way.

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
  province, title status, auction status, price range, minimum condition grade, and a Buy Now
  toggle. Sort by ending-soon / price / year / odometer / condition, with a live result count
  and clear-all.
- **Vehicle detail** — image gallery, full spec sheet, condition block (grade, report, damage
  notes, title status), location + selling dealership, auction details (starting / reserve /
  buy-now), and the bid panel.
- **Bidding (the core)** — place a bid with tiered minimum-increment validation, a reserve-met
  indicator, optional Buy Now, and a running bid history. Current bid and count update
  instantly and persist to `localStorage`.
- **AI Insights panel** — a ranked, live-updating set of buyer-facing signals per lot:
  mileage vs. comparable peers, wholesale spread to Buy Now, condition-to-price, reserve gap,
  bid velocity, closing urgency, and title-status caution. Insights are scored, deduped, and
  capped so the panel stays scannable, with a persisted collapse preference.
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
- **Insight logic is pure too — and transparent about what it is.** `insightLogic.ts` mirrors
  the bid-logic pattern: deterministic, dependency-free rules (`vehicle + bid + timing + catalog
  + now`) producing a ranked `Insight[]`. The panel is labeled **"AI insights"** because that's
  the buyer-facing frame, but there is no model call — every insight is an auditable heuristic
  (cohort medians for mileage and condition-vs-price, reserve gap, recent bid velocity, closing
  urgency, title-status caution). I chose this deliberately: it's fast, offline-safe, and
  testable for a prototype, while leaving a clean seam to swap in a real model behind
  `deriveInsights` later.
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
    vehicle/      VehicleDetailPage, ImageGallery, SpecSheet, ConditionPanel, AuctionDetails,
                  BidPanel, BidHistory, InsightPanel, insightLogic (pure), Panel (shared card)
    bidding/      auctionStore (persisted), bidLogic (pure), useLiveAuction
  data/           vehicles.json, loader, normalize, timing, types
  lib/            format, constants (increment tiers), useNow
  styles/         Tailwind entry
tests/            bidLogic.test.ts, insightLogic.test.ts, VehicleCard.test.tsx
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

## AI Tooling

I used AI coding assistants throughout (primarily Cursor) — as the brief encourages — while
keeping all product decisions and the highest-risk logic under direct review.

**Where AI accelerated the work:**

- Scaffolding repetitive UI surfaces: card, panel, skeleton, and badge variants; filter-bar
  layout; the shape of the spec sheet and condition block.
- Iterating on Tailwind class lists and microcopy (empty states, status labels, error messages).
- Drafting first-cut test cases around bid-logic edge conditions, which I then audited and
  pruned.
- Exploring tradeoffs out loud — store shape, where to put timing normalization, how to keep
  the persisted overlay lean — before committing to an approach.

**Where I deliberately stayed hands-on:**

- **`bidLogic.ts`** — the money rules. Pure, isolated, and unit-tested precisely because every
  branch matters to the buyer.
- **`insightLogic.ts`** — the heuristics behind the "AI insights" panel. I wrote and tuned the
  cohort selection, thresholds, and ranking myself; I wanted full ownership of what the buyer
  sees framed as a recommendation.
- **Data-model boundaries (`src/data/`)** — snake_case → camelCase normalization, the timing
  remap, and the persisted store shape are deliberate calls, not accepted suggestions.
- **The "AI insights" framing.** The panel is labeled AI but is deterministic rules over data
  we already have — no model call at runtime. That's an explicit, transparent choice for a
  prototype: faster, cheaper, offline-safe, and demo-auditable, with a clean seam to swap in a
  real model behind `deriveInsights` later.

**What I'd refine with more model leverage:** replace the median-vs-peer comparisons in
`insightLogic.ts` with comparable-sales lookups or a learned valuation model, and surface a
confidence signal alongside each insight. AI-assisted comparable-vehicle photo analysis (damage
detection, color verification against the report) would be a natural next surface.

## Testing

Focused on the highest-risk and highest-value surfaces rather than blanket coverage:

- **`bidLogic.test.ts`** — unit tests for the pure bid validation: tiered increments, the
  starting-bid floor, buy-now ceiling, reserve-met logic, and invalid-input handling.
- **`insightLogic.test.ts`** — unit tests for the pure insight heuristics: reserve-gap
  analysis, wholesale-spread (Buy Now headroom), mileage-vs-peer cohort comparisons, bid
  velocity (live-only), branded-title cautions, and the ranking/cap behavior.
- **`VehicleCard.test.tsx`** — a component smoke test verifying a card renders the key
  buyer-facing fields.

Run with `npm run test` (28 tests across the three files).

## What I'd Do With More Time

- Wire a real backend + websockets so bids and "live" state are genuinely shared, replacing the
  client-side simulation.
- Add a watchlist and proxy/max auto-bidding (common, high-value buyer features).
- Virtualize the inventory grid to scale well beyond a few hundred lots.
- Image lightbox/zoom and richer condition media.
- A proper accessibility pass (focus management, ARIA on interactive auction controls) and
  end-to-end coverage of the browse → bid flow.
