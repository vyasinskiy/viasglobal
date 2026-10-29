// ecommerce/crm/app/contracted/page.tsx
// Раздел «Товары в работе» (ContractedFilteredProductsView & ContractedAllProductsView)
// С поддержкой переключения налогового режима (Recargo de Equivalencia vs SL), проверкой свежести снапшота Keepa (48ч) и экстренным обновлением ASIN
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
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import SyncIcon from '@mui/icons-material/Sync';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

export default function ContractedProductsPage() {
  // Режим выборки: 'filtered' (BSR <= 100k, Amazon <= 50%) или 'all' (весь каталог без ограничений)
  const [mode, setMode] = useState<'filtered' | 'all'>('filtered');
  // Налоговый режим: true = Recargo de Equivalencia (вычитается 21% НДС на комиссии Amazon), false = SL (без НДС на комиссии)
  const [includeVatOnFees, setIncludeVatOnFees] = useState<boolean>(true);
  // Фильтры
  const [brand, setBrand] = useState<string>('ALL');
  const [distributor, setDistributor] = useState<string>('ALL');
  const [feeStatus, setFeeStatus] = useState<string>('ALL');
  const [onlyProfitable, setOnlyProfitable] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');

  // Состояние экстренного запроса в Keepa API
  const [enqueuingAsin, setEnqueuingAsin] = useState<string | null>(null);
  // Состояние модального окна детальной карточки ASIN
  const [selectedAsinCode, setSelectedAsinCode] = useState<string | null>(null);

  const queryUrl = `/api/backend/crm/products/contracted?mode=${mode}&includeVatOnFees=${includeVatOnFees}&brand=${encodeURIComponent(
    brand
  )}&distributor=${encodeURIComponent(distributor)}&feeStatus=${encodeURIComponent(
    feeStatus
  )}&onlyProfitable=${onlyProfitable}&search=${encodeURIComponent(search)}`;

  const { data, error, isLoading, mutate } = useSWR(queryUrl, fetcher);

  // Загрузка детальной информации о выбранном ASIN при открытии модального окна
  const { data: asinDetailRes, isLoading: isAsinLoading } = useSWR(
    selectedAsinCode ? `/api/backend/crm/products/asin/${selectedAsinCode}` : null,
    fetcher
  );

  // Обработчик принудительного обновления ASIN через Keepa API (CRITICAL приоритет 100)
  const handleForceKeepaFetch = async (asin: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Отправить экстренный запрос в Keepa API (приоритет CRITICAL 100, расход 1 токена) для обновления габаритов и комиссий ASIN ${asin}?`)) {
      return;
    }
    setEnqueuingAsin(asin);
    try {
      await axios.post(`/api/backend/keepa/enqueue/${asin}`);
      await mutate();
      alert(`Данные по ASIN ${asin} успешно получены и обработаны из Keepa API!`);
    } catch (err: any) {
      alert(
        `Ошибка обновления ASIN ${asin}: ${
          err?.response?.data?.message || err?.message || 'Неизвестная ошибка'
        }`
      );
    } finally {
      setEnqueuingAsin(null);
    }
  };

  // Отрисовка бейджа статуса комиссий FBA
  const renderFeeStatusBadge = (status: string | null) => {
    switch (status) {
      case 'KEEPA_SUCCESS':
        return <span className={styles.badgeSuccess}>KEEPA_SUCCESS</span>;
      case 'SUPPLIER_SUCCESS':
        return <span className={styles.badgeInfo}>SUPPLIER_SUCCESS</span>;
      case 'KEEPA_REQUESTED':
        return <span className={styles.badgeWarning}>KEEPA_REQUESTED</span>;
      case 'KEEPA_UNKNOWN':
        return <span className={styles.badgeWarning}>KEEPA_UNKNOWN</span>;
      case 'FAILED':
        return <span className={styles.badgeDanger}>FAILED</span>;
      default:
        return <span className={styles.badgeNeutral}>{status || 'NULL'}</span>;
    }
  };

  // Отрисовка индикатора актуальности снапшота Keepa (правило 48 часов)
  const renderSnapshotFreshness = (item: any) => {
    if (!item.lastSnapshotAt) {
      return (
        <span className={styles.badgeDanger} title="Отсутствует снапшот ProductFinder">
          ⚠️ НЕТ СНАПШОТА
        </span>
      );
    }
    const dateStr = new Date(item.lastSnapshotAt).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
    if (item.isSnapshotStale) {
      return (
        <span
          className={styles.badgeDanger}
          title={`Снапшот старше 48 часов (${item.snapshotAgeHours} ч назад). Требуется проверка цены полки!`}
        >
          ⚠️ УСТАРЕЛ ({dateStr})
        </span>
      );
    }
    return (
      <span className={styles.badgeSuccess} title={`Свежий снапшот Keepa (${item.snapshotAgeHours} ч назад)`}>
        ✅ АКТУАЛЬНО ({dateStr})
      </span>
    );
  };

  const items = data?.items || [];
  const availableBrands: string[] = data?.availableBrands || [];
  const availableDistributors: string[] = data?.availableDistributors || [];

  return (
    <div className={styles.container}>
      {/* Верхняя панель KPI и переключения режимов */}
      <div className={styles.kpiRow}>
        <div className={styles.kpiBox}>
          <div className={styles.kpiLabel}>Найдено товаров</div>
          <div className={styles.kpiValue}>{data?.total ?? '—'}</div>
          <div className={styles.kpiSub}>
            Режим: {mode === 'filtered' ? 'С фильтрами (BSR ≤ 100k)' : 'Весь каталог (All)'}
          </div>
        </div>
        <div className={styles.kpiBox} style={{ borderColor: '#bbf7d0', backgroundColor: '#f0fdf4' }}>
          <div className={styles.kpiLabel} style={{ color: '#15803d' }}>
            Прибыльных позиций (Profit &gt; 0)
          </div>
          <div className={styles.kpiValue} style={{ color: '#15803d' }}>
            {data?.profitableCount ?? '—'}
          </div>
          <div className={styles.kpiSub}>Отображаются в самом верху списка</div>
        </div>
        <div className={styles.kpiBox}>
          <div className={styles.kpiLabel}>Налоговый режим расчета</div>
          <div className={styles.kpiValue} style={{ fontSize: '1.15rem', marginTop: '10px' }}>
            {includeVatOnFees
              ? 'Autónomo RE (НДС 21% на комиссии в расходах)'
              : 'SL / Общий (НДС на комиссии к вычету)'}
          </div>
          <div className={styles.kpiSub}>
            Себестоимость закупки с налогами: priceNetto × 1.262
          </div>
        </div>
      </div>

      {/* Панель фильтров и переключателей */}
      <div className={styles.filterCard}>
        <div className={styles.searchWrapper}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Поиск по ASIN, EAN, названию, бренду..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Переключатель представления */}
          <select
            className={styles.searchInput}
            style={{ width: 'auto', fontWeight: 600 }}
            value={mode}
            onChange={(e) => setMode(e.target.value as 'filtered' | 'all')}
          >
            <option value="filtered">С фильтрами (BSR ≤ 100k, Amazon ≤ 50%)</option>
            <option value="all">Весь каталог в работе (Без фильтров)</option>
          </select>

          {/* Переключатель налогового режима */}
          <select
            className={styles.searchInput}
            style={{ width: 'auto', fontWeight: 600 }}
            value={includeVatOnFees ? 'true' : 'false'}
            onChange={(e) => setIncludeVatOnFees(e.target.value === 'true')}
          >
            <option value="true">Режим: Autónomo RE (с vatOnFees)</option>
            <option value="false">Режим: SL (без vatOnFees)</option>
          </select>

          {/* Фильтр по бренду */}
          <select
            className={styles.searchInput}
            style={{ width: 'auto' }}
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
          >
            <option value="ALL">Все бренды</option>
            {availableBrands.map((b) => (
              <option key={b} value={b}>
                Бренд: {b}
              </option>
            ))}
          </select>

          {/* Фильтр по поставщику */}
          <select
            className={styles.searchInput}
            style={{ width: 'auto' }}
            value={distributor}
            onChange={(e) => setDistributor(e.target.value)}
          >
            <option value="ALL">Все поставщики</option>
            {availableDistributors.map((d) => (
              <option key={d} value={d}>
                Поставщик: {d}
              </option>
            ))}
          </select>

          {/* Фильтр по feeStatus */}
          <select
            className={styles.searchInput}
            style={{ width: 'auto' }}
            value={feeStatus}
            onChange={(e) => setFeeStatus(e.target.value)}
          >
            <option value="ALL">Все статусы комиссий</option>
            <option value="KEEPA_SUCCESS">KEEPA_SUCCESS</option>
            <option value="SUPPLIER_SUCCESS">SUPPLIER_SUCCESS</option>
            <option value="KEEPA_UNKNOWN">KEEPA_UNKNOWN</option>
            <option value="KEEPA_REQUESTED">KEEPA_REQUESTED</option>
            <option value="FAILED">FAILED</option>
            <option value="NULL">NULL (не запрашивался)</option>
          </select>

          <FormControlLabel
            control={
              <Checkbox
                checked={onlyProfitable}
                onChange={(e) => setOnlyProfitable(e.target.checked)}
                color="primary"
              />
            }
            label="Только прибыльные"
          />
        </div>
      </div>

      {/* Таблица товаров на контракте */}
      {isLoading ? (
        <div className={styles.emptyState}>Расчет юнит-экономики товаров на контракте...</div>
      ) : error ? (
        <div className={styles.emptyState} style={{ color: '#ef4444' }}>
          Ошибка при получении списка товаров.
        </div>
      ) : (
        <TableContainer component={Paper} className={styles.tableCard}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell style={{ fontWeight: 700 }}>Фото / ASIN</TableCell>
                <TableCell style={{ fontWeight: 700 }}>Товар / Бренд / Поставщик</TableCell>
                <TableCell style={{ fontWeight: 700 }}>BSR &amp; Спрос/мес</TableCell>
                <TableCell style={{ fontWeight: 700 }}>Закупка (Netto / RE)</TableCell>
                <TableCell style={{ fontWeight: 700 }}>Квант / Партия</TableCell>
                <TableCell style={{ fontWeight: 700 }}>Buy Box &amp; Комиссии</TableCell>
                <TableCell style={{ fontWeight: 700 }}>Прибыль (Шт / Коробка)</TableCell>
                <TableCell style={{ fontWeight: 700 }}>ROI / Маржа / Коэфф</TableCell>
                <TableCell style={{ fontWeight: 700 }}>Снапшот Keepa &amp; Статус</TableCell>
                <TableCell style={{ fontWeight: 700, textAlign: 'center' }}>Действия</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.length > 0 ? (
                items.map((item: any) => {
                  const unitProfit = item.netProfitPerUnit ?? item.netProfit ?? null;
                  const boxProfit = item.netProfitPerMinBoxOrder ?? unitProfit ?? null;
                  const isProfitable = (boxProfit ?? 0) > 0;

                  return (
                    <TableRow
                      key={`${item.asin}-${item.ean}`}
                      className={styles.interactiveRow}
                      onClick={() => setSelectedAsinCode(item.asin)}
                      style={{
                        backgroundColor: isProfitable ? '#f0fdf433' : undefined,
                      }}
                    >
                      {/* Фото, ASIN и EAN */}
                      <TableCell>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {item.image ? (
                            <img
                              src={
                                item.image.startsWith('http')
                                  ? item.image
                                  : `https://m.media-amazon.com/images/I/${item.image}`
                              }
                              alt={item.asin}
                              className={styles.productThumb}
                            />
                          ) : (
                            <div
                              className={styles.productThumb}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.65rem',
                                color: '#94a3b8',
                              }}
                            >
                              Нет фото
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: 700, color: '#1d4ed8' }}>{item.asin}</div>
                            <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                              {item.ean || 'Без EAN'}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* Название, Бренд и Поставщик */}
                      <TableCell style={{ maxWidth: '280px' }}>
                        <div
                          style={{
                            fontWeight: 600,
                            color: '#0f172a',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}
                          title={item.title}
                        >
                          {item.title || 'Без названия'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '3px' }}>
                          <b>{item.brand}</b> • Поставщик: <b>{item.distributor || '—'}</b>
                        </div>
                      </TableCell>

                      {/* BSR и продажи в месяц */}
                      <TableCell>
                        <div style={{ fontWeight: 700 }}>
                          BSR: {item.salesRank ? `#${item.salesRank.toLocaleString('ru-RU')}` : '—'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#15803d', fontWeight: 600 }}>
                          Бейдж: {item.boughtInPastMonth ? `${item.boughtInPastMonth}+ / мес` : '—'}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                          Est. Sales: {item.estimatedMonthlySales ?? '—'} шт/мес
                        </div>
                      </TableCell>

                      {/* Закупка Нетто и Брутто с RE */}
                      <TableCell>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>
                          RE: {item.costPrice != null ? `${Number(item.costPrice).toFixed(2)} €` : '—'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          Netto: {item.netPrice != null ? `${Number(item.netPrice).toFixed(2)} €` : '—'}
                        </div>
                      </TableCell>

                      {/* Квант упаковки и минимальная партия */}
                      <TableCell>
                        <div style={{ fontWeight: 600 }}>
                          Мин. заказ: {item.minBoxOrder ?? item.unitsPerBox ?? 1} шт
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                          В коробке: {item.unitsPerBox ?? 1} шт
                        </div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#1e40af' }}>
                          Партия: {item.minBoxOrderGross != null ? `${Number(item.minBoxOrderGross).toFixed(2)} €` : '—'}
                        </div>
                      </TableCell>

                      {/* Buy Box и комиссии Amazon */}
                      <TableCell>
                        <div style={{ fontWeight: 700, color: '#2563eb' }}>
                          BuyBox: {item.buyBoxPrice != null ? `${Number(item.buyBoxPrice).toFixed(2)} €` : '—'}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                          FBA: {item.fbaFee != null ? `${Number(item.fbaFee).toFixed(2)}€` : '—'} | Ref:{' '}
                          {item.referralFee != null ? `${Number(item.referralFee).toFixed(2)}€` : '—'}
                        </div>
                        {includeVatOnFees && (
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                            IVA на ком.: {item.vatOnFees != null ? `${Number(item.vatOnFees).toFixed(2)} €` : '—'}
                          </div>
                        )}
                      </TableCell>

                      {/* Чистая прибыль (за 1 шт и за минимальную коробку) */}
                      <TableCell>
                        <div
                          style={{
                            fontWeight: 800,
                            fontSize: '0.92rem',
                            color:
                              unitProfit == null
                                ? '#64748b'
                                : unitProfit > 0
                                ? '#15803d'
                                : '#dc2626',
                          }}
                        >
                          {unitProfit != null
                            ? `${unitProfit > 0 ? '+' : ''}${Number(unitProfit).toFixed(2)} € / шт`
                            : '—'}
                        </div>
                        <div
                          style={{
                            fontSize: '0.76rem',
                            fontWeight: 700,
                            color:
                              boxProfit == null
                                ? '#64748b'
                                : boxProfit > 0
                                ? '#16a34a'
                                : '#b91c1c',
                          }}
                        >
                          Коробка:{' '}
                          {boxProfit != null
                            ? `${boxProfit > 0 ? '+' : ''}${Number(boxProfit).toFixed(2)} €`
                            : '—'}
                        </div>
                      </TableCell>

                      {/* ROI, Маржа и Коэффициент отдачи */}
                      <TableCell>
                        <div style={{ fontWeight: 700 }}>
                          ROI: {item.roiPercent != null ? `${Number(item.roiPercent).toFixed(1)}%` : '—'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#475569' }}>
                          Маржа: {item.marginPercent != null ? `${Number(item.marginPercent).toFixed(1)}%` : '—'}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                          Коэфф: {item.profitCoefficient != null ? Number(item.profitCoefficient).toFixed(3) : '—'}
                        </div>
                      </TableCell>

                      {/* Свежесть снапшота Keepa и статус комиссий */}
                      <TableCell>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                          {renderSnapshotFreshness(item)}
                          {renderFeeStatusBadge(item.feeStatus)}
                        </div>
                      </TableCell>

                      {/* Кнопки действий */}
                      <TableCell style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <a
                            href={`https://www.amazon.es/dp/${item.asin}`}
                            target="_blank"
                            rel="noreferrer"
                            className={styles.secondaryBtn}
                            title="Открыть карточку на Amazon.es"
                            style={{ padding: '5px 8px' }}
                          >
                            <OpenInNewIcon style={{ fontSize: '1rem' }} />
                          </a>
                          <button
                            className={styles.secondaryBtn}
                            style={{ padding: '5px 8px' }}
                            title="Экстренно обновить данные через Keepa API (CRITICAL)"
                            disabled={enqueuingAsin === item.asin}
                            onClick={(e) => handleForceKeepaFetch(item.asin, e)}
                          >
                            <SyncIcon style={{ fontSize: '1rem' }} />
                          </button>
                          <button
                            className={styles.primaryBtn}
                            style={{ padding: '5px 8px' }}
                            title="Детальная карточка ASIN"
                            onClick={() => setSelectedAsinCode(item.asin)}
                          >
                            <InfoOutlinedIcon style={{ fontSize: '1rem' }} />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={10} align="center">
                    <div className={styles.emptyState}>Товары по заданным фильтрам не найдены</div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Модальное окно детальной карточки ASIN */}
      <Dialog
        open={Boolean(selectedAsinCode)}
        onClose={() => setSelectedAsinCode(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle style={{ fontWeight: 800 }}>
          Детальная карточка ASIN: {selectedAsinCode}
        </DialogTitle>
        <DialogContent dividers>
          {isAsinLoading ? (
            <div className={styles.emptyState}>Загрузка досье товара...</div>
          ) : asinDetailRes?.data ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className={styles.kpiRow}>
                <div className={styles.kpiBox}>
                  <div className={styles.kpiLabel}>Бренд / Фабрика</div>
                  <div style={{ fontWeight: 700, marginTop: '4px' }}>
                    {asinDetailRes.data.brand?.name || '—'} / {asinDetailRes.data.manufacturer?.name || '—'}
                  </div>
                  <div className={styles.kpiSub}>
                    Статус комиссий: <b>{asinDetailRes.data.feeStatus || 'NULL'}</b>
                  </div>
                </div>
                <div className={styles.kpiBox}>
                  <div className={styles.kpiLabel}>Макс. цена закупки (10% маржи)</div>
                  <div className={styles.kpiValue} style={{ color: '#2563eb' }}>
                    {asinDetailRes.data.maxBuyPrice != null
                      ? `${Number(asinDetailRes.data.maxBuyPrice).toFixed(2)} €`
                      : '—'}
                  </div>
                  <div className={styles.kpiSub}>
                    Фильтр отсева: <b>{asinDetailRes.data.filterReason || 'ПРОХОДИТ (NULL)'}</b>
                  </div>
                </div>
                <div className={styles.kpiBox}>
                  <div className={styles.kpiLabel}>Габариты и Size Tier</div>
                  <div style={{ fontWeight: 700, marginTop: '4px' }}>
                    {asinDetailRes.data.processedData?.sizeTier || 'Не определен'}
                  </div>
                  <div className={styles.kpiSub}>
                    Упаковка:{' '}
                    {asinDetailRes.data.processedData?.packageLength
                      ? `${asinDetailRes.data.processedData.packageLength}×${asinDetailRes.data.processedData.packageWidth}×${asinDetailRes.data.processedData.packageHeight} мм, ${asinDetailRes.data.processedData.packageWeight} г`
                      : 'нет данных'}
                  </div>
                </div>
              </div>

              {/* История закупочных цен из прайс-листов */}
              <div>
                <h4 style={{ margin: '0 0 8px 0' }}>Снапшоты цен поставщиков (DistributorPriceSnapshot)</h4>
                {asinDetailRes.data.priceSnapshots?.length > 0 ? (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Дата</TableCell>
                        <TableCell>Поставщик</TableCell>
                        <TableCell>EAN</TableCell>
                        <TableCell>Цена Нетто</TableCell>
                        <TableCell>Эко-таса</TableCell>
                        <TableCell>Себестоимость RE (1.262)</TableCell>
                        <TableCell>Квант / Мин. заказ</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {asinDetailRes.data.priceSnapshots.map((ps: any) => (
                        <TableRow key={ps.id}>
                          <TableCell>{new Date(ps.createdAt).toLocaleDateString('ru-RU')}</TableCell>
                          <TableCell style={{ fontWeight: 600 }}>{ps.distributor?.name}</TableCell>
                          <TableCell>{ps.ean || '—'}</TableCell>
                          <TableCell>{Number(ps.priceNetto).toFixed(2)} €</TableCell>
                          <TableCell>{ps.ecoTasa ? `${Number(ps.ecoTasa).toFixed(2)} €` : '0 €'}</TableCell>
                          <TableCell style={{ fontWeight: 700, color: '#15803d' }}>
                            {Number(ps.costPrice).toFixed(2)} €
                          </TableCell>
                          <TableCell>
                            Коробка: {ps.unitsPerBox ?? 1} шт | Мин: {ps.minBoxOrder ?? 1} шт
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div style={{ color: '#64748b', fontSize: '0.85rem' }}>
                    Нет загруженных снапшотов прайс-листов для этого ASIN.
                  </div>
                )}
              </div>

              {/* Остатки на складах */}
              <div>
                <h4 style={{ margin: '0 0 8px 0' }}>Складские остатки (WarehouseStock)</h4>
                {asinDetailRes.data.warehouseStocks?.length > 0 ? (
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    {asinDetailRes.data.warehouseStocks.map((ws: any) => (
                      <div key={ws.id} className={styles.kpiBox} style={{ minWidth: '180px' }}>
                        <div className={styles.kpiLabel}>Склад {ws.warehouse} (SKU: {ws.sku})</div>
                        <div className={styles.kpiValue}>{ws.quantity} шт</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: '#64748b', fontSize: '0.85rem' }}>
                    На складах СВХ / MAIN числится 0 шт.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className={styles.emptyState}>Товар не найден</div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedAsinCode(null)}>Закрыть</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

