'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Typography, Button, TextField, Table, TableHead, TableBody, TableRow, TableCell,
  Paper, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions,
  Drawer, Select, MenuItem, FormControl, InputLabel, Chip, IconButton, Grid,
  Divider, Alert, InputAdornment
} from '@mui/material';
import { Add, Edit, Delete, Close, Search, Link as LinkIcon } from '@mui/icons-material';
import { useAuth } from '@/lib/AuthContext';
import { api } from '@/lib/api';
import AppLayout from '@/components/AppLayout';

export default function ProductsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [products, setProducts] = useState<any[]>([]);
  const [platforms, setPlatforms] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [detailProduct, setDetailProduct] = useState<any | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const emptyForm = { sku: '', name: '', description: '', brand: '', manufacturer: '', category: '', imageUrl: '' };
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [externalForm, setExternalForm] = useState({ platformId: '', externalId: '' });

  const [priceOpen, setPriceOpen] = useState(false);
  const emptyPrice = { supplierId: '', costPrice: '', supplierSku: '', unitsPerBox: '', minOrderQty: '', validFrom: '', validTo: '' };
  const [priceForm, setPriceForm] = useState(emptyPrice);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<any[]>('/products');
      setProducts(data || []);
    } catch (e: any) {
      setError(e?.message || 'Ошибка загрузки товаров');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPlatforms = useCallback(async () => {
    try {
      const data = await api.get<any[]>('/products/platforms');
      setPlatforms(data || []);
    } catch { /* ignore */ }
  }, []);

  const fetchSuppliers = useCallback(async () => {
    try {
      const data = await api.get<any[]>('/suppliers');
      setSuppliers(data || []);
    } catch { /* ignore */ }
  }, []);

  const fetchDetail = useCallback(async (id: number) => {
    try {
      const data = await api.get<any>(`/products/${id}`);
      setDetailProduct(data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) { router.push('/login'); return; }
    if (!user) return;
    fetchProducts();
    fetchPlatforms();
    fetchSuppliers();
  }, [user, authLoading, router, fetchProducts, fetchPlatforms, fetchSuppliers]);

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setCreateOpen(true);
  };

  const openEdit = (p: any) => {
    setForm({
      sku: p.sku || '', name: p.name || '', description: p.description || '',
      brand: p.brand || '', manufacturer: p.manufacturer || '', category: p.category || '', imageUrl: p.imageUrl || '',
    });
    setEditingId(p.id);
    setEditOpen(true);
  };

  const submitCreate = async () => {
    try {
      await api.post('/products', form);
      setCreateOpen(false);
      fetchProducts();
    } catch (e: any) {
      setError(e?.message || 'Ошибка создания товара');
    }
  };

  const submitEdit = async () => {
    try {
      await api.patch(`/products/${editingId}`, form);
      setEditOpen(false);
      fetchProducts();
      if (detailProduct?.id === editingId) fetchDetail(editingId!);
    } catch (e: any) {
      setError(e?.message || 'Ошибка обновления товара');
    }
  };

  const deleteProduct = async (id: number) => {
    if (!confirm('Удалить товар?')) return;
    try {
      await api.delete(`/products/${id}`);
      fetchProducts();
      if (detailProduct?.id === id) setDetailOpen(false);
    } catch (e: any) {
      setError(e?.message || 'Ошибка удаления товара');
    }
  };

  const openDetail = (p: any) => {
    setDetailProduct(p);
    setDetailOpen(true);
    fetchDetail(p.id);
  };

  const addExternalId = async () => {
    if (!detailProduct) return;
    try {
      await api.post(`/products/${detailProduct.id}/external-ids`, {
        platformId: externalForm.platformId,
        externalId: externalForm.externalId,
      });
      setExternalForm({ platformId: '', externalId: '' });
      fetchDetail(detailProduct.id);
      fetchProducts();
    } catch (e: any) {
      setError(e?.message || 'Ошибка добавления внешнего ID');
    }
  };

  const deleteExternalId = async (id: number) => {
    try {
      await api.delete(`/products/external-ids/${id}`);
      if (detailProduct) fetchDetail(detailProduct.id);
    } catch (e: any) {
      setError(e?.message || 'Ошибка удаления внешнего ID');
    }
  };

  const openPrice = () => {
    setPriceForm(emptyPrice);
    setPriceOpen(true);
  };

  const submitPrice = async () => {
    if (!detailProduct) return;
    try {
      await api.post('/products/supplier-prices', {
        supplierId: priceForm.supplierId,
        productId: detailProduct.id,
        costPrice: priceForm.costPrice,
        supplierSku: priceForm.supplierSku || undefined,
        unitsPerBox: priceForm.unitsPerBox || undefined,
        minOrderQty: priceForm.minOrderQty || undefined,
        validFrom: priceForm.validFrom || undefined,
        validTo: priceForm.validTo || undefined,
      });
      setPriceOpen(false);
      fetchDetail(detailProduct.id);
    } catch (e: any) {
      setError(e?.message || 'Ошибка добавления цены');
    }
  };

  const deletePrice = async (id: number) => {
    try {
      await api.delete(`/products/supplier-prices/${id}`);
      if (detailProduct) fetchDetail(detailProduct.id);
    } catch (e: any) {
      setError(e?.message || 'Ошибка удаления цены');
    }
  };

  const filtered = products.filter((p) => {
    const s = search.toLowerCase();
    return (
      (p.sku || '').toLowerCase().includes(s) ||
      (p.name || '').toLowerCase().includes(s) ||
      (p.brand || '').toLowerCase().includes(s)
    );
  });

  const setFormField = (key: string) => (e: any) => setForm((f) => ({ ...f, [key]: e.target.value }));

  if (authLoading || (user && loading)) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;
  }
  if (!user) return null;

  return (
    <AppLayout>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h5" fontWeight={700}>Товары</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate}>Добавить товар</Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      <TextField
        fullWidth
        size="small"
        placeholder="Поиск по названию / SKU / бренду"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 2 }}
        InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
      />

      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>SKU</TableCell>
              <TableCell>Название</TableCell>
              <TableCell>Бренд</TableCell>
              <TableCell>Категория</TableCell>
              <TableCell>Платформы</TableCell>
              <TableCell>Поставщики</TableCell>
              <TableCell>Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((p) => (
              <TableRow key={p.id} hover sx={{ cursor: 'pointer' }} onClick={() => openDetail(p)}>
                <TableCell>{p.sku}</TableCell>
                <TableCell>{p.name}</TableCell>
                <TableCell>{p.brand || '—'}</TableCell>
                <TableCell>{p.category || '—'}</TableCell>
                <TableCell><Chip size="small" label={p.externalIds?.length ?? 0} /></TableCell>
                <TableCell><Chip size="small" label={p.supplierPrices?.length ?? 0} color="primary" /></TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <IconButton size="small" onClick={() => openEdit(p)}><Edit fontSize="small" /></IconButton>
                  <IconButton size="small" color="error" onClick={() => deleteProduct(p.id)}><Delete fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={7} align="center">Нет товаров</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Добавить товар</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="SKU" required value={form.sku} onChange={setFormField('sku')} />
            <TextField label="Название" required value={form.name} onChange={setFormField('name')} />
            <TextField label="Описание" multiline minRows={3} value={form.description} onChange={setFormField('description')} />
            <TextField label="Бренд" value={form.brand} onChange={setFormField('brand')} />
            <TextField label="Производитель" value={form.manufacturer} onChange={setFormField('manufacturer')} />
            <TextField label="Категория" value={form.category} onChange={setFormField('category')} />
            <TextField label="URL изображения" value={form.imageUrl} onChange={setFormField('imageUrl')} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Отмена</Button>
          <Button variant="contained" disabled={!form.sku || !form.name} onClick={submitCreate}>Создать</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Редактировать товар</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="SKU" required value={form.sku} onChange={setFormField('sku')} />
            <TextField label="Название" required value={form.name} onChange={setFormField('name')} />
            <TextField label="Описание" multiline minRows={3} value={form.description} onChange={setFormField('description')} />
            <TextField label="Бренд" value={form.brand} onChange={setFormField('brand')} />
            <TextField label="Производитель" value={form.manufacturer} onChange={setFormField('manufacturer')} />
            <TextField label="Категория" value={form.category} onChange={setFormField('category')} />
            <TextField label="URL изображения" value={form.imageUrl} onChange={setFormField('imageUrl')} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Отмена</Button>
          <Button variant="contained" disabled={!form.sku || !form.name} onClick={submitEdit}>Сохранить</Button>
        </DialogActions>
      </Dialog>

      <Drawer anchor="right" open={detailOpen} onClose={() => setDetailOpen(false)}>
        <Box sx={{ width: 640, maxWidth: '100vw', p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" fontWeight={700}>{detailProduct?.name || 'Товар'}</Typography>
            <IconButton onClick={() => setDetailOpen(false)}><Close /></IconButton>
          </Box>

          <Typography variant="subtitle1" fontWeight={700}>Основная информация</Typography>
          <Grid container spacing={1} sx={{ mb: 2 }}>
            <Grid size={{ xs: 6 }}><Typography variant="body2" color="text.secondary">SKU</Typography><Typography>{detailProduct?.sku}</Typography></Grid>
            <Grid size={{ xs: 6 }}><Typography variant="body2" color="text.secondary">Бренд</Typography><Typography>{detailProduct?.brand || '—'}</Typography></Grid>
            <Grid size={{ xs: 6 }}><Typography variant="body2" color="text.secondary">Производитель</Typography><Typography>{detailProduct?.manufacturer || '—'}</Typography></Grid>
            <Grid size={{ xs: 6 }}><Typography variant="body2" color="text.secondary">Категория</Typography><Typography>{detailProduct?.category || '—'}</Typography></Grid>
            {detailProduct?.description && (
              <Grid size={{ xs: 12 }}><Typography variant="body2" color="text.secondary">Описание</Typography><Typography>{detailProduct.description}</Typography></Grid>
            )}
            {detailProduct?.imageUrl && (
              <Grid size={{ xs: 12 }}><Typography variant="body2" color="text.secondary">Изображение</Typography><Typography variant="body2" sx={{ wordBreak: 'break-all' }}>{detailProduct.imageUrl}</Typography></Grid>
            )}
          </Grid>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle1" fontWeight={700}>Внешние ID</Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Платформа</InputLabel>
              <Select
                value={externalForm.platformId}
                label="Платформа"
                onChange={(e) => setExternalForm((f) => ({ ...f, platformId: e.target.value }))}
              >
                {platforms.map((pl) => (
                  <MenuItem key={pl.id} value={pl.id}>{pl.name || pl.code}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField size="small" label="Внешний ID" value={externalForm.externalId} onChange={(e) => setExternalForm((f) => ({ ...f, externalId: e.target.value }))} />
            <Button variant="contained" startIcon={<LinkIcon />} disabled={!externalForm.platformId || !externalForm.externalId} onClick={addExternalId}>Добавить</Button>
          </Box>
          {(detailProduct?.externalIds || []).map((ex: any) => (
            <Box key={ex.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 0.5 }}>
              <Box>
                <Chip size="small" label={ex.platform?.name || ex.platform?.code || ex.platformId} sx={{ mr: 1 }} />
                <Typography component="span" variant="body2">{ex.externalId}</Typography>
              </Box>
              <IconButton size="small" onClick={() => deleteExternalId(ex.id)}><Delete fontSize="small" /></IconButton>
            </Box>
          ))}

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1" fontWeight={700}>Цены поставщиков</Typography>
            <Button size="small" startIcon={<Add />} onClick={openPrice}>Добавить</Button>
          </Box>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Поставщик</TableCell>
                <TableCell>SKU</TableCell>
                <TableCell>Цена</TableCell>
                <TableCell>Уп./кор.</TableCell>
                <TableCell>Мин. заказ</TableCell>
                <TableCell>Действ.</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {(detailProduct?.supplierPrices || []).map((sp: any) => (
                <TableRow key={sp.id}>
                  <TableCell>{sp.supplier?.name || sp.supplierId}</TableCell>
                  <TableCell>{sp.supplierSku || '—'}</TableCell>
                  <TableCell>{sp.costPrice != null ? `€${sp.costPrice}` : '—'}</TableCell>
                  <TableCell>{sp.unitsPerBox || '—'}</TableCell>
                  <TableCell>{sp.minOrderQty || '—'}</TableCell>
                  <TableCell>
                    {sp.validFrom || sp.validTo
                      ? `${sp.validFrom || ''} – ${sp.validTo || ''}`
                      : '—'}
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" color="error" onClick={() => deletePrice(sp.id)}><Delete fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {(detailProduct?.supplierPrices || []).length === 0 && (
                <TableRow><TableCell colSpan={7} align="center">Нет цен</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
      </Drawer>

      <Dialog open={priceOpen} onClose={() => setPriceOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Добавить цену поставщика</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Поставщик</InputLabel>
              <Select
                value={priceForm.supplierId}
                label="Поставщик"
                onChange={(e) => setPriceForm((f) => ({ ...f, supplierId: e.target.value }))}
              >
                {suppliers.map((s) => (
                  <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField label="Цена закупки" type="number" value={priceForm.costPrice} onChange={(e) => setPriceForm((f) => ({ ...f, costPrice: e.target.value }))} />
            <TextField label="SKU поставщика" value={priceForm.supplierSku} onChange={(e) => setPriceForm((f) => ({ ...f, supplierSku: e.target.value }))} />
            <TextField label="Единиц в коробке" type="number" value={priceForm.unitsPerBox} onChange={(e) => setPriceForm((f) => ({ ...f, unitsPerBox: e.target.value }))} />
            <TextField label="Мин. кол-во заказа" type="number" value={priceForm.minOrderQty} onChange={(e) => setPriceForm((f) => ({ ...f, minOrderQty: e.target.value }))} />
            <TextField label="Действует с" type="date" InputLabelProps={{ shrink: true }} value={priceForm.validFrom} onChange={(e) => setPriceForm((f) => ({ ...f, validFrom: e.target.value }))} />
            <TextField label="Действует по" type="date" InputLabelProps={{ shrink: true }} value={priceForm.validTo} onChange={(e) => setPriceForm((f) => ({ ...f, validTo: e.target.value }))} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPriceOpen(false)}>Отмена</Button>
          <Button variant="contained" disabled={!priceForm.supplierId || !priceForm.costPrice} onClick={submitPrice}>Сохранить</Button>
        </DialogActions>
      </Dialog>
    </AppLayout>
  );
}