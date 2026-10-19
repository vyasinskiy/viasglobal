'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Card, CardContent, Typography, Button, TextField, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, IconButton, CircularProgress, Alert, Dialog, DialogTitle,
  DialogContent, DialogActions, Select, InputLabel, FormControl, Snackbar
} from '@mui/material';
import { Download, Delete, UploadFile } from '@mui/icons-material';
import { useAuth } from '@/lib/AuthContext';
import { api, getToken } from '@/lib/api';
import AppLayout from '@/components/AppLayout';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

type DocumentRow = any;

const ENTITY_TYPES = [
  { value: 'SUPPLIER', label: 'Поставщик' },
  { value: 'PURCHASE', label: 'Закупка' },
  { value: 'SALE', label: 'Продажа' },
  { value: 'PRODUCT', label: 'Товар' },
];

const ENTITY_COLORS: Record<string, any> = {
  SUPPLIER: 'primary',
  PURCHASE: 'secondary',
  SALE: 'success',
  PRODUCT: 'info',
};

const DOCUMENT_TYPES = [
  { value: 'INVOICE', label: 'Счет' },
  { value: 'CONTRACT', label: 'Договор' },
  { value: 'PRICE_LIST', label: 'Прайс-лист' },
  { value: 'SHIPPING_LABEL', label: 'Накладная' },
  { value: 'DELIVERY_NOTE', label: 'ТТН' },
  { value: 'OTHER', label: 'Прочее' },
];

const DOCUMENT_LABELS: Record<string, string> = Object.fromEntries(
  DOCUMENT_TYPES.map((t) => [t.value, t.label])
);

const ENTITY_LABELS: Record<string, string> = Object.fromEntries(
  ENTITY_TYPES.map((t) => [t.value, t.label])
);

function formatSize(bytes?: number | null): string {
  if (bytes === undefined || bytes === null || Number.isNaN(bytes)) return '—';
  const units = ['Б', 'КБ', 'МБ', 'ГБ'];
  let v = bytes;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i += 1;
  }
  return `${v.toFixed(i > 0 && v < 10 ? 1 : 0)} ${units[i]}`;
}

function formatDate(value?: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString('ru-RU');
}

export default function DocumentsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [rows, setRows] = useState<DocumentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [entityFilter, setEntityFilter] = useState('');
  const [docTypeFilter, setDocTypeFilter] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [entityType, setEntityType] = useState('');
  const [entityId, setEntityId] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const load = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const data = await api.get<any>('/documents');
      setRows(Array.isArray(data) ? data : data?.items || []);
    } catch (e: any) {
      setLoadError(e?.message || 'Ошибка загрузки документов');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (!user) return;
    load();
  }, [user, authLoading, router]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const et = (r.entityType || '').toUpperCase();
      const dt = (r.documentType || '').toUpperCase();
      if (entityFilter && et !== entityFilter) return false;
      if (docTypeFilter && dt !== docTypeFilter) return false;
      return true;
    });
  }, [rows, entityFilter, docTypeFilter]);

  const showSnackbar = (message: string, severity: 'success' | 'error' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const resetForm = () => {
    setFile(null);
    setEntityType('');
    setEntityId('');
    setDocumentType('');
    setNotes('');
    setUploadError('');
  };

  const handleUpload = async () => {
    setUploadError('');
    if (!file) {
      setUploadError('Выберите файл');
      return;
    }
    if (!entityType) {
      setUploadError('Выберите тип сущности');
      return;
    }
    if (!entityId.trim()) {
      setUploadError('Укажите ID сущности');
      return;
    }
    if (!documentType) {
      setUploadError('Выберите тип документа');
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('entityType', entityType);
      fd.append('entityId', entityId.trim());
      fd.append('documentType', documentType);
      if (notes.trim()) fd.append('notes', notes.trim());

      const res = await fetch(`${API_BASE}/documents/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: fd,
      });

      if (res.status === 401) {
        router.push('/login');
        return;
      }

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || 'Ошибка загрузки');
      }

      setDialogOpen(false);
      resetForm();
      showSnackbar('Документ загружен');
      await load();
    } catch (e: any) {
      setUploadError(e?.message || 'Ошибка загрузки');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (row: DocumentRow) => {
    setDownloadingId(row.id);
    try {
      const res = await fetch(`${API_BASE}/documents/${row.id}/download`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error('Ошибка скачивания');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = row.fileName || row.name || row.originalName || 'document';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      showSnackbar(e?.message || 'Ошибка скачивания', 'error');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (row: DocumentRow) => {
    if (!window.confirm('Удалить документ?')) return;
    try {
      await api.delete(`/documents/${row.id}`);
      showSnackbar('Документ удален');
      await load();
    } catch (e: any) {
      showSnackbar(e?.message || 'Ошибка удаления', 'error');
    }
  };

  if (authLoading || loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }
  if (!user) return null;

  return (
    <AppLayout>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h5" fontWeight={700}>Документы</Typography>
        <Button variant="contained" startIcon={<UploadFile />} onClick={() => setDialogOpen(true)}>
          Загрузить документ
        </Button>
      </Box>

      {loadError && <Alert severity="error" sx={{ mb: 2 }}>{loadError}</Alert>}

      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Тип сущности</InputLabel>
            <Select
              value={entityFilter}
              label="Тип сущности"
              onChange={(e) => setEntityFilter(e.target.value)}
            >
              <MenuItem value="">Все</MenuItem>
              {ENTITY_TYPES.map((t) => (
                <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Тип документа</InputLabel>
            <Select
              value={docTypeFilter}
              label="Тип документа"
              onChange={(e) => setDocTypeFilter(e.target.value)}
            >
              <MenuItem value="">Все</MenuItem>
              {DOCUMENT_TYPES.map((t) => (
                <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </CardContent>
      </Card>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Имя файла</TableCell>
                <TableCell>Тип сущности</TableCell>
                <TableCell>Тип документа</TableCell>
                <TableCell>Размер</TableCell>
                <TableCell>Дата загрузки</TableCell>
                <TableCell align="right">Действия</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">Нет документов</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((row) => {
                  const et = (row.entityType || '').toUpperCase();
                  const dt = (row.documentType || '').toUpperCase();
                  return (
                    <TableRow key={row.id} hover>
                      <TableCell>{row.fileName || row.name || row.originalName || row.id}</TableCell>
                      <TableCell>
                        <Chip
                          label={ENTITY_LABELS[et] || et}
                          color={ENTITY_COLORS[et] || 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{DOCUMENT_LABELS[dt] || dt}</TableCell>
                      <TableCell>{formatSize(row.size)}</TableCell>
                      <TableCell>{formatDate(row.createdAt || row.uploadedAt)}</TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleDownload(row)}
                          disabled={downloadingId === row.id}
                        >
                          {downloadingId === row.id ? <CircularProgress size={18} /> : <Download />}
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDelete(row)}>
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={dialogOpen} onClose={() => !uploading && setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Загрузить документ</DialogTitle>
        <DialogContent>
          {uploadError && <Alert severity="error" sx={{ mb: 2 }}>{uploadError}</Alert>}

          <Box sx={{ mb: 2 }}>
            <Button component="label" variant="outlined" startIcon={<UploadFile />}>
              {file ? 'Заменить файл' : 'Выбрать файл'}
              <input
                type="file"
                hidden
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </Button>
            {file && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {file.name} ({formatSize(file.size)})
              </Typography>
            )}
          </Box>

          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Тип сущности</InputLabel>
            <Select
              value={entityType}
              label="Тип сущности"
              onChange={(e) => setEntityType(e.target.value)}
            >
              {ENTITY_TYPES.map((t) => (
                <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            size="small"
            label="ID сущности"
            value={entityId}
            onChange={(e) => setEntityId(e.target.value)}
            sx={{ mb: 2 }}
          />

          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Тип документа</InputLabel>
            <Select
              value={documentType}
              label="Тип документа"
              onChange={(e) => setDocumentType(e.target.value)}
            >
              {DOCUMENT_TYPES.map((t) => (
                <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            size="small"
            label="Комментарий"
            multiline
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={uploading}>Отмена</Button>
          <Button variant="contained" onClick={handleUpload} disabled={uploading}>
            {uploading ? 'Загрузка...' : 'Загрузить'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </AppLayout>
  );
}