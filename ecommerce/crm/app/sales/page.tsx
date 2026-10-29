// ecommerce/crm/app/sales/page.tsx
// Раздел «Продажи и Партионная прослеживаемость FIFO»: учет продаж Amazon FBM/FBA, списание с СВХ и трассировка партий поставщиков
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
import AddIcon from '@mui/icons-material/Add';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

export default function SalesPage() {
  // Вкладка: 'orders' (все продажи) или 'trace' (сквозная прослеживаемость партии поставщика)
  const [tab, setTab] = useState<'orders' | 'trace'>('orders');
  const [batchQuery, setBatchQuery] = useState<string>('26ALV-0074072');
  const [activeBatchTrace, setActiveBatchTrace] = useState<string>('26ALV-0074072');

  // Модальное окно регистрации новой продажи Amazon
  const [saleModalOpen, setSaleModalOpen] = useState<boolean>(false);
  const [formOrderNum, setFormOrderNum] = useState<string>('');
  const [formCity, setFormCity] = useState<string>('Madrid');
  const [formSku, setFormSku] = useState<string>('');
  const [formQty, setFormQty] = useState<string>('1');
  const [formPrice, setFormPrice] = useState<string>('');
  const [formFee, setFormFee] = useState<string>('');
  const [formShipping, setFormShipping] = useState<string>('4.50');

  const { data: salesRes, isLoading, mutate } = useSWR('/api/backend/sales', fetcher);
  const { data: traceRes, isLoading: isTraceLoading } = useSWR(
    tab === 'trace' && activeBatchTrace
      ? `/api/backend/sales/trace-batch/${encodeURIComponent(activeBatchTrace)}`
      : null,
    fetcher
  );

  const salesOrders = salesRes?.orders || [];

  // Регистрация новой продажи с обязательным подтверждением
  const handleRecordSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formOrderNum.trim() || !formSku.trim() || !formPrice) return;

    if (
      !confirm(
        `Подтверждаете регистрацию продажи заказа Amazon ${formOrderNum} (SKU: ${formSku}, ${formQty} шт по цене ${formPrice} €) со списанием со склада СВХ и партионным учетом FIFO?`
      )
    ) {
      return;
    }

    try {
      const res = await axios.post('/api/backend/sales', {
        platform: 'AMAZON',
        orderNumber: formOrderNum.trim(),
        customerCity: formCity.trim() || undefined,
        items: [
          {
            sku: formSku.trim(),
            quantity: Number(formQty),
            salePrice: Number(formPrice),
            platformFee: formFee ? Number(formFee) : undefined,
            shippingCost: formShipping ? Number(formShipping) : 0,
          },
        ],
      });
      await mutate();
      setSaleModalOpen(false);
      if (res.data?.stockAlerts?.length > 0) {
        alert(res.data.stockAlerts.map((a: any) => a.message).join('\n'));
      } else {
        alert('Продажа успешно зафиксирована, товар списан со склада СВХ по FIFO!');
      }
    } catch (err: any) {
      alert(`Ошибка регистрации продажи: ${err?.response?.data?.message || err?.message}`);
    }
  };

  return (
    <div className={styles.container}>
      {/* Панель переключения вкладок */}
      <div className={styles.filterCard}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className={tab === 'orders' ? styles.primaryBtn : styles.secondaryBtn}
            onClick={() => setTab('orders')}
          >
            Реестр продаж на маркетплейсах ({salesRes?.total ?? 0})
          </button>
          <button
            className={tab === 'trace' ? styles.primaryBtn : styles.secondaryBtn}
            onClick={() => setTab('trace')}
          >
            <TrackChangesIcon fontSize="small" />
            Сквозная прослеживаемость партии (Trace Batch FIFO)
          </button>
        </div>

        {tab === 'orders' ? (
          <button className={styles.primaryBtn} onClick={() => setSaleModalOpen(true)}>
            <AddIcon fontSize="small" />
            Зафиксировать продажу Amazon
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="text"
              className={styles.searchInput}
              style={{ width: '240px' }}
              placeholder="Номер партии (напр. 26ALV-0074072)"
              value={batchQuery}
              onChange={(e) => setBatchQuery(e.target.value)}
            />
            <button
              className={styles.primaryBtn}
              onClick={() => setActiveBatchTrace(batchQuery.trim())}
            >
              Проверить партию
            </button>
          </div>
        )}
      </div>

      {/* Вкладка 1: Все заказы продаж */}
      {tab === 'orders' ? (
        isLoading ? (
          <div className={styles.emptyState}>Загрузка реестра продаж...</div>
        ) : (
          <TableContainer component={Paper} className={styles.tableCard}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell style={{ fontWeight: 700 }}>Номер заказа Amazon</TableCell>
                  <TableCell style={{ fontWeight: 700 }}>Дата продажи</TableCell>
                  <TableCell style={{ fontWeight: 700 }}>Канал / Склад / Город</TableCell>
                  <TableCell style={{ fontWeight: 700 }}>Позиции (SKU / Кол-во / Себест.)</TableCell>
                  <TableCell style={{ fontWeight: 700 }}>Выручка (€)</TableCell>
                  <TableCell style={{ fontWeight: 700 }}>Комиссия + Доставка</TableCell>
                  <TableCell style={{ fontWeight: 700 }}>Чистая прибыль (FIFO)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {salesOrders.length > 0 ? (
                  salesOrders.map((so: any) => {
                    const orderProfit = (so.items || []).reduce(
                      (acc: number, i: any) => acc + (i.netProfit || 0) * i.quantity,
                      0
                    );
                    return (
                      <TableRow key={so.id}>
                        <TableCell style={{ fontWeight: 800, color: '#2563eb' }}>
                          {so.orderNumber}
                        </TableCell>
                        <TableCell>{new Date(so.orderDate).toLocaleString('ru-RU')}</TableCell>
                        <TableCell>
                          <span className={styles.badgeInfo}>
                            {so.platform} • {so.fulfillmentChannel} ({so.warehouse})
                          </span>
                          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '3px' }}>
                            📍 {so.customerCity || '—'}, {so.customerCountry || 'ES'}
                          </div>
                        </TableCell>
                        <TableCell>
                          {so.items?.map((item: any) => (
                            <div key={item.id} style={{ fontSize: '0.82rem' }}>
                              <b>SKU {item.sku}</b> × {item.quantity} шт (Закупка FIFO:{' '}
                              {item.costPrice != null ? `${Number(item.costPrice).toFixed(2)} €` : '—'})
                            </div>
                          ))}
                        </TableCell>
                        <TableCell style={{ fontWeight: 700 }}>
                          {Number(so.totalAmount).toFixed(2)} €
                        </TableCell>
                        <TableCell style={{ fontSize: '0.8rem', color: '#64748b' }}>
                          Комиссия: {Number(so.platformFees).toFixed(2)} € | Дост:{' '}
                          {Number(so.shippingFee).toFixed(2)} €
                        </TableCell>
                        <TableCell>
                          <span
                            className={
                              orderProfit >= 0 ? styles.badgeSuccess : styles.badgeDanger
                            }
                          >
                            {orderProfit >= 0 ? '+' : ''}
                            {orderProfit.toFixed(2)} €
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <div className={styles.emptyState}>Продажи не найдены</div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )
      ) : (
        /* Вкладка 2: Сквозная прослеживаемость партии поставщика */
        isTraceLoading ? (
          <div className={styles.emptyState}>Анализ партионного списания FIFO...</div>
        ) : traceRes?.trace ? (
          <div className={styles.container}>
            <div className={styles.kpiRow}>
              <div className={styles.kpiBox}>
                <div className={styles.kpiLabel}>Партия поставщика</div>
                <div className={styles.kpiValue}>{traceRes.trace.purchaseOrderNumber}</div>
                <div className={styles.kpiSub}>Поставщик: {traceRes.trace.supplier}</div>
              </div>
              <div className={styles.kpiBox}>
                <div className={styles.kpiLabel}>Затраты Брутто на партию</div>
                <div className={styles.kpiValue}>
                  {Number(traceRes.trace.totalGrossCost).toFixed(2)} €
                </div>
              </div>
            </div>

            <TableContainer component={Paper} className={styles.tableCard}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell style={{ fontWeight: 700 }}>SKU / EAN</TableCell>
                    <TableCell style={{ fontWeight: 700 }}>Товар</TableCell>
                    <TableCell style={{ fontWeight: 700 }}>Принято / Продано / Остаток</TableCell>
                    <TableCell style={{ fontWeight: 700 }}>Себестоимость RE</TableCell>
                    <TableCell style={{ fontWeight: 700 }}>Сгенерировано чистой прибыли</TableCell>
                    <TableCell style={{ fontWeight: 700 }}>Заказы покупателей (FIFO аллокации)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {traceRes.trace.itemsTrace?.map((it: any) => (
                    <TableRow key={it.sku}>
                      <TableCell>
                        <div style={{ fontWeight: 800 }}>{it.sku}</div>
                        <div style={{ fontSize: '0.74rem', color: '#64748b' }}>{it.ean}</div>
                      </TableCell>
                      <TableCell style={{ fontWeight: 600 }}>{it.title}</TableCell>
                      <TableCell>
                        Принято: <b>{it.quantityReceived}</b> | Продано:{' '}
                        <b style={{ color: '#15803d' }}>{it.totalSoldFromBatch}</b> | Остаток:{' '}
                        <b>{it.remainingInStock}</b>
                      </TableCell>
                      <TableCell>{Number(it.costPrice).toFixed(2)} €</TableCell>
                      <TableCell style={{ fontWeight: 800, color: '#15803d' }}>
                        +{Number(it.totalProfitGenerated).toFixed(2)} €
                      </TableCell>
                      <TableCell>
                        {it.sales?.length > 0 ? (
                          it.sales.map((s: any, idx: number) => (
                            <div key={idx} style={{ fontSize: '0.78rem', marginBottom: '4px' }}>
                              📦 <b>{s.salesOrderNumber}</b> ({s.customerCity}) — {s.quantitySoldFromBatch} шт по{' '}
                              {s.salePrice} € (Чистая: +{s.totalProfitFromBatchUnits} €)
                            </div>
                          ))
                        ) : (
                          <span style={{ color: '#94a3b8' }}>Еще нет продаж из этой партии</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </div>
        ) : (
          <div className={styles.emptyState}>Партия поставщика не найдена</div>
        )
      )}

      {/* Модальное окно регистрации продажи Amazon */}
      <Dialog open={saleModalOpen} onClose={() => setSaleModalOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleRecordSale}>
          <DialogTitle style={{ fontWeight: 800 }}>
            Регистрация продажи Amazon (FBM со склада СВХ)
          </DialogTitle>
          <DialogContent dividers style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <TextField
              label="Номер заказа Amazon (например, 402-1234567-8901234)"
              required
              fullWidth
              value={formOrderNum}
              onChange={(e) => setFormOrderNum(e.target.value)}
            />
            <TextField
              label="Город покупателя (например, Valencia)"
              fullWidth
              value={formCity}
              onChange={(e) => setFormCity(e.target.value)}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
              <TextField
                label="Артикул SKU (например, 34316)"
                required
                value={formSku}
                onChange={(e) => setFormSku(e.target.value)}
              />
              <TextField
                label="Количество (шт)"
                type="number"
                required
                value={formQty}
                onChange={(e) => setFormQty(e.target.value)}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              <TextField
                label="Цена продажи (€)"
                type="number"
                required
                value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
              />
              <TextField
                label="Комиссия Amazon (€)"
                type="number"
                value={formFee}
                onChange={(e) => setFormFee(e.target.value)}
              />
              <TextField
                label="Доставка (€)"
                type="number"
                value={formShipping}
                onChange={(e) => setFormShipping(e.target.value)}
              />
            </div>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSaleModalOpen(false)}>Отмена</Button>
            <Button type="submit" variant="contained">
              Зарегистрировать продажу
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </div>
  );
}

