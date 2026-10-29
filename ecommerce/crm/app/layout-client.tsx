// ecommerce/crm/app/layout-client.tsx
// Двухуровневая навигация единой CRM-системы Viasglobal:
// 1. Верхнее главное меню в шапке (Top Navbar) с переключением между ключевыми бизнесами:
//    - Сводные финансы (коренная страница /finance)
//    - Amazon Wholesale (коренная страница /)
//    - Аренда недвижимости РФ (коренная страница /rent/apartments)
// 2. Боковая панель (Sidebar), динамически отображающая страницы только выбранного бизнеса.
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import useSWR from 'swr';
import axios from 'axios';
import styles from './layout.module.css';

// Иконки Material UI: Навигация и общие
import DashboardIcon from '@mui/icons-material/Dashboard';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import LogoutIcon from '@mui/icons-material/Logout';

// Иконки Material UI: Сводные финансы
import CodeIcon from '@mui/icons-material/Code';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import ApartmentIcon from '@mui/icons-material/Apartment';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

// Иконки Material UI: Amazon Wholesale & WMS
import Inventory2Icon from '@mui/icons-material/Inventory2';
import ManageSearchIcon from '@mui/icons-material/ManageSearch';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CategoryIcon from '@mui/icons-material/Category';
import ShoppingCartCheckoutIcon from '@mui/icons-material/ShoppingCartCheckout';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import CloudSyncIcon from '@mui/icons-material/CloudSync';

// Иконки Material UI: Аренда недвижимости
import BusinessIcon from '@mui/icons-material/Business';
import PeopleIcon from '@mui/icons-material/People';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ReceiptIcon from '@mui/icons-material/Receipt';
import PaymentIcon from '@mui/icons-material/Payment';
import EventIcon from '@mui/icons-material/Event';
import SyncIcon from '@mui/icons-material/Sync';

// Интерфейс для пунктов подменю в сайдбаре
interface MenuItem {
  text: string;
  path: string;
  icon: React.ReactNode;
  badge?: number;
}

// Интерфейс для бизнес-подраздела верхнего меню
interface BusinessUnit {
  id: 'finance' | 'amazon' | 'rent';
  title: string;
  rootPath: string;
  badgeLabel: string;
  icon: React.ReactNode;
  items: MenuItem[];
}

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentHash, setCurrentHash] = React.useState<string>('');

  // Отслеживаем изменение хэша (#it-section и т.д.) на клиенте
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentHash(window.location.hash);
      const handleHashChange = () => setCurrentHash(window.location.hash);
      window.addEventListener('hashchange', handleHashChange);
      return () => window.removeEventListener('hashchange', handleHashChange);
    }
  }, [pathname]);

  // Опрашиваем алерты низкого остатка на СВХ (Amazon FBM)
  const { data: alertsData } = useSWR<{ totalAlerts: number }>(
    pathname !== '/login' ? '/api/backend/inventory/alerts' : null,
    fetcher,
    { refreshInterval: 20000 }
  );
  const lowStockAlertsCount = alertsData?.totalAlerts || 0;

  // Опрашиваем счетчик событий по аренде (подача счетчиков / напоминания)
  const { data: pendingEventsData } = useSWR<{ count: number }>(
    pathname !== '/login' ? '/api/events/pending-count' : null,
    fetcher,
    { refreshInterval: 20000 }
  );
  const pendingEventsCount = pendingEventsData?.count || 0;

  // На странице входа скрываем боковую панель и шапку
  if (pathname === '/login') {
    return <>{children}</>;
  }

  // Определение активного бизнес-подраздела по URL
  const activeBusinessId: 'finance' | 'amazon' | 'rent' = React.useMemo(() => {
    if (pathname === '/finance' || pathname.startsWith('/finance/')) {
      return 'finance';
    }
    if (pathname.startsWith('/rent')) {
      return 'rent';
    }
    return 'amazon';
  }, [pathname]);

  // Конфигурация всех бизнес-подразделов и их внутренних страниц
  const businessUnits: BusinessUnit[] = [
    {
      id: 'finance',
      title: 'Сводные финансы',
      rootPath: '/finance',
      badgeLabel: 'P&L • IT 4000 € • Amazon • Аренда РФ',
      icon: <AccountBalanceWalletIcon className={styles.tabIcon} />,
      items: [
        {
          text: 'Сводный дашборд P&L',
          path: '/finance',
          icon: <AccountBalanceWalletIcon className={styles.menuIcon} />,
        },
        {
          text: 'IT-разработка (4 000 €)',
          path: '/finance#it-section',
          icon: <CodeIcon className={styles.menuIcon} />,
        },
        {
          text: 'Amazon Wholesale P&L',
          path: '/finance#amazon-section',
          icon: <ShoppingBagIcon className={styles.menuIcon} />,
        },
        {
          text: 'Аренда РФ (Рубли)',
          path: '/finance#rent-section',
          icon: <ApartmentIcon className={styles.menuIcon} />,
        },
        {
          text: 'Помесячный P&L отчет',
          path: '/finance#monthly-pl-section',
          icon: <TrendingUpIcon className={styles.menuIcon} />,
        },
        {
          text: 'Комплаенс Taxfix',
          path: '/finance#taxfix-section',
          icon: <ReceiptIcon className={styles.menuIcon} />,
        },
      ],
    },
    {
      id: 'amazon',
      title: 'Amazon Wholesale',
      rootPath: '/',
      badgeLabel: 'Испания • Autónomo IAE 665 / CNAE 4791',
      icon: <Inventory2Icon className={styles.tabIcon} />,
      items: [
        {
          text: 'Главная CRM (Сводка)',
          path: '/',
          icon: <DashboardIcon className={styles.menuIcon} />,
        },
        {
          text: 'Склад СВХ / MAIN',
          path: '/inventory',
          icon: <WarehouseIcon className={styles.menuIcon} />,
          badge: lowStockAlertsCount,
        },
        {
          text: 'Заказы и Приемка',
          path: '/orders',
          icon: <ShoppingCartCheckoutIcon className={styles.menuIcon} />,
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
          text: 'Продажи и FIFO партии',
          path: '/sales',
          icon: <PointOfSaleIcon className={styles.menuIcon} />,
        },
        {
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
          text: 'Keepa API и Очереди',
          path: '/keepa',
          icon: <CloudSyncIcon className={styles.menuIcon} />,
        },
      ],
    },
    {
      id: 'rent',
      title: 'Аренда недвижимости',
      rootPath: '/rent/apartments',
      badgeLabel: 'РФ • Доходы, ЖКУ и Чеки',
      icon: <BusinessIcon className={styles.tabIcon} />,
      items: [
        {
          text: 'Квартиры',
          path: '/rent/apartments',
          icon: <BusinessIcon className={styles.menuIcon} />,
        },
        {
          text: 'Арендаторы',
          path: '/rent/tenants',
          icon: <PeopleIcon className={styles.menuIcon} />,
        },
        {
          text: 'Платежи и Чеки',
          path: '/rent/payments',
          icon: <PaymentIcon className={styles.menuIcon} />,
        },
        {
          text: 'Квитанции и Инвойсы ЖКУ',
          path: '/rent/invoices',
          icon: <ReceiptIcon className={styles.menuIcon} />,
        },
        {
          text: 'Лицевые счета ЖКУ',
          path: '/rent/accounts',
          icon: <AccountBalanceIcon className={styles.menuIcon} />,
        },
        {
          text: 'Банки зачисления',
          path: '/rent/banks',
          icon: <AccountBalanceWalletIcon className={styles.menuIcon} />,
        },
        {
          text: 'События и Счетчики',
          path: '/rent/events',
          icon: <EventIcon className={styles.menuIcon} />,
          badge: pendingEventsCount,
        },
        {
          text: 'Сканирование и Браузер ЖКХ',
          path: '/rent/scanning',
          icon: <SyncIcon className={styles.menuIcon} />,
        },
      ],
    },
  ];

  // Активный выбранный бизнес для отображения сайдбара
  const currentBusiness =
    businessUnits.find((b) => b.id === activeBusinessId) || businessUnits[1];

  // Выход из системы со сбросом сессионных cookie
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Игнорируем сетевые ошибки при выходе
    }
    document.cookie = 'vias_crm_session=; Path=/; Max-Age=0;';
    document.cookie = 'vias_rent_session=; Path=/; Max-Age=0;';
    router.push('/login');
  };

  return (
    <div className={styles.layoutContainer}>
      {/* 1. ГЛАВНОЕ МЕНЮ В ШАПКЕ С ПОДРАЗДЕЛАМИ ПО БИЗНЕСАМ */}
      <header className={styles.topHeader}>
        {/* Логотип единой системы */}
        <div className={styles.brandArea}>
          <Link href="/" className={styles.logoText}>
            Viasglobal ERP
          </Link>
        </div>

        {/* Главные подразделы бизнеса с переходом на коренные страницы */}
        <nav className={styles.businessNav} aria-label="Подразделы бизнеса">
          {businessUnits.map((business) => {
            const isBusinessActive = activeBusinessId === business.id;
            return (
              <Link
                key={business.id}
                href={business.rootPath}
                className={`${styles.businessTab} ${
                  isBusinessActive ? styles.activeBusinessTab : ''
                }`}
                title={business.badgeLabel}
              >
                {business.icon}
                <span>{business.title}</span>
              </Link>
            );
          })}
        </nav>

        {/* Правый блок: налоговые контуры, пользователь, выход */}
        <div className={styles.topRightInfo}>
          <span
            className={styles.taxBadge}
            title="Налоговые контуры: IT 0% ROI • Amazon RE 1.262 • Аренда РФ"
          >
            IT • Amazon • Rent
          </span>
          <span className={styles.userBadge}>Администратор</span>
          <button className={styles.logoutBtn} onClick={handleLogout} title="Завершить сессию">
            <LogoutIcon
              style={{ fontSize: '0.95rem', marginRight: '4px', verticalAlign: 'middle' }}
            />
            Выйти
          </button>
        </div>
      </header>

      {/* 2. ТЕЛО СИСТЕМЫ: БОКОВОЕ МЕНЮ ТЕКУЩЕГО БИЗНЕСА + РАБОЧАЯ ОБЛАСТЬ */}
      <div className={styles.bodyContainer}>
        {/* Боковая панель (страницы активного подраздела) */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarSectionHeader}>
            <div className={styles.sidebarSectionSub}>Текущий бизнес</div>
            <div className={styles.sidebarSectionTitle}>
              {currentBusiness.icon}
              <span>{currentBusiness.title}</span>
            </div>
          </div>

          <nav className={styles.menuList}>
            {currentBusiness.items.map((item) => {
              // Проверяем активность ссылки
              let isActive = false;
              if (item.path.includes('#')) {
                const [targetPath, targetHash] = item.path.split('#');
                isActive = pathname === targetPath && currentHash === `#${targetHash}`;
              } else if (item.path === '/') {
                isActive = pathname === '/';
              } else if (item.path === '/finance') {
                isActive = pathname === '/finance' && !currentHash;
              } else {
                isActive = pathname === item.path || pathname.startsWith(item.path + '/');
              }

              return (
                <div key={item.path} className={styles.menuItem}>
                  <Link
                    href={item.path}
                    className={`${styles.menuLink} ${
                      isActive ? styles.activeMenuLink : ''
                    }`}
                    onClick={() => {
                      if (item.path.includes('#')) {
                        const targetHash = item.path.split('#')[1];
                        setCurrentHash(`#${targetHash}`);
                      } else {
                        setCurrentHash('');
                      }
                    }}
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
              );
            })}
          </nav>
        </aside>

        {/* Основная рабочая область текущей страницы */}
        <div className={styles.mainWrapper}>
          <main className={styles.contentArea}>{children}</main>
        </div>
      </div>
    </div>
  );
}
