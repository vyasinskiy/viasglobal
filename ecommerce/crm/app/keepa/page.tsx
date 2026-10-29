// ecommerce/crm/app/keepa/page.tsx
// Раздел «Keepa API и Очереди»: мониторинг KeepaRequestQueue, RequestProductQueue, категорий и истории выгрузок
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
import SyncIcon from '@mui/icons-material/Sync';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

export default function KeepaPage() {
  const [tab, setTab] = useState<'requests' | 'products' | 'exports' | 'categories'>('requests');
  const [manualAsin, setManualAsin] = useState<string>('');
  const [busy, setBusy] = useState<boolean>(false);

  const { data, isLoading, mutate } = useSWR('/api/backend/crm/keepa/overview', fetcher, {
    refreshInterval: 15000,
  });

  // Экстренный запрос ASIN через Keepa API (CRITICAL 100)
  const handleManualEnqueue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualAsin.trim() || busy) return;
    const code = manualAsin.trim().toUpperCase();
    if (
      !confirm(
        `Поставить ASIN ${code} в очередь Keepa с приоритетом CRITICAL (100) и немедленно запросить свежие данные?`
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      await axios.post(`/api/backend/keepa/enqueue/${encodeURIComponent(code)}`);
      await mutate();
      setManualAsin('');
      alert(`ASIN ${code} успешно загружен и обработан из Keepa API!`);
    } catch (err: any) {
      alert(`Ошибка запроса Keepa: ${err?.response?.data?.message || err?.message}`);
    } finally {
      setBusy(false);
    }
  };

  // Наполнение очереди из CandidatesProductsView
  const handlePopulateQueue = async () => {
    if (!confirm('Запустить наполнение RequestProductQueue из CandidatesProductsView?')) return;
    setBusy(true);
    try {
      await axios.post('/api/backend/keepa/populate-queue');
      await mutate();
      alert('Очередь успешно пополнена из CandidatesProductsView!');
    } catch (err: any) {
      alert(`Ошибка: ${err?.response?.data?.message || err?.message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* KPI сводка очередей Keepa */}
      <div className={styles.kpiRow}>
        <div className={styles.kpiBox}>
          <div className={styles.kpiLabel}>KeepaRequestQueue (PENDING)</div>
          <div className={styles.kpiValue}>{data?.keepaQueue?.summary?.PENDING ?? 0}</div>
          <div className={styles.kpiSub}>
            PROCESSING: {data?.keepaQueue?.summary?.PROCESSING ?? 0} | Резерв: 10 токенов
          </div>
        </div>
        <div className={styles.kpiBox}>
          <div className={styles.kpiLabel}>Выполнено задач (COMPLETED)</div>
          <div className={styles.kpiValue} style={{ color: '#15803d' }}>
            {data?.keepaQueue?.summary?.COMPLETED ?? 0}
          </div>
          <div className={styles.kpiSub}>
            Ошибок (FAILED): {data?.keepaQueue?.summary?.FAILED ?? 0}
          </div>
        </div>
        <div className={styles.kpiBox}>
          <div className={styles.kpiLabel}>Оптовая очередь (RequestProductQueue)</div>
          <div className={styles.kpiValue} style={{ color: '#2563eb' }}>
            {data?.productQueue?.total ?? 0}
          </div>
          <div className={styles.kpiSub}>
            Очередь анализа вариаций: {data?.analysisQueue?.total ?? 0}
          </div>
        </div>
      </div>

      {/* Панель управления и переключения вкладок */}
      <div className={styles.filterCard}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            className={tab === 'requests' ? styles.primaryBtn : styles.secondaryBtn}
            onClick={() => setTab('requests')}
          >
            Персистентная очередь KeepaRequestQueue
          </button>
          <button
            className={tab === 'products' ? styles.primaryBtn : styles.secondaryBtn}
            onClick={() => setTab('products')}
          >
            Очередь ASIN (RequestProductQueue: {data?.productQueue?.total ?? 0})
          </button>
          <button
            className={tab === 'exports' ? styles.primaryBtn : styles.secondaryBtn}
            onClick={() => setTab('exports')}
          >
            Выгрузки брендов и продавцов (KeepaExportView)
          </button>
          <button
            className={tab === 'categories' ? styles.primaryBtn : styles.secondaryBtn}
            onClick={() => setTab('categories')}
          >
            Разрешенные категории ({data?.allowedCategories?.length ?? 0})
          </button>
        </div>

        <form onSubmit={handleManualEnqueue} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="text"
            className={styles.searchInput}
            style={{ width: '210px' }}
            placeholder="Экстренный ASIN (B0...)"
            value={manualAsin}
            onChange={(e) => setManualAsin(e.target.value)}
          />
          <button type="submit" className={styles.primaryBtn} disabled={busy || !manualAsin.trim()}>
            <SyncIcon fontSize="small" />
            Запросить ASIN (CRITICAL)
          </button>
          <button
            type="button"
            className={styles.secondaryBtn}
            disabled={busy}
            onClick={handlePopulateQueue}
          >
            <PlayArrowIcon fontSize="small" />
            Пополнить очередь
          </button>
        </form>
      </div>

      {isLoading ? (
        <div className={styles.emptyState}>Загрузка состояния очередей Keepa...</div>
      ) : tab === 'requests' ? (
        <TableContainer component={Paper} className={styles.tableCard}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell style={{ fontWeight: 700 }}>ID</TableCell>
                <TableCell style={{ fontWeight: 700 }}>Тип задачи</TableCell>
                <TableCell style={{ fontWeight: 700 }}>Приоритет</TableCell>
                <TableCell style={{ fontWeight: 700 }}>Статус</TableCell>
                <TableCell style={{ fontWeight: 700 }}>Токены</TableCell>
                <TableCell style={{ fontWeight: 700 }}>Параметры (Payload) / Ошибка</TableCell>
                <TableCell style={{ fontWeight: 700 }}>Создано / Завершено</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data?.keepaQueue?.items?.map((job: any) => (
                <TableRow key={job.id}>
                  <TableCell>{job.id}</TableCell>
                  <TableCell style={{ fontWeight: 700 }}>{job.type}</TableCell>
                  <TableCell>
                    <span
                      className={
                        job.priority >= 100
                          ? styles.badgeDanger
                          : job.priority >= 50
                          ? styles.badgeWarning
                          : styles.badgeNeutral
                      }
                    >
                      {job.priority}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={
                        job.status === 'COMPLETED'
                          ? styles.badgeSuccess
                          : job.status === 'FAILED'
                          ? styles.badgeDanger
                          : styles.badgeWarning
                      }
                    >
                      {job.status}
                    </span>
                  </TableCell>
                  <TableCell>{job.expectedCost}</TableCell>
                  <TableCell style={{ maxWidth: '380px', fontFamily: 'monospace', fontSize: '0.76rem' }}>
                    {JSON.stringify(job.payload)}
                    {job.error && (
                      <div style={{ color: '#dc2626', marginTop: '4px' }}>Ошибка: {job.error}</div>
                    )}
                  </TableCell>
                  <TableCell style={{ fontSize: '0.78rem' }}>
                    <div>{new Date(job.createdAt).toLocaleString('ru-RU')}</div>
                    {job.completedAt && (
                      <div style={{ color: '#15803d' }}>
                        ✓ {new Date(job.completedAt).toLocaleString('ru-RU')}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : tab === 'products' ? (
        <TableContainer component={Paper} className={styles.tableCard}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell style={{ fontWeight: 700 }}>ID</TableCell>
                <TableCell style={{ fontWeight: 700 }}>ASIN</TableCell>
                <TableCell style={{ fontWeight: 700 }}>Приоритет (999999 = прайс поставщика)</TableCell>
                <TableCell style={{ fontWeight: 700 }}>Добавлен в очередь</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data?.productQueue?.items?.map((pq: any) => (
                <TableRow key={pq.id}>
                  <TableCell>{pq.id}</TableCell>
                  <TableCell style={{ fontWeight: 800, color: '#2563eb' }}>{pq.asin}</TableCell>
                  <TableCell>
                    <span
                      className={
                        pq.priority >= 999999 ? styles.badgeDanger : styles.badgeInfo
                      }
                    >
                      {pq.priority}
                    </span>
                  </TableCell>
                  <TableCell>{new Date(pq.addedAt).toLocaleString('ru-RU')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : tab === 'exports' ? (
        <TableContainer component={Paper} className={styles.tableCard}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell style={{ fontWeight: 700 }}>ID выгрузки</TableCell>
                <TableCell style={{ fontWeight: 700 }}>Бренд (brandName)</TableCell>
                <TableCell style={{ fontWeight: 700 }}>Продавец (sellerName)</TableCell>
                <TableCell style={{ fontWeight: 700 }}>Seller ID</TableCell>
                <TableCell style={{ fontWeight: 700 }}>Дата выгрузки</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data?.exports?.map((ex: any) => (
                <TableRow key={ex.id}>
                  <TableCell>{ex.id}</TableCell>
                  <TableCell style={{ fontWeight: 700 }}>{ex.brandName || '—'}</TableCell>
                  <TableCell>{ex.sellerName || '—'}</TableCell>
                  <TableCell style={{ fontFamily: 'monospace' }}>{ex.sellerId || '—'}</TableCell>
                  <TableCell>{new Date(ex.createdAt).toLocaleString('ru-RU')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <TableContainer component={Paper} className={styles.tableCard}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell style={{ fontWeight: 700 }}>ID</TableCell>
                <TableCell style={{ fontWeight: 700 }}>Browse Node ID (categoryId)</TableCell>
                <TableCell style={{ fontWeight: 700 }}>Название категории (Amazon.es)</TableCell>
                <TableCell style={{ fontWeight: 700 }}>Статус</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data?.allowedCategories?.map((cat: any) => (
                <TableRow key={cat.id}>
                  <TableCell>{cat.id}</TableCell>
                  <TableCell style={{ fontFamily: 'monospace', fontWeight: 700 }}>
                    {cat.categoryId}
                  </TableCell>
                  <TableCell style={{ fontWeight: 600 }}>{cat.name}</TableCell>
                  <TableCell>
                    {cat.isActive ? (
                      <span className={styles.badgeSuccess}>Активна</span>
                    ) : (
                      <span className={styles.badgeNeutral}>Отключена</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </div>
  );
}

