import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '@/app/AppLayout';
import { NotFoundPage } from '@/app/NotFoundPage';
import { InventorySkeleton } from '@/features/inventory/InventorySkeleton';
import { VehicleDetailSkeleton } from '@/features/vehicle/VehicleDetailSkeleton';

// Code-split the two primary routes so each ships its own chunk; the matching
// skeleton stands in while that chunk downloads.
const InventoryPage = lazy(() =>
  import('@/features/inventory/InventoryPage').then((m) => ({
    default: m.InventoryPage,
  }))
);
const VehicleDetailPage = lazy(() =>
  import('@/features/vehicle/VehicleDetailPage').then((m) => ({
    default: m.VehicleDetailPage,
  }))
);

function withFallback(node: ReactNode, fallback: ReactNode): ReactNode {
  return <Suspense fallback={fallback}>{node}</Suspense>;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: withFallback(<InventoryPage />, <InventorySkeleton />),
      },
      {
        path: 'vehicles/:vehicleId',
        element: withFallback(<VehicleDetailPage />, <VehicleDetailSkeleton />),
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
