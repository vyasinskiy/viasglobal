'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Card, CardContent, Typography, Grid, CircularProgress, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Tabs, Tab, TextField, Button, Stack
} from '@mui/material';
import { TrendingUp, TrendingDown, AttachMoney, ShoppingCart, Inventory } from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useAuth } from '@/lib/AuthContext';
import { api } from '@/lib/api';
import AppLayout from '@/components/AppLayout';

interface DashboardKpi {
  totalRevenue: number;
  netProfit: number;
  avgMarginPercent: number;
  totalOrders: number;
  totalProducts: number;
}

interface SalesTrendItem {
  date: string;
  revenue: number;
  orders: number;
}

interface MarginItem {
  product: string;
  sold: number;
  revenue: number;
  cost: number;
  grossProfit: number;
  marginPercent: number;
}

interface SupplierPerfItem {
  supplier: string;
  purchases: number;
  spent: number;
  products: number;
  avgMargin: number;
}

interface InventoryTurnoverItem {
  product: string;
  inStock: number;
  sold30Days: number;
  turnover: number;
}

export default function AnalyticsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [kpi, setKpi] = useState<DashboardKpi | null>(null);
  const [salesTrend, setSalesTrend] = useState<SalesTrendItem[]>([]);
  const [margin, setMargin] = useState<MarginItem[]>([]);
  const [supplierPerf, setSupplierPerf] = useState<SupplierPerfItem[]>([]);
  const [inventoryTurnover, setInventoryTurnover] = useState<InventoryTurnoverItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState(0);

  const [marginDateFrom, setMarginDateFrom] = useState('');
  const [marginDateTo, setMarginDateTo] = useState('');
  const [marginProduct, setMarginProduct] = useState('');
  const [marginLoading, setMarginLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) { router.push('/login'); return; }
    if (!user) return;
    Promise.all([
      api.get<DashboardKpi>('/analytics/dashboard'),
      api.get<SalesTrendItem[]>('/analytics/sales-trend?days=30'),
      api.get<MarginItem[]>('/analytics/margin'),
      api.get<SupplierPerfItem[]>('/analytics/supplier-performance'),
      api.get<InventoryTurnoverItem[]>('/analytics/inventory-turnover'),
    ]).then(([kpiData, trendData, marginData, supplierData, invData]) => {
      setKpi(kpiData);
      setSalesTrend(trendData || []);
      setMargin(marginData || []);
      setSupplierPerf(supplierData || []);
      setInventoryTurnover(invData || []);
    }).catch((err: any) => {
      setError(err?.message || 'Ошибка загрузки данных');
    }).finally(() => setLoading(false));
  }, [user, authLoading, router]);

  const fetchMargin = useCallback(() => {
    if (!user) return;
    setMarginLoading(true);
    const params = new URLSearchParams();
    if (marginDateFrom) params.set('dateFrom', marginDateFrom);
    if (marginDateTo) params.set('dateTo', marginDateTo);
    if (marginProduct) params.set('product', marginProduct);
    const qs = params.toString();
    api.get<MarginItem[]>(`/analytics/margin${qs ? `?${qs}` : ''}`)
      .then(setMargin)
      .catch((err: any) => setError(err?.message || 'Ошибка загрузки маржинальности'))
      .finally(() => setMarginLoading(false));
  }, [user, marginDateFrom, marginDateTo, marginProduct]);

  const kpiCards = useMemo(() => {
    if (!kpi) return [];
    return [
      { label: 'Общая выручка', value: `€${(kpi.totalRevenue || 0).toLocaleString()}`, icon: <AttachMoney />, color: '#1565c0' },
      { label: 'Чистая прибыль', value: `€${(kpi.netProfit || 0).toLocaleString()}`, icon: <TrendingUp />, color: '#2e7d32' },
      { label: 'Средняя маржа', value: `${(kpi.avgMarginPercent || 0).toFixed(1)}%`, icon: <TrendingDown />, color: '#c62828' },
      { label: 'Всего заказов', value: String(kpi.totalOrders || 0), icon: <ShoppingCart />, color: '#e65100' },
      { label: 'Всего товаров', value: String(kpi.totalProducts || 0), icon: <Inventory />, color: '#7c4dff' },
    ];
  }, [kpi]);

  const marginFmt = (v: number) => `${(v || 0).toFixed(1)}%`;

  if (authLoading || loading) {
    return (
      <AppLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
          <CircularProgress />
        </Box>
      </AppLayout>
    );
  }
  if (!user) return null;

  return (
    <AppLayout>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      <Grid container spacing={3}>
        {kpiCards.map((card, i) => (
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: kpiCards.length >= 5 ? undefined : 3 }} key={i}>
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

      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" mb={2}>Тренд продаж (30 дней)</Typography>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={salesTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#1565c0" strokeWidth={2} name="Выручка €" />
              <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#e65100" strokeWidth={2} name="Заказы" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
            <Tab label="Маржинальность" />
            <Tab label="Эффективность поставщиков" />
            <Tab label="Оборачиваемость склада" />
          </Tabs>

          {tab === 0 && (
            <Box>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
                <TextField
                  label="С"
                  type="date"
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  value={marginDateFrom}
                  onChange={(e) => setMarginDateFrom(e.target.value)}
                />
                <TextField
                  label="По"
                  type="date"
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  value={marginDateTo}
                  onChange={(e) => setMarginDateTo(e.target.value)}
                />
                <TextField
                  label="Товар"
                  size="small"
                  value={marginProduct}
                  onChange={(e) => setMarginProduct(e.target.value)}
                />
                <Button variant="outlined" onClick={fetchMargin} disabled={marginLoading}>
                  Применить
                </Button>
              </Stack>
              {marginLoading ? <CircularProgress /> : (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Товар</TableCell>
                        <TableCell align="right">Продано</TableCell>
                        <TableCell align="right">Выручка</TableCell>
                        <TableCell align="right">Себестоимость</TableCell>
                        <TableCell align="right">Валовая прибыль</TableCell>
                        <TableCell align="right">Маржа %</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {margin.map((row, i) => (
                        <TableRow key={i}>
                          <TableCell>{row.product}</TableCell>
                          <TableCell align="right">{row.sold || 0}</TableCell>
                          <TableCell align="right">€{(row.revenue || 0).toLocaleString()}</TableCell>
                          <TableCell align="right">€{(row.cost || 0).toLocaleString()}</TableCell>
                          <TableCell align="right">€{(row.grossProfit || 0).toLocaleString()}</TableCell>
                          <TableCell align="right">{marginFmt(row.marginPercent)}</TableCell>
                        </TableRow>
                      ))}
                      {margin.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} align="center">Нет данных</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}

          {tab === 1 && (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Поставщик</TableCell>
                    <TableCell align="right">Закупок</TableCell>
                    <TableCell align="right">Потрачено</TableCell>
                    <TableCell align="right">Товаров</TableCell>
                    <TableCell align="right">Средняя маржа</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {supplierPerf.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell>{row.supplier}</TableCell>
                      <TableCell align="right">{row.purchases || 0}</TableCell>
                      <TableCell align="right">€{(row.spent || 0).toLocaleString()}</TableCell>
                      <TableCell align="right">{row.products || 0}</TableCell>
                      <TableCell align="right">{marginFmt(row.avgMargin)}</TableCell>
                    </TableRow>
                  ))}
                  {supplierPerf.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center">Нет данных</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {tab === 2 && (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Товар</TableCell>
                    <TableCell align="right">На складе</TableCell>
                    <TableCell align="right">Продано за 30 дней</TableCell>
                    <TableCell align="right">Оборачиваемость</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {inventoryTurnover.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell>{row.product}</TableCell>
                      <TableCell align="right">{row.inStock || 0}</TableCell>
                      <TableCell align="right">{row.sold30Days || 0}</TableCell>
                      <TableCell align="right">{row.turnover != null ? (row.turnover).toFixed(1) : '—'}</TableCell>
                    </TableRow>
                  ))}
                  {inventoryTurnover.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center">Нет данных</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </AppLayout>
  );
}