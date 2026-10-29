// ecommerce/crm/app/page.tsx
// Главный дашборд Viasglobal E-Commerce CRM & WMS со сквозной статистикой и контролем остатков СВХ
'use client';
import * as React from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import axios from 'axios';
import styles from './page.module.css';
import tableStyles from './shared-table.module.css';

// Иконки Material UI
import Inventory2Icon from '@mui/icons-material/Inventory2';
import ManageSearchIcon from '@mui/icons-material/ManageSearch';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CategoryIcon from '@mui/icons-material/Category';
import ShoppingCartCheckoutIcon from '@mui/icons-material/ShoppingCartCheckout';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import CloudSyncIcon from '@mui/icons-material/CloudSync';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import EmailIcon from '@mui/icons-material/Email';

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

export default function CrmDashboardPage() {
  // Загружаем сводную статистику дашборда с бэкенда
  const { data, error, isLoading } = useSWR('/api/backend/crm/dashboard', fetcher, {
    refreshInterval: 30000,
  });

  if (isLoading) {
    return <div className={tableStyles.emptyState}>Загрузка сводной аналитики Viasglobal CRM...</div>;
  }

  if (error || !data) {
    return (
      <div className={tableStyles.emptyState} style={{ color: '#ef4444' }}>
        Ошибка при загрузке статистики с сервиса ecommerce/backend. Проверьте доступность контейнера.
      </div>
    );
  }

  const alerts = data.inventory?.alerts || [];

  return (
    <div className={styles.container}>
      {/* Приветственный баннер */}
      <section className={styles.welcomeSection}>
        <div>
          <h1 className={styles.welcomeTitle}>Viasglobal E-Commerce CRM & WMS</h1>
          <p className={styles.welcomeSubtitle}>
            Единый центр управления каталогом Amazon Wholesale, поставщиками B2B, перепиской Hostinger IMAP,
            закупками, двухуровневым складом (СВХ / MAIN) и партионной юнит-экономикой FIFO.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <span
            style={{
              background: 'rgba(255,255,255,0.16)',
              padding: '8px 14px',
              borderRadius: '10px',
              fontSize: '0.82rem',
              fontWeight: 600,
            }}
          >
            Бэкапы БД: {data.backups?.status === 'healthy' ? '🟢 Healthy' : '🟡 Check'}
          </span>
          <span
            style={{
              background: 'rgba(255,255,255,0.16)',
              padding: '8px 14px',
              borderRadius: '10px',
              fontSize: '0.82rem',
              fontWeight: 600,
            }}
          >
            Keepa Queue: {data.keepa?.queueByStatus?.PENDING ?? 0} в очереди
          </span>
        </div>
      </section>

      {/* Блок срочных алертов пополнения СВХ (если остаток <= 1 шт) */}
      {alerts.length > 0 && (
        <section
          className={styles.sectionCard}
          style={{
            borderColor: '#fca5a5',
            backgroundColor: '#fef2f2',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <h3 className={styles.sectionTitle} style={{ color: '#b91c1c', margin: 0 }}>
              <WarningAmberIcon />
              Внимание: Требуется пополнение буфера СВХ ({alerts.length} поз.)
            </h3>
            <Link href="/inventory" className={tableStyles.primaryBtn} style={{ backgroundColor: '#dc2626' }}>
              Перейти к пополнению СВХ
            </Link>
          </div>
          <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {alerts.map((al: any) => (
              <div
                key={al.sku}
                style={{
                  background: '#ffffff',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #fecaca',
                  fontSize: '0.86rem',
                  color: '#7f1d1d',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                <span>{al.message}</span>
                <span className={al.status === 'NEEDS_TRANSFER' ? tableStyles.badgeWarning : tableStyles.badgeDanger}>
                  СВХ: {al.svhQuantity} шт | MAIN: {al.mainQuantity} шт
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Сетка основных KPI-карточек (8 направлений) */}
      <section className={styles.grid}>
        {/* 1. Товары на контракте */}
        <Link href="/contracted" className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Товары в работе (Contracted)</span>
            <div className={`${styles.iconWrapper} ${styles.greenIcon}`}>
              <Inventory2Icon />
            </div>
          </div>
          <div className={styles.cardValue}>
            {data.contracted?.filteredProfitableCount ?? 0}{' '}
            <span style={{ fontSize: '1rem', fontWeight: 600, color: '#16a34a' }}>прибыльных</span>
          </div>
          <div className={styles.cardMeta}>
            <span>С фильтрами: <b>{data.contracted?.filteredCount ?? 0}</b></span>
            <span>•</span>
            <span>Весь каталог: <b>{data.contracted?.allCount ?? 0}</b></span>
          </div>
        </Link>

        {/* 2. Кандидаты под опт */}
        <Link href="/candidates" className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Кандидаты Wholesale</span>
            <div className={`${styles.iconWrapper} ${styles.blueIcon}`}>
              <ManageSearchIcon />
            </div>
          </div>
          <div className={styles.cardValue}>
            {data.candidates?.totalCleanAsins ?? 0}{' '}
            <span style={{ fontSize: '1rem', fontWeight: 600, color: '#2563eb' }}>чистых ASIN</span>
          </div>
          <div className={styles.cardMeta}>
            <span>Чистых брендов: <b>{data.candidates?.cleanBrandsCount ?? 0}</b></span>
            <span>•</span>
            <span>Всего в пуле: <b>{data.candidates?.brandsCount ?? 0}</b></span>
          </div>
        </Link>

        {/* 3. Поставщики и B2B воронка */}
        <Link href="/distributors" className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Поставщики и Почта IMAP</span>
            <div className={`${styles.iconWrapper} ${styles.purpleIcon}`}>
              <LocalShippingIcon />
            </div>
          </div>
          <div className={styles.cardValue}>
            {data.distributors?.total ?? 0}{' '}
            <span style={{ fontSize: '1rem', fontWeight: 600, color: '#16a34a' }}>
              ({data.distributors?.byStatus?.ACCOUNT_OPENED ?? 0} открыто)
            </span>
          </div>
          <div className={styles.cardMeta}>
            <span>Писем: <b>{data.distributors?.totalEmails ?? 0}</b></span>
            <span>•</span>
            <span>Прайс-снапшотов: <b>{data.distributors?.totalPriceSnapshots ?? 0}</b></span>
          </div>
        </Link>

        {/* 4. Бренды и Private Label */}
        <Link href="/brands" className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Бренды и Каталог ASIN</span>
            <div className={`${styles.iconWrapper} ${styles.yellowIcon}`}>
              <CategoryIcon />
            </div>
          </div>
          <div className={styles.cardValue}>
            {data.catalog?.totalAsins ?? 0}{' '}
            <span style={{ fontSize: '1rem', fontWeight: 600, color: '#64748b' }}>ASIN</span>
          </div>
          <div className={styles.cardMeta}>
            <span>Брендов: <b>{data.catalog?.totalBrands ?? 0}</b></span>
            <span>•</span>
            <span>Фабрик: <b>{data.catalog?.totalManufacturers ?? 0}</b></span>
            <span>•</span>
            <span>PL: <b>{data.catalog?.totalPrivateLabels ?? 0}</b></span>
          </div>
        </Link>

        {/* 5. Закупки и Партии поставщиков */}
        <Link href="/orders" className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Заказы поставщикам</span>
            <div className={`${styles.iconWrapper} ${styles.blueIcon}`}>
              <ShoppingCartCheckoutIcon />
            </div>
          </div>
          <div className={styles.cardValue}>
            {Number(data.orders?.totalGrossSpent ?? 0).toFixed(2)} €
          </div>
          <div className={styles.cardMeta}>
            <span>Партий: <b>{data.orders?.totalOrders ?? 0}</b></span>
            <span>•</span>
            <span>База Нетто: <b>{Number(data.orders?.totalNettoSpent ?? 0).toFixed(2)} €</b></span>
          </div>
        </Link>

        {/* 6. Двухуровневый склад СВХ / MAIN */}
        <Link href="/inventory" className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Складской буфер СВХ / MAIN</span>
            <div
              className={`${styles.iconWrapper} ${
                (data.inventory?.lowStockAlertsCount ?? 0) > 0 ? styles.redIcon : styles.greenIcon
              }`}
            >
              <WarehouseIcon />
            </div>
          </div>
          <div className={styles.cardValue}>
            СВХ: {data.inventory?.svhTotalUnits ?? 0} шт{' '}
            <span style={{ fontSize: '1.1rem', color: '#475569' }}>
              | MAIN: {data.inventory?.mainTotalUnits ?? 0} шт
            </span>
          </div>
          <div className={styles.cardMeta}>
            <span>Артикулов на СВХ: <b>{data.inventory?.svhSkusCount ?? 0}</b></span>
            <span>•</span>
            <span style={{ color: (data.inventory?.lowStockAlertsCount ?? 0) > 0 ? '#dc2626' : '#16a34a', fontWeight: 700 }}>
              Алертов: {data.inventory?.lowStockAlertsCount ?? 0}
            </span>
          </div>
        </Link>

        {/* 7. Продажи на маркетплейсах и прибыль FIFO */}
        <Link href="/sales" className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Продажи Amazon (FIFO)</span>
            <div className={`${styles.iconWrapper} ${styles.greenIcon}`}>
              <PointOfSaleIcon />
            </div>
          </div>
          <div className={styles.cardValue} style={{ color: '#16a34a' }}>
            +{Number(data.sales?.totalNetProfit ?? 0).toFixed(2)} €{' '}
            <span style={{ fontSize: '0.95rem', color: '#64748b', fontWeight: 600 }}>чистая</span>
          </div>
          <div className={styles.cardMeta}>
            <span>Заказов: <b>{data.sales?.totalSalesOrders ?? 0}</b></span>
            <span>•</span>
            <span>Выручка: <b>{Number(data.sales?.totalRevenue ?? 0).toFixed(2)} €</b></span>
          </div>
        </Link>

        {/* 8. Очереди Keepa API */}
        <Link href="/keepa" className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Очереди Keepa API</span>
            <div className={`${styles.iconWrapper} ${styles.purpleIcon}`}>
              <CloudSyncIcon />
            </div>
          </div>
          <div className={styles.cardValue}>
            {data.keepa?.queueByStatus?.COMPLETED ?? 0}{' '}
            <span style={{ fontSize: '1rem', fontWeight: 600, color: '#64748b' }}>выполнено</span>
          </div>
          <div className={styles.cardMeta}>
            <span>Ожидает: <b>{data.keepa?.queueByStatus?.PENDING ?? 0}</b></span>
            <span>•</span>
            <span>ProductQueue: <b>{data.keepa?.requestProductQueueCount ?? 0}</b></span>
            <span>•</span>
            <span>Выгрузок: <b>{data.keepa?.exportsCount ?? 0}</b></span>
          </div>
        </Link>
      </section>

      {/* Сводка воронки дистрибьюторов */}
      <section className={styles.sectionCard}>
        <h3 className={styles.sectionTitle}>
          <LocalShippingIcon style={{ color: '#2563eb' }} />
          Воронка коммуникаций с B2B поставщиками
        </h3>
        <div className={tableStyles.kpiRow}>
          <div className={tableStyles.kpiBox}>
            <div className={tableStyles.kpiLabel}>NEW (Новые)</div>
            <div className={tableStyles.kpiValue}>{data.distributors?.byStatus?.NEW ?? 0}</div>
            <div className={tableStyles.kpiSub}>Найдены для контакта</div>
          </div>
          <div className={tableStyles.kpiBox}>
            <div className={tableStyles.kpiLabel}>FORM / EMAIL SENT</div>
            <div className={tableStyles.kpiValue}>
              {(data.distributors?.byStatus?.FORM_SUBMITTED ?? 0) +
                (data.distributors?.byStatus?.EMAIL_SENT ?? 0)}
            </div>
            <div className={tableStyles.kpiSub}>Отправлены Welcome Letters</div>
          </div>
          <div className={tableStyles.kpiBox}>
            <div className={tableStyles.kpiLabel}>CALLED (Звонок)</div>
            <div className={tableStyles.kpiValue}>{data.distributors?.byStatus?.CALLED ?? 0}</div>
            <div className={tableStyles.kpiSub}>Переговоры по телефону</div>
          </div>
          <div className={tableStyles.kpiBox} style={{ borderColor: '#bbf7d0', backgroundColor: '#f0fdf4' }}>
            <div className={tableStyles.kpiLabel} style={{ color: '#15803d' }}>
              ACCOUNT_OPENED (Открыт)
            </div>
            <div className={tableStyles.kpiValue} style={{ color: '#15803d' }}>
              {data.distributors?.byStatus?.ACCOUNT_OPENED ?? 0}
            </div>
            <div className={tableStyles.kpiSub}>Активные контракты B2B</div>
          </div>
          <div className={tableStyles.kpiBox}>
            <div className={tableStyles.kpiLabel}>REJECTED (Отказ)</div>
            <div className={tableStyles.kpiValue} style={{ color: '#b91c1c' }}>
              {data.distributors?.byStatus?.REJECTED ?? 0}
            </div>
            <div className={tableStyles.kpiSub}>Закрыты / не работают с Amazon</div>
          </div>
        </div>
      </section>

      {/* Быстрые действия */}
      <section className={styles.sectionCard}>
        <h3 className={styles.sectionTitle}>
          <CheckCircleOutlineIcon style={{ color: '#2563eb' }} />
          Быстрые переходы и рабочие инструменты
        </h3>
        <div className={styles.actionGrid}>
          <Link href="/contracted" className={styles.actionBtn}>
            <Inventory2Icon fontSize="medium" />
            <span>Юнит-экономика брендов на контракте (Safta, Cofan, Kuken)</span>
          </Link>
          <Link href="/candidates" className={styles.actionBtn}>
            <ManageSearchIcon fontSize="medium" />
            <span>Отбор новых брендов и чистых ASIN под Wholesale</span>
          </Link>
          <Link href="/distributors" className={styles.actionBtn}>
            <EmailIcon fontSize="medium" />
            <span>CRM Поставщиков, Контакты и Почта Hostinger IMAP</span>
          </Link>
          <Link href="/orders" className={styles.actionBtn}>
            <ShoppingCartCheckoutIcon fontSize="medium" />
            <span>Заказы поставщикам, Albarán и Приемка коробок</span>
          </Link>
        </div>
      </section>
    </div>
  );
}

