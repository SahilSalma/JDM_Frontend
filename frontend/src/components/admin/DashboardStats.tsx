'use client';

import { useTranslations } from 'next-intl';
import { TrendingUp, ShoppingCart, Package, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import CountUp from '@/components/animations/CountUp';
import { formatCents } from '@/lib/constants';

export interface DashboardStatsData {
  totalOrders: number;
  totalRevenue: number; // in cents
  activeProducts: number;
  lowStockCount: number;
}

interface StatCard {
  key: 'totalOrders' | 'totalRevenue' | 'activeProducts' | 'lowStock';
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  isCurrency?: boolean;
}

interface DashboardStatsProps {
  stats: DashboardStatsData;
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  const t = useTranslations('admin.stats');

  const cards: StatCard[] = [
    {
      key: 'totalOrders',
      value: stats.totalOrders,
      icon: ShoppingCart,
      color: 'text-blue-400',
    },
    {
      key: 'totalRevenue',
      value: stats.totalRevenue,
      icon: TrendingUp,
      color: 'text-green-400',
      isCurrency: true,
    },
    {
      key: 'activeProducts',
      value: stats.activeProducts,
      icon: Package,
      color: 'text-purple-400',
    },
    {
      key: 'lowStock',
      value: stats.lowStockCount,
      icon: AlertTriangle,
      color: 'text-[#DC2626]',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.key} className="bg-card border-border">
            <CardContent className="pt-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    {t(card.key)}
                  </p>
                  <p className="text-2xl font-bold text-foreground font-heading">
                    {card.isCurrency ? (
                      formatCents(card.value)
                    ) : (
                      <CountUp end={card.value} duration={1500} />
                    )}
                  </p>
                </div>
                <div className="rounded-lg p-2 bg-muted">
                  <Icon className={`size-5 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
