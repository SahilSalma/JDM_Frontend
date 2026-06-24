'use client';

import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '@/lib/api';
import type { OrderStatus, PaymentStatus } from '@/lib/constants';

export interface Order {
  id: string;
  order_number: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  customer_email: string;
  customer_name: string;
  customer_phone?: string;
  customer_notes?: string;
  shipping_cents: number;
  shipping_type: string;
  total_cents: number;
  items: OrderItem[];
  shipping_address: Record<string, string>;
  billing_address: Record<string, string> | null;
  tracking_number?: string;
  carrier?: string;
  admin_notes?: string;
  authorizenet_transaction_id?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  product_id: string;
  product_title: string;
  product_sku: string;
  unit_price_cents: number;
  total_cents: number;
  quantity: number;
}

export interface OrderFilters {
  status?: string;
  paymentStatus?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface OrdersResponse {
  success: boolean;
  data: Order[];
  meta: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

interface UseOrdersReturn {
  orders: Order[];
  total: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
  updateStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  updateTracking: (orderId: string, trackingNumber: string) => Promise<void>;
  refetch: () => void;
}

export function useOrders(filters: OrderFilters = {}): UseOrdersReturn {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trigger, setTrigger] = useState(0);

  const refetch = useCallback(() => setTrigger((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const params: Record<string, unknown> = {
          page: filters.page ?? 1,
          limit: filters.limit ?? 20,
          ...(filters.status && { status: filters.status }),
          ...(filters.paymentStatus && { paymentStatus: filters.paymentStatus }),
          ...(filters.search && { search: filters.search }),
          ...(filters.sortBy && { sortBy: filters.sortBy }),
          ...(filters.sortOrder && { sortOrder: filters.sortOrder }),
        };

        const data = await adminApi.get<OrdersResponse>('/admin/orders', params);
        if (!cancelled) {
          setOrders(data.data ?? []);
          setTotal(data.meta?.total ?? 0);
          setTotalPages(data.meta?.total_pages ?? 0);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load orders');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger, filters.status, filters.paymentStatus, filters.search, filters.page, filters.limit, filters.sortBy, filters.sortOrder]);

  const updateStatus = useCallback(
    async (orderId: string, status: OrderStatus) => {
      await adminApi.patch(`/admin/orders/${orderId}/status`, { status });
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o)),
      );
    },
    [],
  );

  const updateTracking = useCallback(
    async (orderId: string, trackingNumber: string) => {
      await adminApi.patch(`/admin/orders/${orderId}/tracking`, { trackingNumber });
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, tracking_number: trackingNumber } : o,
        ),
      );
    },
    [],
  );

  return { orders, total, totalPages, isLoading, error, updateStatus, updateTracking, refetch };
}
