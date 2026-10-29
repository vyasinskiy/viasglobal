// ecommerce/crm/app/orders/[id]/page.tsx
// Детальная карточка заказа поставщика (Albarán), юнит-экономика партии vs Amazon BuyBox, замеры коробок и приемка (SVH / MAIN)
'use client';
import * as React from 'react';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import axios from 'axios';
import styles from '../../shared-table.module.css';

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
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckBoxIcon from '@mui/icons-material/CheckBox';

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const idOrNumber = params?.id ? decodeURIComponent(String(params.id)) : null;

  // Загружаем карточку заказа и юнит-экономику с бэкенда
  const { data, isLoading, error, mutate } = useSWR(
    idOrNumber ? `/api/backend/orders/${encodeURIComponent(idOrNumber)}` : null,
    fetcher
  );

  // Состояние модального окна приемки поставки для конкретной позиции
  const [receiveModalItem, setReceiveModalItem] = useState<any | null>(null);
  const [recvQty, setRecvQty] = useState<string>('10');
  const [recvLen, setRecvLen] = useState<string>('');
  const [recvWid, setRecvWid] = useState<string>('');
  const [recvHei, setRecvHei] = useState<string>('');
  const [recvWeight, setRecvWeight] = useState<string>('');
  const [recvSvh, setRecvSvh] = useState<string>('3');
  const [recvMain, setRecvMain] = useState<string>('7');

  if (isLoading) return <div className={styles.emptyState}>Загрузка карточки заказа и расчет юнит-экономики...</div>;
  if (error || !data?.data) return <div className={styles.emptyState}>Заказ не найден.</div>;

  const order = data.data;

  // Открытие модального окна приемки/замеров позиции
  const openReceiveItem = (item: any) => {
    setReceiveModalItem(item);
    const ordered = item.quantityOrdered || 10;
    const defaultSvh = Math.min(3, ordered);
    setRecvQty(String(item.quantityReceived || ordered));
    setRecvLen(item.packageMeasurements?.lengthCm ? String(item.packageMeasurements.lengthCm) : '');
    setRecvWid(item.packageMeasurements?.widthCm ? String(item.packageMeasurements.widthCm) : '');
    setRecvHei(item.packageMeasurements?.heightCm ? String(item.packageMeasurements.heightCm) : '');
    setRecvWeight(item.packageMeasurements?.weightG ? String(item.packageMeasurements.weightG) : '');
    setRecvSvh(String(defaultSvh));
    setRecvMain(String(Math.max(0, ordered - defaultSvh)));
  };

  // Отправка данных приемки на бэкенд
  const handleConfirmReceive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiveModalItem) return;

    if (
      !confirm(
        `Подтверждаете проведение приемки и оприходование SKU ${receiveModalItem.sku} (${recvSvh} шт на СВХ, ${recvMain} шт на MAIN)?`
      )
    ) {
      return;
    }

    try {
      await axios.post(`/api/backend/orders/${order.orderId}/receive`, {
        items: [
          {
            sku: receiveModalItem.sku,
            quantityReceived: Number(recvQty),
            packageLengthCm: recvLen ? Number(recvLen) : undefined,
            packageWidthCm: recvWid ? Number(recvWid) : undefined,
            packageHeightCm: recvHei ? Number(recvHei) : undefined,
            packageWeightG: recvWeight ? Number(recvWeight) : undefined,
            svhQuantity: Number(recvSvh),
            mainQuantity: Number(recvMain),
          },
        ],
      });
      await mutate();
      setReceiveModalItem(null);
      alert('Приемка и замеры успешно сохранены!');
    } catch (err: any) {
      alert(`Ошибка при проведении приемки: ${err?.response?.data?.message || err?.message}`);
    }
  };

  return (
    <div className={styles.container}>
      {/* Верхняя шапка заказа */}
      <div className={styles.filterCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button className={styles.secondaryBtn} onClick={() => router.push('/orders')}>
            <ArrowBackIcon fontSize="small" />
            К списку заказов
          </button>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800 }}>
              Заказ / Накладная Albarán: {order.orderNumber}
            </h2>
            <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px' }}>
              Поставщик: <b>{order.supplier?.name}</b> • Статус: <b>{order.status}</b> • Оплата:{' '}
              <b>{order.financials?.paymentStatus}</b> ({order.financials?.paymentMethod || '—'})
            </div>
          </div>
        </div>
      </div>

      {/* Финансовые KPI партии */}
      <div className={styles.kpiRow}>
        <div className={styles.kpiBox}>
          <div className={styles.kpiLabel}>Сумма Нетто (без налогов)</div>
          <div className={styles.kpiValue}>{Number(order.financials?.subtotalNetto ?? 0).toFixed(2)} €</div>
          <div className={styles.kpiSub}>
            Эко-таса RAEE: +{Number(order.financials?.totalEcoTasa ?? 0).toFixed(2)} €
          </div>
        </div>
        <div className={styles.kpiBox}>
          <div className={styles.kpiLabel}>Налоги (IVA 21% + RE 5.2%)</div>
          <div className={styles.kpiValue}>{Number(order.financials?.taxAmount ?? 0).toFixed(2)} €</div>
          <div className={styles.kpiSub}>
            Доставка: {Number(order.financials?.shippingCost ?? 0).toFixed(2)} €
          </div>
        </div>
        <div className={styles.kpiBox} style={{ borderColor: '#bfdbfe', backgroundColor: '#eff6ff' }}>
          <div className={styles.kpiLabel} style={{ color: '#1d4ed8' }}>
            Итоговая себестоимость Брутто
          </div>
          <div className={styles.kpiValue} style={{ color: '#1d4ed8' }}>
            {Number(order.financials?.totalGross ?? 0).toFixed(2)} €
          </div>
          <div className={styles.kpiSub}>Полные затраты на выкуп партии</div>
        </div>
      </div>

      {/* Таблица позиций заказа со сквозной юнит-экономикой и FIFO продажами */}
      <TableContainer component={Paper} className={styles.tableCard}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell style={{ fontWeight: 700 }}>SKU / EAN / ASIN</TableCell>
              <TableCell style={{ fontWeight: 700 }}>Наименование товара</TableCell>
              <TableCell style={{ fontWeight: 700 }}>Заказано / Принято</TableCell>
              <TableCell style={{ fontWeight: 700 }}>Закупка (Netto / RE)</TableCell>
              <TableCell style={{ fontWeight: 700 }}>Замеры коробки (Д×Ш×В, Вес)</TableCell>
              <TableCell style={{ fontWeight: 700 }}>Amazon BuyBox / Комиссии</TableCell>
              <TableCell style={{ fontWeight: 700 }}>Прогноз прибыли / ROI</TableCell>
              <TableCell style={{ fontWeight: 700 }}>Реализация FIFO (Продано)</TableCell>
              <TableCell style={{ fontWeight: 700, textAlign: 'center' }}>Приемка</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {order.items?.map((item: any) => (
              <TableRow key={item.id}>
                <TableCell>
                  <div style={{ fontWeight: 800 }}>SKU: {item.sku}</div>
                  <div style={{ fontSize: '0.74rem', color: '#64748b' }}>EAN: {item.ean || '—'}</div>
                  {item.asin && (
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2563eb' }}>
                      <a
                        href={`https://www.amazon.es/dp/${item.asin}`}
                        target="_blank"
                        rel="noreferrer"
                        className="link"
                      >
                        {item.asin}
                      </a>
                    </div>
                  )}
                </TableCell>
                <TableCell style={{ fontWeight: 600, maxWidth: '240px' }}>{item.title}</TableCell>
                <TableCell>
                  <span
                    className={
                      item.quantityReceived >= item.quantityOrdered
                        ? styles.badgeSuccess
                        : styles.badgeWarning
                    }
                  >
                    {item.quantityReceived} / {item.quantityOrdered} шт
                  </span>
                </TableCell>
                <TableCell>
                  <div style={{ fontWeight: 700 }}>
                    RE: {Number(item.costPriceGross).toFixed(2)} € / шт
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                    Netto: {Number(item.priceNetto).toFixed(2)} € + RAEE {Number(item.ecoTasa).toFixed(2)} €
                  </div>
                  <div style={{ fontSize: '0.74rem', fontWeight: 600 }}>
                    Итого: {Number(item.totalCostGross).toFixed(2)} €
                  </div>
                </TableCell>
                <TableCell>
                  {item.packageMeasurements?.lengthCm ? (
                    <div>
                      <div style={{ fontWeight: 600 }}>
                        {item.packageMeasurements.lengthCm}×{item.packageMeasurements.widthCm}×
                        {item.packageMeasurements.heightCm} см
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                        Вес: {item.packageMeasurements.weightG ?? '—'} г
                      </div>
                    </div>
                  ) : (
                    <span className={styles.badgeWarning}>Не замерено</span>
                  )}
                </TableCell>
                <TableCell>
                  <div style={{ fontWeight: 700, color: '#2563eb' }}>
                    BuyBox:{' '}
                    {item.marketData?.buyBoxPrice != null
                      ? `${Number(item.marketData.buyBoxPrice).toFixed(2)} €`
                      : '—'}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                    Комиссии:{' '}
                    {item.marketData?.totalFees != null
                      ? `${Number(item.marketData.totalFees).toFixed(2)} €`
                      : '—'}
                  </div>
                </TableCell>
                <TableCell>
                  <div
                    style={{
                      fontWeight: 800,
                      color:
                        (item.unitEconomics?.estimatedNetProfitPerUnit ?? 0) > 0
                          ? '#15803d'
                          : '#dc2626',
                    }}
                  >
                    {item.unitEconomics?.estimatedNetProfitPerUnit != null
                      ? `${Number(item.unitEconomics.estimatedNetProfitPerUnit).toFixed(2)} € / шт`
                      : '—'}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#475569' }}>
                    ROI:{' '}
                    {item.unitEconomics?.roiPercent != null
                      ? `${item.unitEconomics.roiPercent}%`
                      : '—'}{' '}
                    | Маржа:{' '}
                    {item.unitEconomics?.marginPercent != null
                      ? `${item.unitEconomics.marginPercent}%`
                      : '—'}
                  </div>
                </TableCell>
                <TableCell>
                  <div style={{ fontWeight: 700 }}>
                    Продано: {item.salesProgress?.unitsSold ?? 0} шт (Остаток:{' '}
                    {item.salesProgress?.unitsRemaining ?? 0} шт)
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#15803d', fontWeight: 600 }}>
                    Факт. прибыль: +{Number(item.salesProgress?.actualNetProfit ?? 0).toFixed(2)} €
                  </div>
                </TableCell>
                <TableCell style={{ textAlign: 'center' }}>
                  <button
                    className={styles.secondaryBtn}
                    onClick={() => openReceiveItem(item)}
                  >
                    <CheckBoxIcon style={{ fontSize: '0.9rem' }} />
                    Замеры / Приемка
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Прикрепленные документы и фотофиксация */}
      {order.documents?.length > 0 && (
        <div className={styles.kpiBox}>
          <div className={styles.kpiLabel}>Прикрепленные документы и фото приемки (OrderDocument)</div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>
            {order.documents.map((doc: any) => (
              <span key={doc.id} className={styles.badgeInfo}>
                📄 [{doc.documentType}] {doc.fileName} ({doc.filePath})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Модальное окно приемки и ввода замеров упаковки */}
      <Dialog
        open={Boolean(receiveModalItem)}
        onClose={() => setReceiveModalItem(null)}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={handleConfirmReceive}>
          <DialogTitle style={{ fontWeight: 800 }}>
            Приемка и замеры коробки: SKU {receiveModalItem?.sku}
          </DialogTitle>
          <DialogContent dividers style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <TextField
              label="Фактически принятое количество (шт)"
              type="number"
              required
              fullWidth
              value={recvQty}
              onChange={(e) => setRecvQty(e.target.value)}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px' }}>
              <TextField
                label="Длина (см)"
                type="number"
                value={recvLen}
                onChange={(e) => setRecvLen(e.target.value)}
              />
              <TextField
                label="Ширина (см)"
                type="number"
                value={recvWid}
                onChange={(e) => setRecvWid(e.target.value)}
              />
              <TextField
                label="Высота (см)"
                type="number"
                value={recvHei}
                onChange={(e) => setRecvHei(e.target.value)}
              />
              <TextField
                label="Вес (г)"
                type="number"
                value={recvWeight}
                onChange={(e) => setRecvWeight(e.target.value)}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <TextField
                label="Оприходовать на СВХ (дефолт 3 шт)"
                type="number"
                required
                value={recvSvh}
                onChange={(e) => setRecvSvh(e.target.value)}
              />
              <TextField
                label="Оприходовать на MAIN (Основной склад)"
                type="number"
                required
                value={recvMain}
                onChange={(e) => setRecvMain(e.target.value)}
              />
            </div>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setReceiveModalItem(null)}>Отмена</Button>
            <Button type="submit" variant="contained">
              Сохранить приемку
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </div>
  );
}

