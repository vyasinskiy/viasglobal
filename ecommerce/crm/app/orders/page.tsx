// ecommerce/crm/app/orders/page.tsx
// Раздел «Заказы и Приемка»: реестр партий поставщиков (PurchaseOrder) с учетом налогов Recargo de Equivalencia (1.262) и эко-тасы
'use client';
import * as React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import VisibilityIcon from '@mui/icons-material/Visibility';

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

export default function OrdersPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');

  const { data, isLoading } = useSWR(
    `/api/backend/crm/orders?status=${statusFilter}&search=${encodeURIComponent(search)}`,
    fetcher
  );

  const orders = data?.orders || [];

  const renderStatus = (status: string) => {
    switch (status) {
      case 'RECEIVED':
        return <span className={styles.badgeSuccess}>RECEIVED (Принят)</span>;
      case 'PARTIALLY_RECEIVED':
        return <span className={styles.badgeWarning}>PARTIALLY_RECEIVED</span>;
      case 'SHIPPED':
        return <span className={styles.badgeInfo}>SHIPPED (В пути)</span>;
      case 'CONFIRMED':
        return <span className={styles.badgeInfo}>CONFIRMED (Подтвержден)</span>;
      case 'CANCELLED':
        return <span className={styles.badgeDanger}>CANCELLED</span>;
      default:
        return <span className={styles.badgeNeutral}>{status}</span>;
    }
  };

  return (
    <div className={styles.container}>
      {/* Панель поиска и фильтрации */}
      <div className={styles.filterCard}>
        <div className={styles.searchWrapper}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Поиск по номеру заказа / Albarán (напр. 26ALV-0074072), поставщику..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className={styles.searchInput}
          style={{ width: 'auto' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="ALL">Все статусы заказов</option>
          <option value="RECEIVED">RECEIVED (Принят на складе)</option>
          <option value="CONFIRMED">CONFIRMED (Подтвержден)</option>
          <option value="SHIPPED">SHIPPED (В пути)</option>
          <option value="PARTIALLY_RECEIVED">PARTIALLY_RECEIVED</option>
          <option value="DRAFT">DRAFT (Черновик)</option>
        </select>
      </div>

      {/* Таблица заказов поставщикам */}
      {isLoading ? (
        <div className={styles.emptyState}>Загрузка реестра заказов поставщикам...</div>
      ) : (
        <TableContainer component={Paper} className={styles.tableCard}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell style={{ fontWeight: 700 }}>Номер заказа / Albarán</TableCell>
                <TableCell style={{ fontWeight: 700 }}>Поставщик</TableCell>
                <TableCell style={{ fontWeight: 700 }}>Дата заказа / Приемки</TableCell>
                <TableCell style={{ fontWeight: 700 }}>Статус поставки</TableCell>
                <TableCell style={{ fontWeight: 700 }}>Позиций / Документов</TableCell>
                <TableCell style={{ fontWeight: 700 }}>База Нетто + Эко-таса</TableCell>
                <TableCell style={{ fontWeight: 700 }}>Налоги (IVA+RE 26.2%)</TableCell>
                <TableCell style={{ fontWeight: 700 }}>Итого Брутто (€)</TableCell>
                <TableCell style={{ fontWeight: 700 }}>Оплата</TableCell>
                <TableCell style={{ fontWeight: 700, textAlign: 'center' }}>Действия</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.length > 0 ? (
                orders.map((po: any) => (
                  <TableRow
                    key={po.id}
                    className={styles.interactiveRow}
                    onClick={() => router.push(`/orders/${encodeURIComponent(po.orderNumber)}`)}
                  >
                    <TableCell style={{ fontWeight: 800, color: '#2563eb' }}>
                      {po.orderNumber}
                    </TableCell>
                    <TableCell style={{ fontWeight: 700 }}>
                      {po.distributor?.name || '—'}
                    </TableCell>
                    <TableCell>
                      <div>{new Date(po.orderDate).toLocaleDateString('ru-RU')}</div>
                      {po.actualDeliveryDate && (
                        <div style={{ fontSize: '0.74rem', color: '#15803d' }}>
                          Принят: {new Date(po.actualDeliveryDate).toLocaleDateString('ru-RU')}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{renderStatus(po.status)}</TableCell>
                    <TableCell>
                      <div>{po._count?.items ?? po.items?.length ?? 0} поз.</div>
                      <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                        Документов: {po._count?.documents ?? po.documents?.length ?? 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div style={{ fontWeight: 600 }}>
                        {Number(po.subtotalNetto).toFixed(2)} €
                      </div>
                      {po.totalEcoTasa > 0 && (
                        <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                          + RAEE: {Number(po.totalEcoTasa).toFixed(2)} €
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{Number(po.taxAmount).toFixed(2)} €</TableCell>
                    <TableCell style={{ fontWeight: 800, fontSize: '0.94rem', color: '#0f172a' }}>
                      {Number(po.totalGross).toFixed(2)} €
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          po.paymentStatus === 'PAID' ? styles.badgeSuccess : styles.badgeWarning
                        }
                      >
                        {po.paymentStatus}
                      </span>
                      {po.paymentMethod && (
                        <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                          {po.paymentMethod}
                        </div>
                      )}
                    </TableCell>
                    <TableCell style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                      <button
                        className={styles.primaryBtn}
                        onClick={() => router.push(`/orders/${encodeURIComponent(po.orderNumber)}`)}
                      >
                        <VisibilityIcon style={{ fontSize: '0.95rem' }} />
                        Карточка и Юнит-экономика
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={10} align="center">
                    <div className={styles.emptyState}>Заказы поставщикам не найдены</div>
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

