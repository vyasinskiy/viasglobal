// ecommerce/crm/app/distributors/page.tsx
// Раздел «Поставщики и Почта IMAP»: воронка B2B дистрибьюторов и глобальный поиск условий в письмах Hostinger
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
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import EmailIcon from '@mui/icons-material/Email';
import AttachFileIcon from '@mui/icons-material/AttachFile';

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

export default function DistributorsPage() {
  const router = useRouter();
  // Вкладка: 'funnel' (воронка дистрибьюторов) или 'emails' (поиск по почте Hostinger IMAP)
  const [tab, setTab] = useState<'funnel' | 'emails'>('funnel');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');

  // Модальное окно создания/обновления дистрибьютора
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingDist, setEditingDist] = useState<any | null>(null);
  const [formName, setFormName] = useState<string>('');
  const [formWebsite, setFormWebsite] = useState<string>('');
  const [formEmail, setFormEmail] = useState<string>('');
  const [formPhone, setFormPhone] = useState<string>('');
  const [formStatus, setFormStatus] = useState<string>('NEW');
  const [formNotes, setFormNotes] = useState<string>('');
  const [formRejectionReason, setFormRejectionReason] = useState<string>('');

  // Модальное окно просмотра письма
  const [selectedEmail, setSelectedEmail] = useState<any | null>(null);

  const { data: distRes, isLoading, mutate } = useSWR(
    tab === 'funnel'
      ? `/api/backend/crm/distributors?status=${statusFilter}&search=${encodeURIComponent(search)}`
      : null,
    fetcher
  );

  const { data: emailsRes, isLoading: isEmailsLoading } = useSWR(
    tab === 'emails'
      ? `/api/backend/crm/emails?q=${encodeURIComponent(search)}&limit=100`
      : null,
    fetcher
  );

  // Открытие формы создания поставщика
  const openAddModal = () => {
    setEditingDist(null);
    setFormName('');
    setFormWebsite('');
    setFormEmail('');
    setFormPhone('');
    setFormStatus('NEW');
    setFormNotes('');
    setFormRejectionReason('');
    setModalOpen(true);
  };

  // Открытие формы редактирования статуса и заметок поставщика
  const openEditModal = (dist: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingDist(dist);
    setFormName(dist.name);
    setFormWebsite(dist.website || '');
    setFormEmail(dist.email || '');
    setFormPhone(dist.phone || '');
    setFormStatus(dist.status);
    setFormNotes(dist.notes || '');
    setFormRejectionReason(dist.rejectionReason || '');
    setModalOpen(true);
  };

  // Сохранение поставщика с обязательным подтверждением
  const handleSaveDistributor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const actionText = editingDist
      ? `обновить статус поставщика "${editingDist.name}" на "${formStatus}"`
      : `создать нового поставщика "${formName.toUpperCase()}" со статусом "${formStatus}"`;

    if (!confirm(`Подтверждаете действие: ${actionText}?`)) {
      return;
    }

    try {
      if (editingDist) {
        await axios.patch(`/api/backend/distributors/${editingDist.id}/status`, {
          status: formStatus,
          notes: formNotes,
          rejectionReason: formRejectionReason || undefined,
          email: formEmail || undefined,
          phone: formPhone || undefined,
        });
      } else {
        await axios.post('/api/backend/distributors', {
          name: formName.trim().toUpperCase(),
          website: formWebsite.trim() || undefined,
          email: formEmail.trim() || undefined,
          phone: formPhone.trim() || undefined,
          status: formStatus,
          notes: formNotes.trim() || undefined,
        });
      }
      await mutate();
      setModalOpen(false);
    } catch (err: any) {
      alert(`Ошибка при сохранении поставщика: ${err?.response?.data?.message || err?.message}`);
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'ACCOUNT_OPENED':
        return <span className={styles.badgeSuccess}>ACCOUNT_OPENED (Открыт)</span>;
      case 'CALLED':
        return <span className={styles.badgeInfo}>CALLED (Звонок)</span>;
      case 'EMAIL_SENT':
        return <span className={styles.badgeInfo}>EMAIL_SENT (Письмо)</span>;
      case 'FORM_SUBMITTED':
        return <span className={styles.badgeWarning}>FORM_SUBMITTED (Форма)</span>;
      case 'REJECTED':
        return <span className={styles.badgeDanger}>REJECTED (Отказ)</span>;
      default:
        return <span className={styles.badgeNeutral}>NEW (Новый)</span>;
    }
  };

  return (
    <div className={styles.container}>
      {/* Панель переключения вкладок и поиска */}
      <div className={styles.filterCard}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className={tab === 'funnel' ? styles.primaryBtn : styles.secondaryBtn}
            onClick={() => setTab('funnel')}
          >
            Воронка Поставщиков B2B ({distRes?.total ?? '—'})
          </button>
          <button
            className={tab === 'emails' ? styles.primaryBtn : styles.secondaryBtn}
            onClick={() => setTab('emails')}
          >
            <EmailIcon fontSize="small" />
            Поиск по почте Hostinger IMAP (Read-Only)
          </button>
        </div>

        <div className={styles.searchWrapper}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder={
              tab === 'funnel'
                ? 'Поиск поставщика по имени, домену, email, заметкам...'
                : 'Поиск в письмах (например: portes, franco, pedido mínimo, tarifa)...'
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {tab === 'funnel' && (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <select
              className={styles.searchInput}
              style={{ width: 'auto' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">Все этапы воронки</option>
              <option value="ACCOUNT_OPENED">ACCOUNT_OPENED (Аккаунт открыт)</option>
              <option value="CALLED">CALLED (Совершен звонок)</option>
              <option value="EMAIL_SENT">EMAIL_SENT (Отправлено письмо)</option>
              <option value="FORM_SUBMITTED">FORM_SUBMITTED (Отправлена форма)</option>
              <option value="NEW">NEW (Новый)</option>
              <option value="REJECTED">REJECTED (Отказ)</option>
            </select>
            <button className={styles.primaryBtn} onClick={openAddModal}>
              <AddIcon fontSize="small" />
              Добавить поставщика
            </button>
          </div>
        )}
      </div>

      {/* Вкладка 1: Таблица поставщиков */}
      {tab === 'funnel' ? (
        isLoading ? (
          <div className={styles.emptyState}>Загрузка базы поставщиков...</div>
        ) : (
          <TableContainer component={Paper} className={styles.tableCard}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell style={{ fontWeight: 700 }}>ID</TableCell>
                  <TableCell style={{ fontWeight: 700 }}>Поставщик / Сайт / Домены</TableCell>
                  <TableCell style={{ fontWeight: 700 }}>Этап воронки</TableCell>
                  <TableCell style={{ fontWeight: 700 }}>Контакты / Менеджеры</TableCell>
                  <TableCell style={{ fontWeight: 700 }}>ASIN / Прайс / Письма / Заказы</TableCell>
                  <TableCell style={{ fontWeight: 700 }}>Комментарии / Условия</TableCell>
                  <TableCell style={{ fontWeight: 700, textAlign: 'center' }}>Действия</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {distRes?.distributors?.length > 0 ? (
                  distRes.distributors.map((d: any) => (
                    <TableRow
                      key={d.id}
                      className={styles.interactiveRow}
                      onClick={() => router.push(`/distributors/${d.id}`)}
                    >
                      <TableCell>{d.id}</TableCell>
                      <TableCell>
                        <div style={{ fontWeight: 800, color: '#0f172a' }}>{d.name}</div>
                        {d.website && (
                          <div style={{ fontSize: '0.75rem', color: '#2563eb' }}>{d.website}</div>
                        )}
                        {d.domains?.length > 0 && (
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                            Домены: {d.domains.join(', ')}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{renderStatusBadge(d.status)}</TableCell>
                      <TableCell>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                          {d.email || d.contacts?.[0]?.email || '—'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {d.phone || d.contacts?.[0]?.phone || ''}
                          {d.contacts?.length > 0 && ` (${d.contacts.length} конт.)`}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          <span className={styles.badgeNeutral}>ASIN: {d._count?.asins ?? 0}</span>
                          <span className={styles.badgeInfo}>Прайс: {d._count?.priceSnapshots ?? 0}</span>
                          <span className={styles.badgeNeutral}>Письма: {d._count?.emails ?? 0}</span>
                          <span className={styles.badgeSuccess}>Заказов: {d._count?.purchaseOrders ?? 0}</span>
                        </div>
                      </TableCell>
                      <TableCell style={{ maxWidth: '300px' }}>
                        <div
                          style={{
                            fontSize: '0.8rem',
                            color: '#334155',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}
                          title={d.notes || d.rejectionReason}
                        >
                          {d.notes || d.rejectionReason || '—'}
                        </div>
                      </TableCell>
                      <TableCell style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <button
                          className={styles.secondaryBtn}
                          onClick={(e) => openEditModal(d, e)}
                        >
                          <EditIcon style={{ fontSize: '0.9rem' }} />
                          Статус
                        </button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <div className={styles.emptyState}>Поставщики не найдены</div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )
      ) : (
        /* Вкладка 2: Глобальный поиск по письмам Hostinger IMAP */
        isEmailsLoading ? (
          <div className={styles.emptyState}>Поиск по синхронизированным письмам Hostinger IMAP...</div>
        ) : (
          <TableContainer component={Paper} className={styles.tableCard}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell style={{ fontWeight: 700 }}>Дата</TableCell>
                  <TableCell style={{ fontWeight: 700 }}>Поставщик</TableCell>
                  <TableCell style={{ fontWeight: 700 }}>Отправитель</TableCell>
                  <TableCell style={{ fontWeight: 700 }}>Тема и Фрагмент письма</TableCell>
                  <TableCell style={{ fontWeight: 700 }}>Вложения</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {emailsRes?.emails?.length > 0 ? (
                  emailsRes.emails.map((em: any) => (
                    <TableRow
                      key={em.id}
                      className={styles.interactiveRow}
                      onClick={() => setSelectedEmail(em)}
                    >
                      <TableCell style={{ whiteSpace: 'nowrap' }}>
                        {new Date(em.date).toLocaleString('ru-RU', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </TableCell>
                      <TableCell style={{ fontWeight: 700, color: '#2563eb' }}>
                        {em.distributor?.name || 'Не привязано'}
                      </TableCell>
                      <TableCell>
                        <div style={{ fontWeight: 600 }}>{em.fromName || em.fromEmail}</div>
                        <div style={{ fontSize: '0.74rem', color: '#64748b' }}>{em.fromEmail}</div>
                      </TableCell>
                      <TableCell style={{ maxWidth: '420px' }}>
                        <div style={{ fontWeight: 700 }}>{em.subject}</div>
                        <div
                          style={{
                            fontSize: '0.76rem',
                            color: '#64748b',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {em.snippet || em.bodyText?.slice(0, 120) || ''}
                        </div>
                      </TableCell>
                      <TableCell>
                        {em.hasAttachments ? (
                          <span className={styles.badgeInfo}>
                            <AttachFileIcon style={{ fontSize: '0.9rem' }} />
                            Вложения
                          </span>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <div className={styles.emptyState}>Письма не найдены</div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )
      )}

      {/* Модальное окно создания / редактирования дистрибьютора */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSaveDistributor}>
          <DialogTitle style={{ fontWeight: 800 }}>
            {editingDist ? `Обновление статуса: ${editingDist.name}` : 'Новый поставщик B2B'}
          </DialogTitle>
          <DialogContent dividers style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {!editingDist && (
              <>
                <TextField
                  label="Название компании (UPPERCASE)"
                  required
                  fullWidth
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
                <TextField
                  label="Веб-сайт"
                  fullWidth
                  value={formWebsite}
                  onChange={(e) => setFormWebsite(e.target.value)}
                />
              </>
            )}
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>Статус воронки (DistributorStatus)</label>
              <select
                className={styles.searchInput}
                style={{ marginTop: '6px' }}
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value)}
              >
                <option value="NEW">NEW (Новый)</option>
                <option value="FORM_SUBMITTED">FORM_SUBMITTED (Форма отправлена)</option>
                <option value="EMAIL_SENT">EMAIL_SENT (Welcome Letter отправлено)</option>
                <option value="CALLED">CALLED (Совершен звонок)</option>
                <option value="ACCOUNT_OPENED">ACCOUNT_OPENED (Аккаунт B2B открыт)</option>
                <option value="REJECTED">REJECTED (Отказ)</option>
              </select>
            </div>
            <TextField
              label="Контактный Email"
              fullWidth
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
            />
            <TextField
              label="Телефон"
              fullWidth
              value={formPhone}
              onChange={(e) => setFormPhone(e.target.value)}
            />
            <TextField
              label="Заметки и коммерческие условия (portes, MOQ, скидки)"
              multiline
              rows={3}
              fullWidth
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
            />
            {formStatus === 'REJECTED' && (
              <TextField
                label="Причина отказа (rejectionReason)"
                fullWidth
                value={formRejectionReason}
                onChange={(e) => setFormRejectionReason(e.target.value)}
              />
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setModalOpen(false)}>Отмена</Button>
            <Button type="submit" variant="contained">
              Сохранить
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Модальное окно просмотра письма (строго Read-Only) */}
      <Dialog
        open={Boolean(selectedEmail)}
        onClose={() => setSelectedEmail(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle style={{ fontWeight: 800 }}>
          {selectedEmail?.subject}
        </DialogTitle>
        <DialogContent dividers>
          {selectedEmail && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '0.84rem', color: '#475569' }}>
                <div>
                  <b>От:</b> {selectedEmail.fromName} &lt;{selectedEmail.fromEmail}&gt;
                </div>
                <div>
                  <b>Дата:</b> {new Date(selectedEmail.date).toLocaleString('ru-RU')}
                </div>
                <div>
                  <b>Поставщик:</b> {selectedEmail.distributor?.name || '—'}
                </div>
              </div>
              {selectedEmail.attachments && Array.isArray(selectedEmail.attachments) && (
                <div>
                  <b>Прикрепленные файлы:</b>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                    {selectedEmail.attachments.map((att: any, i: number) => (
                      <span key={i} className={styles.badgeInfo}>
                        📎 {att.filename || att.name || 'Файл'}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <pre
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '14px',
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'inherit',
                  fontSize: '0.88rem',
                  maxHeight: '420px',
                  overflowY: 'auto',
                }}
              >
                {selectedEmail.bodyText || selectedEmail.snippet || 'Текст письма отсутствует'}
              </pre>
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedEmail(null)}>Закрыть</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

