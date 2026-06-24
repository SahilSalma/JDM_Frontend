'use client';

import { useMemo } from 'react';
import { useSiteSettings } from '@/components/providers/SiteSettingsProvider';

export interface VehicleMake {
  name: string;
  models: string[];
  yearRange: { min: number; max: number };
}

export type VehicleData = VehicleMake[];

const DEFAULT_YEAR_RANGE = { min: 1980, max: 2025 };

function parseVehicleData(raw: string | undefined): VehicleData {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((m: Partial<VehicleMake>) => ({
      name: m.name ?? '',
      models: Array.isArray(m.models) ? m.models : [],
      yearRange: m.yearRange ?? DEFAULT_YEAR_RANGE,
    })).filter((m) => m.name);
  } catch {
    return [];
  }
}

export function useVehicleData(): {
  makes: string[];
  modelsForMake: (make: string) => string[];
  yearRangeForMake: (make: string) => { min: number; max: number };
  vehicleData: VehicleData;
  isLoading: boolean;
} {
  const { get, isLoading } = useSiteSettings();
  const raw = get('vehicle_data');

  const vehicleData = useMemo(() => parseVehicleData(raw), [raw]);

  const makes = useMemo(() => vehicleData.map((m) => m.name), [vehicleData]);

  const modelsForMake = useMemo(
    () => (make: string) => {
      const entry = vehicleData.find((m) => m.name.toLowerCase() === make.toLowerCase());
      return entry?.models ?? [];
    },
    [vehicleData],
  );

  const yearRangeForMake = useMemo(
    () => (make: string) => {
      const entry = vehicleData.find((m) => m.name.toLowerCase() === make.toLowerCase());
      return entry?.yearRange ?? DEFAULT_YEAR_RANGE;
    },
    [vehicleData],
  );

  return { makes, modelsForMake, yearRangeForMake, vehicleData, isLoading };
}

export function serializeVehicleData(data: VehicleData): string {
  return JSON.stringify(data);
}
