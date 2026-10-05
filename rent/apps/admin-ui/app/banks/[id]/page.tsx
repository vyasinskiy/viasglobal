'use client';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import useSWR from 'swr';
import axios from 'axios';
import styles from '../../shared-table.module.css';

import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PaymentIcon from '@mui/icons-material/Payment';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

interface Bank {
  id: number;
  name: string;
  createdAt: string;
  _count?: {
    payments: number;
  };
}

interface Payment {
  id: number;
  userId: number;
  userName: string | null;
  amount: string | number;
  receiptPhotoId: string | null;
  status: string;
  createdAt: string;
  confirmedAt: string | null;
  comment: string | null;
  bank?: {
    id: number;
    name: string;
  } | null;
}

const fetcher = (url: string) => axios.get(url).then(res => res.data);

export default function BankDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const bankId = params.id;

  const { data: bank, error, mutate, isLoading } = useSWR<Bank>(
    `/api/banks/${bankId}`,
    fetcher
  );
  const { data: payments, isLoading: loadingPayments } = useSWR<Payment[]>(
    `/api/banks/${bankId}/payments`,
    fetcher
  );

  // Edit Bank Modal states
  const [editOpen, setEditOpen] = React.useState(false);
  const [editName, setEditName] = React.useState('');
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const handleEditClick = () => {
    if (!bank) return;
    setEditName(bank.name);
    setEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      alert('Пожалуйста, введите название банка.');
      return;
    }
    try {
      await axios.put(`/api/banks/${bankId}`, { name: editName.trim() });
      mutate();
      setEditOpen(false);
    } catch (err: unknown) {
      alert('Ошибка при сохранении банка.');
    }
  };

  const handleDeleteSubmit = async () => {
    try {
      setDeleting(true);
      await axios.delete(`/api/banks/${bankId}`);
      router.push('/banks');
    } catch (err: unknown) {
      alert('Ошибка при удалении банка.');
      setDeleting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const formatDateTime = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  const renderStatus = (status: string) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className={styles.statusConfirmed}>
            <CheckCircleIcon style={{ fontSize: '0.9rem', marginRight: '4px', verticalAlign: 'middle' }} />
            Подтвержден
          </span>
        );
      case 'rejected':
        return (
          <span className={styles.statusRejected}>
            <CancelIcon style={{ fontSize: '0.9rem', marginRight: '4px', verticalAlign: 'middle' }} />
            Отклонен
          </span>
        );
      default:
        return (
          <span className={styles.statusPending}>
            <HourglassEmptyIcon style={{ fontSize: '0.9rem', marginRight: '4px', verticalAlign: 'middle' }} />
            Ожидает проверки
          </span>
        );
    }
  };

  const totalAmount = (payments ?? []).reduce((acc, p) => acc + Number(p.amount), 0);

  if (isLoading) return <div className={styles.emptyState}>Загрузка информации о банке...</div>;
  if (error) return <div className={styles.emptyState}>Ошибка загрузки информации о банке.</div>;
  if (!bank) return <div className={styles.emptyState}>Банк не найден.</div>;

  return (
    <div className={styles.container}>
      {/* Header with back button & actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Button
            onClick={() => router.push('/banks')}
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            style={{ color: '#475569', borderColor: '#cbd5e1', textTransform: 'none' }}
          >
            Назад к списку
          </Button>
          <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#0f172a', fontWeight: 700 }}>
            Банк зачисления #{bank.id}
          </h2>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            onClick={() => router.push(`/payments?bankId=${bank.id}`)}
            variant="outlined"
            startIcon={<PaymentIcon />}
            style={{ borderColor: '#2563eb', color: '#2563eb', textTransform: 'none', fontWeight: 600 }}
          >
            Все платежи
          </Button>
          <Button
            onClick={handleEditClick}
            variant="contained"
            startIcon={<EditIcon />}
            style={{ backgroundColor: '#2563eb', color: '#fff', textTransform: 'none', fontWeight: 600 }}
          >
            Изменить
          </Button>
          <Button
            onClick={() => setDeleteOpen(true)}
            variant="contained"
            startIcon={<DeleteIcon />}
            style={{ backgroundColor: '#ef4444', color: '#fff', textTransform: 'none', fontWeight: 600 }}
          >
            Удалить
          </Button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Bank Profile Card */}
        <Paper className={styles.tableCard} style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <AccountBalanceWalletIcon style={{ fontSize: '2.5rem', color: '#2563eb' }} />
              <div>
                <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Название банка
                </span>
                <h3 style={{ margin: '4px 0 0 0', fontSize: '1.8rem', color: '#0f172a', fontWeight: 800 }}>
                  {bank.name}
                </h3>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <span style={{ fontSize: '0.875rem', color: '#64748b', display: 'block' }}>Всего платежей</span>
              <strong style={{ fontSize: '1.25rem', color: '#2563eb' }}>
                {bank._count?.payments ?? payments?.length ?? 0}
              </strong>
            </div>

            <div>
              <span style={{ fontSize: '0.875rem', color: '#64748b', display: 'block' }}>Сумма зачислений</span>
              <strong style={{ fontSize: '1.25rem', color: '#0f172a' }}>
                {totalAmount.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} руб.
              </strong>
            </div>

            <div>
              <span style={{ fontSize: '0.875rem', color: '#64748b', display: 'block' }}>Дата создания</span>
              <strong style={{ fontSize: '1.1rem', color: '#334155', fontWeight: 500 }}>
                {formatDate(bank.createdAt)}
              </strong>
            </div>

            <div>
              <span style={{ fontSize: '0.875rem', color: '#64748b', display: 'block' }}>Статус</span>
              <span style={{ display: 'inline-block', marginTop: '4px' }}>
                <span className={styles.statusConfirmed}>Активен</span>
              </span>
            </div>
          </div>
        </Paper>

        {/* Quick Actions Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Paper className={styles.tableCard} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '1rem', color: '#0f172a', fontWeight: 700 }}>
              Действия с банком
            </h4>

            <Button
              onClick={handleEditClick}
              variant="outlined"
              fullWidth
              startIcon={<EditIcon />}
              style={{
                color: '#1e293b',
                borderColor: '#cbd5e1',
                backgroundColor: '#f8fafc',
                textTransform: 'none',
                padding: '12px',
                fontWeight: 600,
                fontSize: '0.95rem'
              }}
            >
              Переименовать банк
            </Button>

            <Button
              onClick={() => router.push(`/payments?bankId=${bank.id}`)}
              variant="contained"
              fullWidth
              startIcon={<PaymentIcon />}
              style={{
                backgroundColor: '#2563eb',
                color: '#fff',
                textTransform: 'none',
                padding: '12px',
                fontWeight: 600,
                fontSize: '0.95rem'
              }}
            >
              Показать платежи
            </Button>

            <Button
              onClick={() => router.push(`/payments?create=true&bankId=${bank.id}`)}
              variant="outlined"
              fullWidth
              startIcon={<PaymentIcon />}
              style={{
                color: '#10b981',
                borderColor: '#99f6e4',
                backgroundColor: '#f0fdfa',
                textTransform: 'none',
                padding: '12px',
                fontWeight: 600,
                fontSize: '0.95rem'
              }}
            >
              Добавить платеж
            </Button>

            <Button
              onClick={() => setDeleteOpen(true)}
              variant="contained"
              fullWidth
              startIcon={<DeleteIcon />}
              style={{
                backgroundColor: '#ef4444',
                color: '#fff',
                textTransform: 'none',
                padding: '12px',
                fontWeight: 600,
                fontSize: '0.95rem'
              }}
            >
              Удалить банк
            </Button>
          </Paper>
        </div>
      </div>

      {/* Payments table */}
      <div className={styles.filterCard} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <PaymentIcon style={{ fontSize: '1.2rem', color: '#2563eb' }} />
          <span style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
            Платежи по банку «{bank.name}»
          </span>
        </div>
        <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
          Найдено платежей: {payments?.length ?? 0}
        </span>
      </div>

      <TableContainer component={Paper} className={styles.tableCard}>
        <Table aria-label="bank payments table">
          <TableHead>
            <TableRow>
              <TableCell style={{ fontWeight: 'bold' }}>ID</TableCell>
              <TableCell style={{ fontWeight: 'bold' }}>Пользователь</TableCell>
              <TableCell style={{ fontWeight: 'bold' }}>Сумма</TableCell>
              <TableCell style={{ fontWeight: 'bold' }}>Статус</TableCell>
              <TableCell style={{ fontWeight: 'bold' }}>Дата отправки</TableCell>
              <TableCell style={{ fontWeight: 'bold' }}>Комментарий</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loadingPayments ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <div className={styles.emptyState}>Загрузка платежей...</div>
                </TableCell>
              </TableRow>
            ) : (payments && payments.length > 0) ? (
              payments.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.id}</TableCell>
                  <TableCell style={{ fontWeight: 500 }}>
                    {row.userName || `User ID: ${row.userId}`}
                  </TableCell>
                  <TableCell style={{ fontWeight: 600 }}>
                    {Number(row.amount).toFixed(2)} руб.
                  </TableCell>
                  <TableCell>{renderStatus(row.status)}</TableCell>
                  <TableCell style={{ color: '#64748b' }}>{formatDateTime(row.createdAt)}</TableCell>
                  <TableCell style={{ color: '#475569', maxWidth: '200px', wordBreak: 'break-word' }}>
                    {row.comment || '—'}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <div className={styles.emptyState}>
                    Платежей по этому банку нет.
                    <br />
                    <Link href={`/payments?create=true&bankId=${bank.id}`} style={{ color: '#2563eb' }}>
                      Добавить первым платежом
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Edit Bank Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} aria-labelledby="bank-edit-title" maxWidth="sm" fullWidth>
        <form onSubmit={handleEditSubmit}>
          <DialogTitle id="bank-edit-title" style={{ fontWeight: 700 }}>
            Редактирование банка
          </DialogTitle>
          <DialogContent style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '8px' }}>
            <TextField
              label="Название банка"
              fullWidth
              required
              variant="outlined"
              autoFocus
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Например: Альфа-Банк"
            />
          </DialogContent>
          <DialogActions style={{ padding: '16px 24px' }}>
            <Button onClick={() => setEditOpen(false)} variant="outlined" style={{ color: '#475569', borderColor: '#cbd5e1', textTransform: 'none' }}>
              Отмена
            </Button>
            <Button type="submit" variant="contained" style={{ textTransform: 'none', backgroundColor: '#2563eb' }}>
              Сохранить изменения
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Bank Confirmation Dialog */}
      <Dialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        aria-labelledby="delete-bank-title"
        aria-describedby="delete-bank-description"
      >
        <DialogTitle id="delete-bank-title" style={{ fontWeight: 700 }}>
          Подтверждение удаления банка
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-bank-description">
            Вы действительно хотите удалить банк «{bank.name}»? Существующие платежи будут сохранены, но их связь с банком будет сброшена.
          </DialogContentText>
        </DialogContent>
        <DialogActions style={{ padding: '16px 24px' }}>
          <Button onClick={() => setDeleteOpen(false)} variant="outlined" style={{ color: '#475569', borderColor: '#cbd5e1', textTransform: 'none' }}>
            Отмена
          </Button>
          <Button onClick={handleDeleteSubmit} color="error" variant="contained" disabled={deleting} style={{ textTransform: 'none', backgroundColor: '#ef4444' }}>
            {deleting ? 'Удаление...' : 'Удалить банк'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}