// ecommerce/crm/app/inventory/page.tsx
// Раздел «Склад СВХ / MAIN»: управление остатками, алерты пополнения СВХ (<= 1 шт), перемещения MAIN -> SVH и журнал StockMovement
'use client';
import * as React from 'react';
import { useState } from 'react';
import useSWR from 'swr';
import axios from 'axios';
import styles from '../shared-table.module.css';

// Компоненты Material UI
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

export default function InventoryPage() {
  // Вкладка: 'stocks' (остатки) или 'movements' (журнал движений)
  const [tab, setTab] = useState<'stocks' | 'movements'>('stocks');
  const [warehouseFilter, setWarehouseFilter] = useState<string>('');
  const [search, setSearch] = useState<string>('');

  // Модальное окно перемещения между складами
  const [transferOpen, setTransferOpen] = useState<boolean>(false);
  const [tfSku, setTfSku] = useState<string>('');
  const [tfFrom, setTfFrom] = useState<string>('MAIN');
  const [tfTo, setTfTo] = useState<string>('SVH');
  const [tfQty, setTfQty] = useState<string>('3');
  const [tfNotes, setTfNotes] = useState<string>('');

  const { data: stocksRes, mutate: mutateStocks } = useSWR(
    `/api/backend/inventory/stocks${warehouseFilter ? `?warehouse=${warehouseFilter}` : ''}`,
    fetcher
  );
  const { data: alertsRes, mutate: mutateAlerts } = useSWR('/api/backend/inventory/alerts', fetcher);
  const { data: movementsRes, mutate: mutateMovements } = useSWR(
    '/api/backend/inventory/movements?limit=100',
    fetcher
  );

  const stocks = (stocksRes?.stocks || []).filter((st: any) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      st.sku?.toLowerCase().includes(q) ||
      st.title?.toLowerCase().includes(q) ||
      st.asin?.toLowerCase().includes(q) ||
      st.brand?.toLowerCase().includes(q)
    );
  });

  const alerts = alertsRes?.alerts || [];
  const movements = movementsRes?.movements || [];

  // Быстрое пополнение СВХ по алерту (MAIN -> SVH)
  const handleQuickReplenish = async (al: any) => {
    const qty = al.recommendedTransferQty || 3;
    if (
      !confirm(
        `Подтверждаете внутреннее перемещение ${qty} шт товара SKU ${al.sku} (${al.title || ''}) с Основного склада (MAIN) на склад СВХ (SVH)?`
      )
    ) {
      return;
    }
    try {
      await axios.post('/api/backend/inventory/transfer', {
        sku: al.sku,
        fromWarehouse: 'MAIN',
        toWarehouse: 'SVH',
        quantity: qty,
        notes: 'Пополнение оперативного буфера СВХ по алерту',
      });
      await Promise.all([mutateStocks(), mutateAlerts(), mutateMovements()]);
      alert(`Перемещение ${qty} шт SKU ${al.sku} со склада MAIN на СВХ успешно выполнено!`);
    } catch (err: any) {
      alert(`Ошибка перемещения: ${err?.response?.data?.message || err?.message}`);
    }
  };

  // Отправка произвольного перемещения из модального окна
  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tfSku.trim()) return;
    if (
      !confirm(
        `Подтверждаете перемещение ${tfQty} шт артикула SKU ${tfSku} со склада ${tfFrom} на склад ${tfTo}?`
      )
    ) {
      return;
    }
    try {
      await axios.post('/api/backend/inventory/transfer', {
        sku: tfSku.trim(),
        fromWarehouse: tfFrom,
        toWarehouse: tfTo,
        quantity: Number(tfQty),
        notes: tfNotes.trim() || undefined,
      });
      await Promise.all([mutateStocks(), mutateAlerts(), mutateMovements()]);
      setTransferOpen(false);
    } catch (err: any) {
      alert(`Ошибка перемещения: ${err?.response?.data?.message || err?.message}`);
    }
  };

  return (
    <div className={styles.container}>
      {/* Панель активных алертов СВХ */}
      {alerts.length > 0 && (
        <div
          className={styles.kpiBox}
          style={{ borderColor: '#fca5a5', backgroundColor: '#fef2f2' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b91c1c', fontWeight: 800 }}>
            <WarningAmberIcon />
            Алерты окончания оперативного буфера СВХ (остаток ≤ 1 шт): {alerts.length} поз.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
            {alerts.map((al: any) => (
              <div
                key={al.sku}
                style={{
                  background: '#ffffff',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #fecaca',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '10px',
                }}
              >
                <span style={{ fontSize: '0.86rem', color: '#7f1d1d' }}>{al.message}</span>
                {al.status === 'NEEDS_TRANSFER' && (
                  <button
                    className={styles.successBtn}
                    onClick={() => handleQuickReplenish(al)}
                  >
                    <SwapHorizIcon fontSize="small" />
                    Пополнить СВХ (+{al.recommendedTransferQty} шт из MAIN)
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Панель вкладок и фильтров */}
      <div className={styles.filterCard}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className={tab === 'stocks' ? styles.primaryBtn : styles.secondaryBtn}
            onClick={() => setTab('stocks')}
          >
            Складские остатки (SVH / MAIN)
          </button>
          <button
            className={tab === 'movements' ? styles.primaryBtn : styles.secondaryBtn}
            onClick={() => setTab('movements')}
          >
            Журнал движений (StockMovement)
          </button>
        </div>

        <div className={styles.searchWrapper}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Поиск по SKU, ASIN, названию товара..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {tab === 'stocks' && (
            <select
              className={styles.searchInput}
              style={{ width: 'auto' }}
              value={warehouseFilter}
              onChange={(e) => setWarehouseFilter(e.target.value)}
            >
              <option value="">Все склады (SVH + MAIN)</option>
              <option value="SVH">Склад СВХ (Оперативный буфер FBM)</option>
              <option value="MAIN">Склад MAIN (Основной склад хранения)</option>
              <option value="FBA">Склад FBA (Amazon)</option>
            </select>
          )}
          <button className={styles.primaryBtn} onClick={() => setTransferOpen(true)}>
            <SwapHorizIcon fontSize="small" />
            Перемещение между складами
          </button>
        </div>
      </div>

      {/* Таблица остатков */}
      {tab === 'stocks' ? (
        <TableContainer component={Paper} className={styles.tableCard}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell style={{ fontWeight: 700 }}>Склад</TableCell>
                <TableCell style={{ fontWeight: 700 }}>SKU поставщика</TableCell>
                <TableCell style={{ fontWeight: 700 }}>ASIN / Бренд</TableCell>
                <TableCell style={{ fontWeight: 700 }}>Наименование товара</TableCell>
                <TableCell style={{ fontWeight: 700 }}>В наличии (Quantity)</TableCell>
                <TableCell style={{ fontWeight: 700 }}>Порог алерта</TableCell>
                <TableCell style={{ fontWeight: 700 }}>Цена Buy Box</TableCell>
                <TableCell style={{ fontWeight: 700 }}>Обновлено</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {stocks.length > 0 ? (
                stocks.map((st: any) => (
                  <TableRow key={st.id}>
                    <TableCell>
                      <span
                        className={
                          st.warehouse === 'SVH' ? styles.badgeInfo : styles.badgeNeutral
                        }
                      >
                        {st.warehouse}
                      </span>
                    </TableCell>
                    <TableCell style={{ fontWeight: 800 }}>{st.sku}</TableCell>
                    <TableCell>
                      {st.asin ? (
                        <a
                          href={`https://www.amazon.es/dp/${st.asin}`}
                          target="_blank"
                          rel="noreferrer"
                          className="link"
                        >
                          {st.asin}
                        </a>
                      ) : (
                        '—'
                      )}
                      {st.brand && (
                        <div style={{ fontSize: '0.73rem', color: '#64748b' }}>{st.brand}</div>
                      )}
                    </TableCell>
                    <TableCell style={{ fontWeight: 600 }}>{st.title || '—'}</TableCell>
                    <TableCell>
                      <span
                        className={
                          st.warehouse === 'SVH' && st.isLowStock
                            ? styles.badgeDanger
                            : styles.badgeSuccess
                        }
                      >
                        {st.quantity} шт
                      </span>
                    </TableCell>
                    <TableCell>{st.minStockAlert} шт</TableCell>
                    <TableCell style={{ fontWeight: 700 }}>
                      {st.buyBoxPrice != null ? `${Number(st.buyBoxPrice).toFixed(2)} €` : '—'}
                    </TableCell>
                    <TableCell>
                      {new Date(st.updatedAt).toLocaleString('ru-RU')}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <div className={styles.emptyState}>Остатки на складах не найдены</div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        /* Журнал складских движений */
        <TableContainer component={Paper} className={styles.tableCard}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell style={{ fontWeight: 700 }}>Дата и время</TableCell>
                <TableCell style={{ fontWeight: 700 }}>Тип операции</TableCell>
                <TableCell style={{ fontWeight: 700 }}>SKU / ASIN</TableCell>
                <TableCell style={{ fontWeight: 700 }}>Маршрут (Откуда ➔ Куда)</TableCell>
                <TableCell style={{ fontWeight: 700 }}>Кол-во</TableCell>
                <TableCell style={{ fontWeight: 700 }}>Основание / Заказ</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {movements.length > 0 ? (
                movements.map((mv: any) => (
                  <TableRow key={mv.id}>
                    <TableCell>{new Date(mv.createdAt).toLocaleString('ru-RU')}</TableCell>
                    <TableCell>
                      <span
                        className={
                          mv.type === 'RECEIPT'
                            ? styles.badgeSuccess
                            : mv.type === 'SALE_OUT'
                            ? styles.badgeWarning
                            : styles.badgeInfo
                        }
                      >
                        {mv.type}
                      </span>
                    </TableCell>
                    <TableCell style={{ fontWeight: 700 }}>
                      {mv.sku} {mv.asin?.code ? `(${mv.asin.code})` : ''}
                    </TableCell>
                    <TableCell>
                      {mv.fromWarehouse || 'Поставщик'} ➔ {mv.toWarehouse || 'Покупатель'}
                    </TableCell>
                    <TableCell style={{ fontWeight: 800 }}>{mv.quantity} шт</TableCell>
                    <TableCell style={{ color: '#475569' }}>{mv.notes || '—'}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <div className={styles.emptyState}>Движения по складам отсутствуют</div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Модальное окно перемещения между складами */}
      <Dialog open={transferOpen} onClose={() => setTransferOpen(false)} maxWidth="xs" fullWidth>
        <form onSubmit={handleTransferSubmit}>
          <DialogTitle style={{ fontWeight: 800 }}>
            Внутреннее перемещение между складами
          </DialogTitle>
          <DialogContent dividers style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <TextField
              label="Артикул SKU (например, 34316)"
              required
              fullWidth
              value={tfSku}
              onChange={(e) => setTfSku(e.target.value)}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Откуда</label>
                <select
                  className={styles.searchInput}
                  value={tfFrom}
                  onChange={(e) => setTfFrom(e.target.value)}
                >
                  <option value="MAIN">MAIN (Основной)</option>
                  <option value="SVH">SVH (СВХ)</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Куда</label>
                <select
                  className={styles.searchInput}
                  value={tfTo}
                  onChange={(e) => setTfTo(e.target.value)}
                >
                  <option value="SVH">SVH (СВХ)</option>
                  <option value="MAIN">MAIN (Основной)</option>
                </select>
              </div>
            </div>
            <TextField
              label="Количество штук"
              type="number"
              required
              fullWidth
              value={tfQty}
              onChange={(e) => setTfQty(e.target.value)}
            />
            <TextField
              label="Примечание"
              fullWidth
              value={tfNotes}
              onChange={(e) => setTfNotes(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setTransferOpen(false)}>Отмена</Button>
            <Button type="submit" variant="contained">
              Выполнить перемещение
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </div>
  );
}

