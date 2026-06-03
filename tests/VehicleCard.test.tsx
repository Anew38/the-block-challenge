import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { VehicleCard } from '@/features/inventory/VehicleCard';
import { makeInventoryItem } from './fixtures';

function renderCard(item = makeInventoryItem()) {
  return render(
    <MemoryRouter>
      <VehicleCard item={item} />
    </MemoryRouter>,
  );
}

describe('VehicleCard', () => {
  it('renders title, bid, location, and detail link', () => {
    renderCard();

    const link = screen.getByRole('link', { name: /2020 Honda Civic/i });
    expect(link).toHaveAttribute('href', '/vehicles/test-vehicle-1');

    expect(screen.getByText('EX')).toBeInTheDocument();
    expect(screen.getByText('$5,200')).toBeInTheDocument();
    expect(screen.getByText(/3 bids/)).toBeInTheDocument();
    expect(screen.getByText('Reserve not met')).toBeInTheDocument();
    expect(screen.getByText('Toronto, ON')).toBeInTheDocument();
    expect(screen.getByText('LOT-42')).toBeInTheDocument();
    expect(screen.getByText('Live')).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute(
      'alt',
      '2020 Honda Civic EX',
    );
  });

  it('shows ended state copy when the auction has closed', () => {
    const now = Date.now();
    renderCard(
      makeInventoryItem({
        timing: {
          status: 'ended',
          startsAt: now - 86_400_000,
          endsAt: now - 1_000,
          msToStart: 0,
          msRemaining: 0,
        },
      }),
    );

    expect(screen.getByText('Final bid')).toBeInTheDocument();
    expect(screen.getByText('Auction ended')).toBeInTheDocument();
    expect(screen.getByText('Ended')).toBeInTheDocument();
  });
});
