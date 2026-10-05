'use client';
import * as React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import axios from 'axios';
import styles from '../shared-table.module.css';

// MUI Components
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
import TextField from '@mui/material/TextField';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

interface Bank {
  id: number;
  name: string;
  createdAt: string;
  _count?: {
    payments: number;
  };
}

const fetcher = (url: string) => axios.get(url).then(res => res.data);

export default function BanksPage() {
  const router = useRouter();
  const { data: banks, error, mutate, isLoading } = useSWR<Bank[]>('/api/banks', fetcher);

  // Add/Edit modal states
  const [editingBank, setEditingBank] = useState<Bank | null>(null);
  const [bankName, setBankName] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete modal states
  const [deleteBankId, setDeleteBankId] = useState<number | null>(null);

  const openCreate = () => {
    setEditingBank(null);
    setBankName('');
    setModalOpen(true);
  };

  const openEdit = (bank: Bank) => {
    setEditingBank(bank);
    setBankName(bank.name);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const name = bankName.trim();
    if (!name) {
      alert('Пожалуйста, введите название банка.');
      return;
    }
    try {
      setIsSubmitting(true);
      if (editingBank) {
        await axios.put(`/api/banks/${editingBank.id}`, { name });
      } else {
        await axios.post('/api/banks', { name });
      }
      setModalOpen(false);
      setBankName('');
      setEditingBank(null);
      mutate();
    } catch (err: unknown) {
      alert('Ошибка при сохранении банка.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteBankId) return;
    try {
      await axios.delete(`/api/banks/${deleteBankId}`);
      mutate();
    } catch (err: unknown) {
      alert('Ошибка при удалении банка.');
    } finally {
      setDeleteBankId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  if (isLoading) return <div className={styles.emptyState}>Загрузка банков...</div>;
  if (error) return <div className={styles.emptyState}>Ошибка загрузки банков.</div>;

  return (
    <div className={styles.container}>
      {/* Toolbar */}
      <div className={styles.filterCard} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <AccountBalanceWalletIcon style={{ fontSize: '1.5rem', color: '#2563eb' }} />
          <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
            Банки зачисления: {banks?.length ?? 0}
          </span>
        </div>
        <button
          className={styles.downloadLink}
          style={{ padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '6px', border: 'none', cursor: 'pointer' }}
          onClick={openCreate}
        >
          <AddIcon style={{ fontSize: '1.2rem' }} />
          Добавить банк
        </button>
      </div>

      {/* Banks table */}
      <TableContainer component={Paper} className={styles.tableCard}>
        <Table aria-label="banks table">
          <TableHead>
            <TableRow>
              <TableCell style={{ fontWeight: 'bold' }}>ID</TableCell>
              <TableCell style={{ fontWeight: 'bold' }}>Название</TableCell>
              <TableCell style={{ fontWeight: 'bold' }}>Платежей</TableCell>
              <TableCell style={{ fontWeight: 'bold' }}>Дата создания</TableCell>
              <TableCell style={{ fontWeight: 'bold' }}>Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(banks && banks.length > 0) ? (
              banks.map((bank) => (
                <TableRow
                  key={bank.id}
                  className={styles.interactiveRow}
                  onClick={() => router.push(`/banks/${bank.id}`)}
                >
                  <TableCell>{bank.id}</TableCell>
                  <TableCell style={{ fontWeight: 600 }}>
                    {bank.name}
                  </TableCell>
                  <TableCell>
                    <span className={styles.statusPending}>{bank._count?.payments ?? 0}</span>
                  </TableCell>
                  <TableCell style={{ color: '#64748b' }}>{formatDate(bank.createdAt)}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className={styles.actionsCell}>
                      <button
                        className={styles.confirmBtn}
                        onClick={() => openEdit(bank)}
                      >
                        <EditIcon style={{ fontSize: '0.85rem', marginRight: '4px', verticalAlign: 'middle' }} />
                        Изменить
                      </button>
                      <button
                        className={styles.rejectBtn}
                        onClick={() => setDeleteBankId(bank.id)}
                      >
                        <DeleteIcon style={{ fontSize: '0.85rem', marginRight: '4px', verticalAlign: 'middle' }} />
                        Удалить
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <div className={styles.emptyState}>Банки не найдены</div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create/Edit Bank Dialog */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} aria-labelledby="bank-modal-title" maxWidth="sm" fullWidth>
        <DialogTitle id="bank-modal-title" style={{ fontWeight: 700 }}>
          {editingBank ? 'Редактирование банка' : 'Добавление нового банка'}
        </DialogTitle>
        <DialogContent style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '8px' }}>
          <TextField
            label="Название банка"
            fullWidth
            required
            variant="outlined"
            autoFocus
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            placeholder="Например: Альфа-Банк"
          />
        </DialogContent>
        <DialogActions style={{ padding: '16px 24px' }}>
          <Button onClick={() => setModalOpen(false)} variant="outlined" style={{ color: '#475569', borderColor: '#cbd5e1', textTransform: 'none' }}>
            Отмена
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={isSubmitting}
            style={{ textTransform: 'none', backgroundColor: '#2563eb' }}
          >
            {isSubmitting ? 'Сохранение...' : (editingBank ? 'Сохранить изменения' : 'Создать банк')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Bank Confirmation Dialog */}
      <Dialog
        open={deleteBankId !== null}
        onClose={() => setDeleteBankId(null)}
        aria-labelledby="delete-bank-title"
        aria-describedby="delete-bank-description"
      >
        <DialogTitle id="delete-bank-title" style={{ fontWeight: 700 }}>
          Подтверждение удаления банка
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-bank-description">
            Вы действительно хотите удалить этот банк? Существующие платежи будут сохранены, но их связь с банком будет сброшена.
          </DialogContentText>
        </DialogContent>
        <DialogActions style={{ padding: '16px 24px' }}>
          <Button onClick={() => setDeleteBankId(null)} variant="outlined" style={{ color: '#475569', borderColor: '#cbd5e1', textTransform: 'none' }}>
            Отмена
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained" style={{ textTransform: 'none', backgroundColor: '#ef4444' }}>
            Удалить банк
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}