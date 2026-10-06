'use client';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import useSWR from 'swr';
import axios from 'axios';
import styles from '../../shared-table.module.css';

// MUI Компоненты
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';

// MUI Иконки
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import PaymentIcon from '@mui/icons-material/Payment';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import PersonIcon from '@mui/icons-material/Person';

interface Bank {
  id: number;
  name: string;
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
  bank?: Bank | null;
}

// Универсальный SWR-загрузчик
const fetcher = (url: string) => axios.get(url).then((res) => res.data);

export default function PaymentDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const paymentId = params.id;

  // Загрузка данных платежа и списка банков
  const { data: payment, error, mutate, isLoading } = useSWR<Payment>(
    `/api/payments/${paymentId}`,
    fetcher
  );
  const { data: banks } = useSWR<Bank[]>('/api/banks', fetcher);

  // Состояния диалога подтверждения платежа
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [confirmBankId, setConfirmBankId] = React.useState<string>('');
  const [isConfirming, setIsConfirming] = React.useState(false);

  // Состояния диалога отклонения платежа
  const [rejectOpen, setRejectOpen] = React.useState(false);
  const [rejectComment, setRejectComment] = React.useState('');
  const [isRejecting, setIsRejecting] = React.useState(false);

  // Состояния диалога редактирования платежа
  const [editOpen, setEditOpen] = React.useState(false);
  const [editAmount, setEditAmount] = React.useState('');
  const [editBankId, setEditBankId] = React.useState<string>('');
  const [editStatus, setEditStatus] = React.useState('');
  const [editComment, setEditComment] = React.useState('');
  const [isSavingEdit, setIsSavingEdit] = React.useState(false);

  // Состояние удаления платежа
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Состояние загрузки файла чека
  const [isUploadingReceipt, setIsUploadingReceipt] = React.useState(false);

  // Инициализация формы редактирования при открытии
  const handleOpenEdit = () => {
    if (!payment) return;
    setEditAmount(String(payment.amount));
    setEditBankId(payment.bank?.id ? String(payment.bank.id) : '');
    setEditStatus(payment.status);
    setEditComment(payment.comment || '');
    setEditOpen(true);
  };

  // Сохранение отредактированных данных платежа
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editAmount || Number(editAmount) <= 0) {
      alert('Пожалуйста, укажите корректную сумму.');
      return;
    }

    try {
      setIsSavingEdit(true);
      await axios.put(`/api/payments/${paymentId}`, {
        amount: Number(editAmount),
        bankId: editBankId ? Number(editBankId) : null,
        status: editStatus,
        comment: editComment.trim() || null,
      });
      mutate();
      setEditOpen(false);
    } catch {
      alert('Ошибка при сохранении платежа.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Подтверждение платежа администратором с выбором банка
  const handleConfirmSubmit = async () => {
    try {
      setIsConfirming(true);
      await axios.post('/api/payments', {
        action: 'confirm',
        paymentId: Number(paymentId),
        bankId: confirmBankId ? Number(confirmBankId) : undefined,
      });
      mutate();
      setConfirmOpen(false);
    } catch {
      alert('Ошибка при подтверждении платежа.');
    } finally {
      setIsConfirming(false);
    }
  };

  // Отклонение платежа
  const handleRejectSubmit = async () => {
    try {
      setIsRejecting(true);
      await axios.post('/api/payments', {
        action: 'reject',
        paymentId: Number(paymentId),
        comment: rejectComment.trim() || undefined,
      });
      mutate();
      setRejectOpen(false);
    } catch {
      alert('Ошибка при отклонении платежа.');
    } finally {
      setIsRejecting(false);
    }
  };

  // Удаление платежа целиком
  const handleDeleteSubmit = async () => {
    try {
      setIsDeleting(true);
      await axios.delete(`/api/payments/${paymentId}`);
      router.push('/payments');
    } catch {
      alert('Ошибка при удалении платежа.');
      setIsDeleting(false);
    }
  };

  // Загрузка или замена чека
  const handleUploadReceipt = async (file: File) => {
    try {
      setIsUploadingReceipt(true);
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUri = reader.result as string;
        await axios.post(`/api/payments/${paymentId}/receipt`, {
          dataUri,
          fileName: file.name,
          mimeType: file.type,
        });
        mutate();
        setIsUploadingReceipt(false);
      };
      reader.readAsDataURL(file);
    } catch {
      alert('Ошибка при загрузке файла чека.');
      setIsUploadingReceipt(false);
    }
  };

  // Открепление чека
  const handleDetachReceipt = async () => {
    if (!confirm('Вы уверены, что хотите удалить прикрепленный чек?')) return;
    try {
      await axios.delete(`/api/payments/${paymentId}/receipt`);
      mutate();
    } catch {
      alert('Ошибка при удалении чека.');
    }
  };

  // Форматирование даты
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Бейдж статуса
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className={styles.statusConfirmed}>
            <CheckCircleIcon style={{ fontSize: '1rem', marginRight: '4px', verticalAlign: 'middle' }} />
            Подтвержден
          </span>
        );
      case 'rejected':
        return (
          <span className={styles.statusRejected}>
            <CancelIcon style={{ fontSize: '1rem', marginRight: '4px', verticalAlign: 'middle' }} />
            Отклонен
          </span>
        );
      default:
        return (
          <span className={styles.statusPending}>
            <HourglassEmptyIcon style={{ fontSize: '1rem', marginRight: '4px', verticalAlign: 'middle' }} />
            Ожидает проверки
          </span>
        );
    }
  };

  if (isLoading) return <div className={styles.emptyState}>Загрузка информации о платеже...</div>;
  if (error) return <div className={styles.emptyState}>Ошибка загрузки информации о платеже.</div>;
  if (!payment) return <div className={styles.emptyState}>Платеж не найден.</div>;

  const isPendingOrUnconfirmed = payment.status === 'pending' || payment.status === 'unconfirmed';
  const receiptUrl = payment.receiptPhotoId
    ? `/api/payments/receipt?fileId=${encodeURIComponent(payment.receiptPhotoId)}`
    : null;
  const isPdfReceipt = payment.receiptPhotoId?.toLowerCase().endsWith('.pdf');

  return (
    <div className={styles.container}>
      {/* Верхняя шапка с навигацией и кнопками действий */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Button
            onClick={() => router.push('/payments')}
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            style={{ color: '#475569', borderColor: '#cbd5e1', textTransform: 'none', fontWeight: 600 }}
          >
            Назад к списку
          </Button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#0f172a', fontWeight: 700 }}>
              Платеж #{payment.id}
            </h2>
            {renderStatusBadge(payment.status)}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {/* Кнопки подтверждения и отклонения при ожидании проверки */}
          {isPendingOrUnconfirmed && (
            <>
              <Button
                onClick={() => {
                  setConfirmBankId(payment.bank?.id ? String(payment.bank.id) : '');
                  setConfirmOpen(true);
                }}
                variant="contained"
                startIcon={<CheckCircleIcon />}
                style={{ backgroundColor: '#16a34a', color: '#fff', textTransform: 'none', fontWeight: 600 }}
              >
                Подтвердить
              </Button>
              <Button
                onClick={() => {
                  setRejectComment('');
                  setRejectOpen(true);
                }}
                variant="outlined"
                startIcon={<CancelIcon />}
                style={{ color: '#dc2626', borderColor: '#fca5a5', textTransform: 'none', fontWeight: 600 }}
              >
                Отклонить
              </Button>
            </>
          )}

          {/* Кнопка редактирования параметров */}
          <Button
            onClick={handleOpenEdit}
            variant="outlined"
            startIcon={<EditIcon />}
            style={{ color: '#2563eb', borderColor: '#93c5fd', textTransform: 'none', fontWeight: 600 }}
          >
            Редактировать
          </Button>

          {/* Кнопка удаления */}
          <Button
            onClick={() => setDeleteOpen(true)}
            variant="outlined"
            startIcon={<DeleteIcon />}
            style={{ color: '#ef4444', borderColor: '#fca5a5', textTransform: 'none', fontWeight: 600 }}
          >
            Удалить
          </Button>
        </div>
      </div>

      {/* Основная сетка: Детали платежа (слева) и Чек (справа) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1.1fr) minmax(320px, 1fr)', gap: '24px' }}>
        {/* Карточка 1: Параметры платежа */}
        <Paper className={styles.tableCard} style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  backgroundColor: '#eff6ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#2563eb',
                }}
              >
                <PaymentIcon style={{ fontSize: '28px' }} />
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Сумма платежа
                </span>
                <h3 style={{ margin: '4px 0 0 0', fontSize: '1.85rem', color: '#0f172a', fontWeight: 800 }}>
                  {Number(payment.amount).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} руб.
                </h3>
              </div>
            </div>
          </div>

          <div style={{ height: '1px', backgroundColor: '#f1f5f9' }} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* Плательщик / Арендатор */}
            <div>
              <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <PersonIcon style={{ fontSize: '1rem' }} />
                Плательщик
              </span>
              <strong style={{ fontSize: '1.05rem', color: '#0f172a', display: 'block', marginTop: '4px' }}>
                {payment.userName || `ID пользователя: ${payment.userId}`}
              </strong>
            </div>

            {/* Банк зачисления */}
            <div>
              <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AccountBalanceWalletIcon style={{ fontSize: '1rem' }} />
                Банк зачисления
              </span>
              <div style={{ marginTop: '4px' }}>
                {payment.bank ? (
                  <Link
                    href={`/banks/${payment.bank.id}`}
                    style={{ fontSize: '1.05rem', color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}
                  >
                    {payment.bank.name}
                  </Link>
                ) : (
                  <span style={{ fontSize: '1rem', color: '#94a3b8' }}>Не назначен</span>
                )}
              </div>
            </div>

            {/* Дата создания */}
            <div>
              <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'block' }}>Дата отправки</span>
              <span style={{ fontSize: '0.95rem', color: '#334155', fontWeight: 500, display: 'block', marginTop: '4px' }}>
                {formatDate(payment.createdAt)}
              </span>
            </div>

            {/* Дата подтверждения */}
            <div>
              <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'block' }}>Дата подтверждения</span>
              <span style={{ fontSize: '0.95rem', color: '#334155', fontWeight: 500, display: 'block', marginTop: '4px' }}>
                {payment.confirmedAt ? formatDate(payment.confirmedAt) : '-'}
              </span>
            </div>
          </div>

          <div style={{ height: '1px', backgroundColor: '#f1f5f9' }} />

          {/* Комментарий к платежу */}
          <div>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Комментарий к платежу
            </span>
            <div
              style={{
                marginTop: '8px',
                padding: '14px 16px',
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                color: '#334155',
                fontSize: '0.9rem',
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {payment.comment || 'Комментарий отсутствует.'}
            </div>
          </div>
        </Paper>

        {/* Карточка 2: Прикрепленный чек */}
        <Paper className={styles.tableCard} style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a', fontWeight: 700 }}>
              Квитанция / Чек
            </h3>
            {receiptUrl && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <a
                  href={receiptUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.downloadLink}
                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                  title="Открыть в новой вкладке"
                >
                  <OpenInNewIcon style={{ fontSize: '1rem' }} />
                  Открыть оригинал
                </a>
                <label
                  className={styles.downloadLink}
                  style={{
                    backgroundColor: '#f1f5f9',
                    color: '#334155',
                    cursor: 'pointer',
                    padding: '6px 12px',
                    fontSize: '0.8rem',
                  }}
                  title="Заменить файл чека"
                >
                  <AttachFileIcon style={{ fontSize: '1rem' }} />
                  Заменить
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    style={{ display: 'none' }}
                    disabled={isUploadingReceipt}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUploadReceipt(file);
                      e.target.value = '';
                    }}
                  />
                </label>
                <button
                  type="button"
                  className={styles.rejectBtn}
                  style={{ padding: '6px 10px', display: 'inline-flex', alignItems: 'center' }}
                  onClick={handleDetachReceipt}
                  title="Удалить чек"
                >
                  <DeleteIcon style={{ fontSize: '1rem' }} />
                </button>
              </div>
            )}
          </div>

          {receiptUrl ? (
            <div style={{ width: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
              {isPdfReceipt ? (
                <iframe
                  src={receiptUrl}
                  title="Предпросмотр PDF чека"
                  style={{
                    width: '100%',
                    height: '520px',
                    border: 'none',
                    display: 'block',
                    backgroundColor: '#525659',
                  }}
                />
              ) : (
                <div style={{ padding: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <img
                    src={receiptUrl}
                    alt="Квитанция платежа"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '520px',
                      objectFit: 'contain',
                      borderRadius: '6px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    }}
                  />
                </div>
              )}
            </div>
          ) : (
            <div
              style={{
                border: '2px dashed #cbd5e1',
                borderRadius: '12px',
                padding: '48px 24px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
                backgroundColor: '#f8fafc',
              }}
            >
              <PictureAsPdfIcon style={{ fontSize: '48px', color: '#94a3b8' }} />
              <div style={{ color: '#475569', fontWeight: 600, fontSize: '1rem' }}>
                Чек не прикреплен к данному платежу
              </div>
              <div style={{ color: '#64748b', fontSize: '0.85rem', maxWidth: '320px' }}>
                Вы можете загрузить скан или фото квитанции в формате PDF, PNG или JPG
              </div>
              <label
                className={styles.downloadLink}
                style={{
                  marginTop: '8px',
                  padding: '10px 20px',
                  cursor: isUploadingReceipt ? 'wait' : 'pointer',
                  fontSize: '0.9rem',
                }}
              >
                <AttachFileIcon style={{ fontSize: '1.1rem' }} />
                {isUploadingReceipt ? 'Загрузка файла...' : 'Прикрепить квитанцию'}
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  style={{ display: 'none' }}
                  disabled={isUploadingReceipt}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUploadReceipt(file);
                    e.target.value = '';
                  }}
                />
              </label>
            </div>
          )}
        </Paper>
      </div>

      {/* Диалог редактирования параметров платежа */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSaveEdit}>
          <DialogTitle style={{ fontWeight: 700, color: '#0f172a' }}>
            Редактирование платежа #{payment.id}
          </DialogTitle>
          <DialogContent style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '8px' }}>
            <TextField
              label="Сумма платежа (руб.)"
              type="number"
              fullWidth
              required
              value={editAmount}
              onChange={(e) => setEditAmount(e.target.value)}
              inputProps={{ step: '0.01', min: '0.01' }}
            />
            <TextField
              select
              label="Банк зачисления"
              fullWidth
              value={editBankId}
              onChange={(e) => setEditBankId(e.target.value)}
            >
              <MenuItem value="">— Не назначен —</MenuItem>
              {banks?.map((b) => (
                <MenuItem key={b.id} value={String(b.id)}>
                  {b.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Статус платежа"
              fullWidth
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value)}
            >
              <MenuItem value="confirmed">Подтвержден</MenuItem>
              <MenuItem value="pending">Ожидает проверки</MenuItem>
              <MenuItem value="unconfirmed">Не подтвержден</MenuItem>
              <MenuItem value="rejected">Отклонен</MenuItem>
            </TextField>
            <TextField
              label="Комментарий к платежу"
              multiline
              rows={3}
              fullWidth
              value={editComment}
              onChange={(e) => setEditComment(e.target.value)}
            />
          </DialogContent>
          <DialogActions style={{ padding: '16px 24px' }}>
            <Button onClick={() => setEditOpen(false)} style={{ textTransform: 'none', color: '#64748b' }}>
              Отмена
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isSavingEdit}
              style={{ backgroundColor: '#2563eb', color: '#fff', textTransform: 'none', fontWeight: 600 }}
            >
              {isSavingEdit ? 'Сохранение...' : 'Сохранить изменения'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Диалог подтверждения платежа */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle style={{ fontWeight: 700, color: '#0f172a' }}>
          Подтвердить платеж #{payment.id}?
        </DialogTitle>
        <DialogContent style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '8px' }}>
          <DialogContentText>
            Подтвердите получение средств на сумму{' '}
            <strong>
              {Number(payment.amount).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} руб.
            </strong>
          </DialogContentText>
          <TextField
            select
            label="Банк зачисления"
            fullWidth
            value={confirmBankId}
            onChange={(e) => setConfirmBankId(e.target.value)}
            helperText="Выберите счет или банк, куда фактически поступили деньги"
          >
            <MenuItem value="">— Без привязки к банку —</MenuItem>
            {banks?.map((b) => (
              <MenuItem key={b.id} value={String(b.id)}>
                {b.name}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions style={{ padding: '16px 24px' }}>
          <Button onClick={() => setConfirmOpen(false)} style={{ textTransform: 'none', color: '#64748b' }}>
            Отмена
          </Button>
          <Button
            onClick={handleConfirmSubmit}
            variant="contained"
            disabled={isConfirming}
            style={{ backgroundColor: '#16a34a', color: '#fff', textTransform: 'none', fontWeight: 600 }}
          >
            {isConfirming ? 'Подтверждение...' : 'Подтвердить платеж'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог отклонения платежа */}
      <Dialog open={rejectOpen} onClose={() => setRejectOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle style={{ fontWeight: 700, color: '#dc2626' }}>
          Отклонить платеж #{payment.id}
        </DialogTitle>
        <DialogContent style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '8px' }}>
          <DialogContentText>
            Укажите причину отклонения платежа. Пользователь увидит этот комментарий.
          </DialogContentText>
          <TextField
            label="Причина отклонения"
            multiline
            rows={3}
            fullWidth
            value={rejectComment}
            onChange={(e) => setRejectComment(e.target.value)}
            placeholder="Например: Чек не читается / сумма не совпадает"
          />
        </DialogContent>
        <DialogActions style={{ padding: '16px 24px' }}>
          <Button onClick={() => setRejectOpen(false)} style={{ textTransform: 'none', color: '#64748b' }}>
            Отмена
          </Button>
          <Button
            onClick={handleRejectSubmit}
            variant="contained"
            disabled={isRejecting}
            style={{ backgroundColor: '#dc2626', color: '#fff', textTransform: 'none', fontWeight: 600 }}
          >
            {isRejecting ? 'Отклонение...' : 'Отклонить'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог удаления платежа */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle style={{ fontWeight: 700, color: '#dc2626' }}>
          Удалить платеж #{payment.id}?
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Вы действительно хотите удалить этот платеж? Это действие необратимо и удалит запись из базы данных.
          </DialogContentText>
        </DialogContent>
        <DialogActions style={{ padding: '16px 24px' }}>
          <Button onClick={() => setDeleteOpen(false)} style={{ textTransform: 'none', color: '#64748b' }}>
            Отмена
          </Button>
          <Button
            onClick={handleDeleteSubmit}
            variant="contained"
            disabled={isDeleting}
            style={{ backgroundColor: '#dc2626', color: '#fff', textTransform: 'none', fontWeight: 600 }}
          >
            {isDeleting ? 'Удаление...' : 'Да, удалить'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
