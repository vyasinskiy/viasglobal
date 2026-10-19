'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, Button, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Select, MenuItem, FormControl, InputLabel, Checkbox,
  FormControlLabel, Drawer, CircularProgress, Alert, Snackbar, Tooltip
} from '@mui/material';
import {
  History, Edit, Settings, SwapHoriz
} from '@mui/icons-material';
import { useAuth } from '@/lib/AuthContext';
import { api } from '@/lib/api';
import AppLayout from '@/components/AppLayout';

const WAREHOUSE_LABELS: Record<string, string> = { OWN: 'Свой', FBA: 'FBA', THIRD_PARTY: '3PL' };
const WAREHOUSE_COLORS: Record<string, 'primary' | 'info' | 'warning'> = {
  OWN: 'primary', FBA: 'info', THIRD_PARTY: 'warning',
};

const MOVEMENT_TYPE_LABELS: Record<string, string> = {
  IN: 'Поступление', OUT: 'Списание', RESERVE: 'Резерв', UNRESERVE: 'Снятие резерва',
  RETURN: 'Возврат', ADJUST: 'Корректировка',
};

const MOVEMENT_TYPE_COLORS: Record<string, string> = {
  IN: '#2e7d32', OUT: '#c62828', RESERVE: '#e65100', UNRESERVE: '#6a1b9a',
  RETURN: '#1565c0', ADJUST: '#546e7a',
};

interface InventoryItem {
  id: number; productId: number; sku: string; productName: string;
  warehouse: string; quantity: number; reserved: number; minStockLevel: number;
}

interface ProductOption { id: number; sku: string; name: string; }

interface MovementRecord {
  id: number; productId: number; sku: string; productName: string;
  type: string; quantity: number; warehouse: string; notes: string; createdAt: string;
}

export default function InventoryPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [warehouseFilter, setWarehouseFilter] = useState<string>('all');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  const [movementsOpen, setMovementsOpen] = useState(false);
  const [movements, setMovements] = useState<MovementRecord[]>([]);
  const [movementsLoading, setMovementsLoading] = useState(false);
  const [movementFilters, setMovementFilters] = useState<{
    productId: string; warehouse: string; type: string; dateFrom: string; dateTo: string;
  }>({ productId: '', warehouse: 'all', type: 'all', dateFrom: '', dateTo: '' });

  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustForm, setAdjustForm] = useState({ productId: '', warehouse: 'OWN', quantity: '', notes: '' });
  const [adjustLoading, setAdjustLoading] = useState(false);

  const [moveOpen, setMoveOpen] = useState(false);
  const [moveForm, setMoveForm] = useState({ productId: '', warehouse: 'OWN', type: 'IN', quantity: '', notes: '' });
  const [moveLoading, setMoveLoading] = useState(false);

  const [minStockOpen, setMinStockOpen] = useState(false);
  const [minStockForm, setMinStockForm] = useState({ productId: 0, warehouse: 'OWN', minStockLevel: '' });
  const [minStockLoading, setMinStockLoading] = useState(false);

  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  });

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<InventoryItem[]>('/inventory');
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setError('Ошибка загрузки остатков');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const data = await api.get<ProductOption[]>('/products');
      setProducts(Array.isArray(data) ? data : []);
    } catch { /* fallback */ }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) { router.push('/login'); return; }
    if (!user) return;
    fetchInventory();
    fetchProducts();
  }, [user, authLoading, router, fetchInventory, fetchProducts]);

  const filteredItems = items.filter((item) => {
    if (warehouseFilter !== 'all' && item.warehouse !== warehouseFilter) return false;
    if (lowStockOnly && item.quantity - item.reserved >= item.minStockLevel) return false;
    return true;
  });

  const fetchMovements = async () => {
    setMovementsLoading(true);
    try {
      const params = new URLSearchParams();
      if (movementFilters.productId) params.set('productId', movementFilters.productId);
      if (movementFilters.warehouse !== 'all') params.set('warehouse', movementFilters.warehouse);
      if (movementFilters.type !== 'all') params.set('type', movementFilters.type);
      if (movementFilters.dateFrom) params.set('dateFrom', movementFilters.dateFrom);
      if (movementFilters.dateTo) params.set('dateTo', movementFilters.dateTo);
      const qs = params.toString();
      const data = await api.get<MovementRecord[]>(`/inventory/movements${qs ? '?' + qs : ''}`);
      setMovements(Array.isArray(data) ? data : []);
    } catch {
      showSnackbar('Ошибка загрузки движений', 'error');
    } finally {
      setMovementsLoading(false);
    }
  };

  useEffect(() => {
    if (movementsOpen) fetchMovements();
  }, [movementsOpen]);

  const handleAdjust = async () => {
    if (!adjustForm.productId || !adjustForm.quantity) return;
    setAdjustLoading(true);
    try {
      await api.post('/inventory/adjust', {
        productId: Number(adjustForm.productId),
        warehouse: adjustForm.warehouse,
        quantity: Number(adjustForm.quantity),
        notes: adjustForm.notes || undefined,
      });
      showSnackbar('Остаток скорректирован', 'success');
      setAdjustOpen(false);
      setAdjustForm({ productId: '', warehouse: 'OWN', quantity: '', notes: '' });
      fetchInventory();
    } catch {
      showSnackbar('Ошибка корректировки', 'error');
    } finally {
      setAdjustLoading(false);
    }
  };

  const handleMove = async () => {
    if (!moveForm.productId || !moveForm.quantity) return;
    setMoveLoading(true);
    try {
      await api.post('/inventory/move', {
        productId: Number(moveForm.productId),
        warehouse: moveForm.warehouse,
        type: moveForm.type,
        quantity: Number(moveForm.quantity),
        notes: moveForm.notes || undefined,
      });
      showSnackbar('Операция выполнена', 'success');
      setMoveOpen(false);
      setMoveForm({ productId: '', warehouse: 'OWN', type: 'IN', quantity: '', notes: '' });
      fetchInventory();
    } catch {
      showSnackbar('Ошибка операции', 'error');
    } finally {
      setMoveLoading(false);
    }
  };

  const handleMinStock = async () => {
    setMinStockLoading(true);
    try {
      await api.patch('/inventory/' + minStockForm.productId + '/min-stock', {
        warehouse: minStockForm.warehouse,
        minStockLevel: Number(minStockForm.minStockLevel),
      });
      showSnackbar('Мин. остаток обновлен', 'success');
      setMinStockOpen(false);
      fetchInventory();
    } catch {
      showSnackbar('Ошибка', 'error');
    } finally {
      setMinStockLoading(false);
    }
  };

  const openMinStockDialog = (item: InventoryItem) => {
    setMinStockForm({
      productId: item.productId,
      warehouse: item.warehouse || 'OWN',
      minStockLevel: String(item.minStockLevel || 0),
    });
    setMinStockOpen(true);
  };

  if (authLoading || loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;
  if (!user) return null;

  return (
    <AppLayout>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 2, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Склад</InputLabel>
            <Select
              value={warehouseFilter}
              label="Склад"
              onChange={(e) => setWarehouseFilter(e.target.value)}
            >
              <MenuItem value="all">Все склады</MenuItem>
              <MenuItem value="OWN">Свой</MenuItem>
              <MenuItem value="FBA">FBA</MenuItem>
              <MenuItem value="THIRD_PARTY">3PL</MenuItem>
            </Select>
          </FormControl>
          <FormControlLabel
            control={<Checkbox checked={lowStockOnly} onChange={(e) => setLowStockOnly(e.target.checked)} />}
            label="Только низкий остаток"
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button variant="outlined" startIcon={<History />} onClick={() => setMovementsOpen(true)}>
            Движения
          </Button>
          <Button variant="outlined" startIcon={<Edit />} onClick={() => setAdjustOpen(true)}>
            Корректировка
          </Button>
          <Button variant="outlined" startIcon={<SwapHoriz />} onClick={() => setMoveOpen(true)}>
            Перемещение
          </Button>
        </Box>
      </Box>

      <Card>
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Товар</TableCell>
                  <TableCell>Склад</TableCell>
                  <TableCell align="right">Количество</TableCell>
                  <TableCell align="right">Зарезервировано</TableCell>
                  <TableCell align="right">Доступно</TableCell>
                  <TableCell align="right">Мин. остаток</TableCell>
                  <TableCell align="center">Статус</TableCell>
                  <TableCell align="center">Действия</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography color="text.secondary" sx={{ py: 4 }}>Нет данных</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item) => {
                    const available = (item.quantity || 0) - (item.reserved || 0);
                    const isLow = available <= (item.minStockLevel || 0);
                    return (
                      <TableRow key={item.productId + '-' + item.warehouse} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>{item.sku || '-'}</Typography>
                          <Typography variant="body2" color="text.secondary">{item.productName || '-'}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={WAREHOUSE_LABELS[item.warehouse] || item.warehouse}
                            color={WAREHOUSE_COLORS[item.warehouse] || 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">{item.quantity || 0}</TableCell>
                        <TableCell align="right">{item.reserved || 0}</TableCell>
                        <TableCell align="right">
                          <Typography fontWeight={600} color={isLow ? 'error.main' : 'text.primary'}>
                            {available}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">{item.minStockLevel || 0}</TableCell>
                        <TableCell align="center">
                          {isLow ? (
                            <Chip label="Низкий остаток" color="warning" size="small" />
                          ) : (
                            <Chip label="ОК" color="success" variant="outlined" size="small" />
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Уст. мин. остаток">
                            <IconButton size="small" onClick={() => openMinStockDialog(item)}>
                              <Settings fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Движения Drawer */}
      <Drawer anchor="right" open={movementsOpen} onClose={() => setMovementsOpen(false)}>
        <Box sx={{ width: 800, maxWidth: '100vw', p: 3 }}>
          <Typography variant="h6" mb={2}>Движения товаров</Typography>

          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Товар</InputLabel>
              <Select
                value={movementFilters.productId}
                label="Товар"
                onChange={(e) => setMovementFilters({ ...movementFilters, productId: e.target.value })}
              >
                <MenuItem value="">Все</MenuItem>
                {products.map((p) => (
                  <MenuItem key={p.id} value={String(p.id)}>{p.sku} - {p.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Склад</InputLabel>
              <Select
                value={movementFilters.warehouse}
                label="Склад"
                onChange={(e) => setMovementFilters({ ...movementFilters, warehouse: e.target.value })}
              >
                <MenuItem value="all">Все</MenuItem>
                <MenuItem value="OWN">Свой</MenuItem>
                <MenuItem value="FBA">FBA</MenuItem>
                <MenuItem value="THIRD_PARTY">3PL</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Тип</InputLabel>
              <Select
                value={movementFilters.type}
                label="Тип"
                onChange={(e) => setMovementFilters({ ...movementFilters, type: e.target.value })}
              >
                <MenuItem value="all">Все</MenuItem>
                {Object.entries(MOVEMENT_TYPE_LABELS).map(([value, label]) => (
                  <MenuItem key={value} value={value}>{label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="С"
              type="date"
              size="small"
              InputLabelProps={{ shrink: true }}
              value={movementFilters.dateFrom}
              onChange={(e) => setMovementFilters({ ...movementFilters, dateFrom: e.target.value })}
            />
            <TextField
              label="По"
              type="date"
              size="small"
              InputLabelProps={{ shrink: true }}
              value={movementFilters.dateTo}
              onChange={(e) => setMovementFilters({ ...movementFilters, dateTo: e.target.value })}
            />
            <Button variant="contained" size="small" onClick={fetchMovements}>
              Применить
            </Button>
          </Box>

          {movementsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
          ) : (
            <TableContainer sx={{ maxHeight: 'calc(100vh - 250px)' }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Дата</TableCell>
                    <TableCell>Товар</TableCell>
                    <TableCell>Тип</TableCell>
                    <TableCell align="right">Кол-во</TableCell>
                    <TableCell>Склад</TableCell>
                    <TableCell>Примечание</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {movements.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography color="text.secondary" sx={{ py: 2 }}>Нет данных</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    movements.map((m) => (
                      <TableRow key={m.id} hover>
                        <TableCell>{new Date(m.createdAt).toLocaleDateString('ru-RU')}</TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>{m.sku}</Typography>
                          <Typography variant="body2" color="text.secondary">{m.productName}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={MOVEMENT_TYPE_LABELS[m.type] || m.type}
                            size="small"
                            sx={{ bgcolor: MOVEMENT_TYPE_COLORS[m.type] || '#757575', color: '#fff' }}
                          />
                        </TableCell>
                        <TableCell align="right">{m.quantity}</TableCell>
                        <TableCell>{WAREHOUSE_LABELS[m.warehouse] || m.warehouse}</TableCell>
                        <TableCell>{m.notes || '-'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Drawer>

      {/* Корректировка Dialog */}
      <Dialog open={adjustOpen} onClose={() => setAdjustOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Корректировка остатка</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Товар</InputLabel>
              <Select
                value={adjustForm.productId}
                label="Товар"
                onChange={(e) => setAdjustForm({ ...adjustForm, productId: e.target.value })}
              >
                {products.map((p) => (
                  <MenuItem key={p.id} value={String(p.id)}>{p.sku} - {p.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Склад</InputLabel>
              <Select
                value={adjustForm.warehouse}
                label="Склад"
                onChange={(e) => setAdjustForm({ ...adjustForm, warehouse: e.target.value })}
              >
                <MenuItem value="OWN">Свой</MenuItem>
                <MenuItem value="FBA">FBA</MenuItem>
                <MenuItem value="THIRD_PARTY">3PL</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Новое количество"
              type="number"
              fullWidth
              value={adjustForm.quantity}
              onChange={(e) => setAdjustForm({ ...adjustForm, quantity: e.target.value })}
            />
            <TextField
              label="Примечание"
              fullWidth
              multiline
              rows={2}
              value={adjustForm.notes}
              onChange={(e) => setAdjustForm({ ...adjustForm, notes: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAdjustOpen(false)}>Отмена</Button>
          <Button variant="contained" onClick={handleAdjust} disabled={adjustLoading || !adjustForm.productId || !adjustForm.quantity}>
            {adjustLoading ? <CircularProgress size={20} /> : 'Сохранить'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Перемещение Dialog */}
      <Dialog open={moveOpen} onClose={() => setMoveOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Перемещение товара</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Товар</InputLabel>
              <Select
                value={moveForm.productId}
                label="Товар"
                onChange={(e) => setMoveForm({ ...moveForm, productId: e.target.value })}
              >
                {products.map((p) => (
                  <MenuItem key={p.id} value={String(p.id)}>{p.sku} - {p.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Склад</InputLabel>
              <Select
                value={moveForm.warehouse}
                label="Склад"
                onChange={(e) => setMoveForm({ ...moveForm, warehouse: e.target.value })}
              >
                <MenuItem value="OWN">Свой</MenuItem>
                <MenuItem value="FBA">FBA</MenuItem>
                <MenuItem value="THIRD_PARTY">3PL</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Тип операции</InputLabel>
              <Select
                value={moveForm.type}
                label="Тип операции"
                onChange={(e) => setMoveForm({ ...moveForm, type: e.target.value })}
              >
                {Object.entries(MOVEMENT_TYPE_LABELS).map(([value, label]) => (
                  <MenuItem key={value} value={value}>{label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Количество"
              type="number"
              fullWidth
              value={moveForm.quantity}
              onChange={(e) => setMoveForm({ ...moveForm, quantity: e.target.value })}
            />
            <TextField
              label="Примечание"
              fullWidth
              multiline
              rows={2}
              value={moveForm.notes}
              onChange={(e) => setMoveForm({ ...moveForm, notes: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMoveOpen(false)}>Отмена</Button>
          <Button variant="contained" onClick={handleMove} disabled={moveLoading || !moveForm.productId || !moveForm.quantity}>
            {moveLoading ? <CircularProgress size={20} /> : 'Выполнить'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Мин. остаток Dialog */}
      <Dialog open={minStockOpen} onClose={() => setMinStockOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Установить мин. остаток</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Склад</InputLabel>
              <Select
                value={minStockForm.warehouse}
                label="Склад"
                onChange={(e) => setMinStockForm({ ...minStockForm, warehouse: e.target.value })}
              >
                <MenuItem value="OWN">Свой</MenuItem>
                <MenuItem value="FBA">FBA</MenuItem>
                <MenuItem value="THIRD_PARTY">3PL</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Мин. остаток"
              type="number"
              fullWidth
              value={minStockForm.minStockLevel}
              onChange={(e) => setMinStockForm({ ...minStockForm, minStockLevel: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMinStockOpen(false)}>Отмена</Button>
          <Button variant="contained" onClick={handleMinStock} disabled={minStockLoading || !minStockForm.minStockLevel}>
            {minStockLoading ? <CircularProgress size={20} /> : 'Сохранить'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </AppLayout>
  );
}
