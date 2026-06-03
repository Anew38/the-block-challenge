import { ListChecks } from 'lucide-react';
import type { Vehicle } from '@/data/types';
import { Stat } from '@/components';
import { formatOdometer } from '@/lib/format';
import { Panel } from './Panel';

interface SpecSheetProps {
  vehicle: Vehicle;
}

/** Capitalizes the first letter of dataset enums like `gasoline` → `Gasoline`. */
function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** Full specification sheet rendered as a two-column definition list. */
export function SpecSheet({ vehicle }: SpecSheetProps) {
  const specs: Array<{ label: string; value: string; mono?: boolean }> = [
    { label: 'VIN', value: vehicle.vin, mono: true },
    { label: 'Body style', value: vehicle.bodyStyle },
    { label: 'Odometer', value: formatOdometer(vehicle.odometerKm) },
    { label: 'Engine', value: vehicle.engine },
    { label: 'Transmission', value: titleCase(vehicle.transmission) },
    { label: 'Drivetrain', value: vehicle.drivetrain },
    { label: 'Fuel type', value: titleCase(vehicle.fuelType) },
    { label: 'Exterior', value: vehicle.exteriorColor },
    { label: 'Interior', value: vehicle.interiorColor },
  ];

  return (
    <Panel title="Specifications" icon={ListChecks}>
      <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
        {specs.map((spec) => (
          <Stat
            key={spec.label}
            label={spec.label}
            value={spec.value}
            mono={spec.mono}
          />
        ))}
      </dl>
    </Panel>
  );
}
