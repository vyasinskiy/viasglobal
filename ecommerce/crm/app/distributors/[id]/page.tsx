// ecommerce/crm/app/distributors/[id]/page.tsx
// Детальное досье B2B Поставщика: Контакты (DistributorContact), Переписка IMAP, Снапшоты прайс-листов, Заказы и Документы
'use client';
import * as React from 'react';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
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
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

export default function DistributorDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;

  // Вкладки досье поставщика
  const [tab, setTab] = useState<'contacts' | 'emails' | 'prices' | 'orders' | 'asins'>('contacts');
  const [priceSearch, setPriceSearch] = useState<string>('');

  const { data, isLoading, error } = useSWR(
    id ? `/api/backend/crm/distributors/${id}` : null,
    fetcher
  );

  if (isLoading) return <div className={styles.emptyState}>Загрузка досье поставщика...</div>;
  if (error || !data?.distributor) {
    return <div className={styles.emptyState}>Поставщик не найден.</div>;
  }

  const d = data.distributor;
  const filteredPrices = (d.priceSnapshots || []).filter((ps: any) => {
    if (!priceSearch.trim()) return true;
    const q = priceSearch.toLowerCase();
    return (
      (ps.ean && ps.ean.toLowerCase().includes(q)) ||
      (ps.asin?.code && ps.asin.code.toLowerCase().includes(q))
    );
  });

  return (
    <div className={styles.container}>
      {/* Шапка карточки поставщика */}
      <div className={styles.filterCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button className={styles.secondaryBtn} onClick={() => router.push('/distributors')}>
            <ArrowBackIcon fontSize="small" />
            Назад к списку
          </button>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800 }}>{d.name}</h2>
            <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px' }}>
              Статус: <b>{d.status}</b> • Сайт: {d.website || '—'} • Email: {d.email || '—'} • Тел:{' '}
              {d.phone || '—'}
            </div>
          </div>
        </div>
        {d.domains?.length > 0 && (
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {d.domains.map((dom: string) => (
              <span key={dom} className={styles.badgeInfo}>
                @{dom}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Заметки по условиям сотрудничества */}
      {d.notes && (
        <div
          className={styles.kpiBox}
          style={{ backgroundColor: '#f8fafc', borderColor: '#cbd5e1', whiteSpace: 'pre-wrap' }}
        >
          <div className={styles.kpiLabel}>Коммерческие условия и заметки (Notes)</div>
          <div style={{ marginTop: '6px', fontSize: '0.9rem', color: '#1e293b' }}>{d.notes}</div>
        </div>
      )}

      {/* Вкладки досье */}
      <div className={styles.filterCard}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            className={tab === 'contacts' ? styles.primaryBtn : styles.secondaryBtn}
            onClick={() => setTab('contacts')}
          >
            Менеджеры ({d._count?.contacts ?? 0})
          </button>
          <button
            className={tab === 'emails' ? styles.primaryBtn : styles.secondaryBtn}
            onClick={() => setTab('emails')}
          >
            Переписка IMAP ({d._count?.emails ?? 0})
          </button>
          <button
            className={tab === 'prices' ? styles.primaryBtn : styles.secondaryBtn}
            onClick={() => setTab('prices')}
          >
            Снапшоты прайса ({d._count?.priceSnapshots ?? 0})
          </button>
          <button
            className={tab === 'orders' ? styles.primaryBtn : styles.secondaryBtn}
            onClick={() => setTab('orders')}
          >
            Заказы и Документы ({d._count?.purchaseOrders ?? 0})
          </button>
          <button
            className={tab === 'asins' ? styles.primaryBtn : styles.secondaryBtn}
            onClick={() => setTab('asins')}
          >
            Привязанные ASIN ({d._count?.asins ?? 0})
          </button>
        </div>

        {tab === 'prices' && (
          <input
            type="text"
            className={styles.searchInput}
            style={{ maxWidth: '300px' }}
            placeholder="Поиск по ASIN или EAN в прайсе..."
            value={priceSearch}
            onChange={(e) => setPriceSearch(e.target.value)}
          />
        )}
      </div>

      {/* 1. Контакты и менеджеры */}
      {tab === 'contacts' && (
        <TableContainer component={Paper} className={styles.tableCard}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell style={{ fontWeight: 700 }}>Имя менеджера</TableCell>
                <TableCell style={{ fontWeight: 700 }}>Email</TableCell>
                <TableCell style={{ fontWeight: 700 }}>Телефон</TableCell>
                <TableCell style={{ fontWeight: 700 }}>Роль / Отдел</TableCell>
                <TableCell style={{ fontWeight: 700 }}>Статус</TableCell>
                <TableCell style={{ fontWeight: 700 }}>Заметки</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {d.contacts?.length > 0 ? (
                d.contacts.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell style={{ fontWeight: 700 }}>{c.name || 'Без имени'}</TableCell>
                    <TableCell>{c.email}</TableCell>
                    <TableCell>{c.phone || '—'}</TableCell>
                    <TableCell>{c.role || '—'}</TableCell>
                    <TableCell>
                      {c.isPrimary ? (
                        <span className={styles.badgeSuccess}>Основной</span>
                      ) : (
                        <span className={styles.badgeNeutral}>Доп. контакт</span>
                      )}
                    </TableCell>
                    <TableCell>{c.notes || '—'}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <div className={styles.emptyState}>Менеджеры пока не добавлены</div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* 2. Переписка по электронной почте */}
      {tab === 'emails' && (
        <TableContainer component={Paper} className={styles.tableCard}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell style={{ fontWeight: 700 }}>Дата</TableCell>
                <TableCell style={{ fontWeight: 700 }}>Отправитель</TableCell>
                <TableCell style={{ fontWeight: 700 }}>Тема</TableCell>
                <TableCell style={{ fontWeight: 700 }}>Содержание</TableCell>
                <TableCell style={{ fontWeight: 700 }}>Вложения</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {d.emails?.length > 0 ? (
                d.emails.map((em: any) => (
                  <TableRow key={em.id}>
                    <TableCell style={{ whiteSpace: 'nowrap' }}>
                      {new Date(em.date).toLocaleString('ru-RU')}
                    </TableCell>
                    <TableCell>
                      <div style={{ fontWeight: 600 }}>{em.fromName || em.fromEmail}</div>
                      <div style={{ fontSize: '0.74rem', color: '#64748b' }}>{em.fromEmail}</div>
                    </TableCell>
                    <TableCell style={{ fontWeight: 700 }}>{em.subject}</TableCell>
                    <TableCell style={{ maxWidth: '460px', whiteSpace: 'pre-wrap', fontSize: '0.8rem' }}>
                      {em.bodyText ? em.bodyText.slice(0, 320) : em.snippet || '—'}
                    </TableCell>
                    <TableCell>
                      {em.hasAttachments ? (
                        <span className={styles.badgeInfo}>Есть вложения</span>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <div className={styles.emptyState}>Письма от поставщика не найдены</div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* 3. Снапшоты прайс-листа */}
      {tab === 'prices' && (
        <TableContainer component={Paper} className={styles.tableCard}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell style={{ fontWeight: 700 }}>ASIN</TableCell>
                <TableCell style={{ fontWeight: 700 }}>EAN</TableCell>
                <TableCell style={{ fontWeight: 700 }}>Бренд</TableCell>
                <TableCell style={{ fontWeight: 700 }}>Цена Нетто (€)</TableCell>
                <TableCell style={{ fontWeight: 700 }}>Эко-таса (€)</TableCell>
                <TableCell style={{ fontWeight: 700 }}>Себестоимость RE (1.262)</TableCell>
                <TableCell style={{ fontWeight: 700 }}>Квант (Коробка / Мин. заказ)</TableCell>
                <TableCell style={{ fontWeight: 700 }}>Дата снапшота</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPrices.length > 0 ? (
                filteredPrices.map((ps: any) => (
                  <TableRow key={ps.id}>
                    <TableCell style={{ fontWeight: 700, color: '#2563eb' }}>
                      {ps.asin?.code || 'Не сопоставлен'}
                    </TableCell>
                    <TableCell>{ps.ean || '—'}</TableCell>
                    <TableCell>{ps.asin?.brand?.name || '—'}</TableCell>
                    <TableCell style={{ fontWeight: 600 }}>
                      {Number(ps.priceNetto).toFixed(2)} €
                    </TableCell>
                    <TableCell>
                      {ps.ecoTasa ? `${Number(ps.ecoTasa).toFixed(2)} €` : '0.00 €'}
                    </TableCell>
                    <TableCell style={{ fontWeight: 800, color: '#15803d' }}>
                      {Number(ps.costPrice).toFixed(2)} €
                    </TableCell>
                    <TableCell>
                      Коробка: {ps.unitsPerBox ?? 1} шт | Мин: {ps.minBoxOrder ?? 1} шт
                    </TableCell>
                    <TableCell>{new Date(ps.createdAt).toLocaleDateString('ru-RU')}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <div className={styles.emptyState}>Снапшоты цен не найдены</div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* 4. Заказы у поставщика */}
      {tab === 'orders' && (
        <TableContainer component={Paper} className={styles.tableCard}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell style={{ fontWeight: 700 }}>Номер заказа / Albarán</TableCell>
                <TableCell style={{ fontWeight: 700 }}>Дата заказа</TableCell>
                <TableCell style={{ fontWeight: 700 }}>Статус</TableCell>
                <TableCell style={{ fontWeight: 700 }}>Позиций</TableCell>
                <TableCell style={{ fontWeight: 700 }}>База Нетто</TableCell>
                <TableCell style={{ fontWeight: 700 }}>Итого Брутто (с RE)</TableCell>
                <TableCell style={{ fontWeight: 700 }}>Действия</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {d.purchaseOrders?.length > 0 ? (
                d.purchaseOrders.map((po: any) => (
                  <TableRow key={po.id}>
                    <TableCell style={{ fontWeight: 800, color: '#2563eb' }}>
                      {po.orderNumber}
                    </TableCell>
                    <TableCell>{new Date(po.orderDate).toLocaleDateString('ru-RU')}</TableCell>
                    <TableCell>
                      <span className={styles.badgeInfo}>{po.status}</span>
                    </TableCell>
                    <TableCell>{po._count?.items ?? 0} поз.</TableCell>
                    <TableCell>{Number(po.subtotalNetto).toFixed(2)} €</TableCell>
                    <TableCell style={{ fontWeight: 800 }}>
                      {Number(po.totalGross).toFixed(2)} €
                    </TableCell>
                    <TableCell>
                      <Link href={`/orders/${po.orderNumber}`} className={styles.primaryBtn}>
                        Открыть заказ
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <div className={styles.emptyState}>Заказы у поставщика отсутствуют</div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* 5. Привязанные товары ASIN */}
      {tab === 'asins' && (
        <TableContainer component={Paper} className={styles.tableCard}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell style={{ fontWeight: 700 }}>ID</TableCell>
                <TableCell style={{ fontWeight: 700 }}>ASIN</TableCell>
                <TableCell style={{ fontWeight: 700 }}>Бренд</TableCell>
                <TableCell style={{ fontWeight: 700 }}>Статус комиссий (feeStatus)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {d.asins?.length > 0 ? (
                d.asins.map((a: any) => (
                  <TableRow key={a.id}>
                    <TableCell>{a.id}</TableCell>
                    <TableCell style={{ fontWeight: 700, color: '#2563eb' }}>
                      <a
                        href={`https://www.amazon.es/dp/${a.code}`}
                        target="_blank"
                        rel="noreferrer"
                        className="link"
                      >
                        {a.code}
                      </a>
                    </TableCell>
                    <TableCell>{a.brand?.name || '—'}</TableCell>
                    <TableCell>{a.feeStatus || 'NULL'}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    <div className={styles.emptyState}>Привязанные товары отсутствуют</div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </div>
  );
}

