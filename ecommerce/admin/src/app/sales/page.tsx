'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, CircularProgress, Alert, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  Drawer, IconButton, Select, FormControl, InputLabel, Grid, Divider,
  Card, CardContent, Stack
} from '@mui/material';
import { Add, Close, Delete } from '@mui/icons-material';
import { useAuth } from '@/lib/AuthContext';
import { api } from '@/lib/api';
import AppLayout from '@/components/AppLayout';

const STATUS_MAP: Record<string, { label: string; color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' }> = {
  PENDING: { label: 'Ожидает', color: 'default' },
  SHIPPED: { label: 'Отправлен', color: 'info' },
  DELIVERED: { label: 'Доставлен', color: 'success' },
  RETURNED: { label: 'Возврат', color: 'warning' },
  CANCELLED: { label: 'Отменён', color: 'error' },
};

const STATUSES = ['PENDING', 'SHIPPED', 'DELIVERED', 'RETURNED', 'CANCELLED'];

interface ItemForm {
  productId: number | '';
  quantity: number | '';
  unitPrice: number | '';
  platformFee: number | '';
  costPrice: number | '';
}

const emptyItem = (): ItemForm => ({
  productId: '',
  quantity: '',
  unitPrice: '',
  platformFee: '',
  costPrice: '',
});

export default function SalesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [form, setForm] = useState({
    platform: '',
    platformOrderId: '',
    date: new Date().toISOString().slice(0, 16),
    status: 'PENDING',
    shippingCost: '',
    notes: '',
  });
  const [items, setItems] = useState<ItemForm[]>([emptyItem()]);
  const [saving, setSaving] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [detailItems, setDetailItems] = useState<any[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchOrders = useCallback(async () => {
    const data = await api.get<any[]>('/sales');
    setOrders(data || []);
  }, []);

  const fetchStats = useCallback(async () => {
    const data = await api.get<any>('/sales/stats');
    setStats(data);
  }, []);

  const fetchPlatforms = useCallback(async () => {
    const data = await api.get<{ platforms: string[] }>('/products/platforms');
    setPlatforms(data?.platforms || []);
  }, []);

  const fetchProducts = useCallback(async () => {
    const data = await api.get<any[]>('/products');
    setProducts(data || []);
  }, []);

  useEffect(() => {
    if (!authLoading && !user) { router.push('/login'); return; }
    if (!user) return;
    Promise.all([fetchOrders(), fetchStats()])
      .catch(() => setError('Ошибка загрузки данных'))
      .finally(() => setLoading(false));
  }, [user, authLoading, router, fetchOrders, fetchStats]);

  const handleOpenCreate = () => {
    setForm({
      platform: '',
      platformOrderId: '',
      date: new Date().toISOString().slice(0, 16),
      status: 'PENDING',
      shippingCost: '',
      notes: '',
    });
    setItems([emptyItem()]);
    setCreateOpen(true);
    fetchPlatforms();
    fetchProducts();
  };

  const handleCloseCreate = () => {
    setCreateOpen(false);
    setSaving(false);
  };

  const handleFormChange = (field: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm(prev => ({ ...prev, [field]: e.target.value }));
    };

  const handleItemChange = (index: number, field: keyof ItemForm) =>
    (e: { target: { value: any } }) => {
      const val = e.target.value;
      setItems(prev => {
        const next = [...prev];
        (next[index] as any)[field] = field === 'productId' ? val : val === '' ? '' : Number(val);
        return next;
      });
    };

  const addItemRow = () => setItems(prev => [...prev, emptyItem()]);

  const removeItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const computeSummary = () => {
    const totalAmount = items.reduce((sum, it) => {
      const qty = Number(it.quantity) || 0;
      const up = Number(it.unitPrice) || 0;
      return sum + qty * up;
    }, 0);
    const platformFees = items.reduce((sum, it) => sum + (Number(it.platformFee) || 0), 0);
    const shipping = Number(form.shippingCost) || 0;
    const netAmount = totalAmount - platformFees - shipping;
    return { totalAmount, platformFees, netAmount };
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      const { totalAmount, platformFees, netAmount } = computeSummary();
      const payload = {
        platform: form.platform,
        platformOrderId: form.platformOrderId || undefined,
        date: form.date,
        status: form.status,
        shippingCost: Number(form.shippingCost) || 0,
        notes: form.notes || undefined,
        totalAmount,
        platformFees,
        netAmount,
        items: items.map(it => ({
          productId: Number(it.productId),
          quantity: Number(it.quantity),
          unitPrice: Number(it.unitPrice),
          totalPrice: (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0),
          platformFee: Number(it.platformFee) || 0,
          costPrice: it.costPrice !== '' ? Number(it.costPrice) : null,
        })),
      };
      await api.post('/sales', payload);
      handleCloseCreate();
      await fetchOrders();
      await fetchStats();
    } catch {
      setError('Ошибка при создании продажи');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    try {
      await api.patch(`/sales/${orderId}`, { status: newStatus });
      await fetchOrders();
      if (drawerOpen) {
        setSelectedOrder((prev: any) => ({ ...prev, status: newStatus }));
      }
    } catch {
      setError('Ошибка обновления статуса');
    }
  };

  const fetchOrderDetail = async (orderId: number) => {
    setDetailLoading(true);
    try {
      const data = await api.get<any>(`/sales/${orderId}`);
      setSelectedOrder(data);
      setDetailItems(data?.items || []);
    } catch {
      setError('Ошибка загрузки заказа');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleRowClick = (order: any) => {
    setDrawerOpen(true);
    fetchOrderDetail(order.id);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedOrder(null);
    setDetailItems([]);
  };

  const handleAddDetailItem = async () => {
    if (!selectedOrder) return;
    try {
      const item = emptyItem();
      const payload = {
        productId: item.productId,
        quantity: 1,
        unitPrice: 0,
        platformFee: 0,
      };
      const created = await api.post<any>(`/sales/${selectedOrder.id}/items`, payload);
      setDetailItems(prev => [...prev, created]);
      await fetchOrders();
    } catch {
      setError('Ошибка добавления позиции');
    }
  };

  const handleDeleteDetailItem = async (itemId: number) => {
    try {
      await api.delete(`/sales/items/${itemId}`);
      setDetailItems(prev => prev.filter(it => it.id !== itemId));
      await fetchOrders();
    } catch {
      setError('Ошибка удаления позиции');
    }
  };

  const handleUpdateDetailItem = async (itemId: number, field: string, value: any) => {
    try {
      await api.patch(`/sales/items/${itemId}`, { [field]: value === '' ? null : Number(value) });
      setDetailItems(prev =>
        prev.map(it => (it.id === itemId ? { ...it, [field]: field === 'costPrice' && value === '' ? null : Number(value) } : it))
      );
    } catch {
      setError('Ошибка обновления позиции');
    }
  };

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

  const summary = computeSummary();

  return (
    <AppLayout>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {stats && (
        <Grid container spacing={2} mb={3}>
          <Grid size={{ xs: 6, sm: 6, md: 2 }}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">Всего за месяц</Typography>
              <Typography variant="h4" fontWeight={700}>{stats.totalThisMonth ?? 0}</Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 6, sm: 6, md: 2 }}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">Выручка</Typography>
              <Typography variant="h4" fontWeight={700}>
                €{(stats.totalRevenueThisMonth ?? 0).toLocaleString()}
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 6, sm: 6, md: 2 }}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">Комиссии</Typography>
              <Typography variant="h4" fontWeight={700} color="error.main">
                €{(stats.totalPlatformFeesThisMonth ?? 0).toLocaleString()}
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 6, sm: 6, md: 2 }}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">Чистая</Typography>
              <Typography variant="h4" fontWeight={700} color="success.main">
                €{(stats.totalNetThisMonth ?? 0).toLocaleString()}
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 6, sm: 6, md: 2 }}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">В ожидании</Typography>
              <Typography variant="h4" fontWeight={700}>{stats.pending ?? 0}</Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 6, sm: 6, md: 2 }}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">Возвратов</Typography>
              <Typography variant="h4" fontWeight={700} color="warning.main">{stats.returned ?? 0}</Typography>
            </Paper>
          </Grid>
        </Grid>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" fontWeight={600}>Продажи</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={handleOpenCreate}>
          Добавить продажу
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Платформа</TableCell>
              <TableCell>ID заказа</TableCell>
              <TableCell>Дата</TableCell>
              <TableCell>Статус</TableCell>
              <TableCell align="right">Сумма</TableCell>
              <TableCell align="right">Комиссия</TableCell>
              <TableCell align="right">Чистая</TableCell>
              <TableCell align="right">Позиций</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">Нет данных о продажах</Typography>
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order: any) => {
                const st = STATUS_MAP[order.status] || { label: order.status, color: 'default' as const };
                return (
                  <TableRow
                    key={order.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => handleRowClick(order)}
                  >
                    <TableCell>{order.platform}</TableCell>
                    <TableCell>{order.platformOrderId || `#${order.id}`}</TableCell>
                    <TableCell>{new Date(order.date).toLocaleDateString('ru-RU')}</TableCell>
                    <TableCell>
                      <Chip label={st.label} color={st.color} size="small" />
                    </TableCell>
                    <TableCell align="right">€{(order.totalAmount ?? 0).toLocaleString()}</TableCell>
                    <TableCell align="right">€{(order.platformFees ?? 0).toLocaleString()}</TableCell>
                    <TableCell align="right">€{(order.netAmount ?? 0).toLocaleString()}</TableCell>
                    <TableCell align="right">{order.itemCount ?? order.items?.length ?? 0}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={createOpen} onClose={handleCloseCreate} maxWidth="md" fullWidth>
        <DialogTitle>Добавить продажу</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} mt={0.5}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Платформа</InputLabel>
                <Select
                  value={form.platform}
                  label="Платформа"
                  onChange={(e) => setForm(prev => ({ ...prev, platform: e.target.value }))}
                >
                  {platforms.map((p) => (
                    <MenuItem key={p} value={p}>{p}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="ID заказа на платформе"
                value={form.platformOrderId}
                onChange={handleFormChange('platformOrderId')}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                type="datetime-local"
                label="Дата"
                value={form.date}
                onChange={handleFormChange('date')}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControl fullWidth>
                <InputLabel>Статус</InputLabel>
                <Select
                  value={form.status}
                  label="Статус"
                  onChange={(e) => setForm(prev => ({ ...prev, status: e.target.value }))}
                >
                  {STATUSES.map(s => (
                    <MenuItem key={s} value={s}>{STATUS_MAP[s]?.label || s}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                type="number"
                label="Стоимость доставки"
                value={form.shippingCost}
                onChange={handleFormChange('shippingCost')}
                slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Заметки"
                value={form.notes}
                onChange={handleFormChange('notes')}
              />
            </Grid>
          </Grid>

          <Typography variant="subtitle1" mt={3} mb={1} fontWeight={600}>Позиции</Typography>
          {items.map((item, idx) => (
            <Grid container spacing={1} key={idx} mb={1.5} alignItems="center">
              <Grid size={{ xs: 12, sm: 3 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Товар</InputLabel>
                  <Select
                    value={item.productId}
                    label="Товар"
                    onChange={handleItemChange(idx, 'productId')}
                  >
                    {products.map((p: any) => (
                      <MenuItem key={p.id} value={p.id}>
                        {p.title || p.name || `#${p.id}`}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 3, sm: 1.5 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Кол-во"
                  value={item.quantity}
                  onChange={handleItemChange(idx, 'quantity')}
                  slotProps={{ htmlInput: { min: 1 } }}
                />
              </Grid>
              <Grid size={{ xs: 3, sm: 1.5 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Цена"
                  value={item.unitPrice}
                  onChange={handleItemChange(idx, 'unitPrice')}
                  slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
                />
              </Grid>
              <Grid size={{ xs: 3, sm: 1.5 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Комиссия"
                  value={item.platformFee}
                  onChange={handleItemChange(idx, 'platformFee')}
                  slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
                />
              </Grid>
              <Grid size={{ xs: 3, sm: 1.5 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Себест."
                  value={item.costPrice}
                  onChange={handleItemChange(idx, 'costPrice')}
                  slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Сумма: €{((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)).toFixed(2)}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 1 }}>
                <IconButton size="small" color="error" onClick={() => removeItemRow(idx)} disabled={items.length <= 1}>
                  <Delete fontSize="small" />
                </IconButton>
              </Grid>
            </Grid>
          ))}
          <Button size="small" startIcon={<Add />} onClick={addItemRow}>
            Добавить позицию
          </Button>

          <Divider sx={{ my: 2 }} />
          <Card variant="outlined">
            <CardContent sx={{ py: 1.5 }}>
              <Grid container spacing={2}>
                <Grid size={4}>
                  <Typography variant="body2" color="text.secondary">Сумма заказа</Typography>
                  <Typography fontWeight={700}>€{summary.totalAmount.toFixed(2)}</Typography>
                </Grid>
                <Grid size={4}>
                  <Typography variant="body2" color="text.secondary">Комиссии</Typography>
                  <Typography fontWeight={700} color="error.main">€{summary.platformFees.toFixed(2)}</Typography>
                </Grid>
                <Grid size={4}>
                  <Typography variant="body2" color="text.secondary">Чистая выручка</Typography>
                  <Typography fontWeight={700} color="success.main">€{summary.netAmount.toFixed(2)}</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreate}>Отмена</Button>
          <Button variant="contained" onClick={handleCreate} disabled={saving || !form.platform}>
            {saving ? <CircularProgress size={20} /> : 'Создать'}
          </Button>
        </DialogActions>
      </Dialog>

      <Drawer anchor="right" open={drawerOpen} onClose={handleCloseDrawer}>
        <Box sx={{ width: { xs: '100vw', sm: 550 }, p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Детали заказа</Typography>
            <IconButton onClick={handleCloseDrawer}><Close /></IconButton>
          </Box>

          {detailLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <CircularProgress />
            </Box>
          ) : selectedOrder ? (
            <>
              <Grid container spacing={2} mb={2}>
                <Grid size={6}>
                  <Typography variant="body2" color="text.secondary">Платформа</Typography>
                  <Typography fontWeight={600}>{selectedOrder.platform}</Typography>
                </Grid>
                <Grid size={6}>
                  <Typography variant="body2" color="text.secondary">ID заказа</Typography>
                  <Typography fontWeight={600}>{selectedOrder.platformOrderId || `#${selectedOrder.id}`}</Typography>
                </Grid>
                <Grid size={6}>
                  <Typography variant="body2" color="text.secondary">Дата</Typography>
                  <Typography fontWeight={600}>
                    {new Date(selectedOrder.date).toLocaleDateString('ru-RU')}
                  </Typography>
                </Grid>
                <Grid size={6}>
                  <Typography variant="body2" color="text.secondary">Статус</Typography>
                  <Select
                    size="small"
                    value={selectedOrder.status}
                    onChange={(e) => handleStatusChange(selectedOrder.id, e.target.value)}
                    sx={{ mt: 0.5, minWidth: 140 }}
                  >
                    {STATUSES.map(s => (
                      <MenuItem key={s} value={s}>{STATUS_MAP[s]?.label || s}</MenuItem>
                    ))}
                  </Select>
                </Grid>
                {selectedOrder.notes && (
                  <Grid size={12}>
                    <Typography variant="body2" color="text.secondary">Заметки</Typography>
                    <Typography>{selectedOrder.notes}</Typography>
                  </Grid>
                )}
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1" fontWeight={600}>Позиции</Typography>
                <Button size="small" startIcon={<Add />} onClick={handleAddDetailItem}>Добавить</Button>
              </Box>

              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Товар</TableCell>
                      <TableCell align="right">Кол-во</TableCell>
                      <TableCell align="right">Цена</TableCell>
                      <TableCell align="right">Комиссия</TableCell>
                      <TableCell align="right">Себест.</TableCell>
                      <TableCell align="right">Прибыль</TableCell>
                      <TableCell />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {detailItems.map((it: any) => {
                      const profit = it.costPrice != null
                        ? it.unitPrice - it.platformFee - it.costPrice
                        : null;
                      return (
                        <TableRow key={it.id}>
                          <TableCell>
                            {it.product?.title || it.product?.name || `#${it.productId}`}
                          </TableCell>
                          <TableCell align="right">{it.quantity}</TableCell>
                          <TableCell align="right">€{Number(it.unitPrice || 0).toFixed(2)}</TableCell>
                          <TableCell align="right">
                            <TextField
                              size="small"
                              type="number"
                              value={it.platformFee ?? ''}
                              onChange={(e) => handleUpdateDetailItem(it.id, 'platformFee', e.target.value)}
                              sx={{ width: 80 }}
                              slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <TextField
                              size="small"
                              type="number"
                              value={it.costPrice ?? ''}
                              onChange={(e) => handleUpdateDetailItem(it.id, 'costPrice', e.target.value)}
                              sx={{ width: 80 }}
                              slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            {profit !== null ? (
                              <Chip
                                label={`€${profit.toFixed(2)}`}
                                size="small"
                                color={profit >= 0 ? 'success' : 'error'}
                              />
                            ) : (
                              <Typography variant="body2" color="text.secondary">—</Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <IconButton size="small" color="error" onClick={() => handleDeleteDetailItem(it.id)}>
                              <Delete fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {detailItems.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 2 }}>
                          <Typography variant="body2" color="text.secondary">Нет позиций</Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <Card variant="outlined" sx={{ mt: 2 }}>
                <CardContent sx={{ py: 1.5 }}>
                  <Grid container spacing={2}>
                    <Grid size={4}>
                      <Typography variant="body2" color="text.secondary">Сумма</Typography>
                      <Typography fontWeight={700}>
                        €{(selectedOrder.totalAmount ?? 0).toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid size={4}>
                      <Typography variant="body2" color="text.secondary">Доставка</Typography>
                      <Typography fontWeight={700}>
                        €{(selectedOrder.shippingCost ?? 0).toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid size={4}>
                      <Typography variant="body2" color="text.secondary">Чистая</Typography>
                      <Typography fontWeight={700} color="success.main">
                        €{(selectedOrder.netAmount ?? 0).toLocaleString()}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </>
          ) : null}
        </Box>
      </Drawer>
    </AppLayout>
  );
}