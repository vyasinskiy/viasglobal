'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Card, CardContent, Typography, Grid, CircularProgress } from '@mui/material';
import { Business, Inventory, ShoppingCart, PointOfSale, TrendingUp, Warning } from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useAuth } from '@/lib/AuthContext';
import { api } from '@/lib/api';
import AppLayout from '@/components/AppLayout';

interface DashboardData {
  suppliers: { total: number; active: number; inPipeline: number };
  products: { total: number; withSupplier: number };
  purchases: { totalThisMonth: number; totalAmountThisMonth: number; pending: number };
  sales: { totalThisMonth: number; totalRevenueThisMonth: number; totalNetThisMonth: number; totalPlatformFeesThisMonth: number };
  inventory: { totalItems: number; lowStockCount: number; byWarehouse: { warehouse: string; count: number }[] };
  margin: { avgMarginPercent: number };
}

interface TrendData {
  date: string; revenue: number; orders: number; fees: number;
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [trend, setTrend] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) { router.push('/login'); return; }
    if (!user) return;
    Promise.all([
      api.get<DashboardData>('/analytics/dashboard'),
      api.get<TrendData[]>('/analytics/sales-trend?days=30'),
    ]).then(([d, t]) => {
      setData(d);
      setTrend(t || []);
    }).finally(() => setLoading(false));
  }, [user, authLoading, router]);

  const cards = useMemo(() => {
    if (!data) return [];
    return [
      { label: 'Поставщики в работе', value: data.suppliers?.inPipeline || 0, icon: <Business />, color: '#1565c0' },
      { label: 'Товаров в каталоге', value: data.products?.total || 0, icon: <Inventory />, color: '#2e7d32' },
      { label: 'Закупок в ожидании', value: data.purchases?.pending || 0, icon: <ShoppingCart />, color: '#e65100' },
      { label: 'Продаж за месяц', value: data.sales?.totalThisMonth || 0, icon: <PointOfSale />, color: '#7c4dff' },
      { label: 'Выручка за месяц', value: `€${(data.sales?.totalRevenueThisMonth || 0).toLocaleString()}`, icon: <TrendingUp />, color: '#c62828' },
      { label: 'Средняя маржа', value: `${(data.margin?.avgMarginPercent || 0).toFixed(1)}%`, icon: <TrendingUp />, color: '#00695c' },
    ];
  }, [data]);

  if (authLoading || loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;
  if (!user) return null;

  return (
    <AppLayout>
      <Grid container spacing={3}>
        {cards.map((card, i) => (
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }} key={i}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ color: card.color, mr: 1 }}>{card.icon}</Box>
                  <Typography variant="body2" color="text.secondary">{card.label}</Typography>
                </Box>
                <Typography variant="h4" fontWeight={700}>{card.value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} mt={1}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={2}>Выручка по дням</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="revenue" stroke="#1565c0" strokeWidth={2} name="Выручка €" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" mb={1}>Финансы за месяц</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Выручка:</Typography>
                  <Typography fontWeight={600}>€{(data?.sales?.totalRevenueThisMonth || 0).toLocaleString()}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Комиссии платформ:</Typography>
                  <Typography fontWeight={600} color="error.main">€{(data?.sales?.totalPlatformFeesThisMonth || 0).toLocaleString()}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Чистая выручка:</Typography>
                  <Typography fontWeight={700} color="success.main">€{(data?.sales?.totalNetThisMonth || 0).toLocaleString()}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Затраты на закупки:</Typography>
                  <Typography fontWeight={600}>€{(data?.purchases?.totalAmountThisMonth || 0).toLocaleString()}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={1}>Склад</Typography>
              {(data?.inventory?.byWarehouse || []).map((wh, i) => (
                <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2">{wh.warehouse === 'OWN' ? 'Свой' : wh.warehouse === 'FBA' ? 'FBA' : wh.warehouse}:</Typography>
                  <Typography fontWeight={600}>{wh.count} поз.</Typography>
                </Box>
              ))}
              {data?.inventory?.lowStockCount ? (
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, color: 'warning.main' }}>
                  <Warning fontSize="small" sx={{ mr: 0.5 }} />
                  <Typography variant="body2">{data.inventory.lowStockCount} позиций с низким остатком</Typography>
                </Box>
              ) : null}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </AppLayout>
  );
}