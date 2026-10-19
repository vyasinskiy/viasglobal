'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Card, CardContent, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, IconButton, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  Drawer, Grid, Alert, InputAdornment, Divider, Tooltip, Snackbar
} from '@mui/material';
import { Add, Visibility, Delete, Refresh, Close } from '@mui/icons-material';
import { useAuth } from '@/lib/AuthContext';
import { api } from '@/lib/api';
import AppLayout from '@/components/AppLayout';

const STATUS_COLORS: Record<string, 'default' | 'primary' | 'secondary' | 'info' | 'warning' | 'success' | 'error'> = {
  DRAFT: 'default',
  SENT: 'info',
  CONFIRMED: 'primary',
  PAID: 'secondary',
  SHIPPED: 'warning',
  PARTIALLY_RECEIVED: 'info',
  RECEIVED: 'success',
  CANCELLED: 'error',
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Черновик',
  SENT: 'Отправлен',
  CONFIRMED: 'Подтверждён',
  PAID: 'Оплачен',
  SHIPPED: 'Отправлен',
  PARTIALLY_RECEIVED: 'Частично получен',
  RECEIVED: 'Получен',
  CANCELLED: 'Отменён',
};

interface PurchaseOrder {
  id: number;
  orderNumber: string;
  supplier?: { id: number; name: string };
  supplierId: number;
  status: string;
  orderDate: string;
  expectedDeliveryDate?: string;
  shippingCost: number;
  taxAmount: number;
  notes?: string;
  items: PurchaseItem[];
  totalAmount: number;
  itemCount: number;
}

interface PurchaseItem {
  id: number;
  purchaseId: number;
  productId: number;
  product?: { id: number; name: string; sku: string };
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  receivedQuantity: number;
}

interface SupplierOption {
  id: number;
  name: string;
}

interface ProductOption {
  id: number;
  name: string;
  sku: string;
}

interface NewItemRow {
  productId: number | '';
  quantity: number;
  unitPrice: number;
}

const NEW_ITEM_TEMPLATE: NewItemRow = { productId: '', quantity: 1, unitPrice: 0 };

export default function PurchasesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [purchases, setPurchases] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snack, setSnack] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [form, setForm] = useState({
    orderNumber: '',
    supplierId: '' as number | '',
    expectedDeliveryDate: '',
    shippingCost: 0,
    taxAmount: 0,
    notes: '',
  });
  const [formItems, setFormItems] = useState<NewItemRow[]>([NEW_ITEM_TEMPLATE]);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [detailDrawer, setDetailDrawer] = useState(false);
  const [detail, setDetail] = useState<PurchaseOrder | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [receiveQuantities, setReceiveQuantities] = useState<Record<number, number>>({});
  const [detailError, setDetailError] = useState<string | null>(null);

  const fetchSuppliers = useCallback(async () => {
    try {
      const data = await api.get<SupplierOption[]>('/suppliers');
      setSuppliers(Array.isArray(data) ? data : []);
    } catch { /* ignore */ }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const data = await api.get<ProductOption[]>('/products');
      setProducts(Array.isArray(data) ? data : []);
    } catch { /* ignore */ }
  }, []);

  const fetchPurchases = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<PurchaseOrder[]>('/purchases');
      setPurchases(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message || 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDetail = useCallback(async (id: number) => {
    try {
      setDetailLoading(true);
      setDetailError(null);
      const data = await api.get<PurchaseOrder>(`/purchases/${id}`);
      setDetail(data);
      setReceiveQuantities({});
    } catch (e: any) {
      setDetailError(e?.message || 'Ошибка загрузки');
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) { router.push('/login'); return; }
    if (!user) return;
    fetchPurchases();
    fetchSuppliers();
    fetchProducts();
  }, [user, authLoading, router, fetchPurchases, fetchSuppliers, fetchProducts]);

  const handleOpenCreate = () => {
    setForm({ orderNumber: '', supplierId: '', expectedDeliveryDate: '', shippingCost: 0, taxAmount: 0, notes: '' });
    setFormItems([{ ...NEW_ITEM_TEMPLATE }]);
    setFormError(null);
    setCreateOpen(true);
  };

  const handleCloseCreate = () => {
    if (submitting) return;
    setCreateOpen(false);
  };

  const formTotal = formItems.reduce((sum, item) => {
    const productId = item.productId;
    const quantity = item.quantity || 0;
    const unitPrice = item.unitPrice || 0;
    return productId ? sum + quantity * unitPrice : sum;
  }, 0);

  const handleCreate = async () => {
    if (!form.supplierId) { setFormError('Выберите поставщика'); return; }
    const validItems = formItems.filter(i => i.productId);
    if (validItems.length === 0) { setFormError('Добавьте хотя бы одну позицию'); return; }

    setSubmitting(true);
    setFormError(null);
    try {
      await api.post('/purchases', {
        supplierId: form.supplierId,
        orderNumber: form.orderNumber || undefined,
        expectedDeliveryDate: form.expectedDeliveryDate || undefined,
        shippingCost: form.shippingCost,
        taxAmount: form.taxAmount,
        notes: form.notes || undefined,
        items: validItems.map(i => ({
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
      });
      setSnack('Закупка создана');
      setCreateOpen(false);
      fetchPurchases();
    } catch (e: any) {
      setFormError(e?.message || 'Ошибка создания закупки');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDetail = (purchase: PurchaseOrder) => {
    fetchDetail(purchase.id);
    setDetailDrawer(true);
  };

  const handleCloseDetail = () => {
    setDetailDrawer(false);
    setDetail(null);
  };

  const handleStatusChange = async (purchaseId: number, status: string) => {
    try {
      await api.patch(`/purchases/${purchaseId}/status`, { status });
      setSnack('Статус обновлён');
      fetchPurchases();
      fetchDetail(purchaseId);
    } catch (e: any) {
      setDetailError(e?.message || 'Ошибка смены статуса');
    }
  };

  const handleReceiveItem = async (itemId: number, quantity: number) => {
    try {
      await api.patch(`/purchases/items/${itemId}/receive`, { quantity });
      setSnack('Приёмка выполнена');
      if (detail) fetchDetail(detail.id);
      fetchPurchases();
    } catch (e: any) {
      setDetailError(e?.message || 'Ошибка приёмки');
    }
  };

  const handleReceiveAll = async () => {
    if (!detail) return;
    const promises = detail.items.map(item => {
      const remaining = item.quantity - item.receivedQuantity;
      if (remaining <= 0) return null;
      return api.patch(`/purchases/items/${item.id}/receive`, { quantity: remaining });
    }).filter(Boolean);
    if (promises.length === 0) { setSnack('Все позиции уже приняты'); return; }
    try {
      await Promise.all(promises);
      setSnack('Вся закупка принята');
      fetchDetail(detail.id);
      fetchPurchases();
    } catch (e: any) {
      setDetailError(e?.message || 'Ошибка приёмки');
    }
  };

  const handleDeleteItem = async (itemId: number) => {
    try {
      await api.delete(`/purchases/items/${itemId}`);
      setSnack('Позиция удалена');
      if (detail) fetchDetail(detail.id);
      fetchPurchases();
    } catch (e: any) {
      setDetailError(e?.message || 'Ошибка удаления');
    }
  };

  const handleAddItem = async () => {
    if (!detail) return;
    try {
      const data = await api.post<PurchaseItem>(`/purchases/${detail.id}/items`, {
        productId: products[0]?.id,
        quantity: 1,
        unitPrice: 0,
      });
      setSnack('Позиция добавлена');
      fetchDetail(detail.id);
      fetchPurchases();
    } catch (e: any) {
      setDetailError(e?.message || 'Ошибка добавления позиции');
    }
  };

  const handleUpdateDetailItem = async (itemId: number, field: string, value: number) => {
    try {
      await api.patch(`/purchases/items/${itemId}`, { [field]: value });
      if (detail) fetchDetail(detail.id);
      fetchPurchases();
    } catch (e: any) {
      setDetailError(e?.message || 'Ошибка обновления');
    }
  };

  if (authLoading || loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;
  if (!user) return null;

  return (
    <AppLayout>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>Закупки</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton onClick={fetchPurchases} title="Обновить"><Refresh /></IconButton>
          <Button variant="contained" startIcon={<Add />} onClick={handleOpenCreate}>
            Создать закупку
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Номер заказа</TableCell>
                <TableCell>Поставщик</TableCell>
                <TableCell>Статус</TableCell>
                <TableCell>Дата заказа</TableCell>
                <TableCell align="right">Сумма</TableCell>
                <TableCell align="right">Позиций</TableCell>
                <TableCell align="center">Действия</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {purchases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">Нет закупок</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                purchases.map((po) => (
                  <TableRow key={po.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleOpenDetail(po)}>
                    <TableCell><Typography fontWeight={500}>{po.orderNumber || `#${po.id}`}</Typography></TableCell>
                    <TableCell>{po.supplier?.name || '-'}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Chip
                        label={STATUS_LABELS[po.status] || po.status}
                        color={STATUS_COLORS[po.status] || 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{po.orderDate ? new Date(po.orderDate).toLocaleDateString('ru-RU') : '-'}</TableCell>
                    <TableCell align="right">€{(po.totalAmount || 0).toLocaleString()}</TableCell>
                    <TableCell align="right">{po.items?.length || po.itemCount || 0}</TableCell>
                    <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                      <IconButton size="small" onClick={() => handleOpenDetail(po)} title="Просмотр">
                        <Visibility fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Create Dialog */}
      <Dialog open={createOpen} onClose={handleCloseCreate} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Создание закупки
            <IconButton onClick={handleCloseCreate} disabled={submitting}><Close /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {formError && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setFormError(null)}>{formError}</Alert>}

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                label="Поставщик"
                value={form.supplierId}
                onChange={(e) => setForm({ ...form, supplierId: e.target.value as number | '' })}
                fullWidth
                required
              >
                {suppliers.map((s) => (
                  <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Номер заказа"
                value={form.orderNumber}
                onChange={(e) => setForm({ ...form, orderNumber: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                type="date"
                label="Ожидаемая дата поставки"
                value={form.expectedDeliveryDate}
                onChange={(e) => setForm({ ...form, expectedDeliveryDate: e.target.value })}
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Стоимость доставки"
                type="number"
                value={form.shippingCost}
                onChange={(e) => setForm({ ...form, shippingCost: Number(e.target.value) })}
                fullWidth
                slotProps={{ input: { startAdornment: <InputAdornment position="start">€</InputAdornment> } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Налог"
                type="number"
                value={form.taxAmount}
                onChange={(e) => setForm({ ...form, taxAmount: Number(e.target.value) })}
                fullWidth
                slotProps={{ input: { startAdornment: <InputAdornment position="start">€</InputAdornment> } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Заметки"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                fullWidth
                multiline
                maxRows={2}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" mb={2}>Позиции</Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {formItems.map((item, idx) => {
              const totalPrice = item.productId ? (item.quantity || 0) * (item.unitPrice || 0) : 0;
              return (
                <Box key={idx} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                  <TextField
                    select
                    label="Товар"
                    value={item.productId}
                    onChange={(e) => {
                      const v = Number(e.target.value) || '';
                      const updated = [...formItems];
                      updated[idx] = { ...updated[idx], productId: v };
                      setFormItems(updated);
                    }}
                    size="small"
                    sx={{ flex: 3, minWidth: 180 }}
                  >
                    {products.map((p) => (
                      <MenuItem key={p.id} value={p.id}>{p.name} ({p.sku})</MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    label="Кол-во"
                    type="number"
                    value={item.quantity}
                    onChange={(e) => {
                      const updated = [...formItems];
                      updated[idx] = { ...updated[idx], quantity: Number(e.target.value) };
                      setFormItems(updated);
                    }}
                    size="small"
                    sx={{ flex: 1, minWidth: 80 }}
                  />
                  <TextField
                    label="Цена"
                    type="number"
                    value={item.unitPrice}
                    onChange={(e) => {
                      const updated = [...formItems];
                      updated[idx] = { ...updated[idx], unitPrice: Number(e.target.value) };
                      setFormItems(updated);
                    }}
                    size="small"
                    slotProps={{ input: { startAdornment: <InputAdornment position="start">€</InputAdornment> } }}
                    sx={{ flex: 1, minWidth: 100 }}
                  />
                  <TextField
                    label="Сумма"
                    value={`€${totalPrice.toFixed(2)}`}
                    size="small"
                    sx={{ flex: 1, minWidth: 100 }}
                    slotProps={{ input: { readOnly: true } }}
                  />
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => setFormItems(formItems.filter((_, i) => i !== idx))}
                    disabled={submitting}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </Box>
              );
            })}
          </Box>

          <Button
            variant="outlined"
            size="small"
            startIcon={<Add />}
            onClick={() => setFormItems([...formItems, { ...NEW_ITEM_TEMPLATE }])}
            sx={{ mt: 1.5 }}
          >
            Добавить позицию
          </Button>

          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 4 }}>
                <Typography variant="body2" color="text.secondary">Позиций:</Typography>
                <Typography fontWeight={600}>{formItems.filter(i => i.productId).length}</Typography>
              </Grid>
              <Grid size={{ xs: 4 }}>
                <Typography variant="body2" color="text.secondary">Сумма товаров:</Typography>
                <Typography fontWeight={600}>€{formTotal.toFixed(2)}</Typography>
              </Grid>
              <Grid size={{ xs: 4 }}>
                <Typography variant="body2" color="text.secondary">Итого:</Typography>
                <Typography fontWeight={700} color="primary.main">
                  €{(formTotal + (form.shippingCost || 0) + (form.taxAmount || 0)).toFixed(2)}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreate} disabled={submitting}>Отмена</Button>
          <Button onClick={handleCreate} variant="contained" disabled={submitting}>
            {submitting ? <CircularProgress size={20} /> : 'Создать'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Detail Drawer */}
      <Drawer anchor="right" open={detailDrawer} onClose={handleCloseDetail} sx={{ '& .MuiDrawer-paper': { width: 700, maxWidth: '100vw' } }}>
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" fontWeight={700}>
              Закупка {detail?.orderNumber || `#${detail?.id}`}
            </Typography>
            <IconButton onClick={handleCloseDetail}><Close /></IconButton>
          </Box>

          {detailLoading && <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>}

          {detailError && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setDetailError(null)}>{detailError}</Alert>}

          {detail && !detailLoading && (
            <>
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid size={6}>
                      <Typography variant="body2" color="text.secondary">Поставщик</Typography>
                      <Typography fontWeight={500}>{detail.supplier?.name || '-'}</Typography>
                    </Grid>
                    <Grid size={6}>
                      <Typography variant="body2" color="text.secondary">Дата заказа</Typography>
                      <Typography>{detail.orderDate ? new Date(detail.orderDate).toLocaleDateString('ru-RU') : '-'}</Typography>
                    </Grid>
                    <Grid size={6}>
                      <Typography variant="body2" color="text.secondary">Ожидаемая дата</Typography>
                      <Typography>{detail.expectedDeliveryDate ? new Date(detail.expectedDeliveryDate).toLocaleDateString('ru-RU') : '-'}</Typography>
                    </Grid>
                    <Grid size={6}>
                      <Typography variant="body2" color="text.secondary">Статус</Typography>
                      <TextField
                        select
                        value={detail.status}
                        size="small"
                        onChange={(e) => handleStatusChange(detail.id, e.target.value)}
                        sx={{ minWidth: 160, mt: 0.5 }}
                      >
                        {Object.keys(STATUS_LABELS).map((s) => (
                          <MenuItem key={s} value={s}>{STATUS_LABELS[s]}</MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid size={6}>
                      <Typography variant="body2" color="text.secondary">Доставка</Typography>
                      <Typography>€{detail.shippingCost?.toFixed(2)}</Typography>
                    </Grid>
                    <Grid size={6}>
                      <Typography variant="body2" color="text.secondary">Налог</Typography>
                      <Typography>€{detail.taxAmount?.toFixed(2)}</Typography>
                    </Grid>
                    {detail.notes && (
                      <Grid size={12}>
                        <Typography variant="body2" color="text.secondary">Заметки</Typography>
                        <Typography>{detail.notes}</Typography>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="h6">Позиции</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button variant="outlined" size="small" startIcon={<Add />} onClick={handleAddItem}>
                    Добавить
                  </Button>
                  <Button variant="contained" color="success" size="small" onClick={handleReceiveAll}>
                    Принять всё
                  </Button>
                </Box>
              </Box>

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Товар</TableCell>
                      <TableCell align="right">Заказано</TableCell>
                      <TableCell align="right">Принято</TableCell>
                      <TableCell align="right">Цена</TableCell>
                      <TableCell align="right">Сумма</TableCell>
                      <TableCell align="center">Приёмка</TableCell>
                      <TableCell align="center">Удалить</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {detail.items.map((item) => {
                      const remaining = item.quantity - (item.receivedQuantity || 0);
                      const rq = receiveQuantities[item.id] ?? remaining;
                      return (
                        <TableRow key={item.id}>
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>{item.product?.name || `ID: ${item.productId}`}</Typography>
                            <Typography variant="caption" color="text.secondary">{item.product?.sku}</Typography>
                          </TableCell>
                          <TableCell align="right">{item.quantity}</TableCell>
                          <TableCell align="right">
                            <Chip
                              label={`${item.receivedQuantity || 0} / ${item.quantity}`}
                              size="small"
                              color={remaining <= 0 ? 'success' : 'default'}
                            />
                          </TableCell>
                          <TableCell align="right">€{item.unitPrice?.toFixed(2)}</TableCell>
                          <TableCell align="right">€{(item.quantity * item.unitPrice).toFixed(2)}</TableCell>
                          <TableCell align="center">
                            {remaining > 0 ? (
                              <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', justifyContent: 'center' }}>
                                <TextField
                                  type="number"
                                  size="small"
                                  value={rq}
                                  onChange={(e) => setReceiveQuantities({ ...receiveQuantities, [item.id]: Number(e.target.value) })}
                                  sx={{ width: 70 }}
                                  slotProps={{ htmlInput: { min: 1, max: remaining } }}
                                />
                                <Button
                                  size="small"
                                  variant="contained"
                                  onClick={() => handleReceiveItem(item.id, rq)}
                                >
                                  Принять
                                </Button>
                              </Box>
                            ) : (
                              <Chip label="Принято" size="small" color="success" />
                            )}
                          </TableCell>
                          <TableCell align="center">
                            <IconButton size="small" color="error" onClick={() => handleDeleteItem(item.id)}>
                              <Delete fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Grid container spacing={2}>
                  <Grid size={4}>
                    <Typography variant="body2" color="text.secondary">Позиций:</Typography>
                    <Typography fontWeight={600}>{detail.items.length}</Typography>
                  </Grid>
                  <Grid size={4}>
                    <Typography variant="body2" color="text.secondary">Сумма товаров:</Typography>
                    <Typography fontWeight={600}>
                      €{detail.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0).toFixed(2)}
                    </Typography>
                  </Grid>
                  <Grid size={4}>
                    <Typography variant="body2" color="text.secondary">Итого:</Typography>
                    <Typography fontWeight={700} color="primary.main">
                      €{(
                        detail.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0) +
                        (detail.shippingCost || 0) +
                        (detail.taxAmount || 0)
                      ).toFixed(2)}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </>
          )}
        </Box>
      </Drawer>

      <Snackbar
        open={!!snack}
        autoHideDuration={3000}
        onClose={() => setSnack(null)}
        message={snack}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </AppLayout>
  );
}