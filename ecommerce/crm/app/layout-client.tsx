// ecommerce/crm/app/layout-client.tsx
// Клиентская оболочка с боковой навигацией, индикатором алертов СВХ и шапкой CRM
'use client';
import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import useSWR from 'swr';
import axios from 'axios';
import styles from './layout.module.css';

// Иконки Material UI
import DashboardIcon from '@mui/icons-material/Dashboard';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import ManageSearchIcon from '@mui/icons-material/ManageSearch';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CategoryIcon from '@mui/icons-material/Category';
import ShoppingCartCheckoutIcon from '@mui/icons-material/ShoppingCartCheckout';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import CloudSyncIcon from '@mui/icons-material/CloudSync';
import LogoutIcon from '@mui/icons-material/Logout';

interface MenuItem {
  text: string;
  path: string;
  icon: React.ReactNode;
  badge?: number;
  section?: string;
}

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // Периодически опрашиваем алерты низкого остатка на СВХ (<= 1 шт) для отображения красного бейджа в меню
  const { data: alertsData } = useSWR<{ totalAlerts: number }>(
    pathname !== '/login' ? '/api/backend/inventory/alerts' : null,
    fetcher,
    { refreshInterval: 20000 }
  );
  const lowStockAlertsCount = alertsData?.totalAlerts || 0;

  // На странице входа скрываем боковую панель и шапку
  if (pathname === '/login') {
    return <>{children}</>;
  }

  // Навигационное меню по всем подсистемам ecommerce/backend
  const menuItems: MenuItem[] = [
    {
      section: 'Аналитика и Каталог',
      text: 'Дашборд CRM',
      path: '/',
      icon: <DashboardIcon className={styles.menuIcon} />,
    },
    {
      text: 'Товары в работе',
      path: '/contracted',
      icon: <Inventory2Icon className={styles.menuIcon} />,
    },
    {
      text: 'Кандидаты Wholesale',
      path: '/candidates',
      icon: <ManageSearchIcon className={styles.menuIcon} />,
    },
    {
      section: 'Контрагенты и Бренд-менеджмент',
      text: 'Поставщики и Почта',
      path: '/distributors',
      icon: <LocalShippingIcon className={styles.menuIcon} />,
    },
    {
      text: 'Бренды и Private Label',
      path: '/brands',
      icon: <CategoryIcon className={styles.menuIcon} />,
    },
    {
      section: 'WMS: Закупки, Склад и Продажи',
      text: 'Заказы и Приемка',
      path: '/orders',
      icon: <ShoppingCartCheckoutIcon className={styles.menuIcon} />,
    },
    {
      text: 'Склад СВХ / MAIN',
      path: '/inventory',
      icon: <WarehouseIcon className={styles.menuIcon} />,
      badge: lowStockAlertsCount,
    },
    {
      text: 'Продажи и FIFO партии',
      path: '/sales',
      icon: <PointOfSaleIcon className={styles.menuIcon} />,
    },
    {
      section: 'Инфраструктура',
      text: 'Keepa API и Очереди',
      path: '/keepa',
      icon: <CloudSyncIcon className={styles.menuIcon} />,
    },
  ];

  // Выход из системы со сбросом сессионной cookie
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Игнорируем сетевые ошибки при выходе
    }
    document.cookie = 'vias_crm_session=; Path=/; Max-Age=0;';
    router.push('/login');
  };

  // Определяем заголовок текущей страницы для верхней шапки
  const getPageTitle = () => {
    const activeItem = menuItems.find((item) => {
      if (item.path === '/') return pathname === '/';
      return pathname.startsWith(item.path);
    });
    return activeItem ? activeItem.text : 'Viasglobal E-Commerce CRM';
  };

  return (
    <div className={styles.layoutContainer}>
      {/* Боковая панель навигации */}
      <aside className={styles.sidebar}>
        <div className={styles.logoArea}>
          <span className={styles.logoText}>Viasglobal CRM</span>
          <span className={styles.logoSubtext}>Amazon Wholesale & WMS</span>
        </div>
        <nav className={styles.menuList}>
          {menuItems.map((item) => {
            const isActive =
              item.path === '/' ? pathname === '/' : pathname.startsWith(item.path);

            return (
              <React.Fragment key={item.path}>
                {item.section && (
                  <div className={styles.menuSectionLabel}>{item.section}</div>
                )}
                <div className={styles.menuItem}>
                  <Link
                    href={item.path}
                    className={`${styles.menuLink} ${
                      isActive ? styles.activeMenuLink : ''
                    }`}
                  >
                    {item.icon}
                    <span style={{ flex: 1 }}>{item.text}</span>
                    {Boolean(item.badge && item.badge > 0) && (
                      <span
                        style={{
                          backgroundColor: '#ef4444',
                          color: '#fff',
                          borderRadius: '10px',
                          padding: '2px 8px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          lineHeight: 1.2,
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </div>
              </React.Fragment>
            );
          })}
        </nav>
      </aside>

      {/* Основная рабочая область */}
      <div className={styles.mainWrapper}>
        <header className={styles.header}>
          <h2 className={styles.pageTitle}>{getPageTitle()}</h2>
          <div className={styles.userInfo}>
            <span className={styles.taxBadge} title="Режим налогообложения по умолчанию: IVA 21% + RE 5.2% (1.262)">
              IVA 21% + RE 5.2%
            </span>
            <span className={styles.userBadge}>Администратор</span>
            <button className={styles.logoutBtn} onClick={handleLogout}>
              <LogoutIcon
                style={{ fontSize: '1rem', marginRight: '4px', verticalAlign: 'middle' }}
              />
              Выйти
            </button>
          </div>
        </header>
        <main className={styles.contentArea}>{children}</main>
      </div>
    </div>
  );
}

