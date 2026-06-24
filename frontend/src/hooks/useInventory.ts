'use client';

import { useState, useCallback } from 'react';
import { adminApi } from '@/lib/api';

export interface InventoryLogEntry {
  id: string;
  product_id: string;
  previous_stock: number;
  new_stock: number;
  change: number;
  reason: string;
  created_by: string;
  created_at: string;
}

interface UseInventoryReturn {
  updateStock: (productId: string, newStock: number, reason?: string) => Promise<void>;
  getLog: (productId: string) => Promise<InventoryLogEntry[]>;
  isLoading: boolean;
  error: string | null;
}

export function useInventory(): UseInventoryReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateStock = useCallback(
    async (productId: string, newStock: number, reason?: string) => {
      setIsLoading(true);
      setError(null);
      try {
        await adminApi.patch(`/admin/inventory/${productId}`, {
          quantity: newStock,
          ...(reason ? { reason } : {}),
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update stock';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const getLog = useCallback(async (productId: string): Promise<InventoryLogEntry[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminApi.get<{ success: boolean; data: InventoryLogEntry[] }>(
        `/admin/inventory/log/${productId}`,
      );
      return data.data ?? [];
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load inventory log';
      setError(message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { updateStock, getLog, isLoading, error };
}
