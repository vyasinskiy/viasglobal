// ecommerce/crm/app/candidates/page.tsx
// Раздел «Кандидаты Wholesale» (CandidatesProductsView / WholesaleCandidatesView) и поиск по общему реестру AsinView
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
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import VisibilityIcon from '@mui/icons-material/Visibility';

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

export default function CandidatesPage() {
  // Переключатель вкладок: 'candidates' (группировка по брендам) или 'asins' (поштучный поиск AsinView)
  const [tab, setTab] = useState<'candidates' | 'asins'>('candidates');
  const [search, setSearch] = useState<string>('');
  const [onlyClean, setOnlyClean] = useState<boolean>(true);
  const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null);

  // Запрос кандидатов Wholesale
  const { data: candData, isLoading: isCandLoading } = useSWR(
    tab === 'candidates'
      ? `/api/backend/crm/products/candidates?onlyClean=${onlyClean}&search=${encodeURIComponent(search)}`
      : null,
    fetcher
  );

  // Запрос общего каталога AsinView
  const { data: asinData, isLoading: isAsinLoading } = useSWR(
    tab === 'asins'
      ? `/api/backend/crm/products/asins?search=${encodeURIComponent(search)}&limit=150`
      : null,
    fetcher
  );

  // Копирование списка ASIN или EAN в буфер обмена
  const copyToClipboard = (text: string, label: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!text) return;
    navigator.clipboard.writeText(text);
    alert(`${label} скопированы в буфер обмена!`);
  };

  return (
    <div className={styles.container}>
      {/* Переключатель вкладок и KPI */}
      <div className={styles.filterCard}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className={tab === 'candidates' ? styles.primaryBtn : styles.secondaryBtn}
            onClick={() => setTab('candidates')}
          >
            Пул кандидатов Wholesale (1 бренд + фабрика)
          </button>
          <button
            className={tab === 'asins' ? styles.primaryBtn : styles.secondaryBtn}
            onClick={() => setTab('asins')}
          >
            Общий реестр AsinView (поштучный поиск)
          </button>
        </div>

        <div className={styles.searchWrapper}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder={
              tab === 'candidates'
                ? 'Поиск по бренду, фабрике, продавцам, ASIN, EAN...'
                : 'Поиск по ASIN, EAN, бренду или продавцу Buy Box...'
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {tab === 'candidates' && (
          <FormControlLabel
            control={
              <Checkbox
                checked={onlyClean}
                onChange={(e) => setOnlyClean(e.target.checked)}
                color="primary"
              />
            }
            label="Только с чистыми ASIN (cleanAsinCount > 0)"
          />
        )}
      </div>

      {/* Вкладка 1: CandidatesProductsView */}
      {tab === 'candidates' ? (
        isCandLoading ? (
          <div className={styles.emptyState}>Анализ пула кандидатов Wholesale...</div>
        ) : (
          <TableContainer component={Paper} className={styles.tableCard}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell style={{ fontWeight: 700 }}>Производитель (Manufacturer)</TableCell>
                  <TableCell style={{ fontWeight: 700 }}>Бренд (Brand)</TableCell>
                  <TableCell style={{ fontWeight: 700 }}>Чистых ASIN / Всего</TableCell>
                  <TableCell style={{ fontWeight: 700 }}>Продавцов (Sellers)</TableCell>
                  <TableCell style={{ fontWeight: 700 }}>Причины фильтрации</TableCell>
                  <TableCell style={{ fontWeight: 700 }}>Дистрибьюторы</TableCell>
                  <TableCell style={{ fontWeight: 700, textAlign: 'center' }}>Действия</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {candData?.items?.length > 0 ? (
                  candData.items.map((row: any, idx: number) => (
                    <TableRow
                      key={`${row.brandId}-${row.manufacturer}-${idx}`}
                      className={styles.interactiveRow}
                      onClick={() => setSelectedCandidate(row)}
                    >
                      <TableCell style={{ fontWeight: 700 }}>{row.manufacturer}</TableCell>
                      <TableCell>
                        <span className={styles.badgeInfo}>{row.brand}</span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={
                            row.cleanAsinCount > 0 ? styles.badgeSuccess : styles.badgeNeutral
                          }
                        >
                          {row.cleanAsinCount} чистых
                        </span>{' '}
                        <span style={{ color: '#64748b', fontSize: '0.78rem' }}>
                          из {row.asinCount}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div style={{ fontWeight: 700 }}>{row.sellerCount} селлеров</div>
                        <div
                          style={{
                            fontSize: '0.75rem',
                            color: '#64748b',
                            maxWidth: '240px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                          title={row.sellerNames}
                        >
                          {row.sellerNames || '—'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {row.filterReasons ? (
                          <span className={styles.badgeWarning}>{row.filterReasons}</span>
                        ) : (
                          <span className={styles.badgeSuccess}>ВСЕ ЧИСТЫЕ</span>
                        )}
                      </TableCell>
                      <TableCell style={{ fontWeight: 600, color: '#15803d' }}>
                        {row.distributors || 'Не привязан'}
                      </TableCell>
                      <TableCell style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          {row.cleanAsins && (
                            <button
                              className={styles.secondaryBtn}
                              style={{ padding: '5px 10px' }}
                              title="Скопировать чистые ASIN"
                              onClick={(e) => copyToClipboard(row.cleanAsins, 'Чистые ASIN', e)}
                            >
                              <ContentCopyIcon style={{ fontSize: '0.9rem' }} />
                              ASINs
                            </button>
                          )}
                          <button
                            className={styles.primaryBtn}
                            style={{ padding: '5px 10px' }}
                            onClick={() => setSelectedCandidate(row)}
                          >
                            <VisibilityIcon style={{ fontSize: '0.9rem' }} />
                            Детали
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <div className={styles.emptyState}>Кандидаты по запросу не найдены</div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )
      ) : (
        /* Вкладка 2: Общий каталог AsinView */
        isAsinLoading ? (
          <div className={styles.emptyState}>Загрузка реестра AsinView...</div>
        ) : (
          <TableContainer component={Paper} className={styles.tableCard}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell style={{ fontWeight: 700 }}>ID</TableCell>
                  <TableCell style={{ fontWeight: 700 }}>ASIN</TableCell>
                  <TableCell style={{ fontWeight: 700 }}>EAN</TableCell>
                  <TableCell style={{ fontWeight: 700 }}>Бренд</TableCell>
                  <TableCell style={{ fontWeight: 700 }}>Продавец Buy Box</TableCell>
                  <TableCell style={{ fontWeight: 700 }}>Цена Buy Box (€)</TableCell>
                  <TableCell style={{ fontWeight: 700 }}>Макс. цена закупки под 10% маржи (€)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {asinData?.items?.length > 0 ? (
                  asinData.items.map((row: any) => (
                    <TableRow key={row.id} className={styles.interactiveRow}>
                      <TableCell>{row.id}</TableCell>
                      <TableCell style={{ fontWeight: 700, color: '#2563eb' }}>
                        <a
                          href={`https://www.amazon.es/dp/${row.asin}`}
                          target="_blank"
                          rel="noreferrer"
                          className="link"
                        >
                          {row.asin}
                        </a>
                      </TableCell>
                      <TableCell>{row.ean || '—'}</TableCell>
                      <TableCell style={{ fontWeight: 600 }}>{row.brand || '—'}</TableCell>
                      <TableCell>{row.seller || '—'}</TableCell>
                      <TableCell style={{ fontWeight: 700 }}>
                        {row.buyBoxPrice != null ? `${Number(row.buyBoxPrice).toFixed(2)} €` : '—'}
                      </TableCell>
                      <TableCell style={{ fontWeight: 700, color: '#15803d' }}>
                        {row.maxBuyPrice != null ? `${Number(row.maxBuyPrice).toFixed(2)} €` : '—'}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <div className={styles.emptyState}>Товары в AsinView не найдены</div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )
      )}

      {/* Модальное окно детального просмотра кандидата (списки ASIN, EAN, селлеров) */}
      <Dialog
        open={Boolean(selectedCandidate)}
        onClose={() => setSelectedCandidate(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle style={{ fontWeight: 800 }}>
          Кандидат Wholesale: {selectedCandidate?.brand} ({selectedCandidate?.manufacturer})
        </DialogTitle>
        <DialogContent dividers>
          {selectedCandidate && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <b>Чистые ASIN ({selectedCandidate.cleanAsinCount} шт):</b>
                <div
                  style={{
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    padding: '10px',
                    borderRadius: '8px',
                    marginTop: '4px',
                    fontFamily: 'monospace',
                  }}
                >
                  {selectedCandidate.cleanAsins || 'Нет чистых ASIN'}
                </div>
              </div>
              <div>
                <b>Все ASIN бренда ({selectedCandidate.asinCount} шт):</b>
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    padding: '10px',
                    borderRadius: '8px',
                    marginTop: '4px',
                    fontFamily: 'monospace',
                  }}
                >
                  {selectedCandidate.asins}
                </div>
              </div>
              <div>
                <b>Штрихкоды EAN:</b>
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    padding: '10px',
                    borderRadius: '8px',
                    marginTop: '4px',
                    fontFamily: 'monospace',
                  }}
                >
                  {selectedCandidate.eans || '—'}
                </div>
              </div>
              <div>
                <b>Продавцы на листингах ({selectedCandidate.sellerCount}):</b>
                <p style={{ margin: '4px 0', color: '#334155' }}>
                  {selectedCandidate.sellerNames || '—'}
                </p>
                <p style={{ margin: '2px 0', fontSize: '0.78rem', color: '#64748b' }}>
                  Seller IDs: {selectedCandidate.sellerIds || '—'}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedCandidate(null)}>Закрыть</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

