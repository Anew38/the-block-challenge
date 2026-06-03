import { useEffect, useMemo, useState } from 'react';
import { PackageOpen } from 'lucide-react';
import { Button, EmptyState } from '@/components';
import { catalog, vehicleCount } from '@/data/loader';
import { useAuctionStore } from '@/features/bidding/auctionStore';
import { useLiveInventorySim } from '@/features/bidding/useLiveAuction';
import { useNow } from '@/lib/useNow';
import { RecentlyViewedStrip } from '@/features/recentlyViewed/RecentlyViewedStrip';
import { FilterBar } from './FilterBar';
import { Pagination } from './Pagination';
import { SearchInput } from './SearchInput';
import { VehicleCard } from './VehicleCard';
import { selectInventory } from './inventorySelectors';
import { useInventoryFilters } from './useInventoryFilters';

/** Lots shown per page in the inventory grid. */
const PAGE_SIZE = 20;

export function InventoryPage() {
  const {
    filters,
    searchInput,
    setSearchInput,
    setFilter,
    clearAll,
    hasActiveFilters,
    options,
  } = useInventoryFilters();

  // A shared 1s tick keeps countdowns and "ending soon" ordering live; the bid
  // overlay subscription re-runs selection whenever a bid lands.
  const now = useNow(1000);
  const overlay = useAuctionStore((s) => s.bids);

  // Nudge one random live lot per tick so the grid's prices move on their own.
  useLiveInventorySim(catalog);

  const items = useMemo(
    () => selectInventory(catalog, overlay, filters, now),
    [overlay, filters, now]
  );

  const [page, setPage] = useState(1);

  // Jump back to the first page whenever the filtered result set changes.
  useEffect(() => {
    setPage(1);
  }, [filters]);

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  // Clamp in case the result set shrank below the active page.
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageItems = items.slice(pageStart, pageStart + PAGE_SIZE);

  const goToPage = (next: number) => {
    setPage(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section className="flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Inventory</h1>
        <p className="text-sm text-slate-400 light:text-slate-600">
          Browse {vehicleCount} lots on the block. Search, filter, and open a
          lot to place a bid.
        </p>
      </header>

      <RecentlyViewedStrip />

      <SearchInput value={searchInput} onChange={setSearchInput} />

      <FilterBar
        filters={filters}
        options={options}
        setFilter={setFilter}
        hasActiveFilters={hasActiveFilters}
        clearAll={clearAll}
      />

      <div className="flex items-center justify-between text-sm text-slate-400 light:text-slate-600">
        <span aria-live="polite">
          {items.length === 0
            ? '0 results'
            : `Showing ${pageStart + 1}–${pageStart + pageItems.length} of ${items.length} ${items.length === 1 ? 'result' : 'results'}`}
          {items.length !== vehicleCount && items.length > 0 && (
            <span className="text-slate-500"> ({vehicleCount} total)</span>
          )}
        </span>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={PackageOpen}
          title="No lots match your filters"
          description="Try widening your search or clearing some filters."
          action={
            hasActiveFilters && (
              <Button size="sm" onClick={clearAll}>
                Clear all filters
              </Button>
            )
          }
        />
      ) : (
        <>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {pageItems.map((item) => (
              <li key={item.vehicle.id}>
                <VehicleCard item={item} />
              </li>
            ))}
          </ul>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={goToPage}
          />
        </>
      )}
    </section>
  );
}
