// ecommerce/crm/app/brands/page.tsx
// Раздел управления Брендами (Brand), Приватными Лейблами (PrivateLabelView) и Производителями (Manufacturer & ManufacturerAlias)
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
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

export default function BrandsPage() {
  // Вкладка: 'brands' | 'private-labels' | 'manufacturers'
  const [tab, setTab] = useState<'brands' | 'private-labels' | 'manufacturers'>('brands');
  const [search, setSearch] = useState<string>('');
  const [brandStatus, setBrandStatus] = useState<string>('ALL');

  // Модальное окно редактирования бренда
  const [editingBrand, setEditingBrand] = useState<any | null>(null);
  const [formStatus, setFormStatus] = useState<string>('UNPROCESSED');
  const [formNotes, setFormNotes] = useState<string>('');

  // Модальное окно добавления связки Private Label
  const [plModalOpen, setPlModalOpen] = useState<boolean>(false);
  const [plBrandName, setPlBrandName] = useState<string>('');
  const [plSellerId, setPlSellerId] = useState<string>('');
  const [plSellerName, setPlSellerName] = useState<string>('');

  // Загрузка данных в зависимости от активной вкладки
  const { data: brandsRes, mutate: mutateBrands } = useSWR(
    tab === 'brands'
      ? `/api/backend/crm/brands?status=${brandStatus}&search=${encodeURIComponent(search)}`
      : null,
    fetcher
  );

  const { data: plRes, mutate: mutatePl } = useSWR(
    tab === 'private-labels'
      ? `/api/backend/crm/private-labels?search=${encodeURIComponent(search)}`
      : null,
    fetcher
  );

  const { data: mfgRes } = useSWR(
    tab === 'manufacturers'
      ? `/api/backend/crm/manufacturers?search=${encodeURIComponent(search)}`
      : null,
    fetcher
  );

  // Открытие диалога редактирования бренда
  const openEditBrand = (b: any) => {
    setEditingBrand(b);
    setFormStatus(b.status);
    setFormNotes(b.notes || '');
  };

  // Сохранение изменений бренда
  const handleSaveBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBrand) return;
    if (!confirm(`Подтверждаете изменение статуса бренда "${editingBrand.name}" на "${formStatus}"?`)) {
      return;
    }
    try {
      await axios.patch(`/api/backend/crm/brands/${editingBrand.id}`, {
        status: formStatus,
        notes: formNotes,
      });
      await mutateBrands();
      setEditingBrand(null);
    } catch (err: any) {
      alert(`Ошибка обновления бренда: ${err?.response?.data?.message || err?.message}`);
    }
  };

  // Добавление новой связки Private Label
  const handleAddPrivateLabel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plBrandName.trim() || !plSellerId.trim()) return;
    if (
      !confirm(
        `Подтверждаете добавление связки Private Label: Бренд "${plBrandName.toUpperCase()}" + Продавец "${plSellerId}"?`
      )
    ) {
      return;
    }
    try {
      await axios.post('/api/backend/private-labels', {
        brandName: plBrandName.trim().toUpperCase(),
        sellerId: plSellerId.trim(),
        sellerName: plSellerName.trim() || undefined,
      });
      await mutatePl();
      setPlModalOpen(false);
      setPlBrandName('');
      setPlSellerId('');
      setPlSellerName('');
    } catch (err: any) {
      alert(`Ошибка сохранения Private Label: ${err?.response?.data?.message || err?.message}`);
    }
  };

  const renderBrandStatus = (status: string) => {
    switch (status) {
      case 'CONTRACTED':
        return <span className={styles.badgeSuccess}>CONTRACTED (В работе)</span>;
      case 'NO_EU_DISTRIBUTOR':
        return <span className={styles.badgeDanger}>NO_EU_DISTRIBUTOR</span>;
      default:
        return <span className={styles.badgeNeutral}>UNPROCESSED</span>;
    }
  };

  return (
    <div className={styles.container}>
      {/* Переключатель вкладок и строка фильтрации */}
      <div className={styles.filterCard}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            className={tab === 'brands' ? styles.primaryBtn : styles.secondaryBtn}
            onClick={() => setTab('brands')}
          >
            Бренды (Brand)
          </button>
          <button
            className={tab === 'private-labels' ? styles.primaryBtn : styles.secondaryBtn}
            onClick={() => setTab('private-labels')}
          >
            Приватные лейблы (PrivateLabelView)
          </button>
          <button
            className={tab === 'manufacturers' ? styles.primaryBtn : styles.secondaryBtn}
            onClick={() => setTab('manufacturers')}
          >
            Производители и Алиасы Keepa
          </button>
        </div>

        <div className={styles.searchWrapper}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Поиск по названию, заметкам, Seller ID или алиасу Keepa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {tab === 'brands' && (
          <select
            className={styles.searchInput}
            style={{ width: 'auto' }}
            value={brandStatus}
            onChange={(e) => setBrandStatus(e.target.value)}
          >
            <option value="ALL">Все статусы брендов</option>
            <option value="CONTRACTED">CONTRACTED (В работе)</option>
            <option value="UNPROCESSED">UNPROCESSED (В анализе)</option>
            <option value="NO_EU_DISTRIBUTOR">NO_EU_DISTRIBUTOR (Нет дистр. в ЕС)</option>
          </select>
        )}

        {tab === 'private-labels' && (
          <button className={styles.primaryBtn} onClick={() => setPlModalOpen(true)}>
            <AddIcon fontSize="small" />
            Добавить Private Label
          </button>
        )}
      </div>

      {/* Вкладка 1: Бренды */}
      {tab === 'brands' && (
        <TableContainer component={Paper} className={styles.tableCard}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell style={{ fontWeight: 700 }}>ID</TableCell>
                <TableCell style={{ fontWeight: 700 }}>Название бренда (UPPERCASE)</TableCell>
                <TableCell style={{ fontWeight: 700 }}>Статус (BrandStatus)</TableCell>
                <TableCell style={{ fontWeight: 700 }}>Товаров ASIN</TableCell>
                <TableCell style={{ fontWeight: 700 }}>Выгрузок Keepa</TableCell>
                <TableCell style={{ fontWeight: 700 }}>Заметки и Легенда (Welcome Letter)</TableCell>
                <TableCell style={{ fontWeight: 700, textAlign: 'center' }}>Действия</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {brandsRes?.brands?.length > 0 ? (
                brandsRes.brands.map((b: any) => (
                  <TableRow key={b.id} className={styles.interactiveRow}>
                    <TableCell>{b.id}</TableCell>
                    <TableCell style={{ fontWeight: 800 }}>{b.name}</TableCell>
                    <TableCell>{renderBrandStatus(b.status)}</TableCell>
                    <TableCell style={{ fontWeight: 700 }}>{b._count?.asins ?? 0}</TableCell>
                    <TableCell>{b._count?.keepaExports ?? 0}</TableCell>
                    <TableCell style={{ maxWidth: '360px', color: '#475569' }}>
                      {b.notes || '—'}
                    </TableCell>
                    <TableCell style={{ textAlign: 'center' }}>
                      <button
                        className={styles.secondaryBtn}
                        onClick={() => openEditBrand(b)}
                      >
                        <EditIcon style={{ fontSize: '0.9rem' }} />
                        Изменить
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <div className={styles.emptyState}>Бренды не найдены</div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Вкладка 2: Приватные лейблы */}
      {tab === 'private-labels' && (
        <TableContainer component={Paper} className={styles.tableCard}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell style={{ fontWeight: 700 }}>ID</TableCell>
                <TableCell style={{ fontWeight: 700 }}>Бренд (brandName)</TableCell>
                <TableCell style={{ fontWeight: 700 }}>Продавец (sellerName)</TableCell>
                <TableCell style={{ fontWeight: 700 }}>Amazon Seller ID</TableCell>
                <TableCell style={{ fontWeight: 700 }}>Результаты анализа (notes)</TableCell>
                <TableCell style={{ fontWeight: 700 }}>Дата фиксации</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {plRes?.items?.length > 0 ? (
                plRes.items.map((pl: any) => (
                  <TableRow key={pl.id}>
                    <TableCell>{pl.id}</TableCell>
                    <TableCell style={{ fontWeight: 800, color: '#b91c1c' }}>
                      {pl.brandName}
                    </TableCell>
                    <TableCell style={{ fontWeight: 600 }}>{pl.sellerName}</TableCell>
                    <TableCell style={{ fontFamily: 'monospace' }}>{pl.sellerId}</TableCell>
                    <TableCell style={{ maxWidth: '420px', color: '#334155' }}>
                      {pl.notes || '—'}
                    </TableCell>
                    <TableCell>
                      {new Date(pl.createdAt).toLocaleDateString('ru-RU')}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <div className={styles.emptyState}>Связки Private Label не найдены</div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Вкладка 3: Производители и Алиасы Keepa */}
      {tab === 'manufacturers' && (
        <TableContainer component={Paper} className={styles.tableCard}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell style={{ fontWeight: 700 }}>ID</TableCell>
                <TableCell style={{ fontWeight: 700 }}>Каноническое имя производителя</TableCell>
                <TableCell style={{ fontWeight: 700 }}>Товаров ASIN</TableCell>
                <TableCell style={{ fontWeight: 700 }}>Сырые вариации и коды Vendor Central (ManufacturerAlias)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {mfgRes?.manufacturers?.length > 0 ? (
                mfgRes.manufacturers.map((m: any) => (
                  <TableRow key={m.id}>
                    <TableCell>{m.id}</TableCell>
                    <TableCell style={{ fontWeight: 800 }}>{m.name}</TableCell>
                    <TableCell style={{ fontWeight: 700 }}>{m._count?.asins ?? 0}</TableCell>
                    <TableCell>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {m.aliases?.length > 0 ? (
                          m.aliases.map((al: any) => (
                            <span key={al.id} className={styles.badgeNeutral}>
                              {al.rawName}
                            </span>
                          ))
                        ) : (
                          <span style={{ color: '#94a3b8' }}>Прямое совпадение</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    <div className={styles.emptyState}>Производители не найдены</div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Модальное окно редактирования бренда */}
      <Dialog open={Boolean(editingBrand)} onClose={() => setEditingBrand(null)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSaveBrand}>
          <DialogTitle style={{ fontWeight: 800 }}>
            Редактирование бренда: {editingBrand?.name}
          </DialogTitle>
          <DialogContent dividers style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>Статус бренда (BrandStatus)</label>
              <select
                className={styles.searchInput}
                style={{ marginTop: '6px' }}
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value)}
              >
                <option value="UNPROCESSED">UNPROCESSED (В анализе)</option>
                <option value="CONTRACTED">CONTRACTED (В работе / На контракте)</option>
                <option value="NO_EU_DISTRIBUTOR">NO_EU_DISTRIBUTOR (Нет дистрибьютора в ЕС)</option>
              </select>
            </div>
            <TextField
              label="Заметки и легенда для Welcome Letter (notes)"
              multiline
              rows={4}
              fullWidth
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditingBrand(null)}>Отмена</Button>
            <Button type="submit" variant="contained">
              Сохранить
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Модальное окно добавления связки Private Label */}
      <Dialog open={plModalOpen} onClose={() => setPlModalOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleAddPrivateLabel}>
          <DialogTitle style={{ fontWeight: 800 }}>
            Добавление связки Private Label
          </DialogTitle>
          <DialogContent dividers style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <TextField
              label="Название бренда (приводится к UPPERCASE)"
              required
              fullWidth
              value={plBrandName}
              onChange={(e) => setPlBrandName(e.target.value)}
            />
            <TextField
              label="Amazon Seller ID (например, A2125XITGCFM0Q)"
              required
              fullWidth
              value={plSellerId}
              onChange={(e) => setPlSellerId(e.target.value)}
            />
            <TextField
              label="Название магазина продавца (опционально)"
              fullWidth
              value={plSellerName}
              onChange={(e) => setPlSellerName(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPlModalOpen(false)}>Отмена</Button>
            <Button type="submit" variant="contained">
              Сохранить связку
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </div>
  );
}

