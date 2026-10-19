'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Typography, CircularProgress, Alert, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Chip, Drawer, Select, MenuItem, FormControl,
  InputLabel, IconButton, Checkbox, FormControlLabel, Divider, Grid, Card,
  CardContent
} from '@mui/material';
import { Add, Edit, Delete, Close } from '@mui/icons-material';
import { useAuth } from '@/lib/AuthContext';
import { api } from '@/lib/api';
import AppLayout from '@/components/AppLayout';

const STATUS_CONFIG: Record<string, { label: string; color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' }> = {
  NEW: { label: 'Новый', color: 'default' },
  RESEARCHING: { label: 'Исследование', color: 'info' },
  FORM_SUBMITTED: { label: 'Форма отправлена', color: 'secondary' },
  EMAIL_SENT: { label: 'Письмо отправлено', color: 'primary' },
  CALLED: { label: 'Звонок', color: 'warning' },
  NEGOTIATING: { label: 'Переговоры', color: 'secondary' },
  ACCOUNT_OPENED: { label: 'Аккаунт открыт', color: 'success' },
  REJECTED: { label: 'Отказ', color: 'error' },
  INACTIVE: { label: 'Неактивен', color: 'default' },
};

const COMM_TYPES = ['CALL', 'EMAIL', 'MEETING', 'FORM', 'OTHER'] as const;

interface FunnelStats {
  NEW?: number;
  RESEARCHING?: number;
  FORM_SUBMITTED?: number;
  EMAIL_SENT?: number;
  CALLED?: number;
  NEGOTIATING?: number;
  ACCOUNT_OPENED?: number;
  REJECTED?: number;
  INACTIVE?: number;
}

export default function SuppliersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [funnel, setFunnel] = useState<FunnelStats>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', website: '', country: '', email: '', phone: '', notes: '' });
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Detail drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detail, setDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Status change
  const [statusForm, setStatusForm] = useState({ status: '', notes: '', rejectionReason: '' });

  // Contacts
  const [contactForm, setContactForm] = useState({ name: '', role: '', email: '', phone: '', isPrimary: false });
  const [contactSubmitting, setContactSubmitting] = useState(false);

  // Communications
  const [commForm, setCommForm] = useState({ type: 'CALL', date: new Date().toISOString().split('T')[0], summary: '', nextAction: '', nextActionDate: '' });
  const [commSubmitting, setCommSubmitting] = useState(false);

  // Notes
  const [notesText, setNotesText] = useState('');
  const [notesSaving, setNotesSaving] = useState(false);

  const fetchSuppliers = useCallback(async () => {
    try {
      setError(null);
      const [list, f] = await Promise.all([
        api.get<any[]>('/suppliers'),
        api.get<FunnelStats>('/suppliers/funnel'),
      ]);
      setSuppliers(Array.isArray(list) ? list : []);
      setFunnel(f || {});
    } catch (e: any) {
      setError(e?.message || 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) { router.push('/login'); return; }
    if (user) fetchSuppliers();
  }, [user, authLoading, router, fetchSuppliers]);

  const handleCreate = async () => {
    if (!createForm.name.trim()) return;
    setCreateSubmitting(true);
    setCreateError(null);
    try {
      await api.post('/suppliers', createForm);
      setCreateOpen(false);
      setCreateForm({ name: '', website: '', country: '', email: '', phone: '', notes: '' });
      fetchSuppliers();
    } catch (e: any) {
      setCreateError(e?.message || 'Ошибка создания');
    } finally {
      setCreateSubmitting(false);
    }
  };

  const openDrawer = async (supplier: any) => {
    setDrawerOpen(true);
    setDetailLoading(true);
    setDetail(supplier);
    try {
      const d = await api.get<any>(`/suppliers/${supplier.id}`);
      setDetail(d);
      setStatusForm({ status: d.status || '', notes: '', rejectionReason: '' });
      setNotesText(d.notes || '');
    } catch {
      // keep basic data
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setDetail(null);
  };

  const handleStatusChange = async () => {
    if (!detail || !statusForm.status) return;
    try {
      await api.patch(`/suppliers/${detail.id}/status`, {
        status: statusForm.status,
        notes: statusForm.notes || undefined,
        rejectionReason: statusForm.status === 'REJECTED' ? statusForm.rejectionReason : undefined,
      });
      setDetail({ ...detail, status: statusForm.status });
      setStatusForm({ ...statusForm, notes: '', rejectionReason: '' });
      fetchSuppliers();
    } catch {
      // silent
    }
  };

  const handleAddContact = async () => {
    if (!detail || !contactForm.name.trim()) return;
    setContactSubmitting(true);
    try {
      await api.post(`/suppliers/${detail.id}/contacts`, contactForm);
      setContactForm({ name: '', role: '', email: '', phone: '', isPrimary: false });
      const d = await api.get<any>(`/suppliers/${detail.id}`);
      setDetail(d);
    } catch {
      // silent
    } finally {
      setContactSubmitting(false);
    }
  };

  const handleDeleteContact = async (contactId: number) => {
    try {
      await api.delete(`/suppliers/contacts/${contactId}`);
      setDetail({ ...detail, contacts: (detail.contacts || []).filter((c: any) => c.id !== contactId) });
    } catch {
      // silent
    }
  };

  const handleAddComm = async () => {
    if (!detail || !commForm.summary.trim()) return;
    setCommSubmitting(true);
    try {
      await api.post(`/suppliers/${detail.id}/communications`, {
        ...commForm,
        nextActionDate: commForm.nextActionDate || undefined,
      });
      setCommForm({ type: 'CALL', date: new Date().toISOString().split('T')[0], summary: '', nextAction: '', nextActionDate: '' });
      const d = await api.get<any>(`/suppliers/${detail.id}`);
      setDetail(d);
    } catch {
      // silent
    } finally {
      setCommSubmitting(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!detail) return;
    setNotesSaving(true);
    try {
      await api.patch(`/suppliers/${detail.id}/status`, { status: detail.status, notes: notesText });
      setDetail({ ...detail, notes: notesText });
    } catch {
      // silent
    } finally {
      setNotesSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <AppLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>
      </AppLayout>
    );
  }
  if (!user) return null;

  return (
    <AppLayout>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {/* Funnel */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <Grid key={key}>
            <Card sx={{ minWidth: 140 }}>
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Chip label={cfg.label} color={cfg.color} size="small" />
                <Typography variant="h5" fontWeight={700} mt={0.5}>{funnel[key as keyof FunnelStats] ?? 0}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">Поставщики</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setCreateOpen(true)}>Добавить поставщика</Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Название</TableCell>
              <TableCell>Страна</TableCell>
              <TableCell>Статус</TableCell>
              <TableCell>Контактов</TableCell>
              <TableCell>Последний контакт</TableCell>
              <TableCell>Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {suppliers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">Нет поставщиков</Typography>
                </TableCell>
              </TableRow>
            ) : (
              suppliers.map((s: any) => {
                const sc = STATUS_CONFIG[s.status] || STATUS_CONFIG.NEW;
                return (
                  <TableRow
                    key={s.id}
                    hover
                    onClick={() => openDrawer(s)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>{s.name}</TableCell>
                    <TableCell>{s.country || '—'}</TableCell>
                    <TableCell>
                      <Chip label={sc.label} color={sc.color} size="small" />
                    </TableCell>
                    <TableCell>{s.contactCount ?? (s.contacts?.length ?? 0)}</TableCell>
                    <TableCell>{s.lastContactDate ? new Date(s.lastContactDate).toLocaleDateString('ru') : '—'}</TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={(e: any) => { e.stopPropagation(); openDrawer(s); }}>
                        <Edit fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Добавить поставщика</DialogTitle>
        <DialogContent>
          {createError && <Alert severity="error" sx={{ mb: 1 }}>{createError}</Alert>}
          <TextField label="Название" required fullWidth margin="dense"
            value={createForm.name} onChange={(e: any) => setCreateForm({ ...createForm, name: e.target.value })} />
          <TextField label="Сайт" fullWidth margin="dense"
            value={createForm.website} onChange={(e: any) => setCreateForm({ ...createForm, website: e.target.value })} />
          <TextField label="Страна" fullWidth margin="dense"
            value={createForm.country} onChange={(e: any) => setCreateForm({ ...createForm, country: e.target.value })} />
          <TextField label="Email" fullWidth margin="dense"
            value={createForm.email} onChange={(e: any) => setCreateForm({ ...createForm, email: e.target.value })} />
          <TextField label="Телефон" fullWidth margin="dense"
            value={createForm.phone} onChange={(e: any) => setCreateForm({ ...createForm, phone: e.target.value })} />
          <TextField label="Заметки" fullWidth margin="dense" multiline rows={3}
            value={createForm.notes} onChange={(e: any) => setCreateForm({ ...createForm, notes: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Отмена</Button>
          <Button variant="contained" onClick={handleCreate} disabled={createSubmitting || !createForm.name.trim()}>
            {createSubmitting ? <CircularProgress size={20} /> : 'Создать'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Detail Drawer */}
      <Drawer anchor="right" open={drawerOpen} onClose={closeDrawer}
        PaperProps={{ sx: { width: { xs: '100%', sm: 500 } } }}>
        {detailLoading || !detail ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>
        ) : (
          <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">{detail.name}</Typography>
              <IconButton onClick={closeDrawer}><Close /></IconButton>
            </Box>

            {/* Basic Info */}
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Основная информация</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 2 }}>
              <Typography variant="body2">Сайт: {detail.website || '—'}</Typography>
              <Typography variant="body2">Страна: {detail.country || '—'}</Typography>
              <Typography variant="body2">Email: {detail.email || '—'}</Typography>
              <Typography variant="body2">Телефон: {detail.phone || '—'}</Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Status Change */}
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Смена статуса</Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel>Статус</InputLabel>
                <Select
                  value={statusForm.status}
                  label="Статус"
                  onChange={(e: any) => setStatusForm({ ...statusForm, status: e.target.value })}
                >
                  {Object.keys(STATUS_CONFIG).map((k) => (
                    <MenuItem key={k} value={k}>{STATUS_CONFIG[k].label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              {statusForm.status === 'REJECTED' && (
                <TextField size="small" label="Причина отказа"
                  value={statusForm.rejectionReason}
                  onChange={(e: any) => setStatusForm({ ...statusForm, rejectionReason: e.target.value })}
                  sx={{ minWidth: 160 }} />
              )}
            </Box>
            <TextField label="Заметки к статусу" size="small" fullWidth multiline rows={2}
              value={statusForm.notes}
              onChange={(e: any) => setStatusForm({ ...statusForm, notes: e.target.value })}
              sx={{ mb: 1 }} />
            <Button variant="outlined" size="small" onClick={handleStatusChange}
              disabled={!statusForm.status || statusForm.status === detail.status}>
              Обновить статус
            </Button>

            <Divider sx={{ my: 2 }} />

            {/* Contacts */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">Контакты</Typography>
            </Box>
            {(detail.contacts || []).length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Нет контактов</Typography>
            ) : (
              (detail.contacts || []).map((c: any) => (
                <Box key={c.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, bgcolor: 'action.hover', borderRadius: 1, p: 1 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight={600}>
                      {c.name}{c.isPrimary ? ' (Основной)' : ''}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {[c.role, c.email, c.phone].filter(Boolean).join(' • ')}
                    </Typography>
                  </Box>
                  <IconButton size="small" onClick={() => handleDeleteContact(c.id)}><Delete fontSize="small" /></IconButton>
                </Box>
              ))
            )}
            <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
              <TextField size="small" label="Имя" value={contactForm.name}
                onChange={(e: any) => setContactForm({ ...contactForm, name: e.target.value })} />
              <TextField size="small" label="Роль" value={contactForm.role}
                onChange={(e: any) => setContactForm({ ...contactForm, role: e.target.value })} />
              <TextField size="small" label="Email" value={contactForm.email}
                onChange={(e: any) => setContactForm({ ...contactForm, email: e.target.value })} />
              <TextField size="small" label="Телефон" value={contactForm.phone}
                onChange={(e: any) => setContactForm({ ...contactForm, phone: e.target.value })} />
              <FormControlLabel
                control={<Checkbox size="small" checked={contactForm.isPrimary}
                  onChange={(e: any) => setContactForm({ ...contactForm, isPrimary: e.target.checked })} />}
                label="Основной"
                sx={{ '& .MuiTypography-root': { fontSize: '0.875rem' } }}
              />
            </Box>
            <Button variant="outlined" size="small" startIcon={<Add />} onClick={handleAddContact}
              disabled={contactSubmitting || !contactForm.name.trim()}>
              {contactSubmitting ? <CircularProgress size={16} /> : 'Добавить контакт'}
            </Button>

            <Divider sx={{ my: 2 }} />

            {/* Communication Log */}
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Журнал коммуникаций</Typography>
            {(detail.communications || []).length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Нет записей</Typography>
            ) : (
              (detail.communications || []).slice(0, 10).map((c: any) => (
                <Box key={c.id} sx={{ mb: 1, borderLeft: '3px solid', borderColor: 'primary.main', pl: 1.5 }}>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Chip label={c.type} size="small" />
                    <Typography variant="caption" color="text.secondary">
                      {c.date ? new Date(c.date).toLocaleDateString('ru') : ''}
                    </Typography>
                  </Box>
                  <Typography variant="body2">{c.summary}</Typography>
                  {c.nextAction && (
                    <Typography variant="caption" color="warning.main">
                      Далее: {c.nextAction}{c.nextActionDate ? ` до ${new Date(c.nextActionDate).toLocaleDateString('ru')}` : ''}
                    </Typography>
                  )}
                </Box>
              ))
            )}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 1 }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <FormControl size="small" sx={{ minWidth: 100 }}>
                  <InputLabel>Тип</InputLabel>
                  <Select value={commForm.type} label="Тип"
                    onChange={(e: any) => setCommForm({ ...commForm, type: e.target.value })}>
                    {COMM_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                  </Select>
                </FormControl>
                <TextField size="small" label="Дата" type="date"
                  value={commForm.date}
                  onChange={(e: any) => setCommForm({ ...commForm, date: e.target.value })}
                  InputLabelProps={{ shrink: true }} />
              </Box>
              <TextField size="small" label="Описание" fullWidth multiline rows={2}
                value={commForm.summary}
                onChange={(e: any) => setCommForm({ ...commForm, summary: e.target.value })} />
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField size="small" label="Следующее действие" sx={{ flex: 1 }}
                  value={commForm.nextAction}
                  onChange={(e: any) => setCommForm({ ...commForm, nextAction: e.target.value })} />
                <TextField size="small" label="Дата" type="date" sx={{ flex: 1 }}
                  value={commForm.nextActionDate}
                  onChange={(e: any) => setCommForm({ ...commForm, nextActionDate: e.target.value })}
                  InputLabelProps={{ shrink: true }} />
              </Box>
            </Box>
            <Button variant="outlined" size="small" startIcon={<Add />} onClick={handleAddComm}
              disabled={commSubmitting || !commForm.summary.trim()}>
              {commSubmitting ? <CircularProgress size={16} /> : 'Добавить коммуникацию'}
            </Button>

            <Divider sx={{ my: 2 }} />

            {/* Notes */}
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Заметки</Typography>
            <TextField fullWidth multiline rows={4} value={notesText}
              onChange={(e: any) => setNotesText(e.target.value)} sx={{ mb: 1 }} />
            <Button variant="outlined" size="small" onClick={handleSaveNotes}
              disabled={notesSaving}>
              {notesSaving ? <CircularProgress size={16} /> : 'Сохранить заметки'}
            </Button>
          </Box>
        )}
      </Drawer>
    </AppLayout>
  );
}