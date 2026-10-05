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
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import VisibilityIcon from '@mui/icons-material/Visibility';

interface ScraperRun {
  id: number;
  startedAt: string;
  finishedAt: string | null;
  trigger: string;
  status: string; // 'success' | 'warning' | 'needs_login' | 'error' | 'started' | 'completed' | 'failed'
  message: string | null;
  error?: string;
  errors?: string[];
  apartmentsScanned: number;
  accrualsObserved: number;
  invoicesObserved: number;
  newApartments: number;
  newAccruals: number;
  newInvoices: number;
  needsLogin: boolean;
  summaryJson?: string;
}

const fetcher = (url: string) => axios.get(url).then(res => res.data);

export default function ScanningPage() {
  const router = useRouter();
  const [triggering, setTriggering] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [lastRunResult, setLastRunResult] = useState<ScraperRun | null>(null);
  // Набор ID строк, у которых развернут полный текст ошибки
  const [expandedRowIds, setExpandedRowIds] = useState<Set<number>>(new Set());

  // Переход на детальную страницу конкретного запуска
  const handleRowClick = (id: number) => {
    router.push(`/scanning/${id}`);
  };

  // Переключение сворачивания/разворачивания длинного текста сообщения
  const toggleRowExpand = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setExpandedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Опрос истории запусков парсера каждые 4 секунды
  const { data: runs, mutate, isLoading } = useSWR<ScraperRun[]>(
    '/api/watcher/runs', 
    fetcher, 
    { refreshInterval: 4000 }
  );

  const handleStartScan = async () => {
    setTriggering(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setLastRunResult(null);
    try {
      // Отправляем запрос на запуск сканирования и получаем подробный ответ с ошибками
      const res = await axios.post('/api/watcher/scan', { force: true });
      const data: ScraperRun = res.data;
      setLastRunResult(data);

      if (data.status === 'needs_login') {
        setErrorMsg(data.error || data.message || 'Требуется авторизация в личный кабинет kvartplata.online');
      } else if (data.status === 'error' || data.status === 'failed') {
        setErrorMsg(data.error || data.message || 'Ошибка выполнения сканирования');
      } else if (data.status === 'warning') {
        setErrorMsg(`Сканирование завершено с предупреждениями: ${data.error || data.message}`);
      } else {
        setSuccessMsg(`Сканирование успешно завершено. Квартир: ${data.apartmentsScanned}, начислений: ${data.accrualsObserved}, инвойсов: ${data.invoicesObserved}`);
      }

      mutate();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ошибка связи с парсером';
      setErrorMsg(`Не удалось запустить сканирование: ${msg}. Убедитесь, что контейнер watcher запущен на порту 4500.`);
    } finally {
      setTriggering(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  const renderRunStatus = (status: string) => {
    switch (status) {
      case 'success':
      case 'completed':
        return (
          <span className={styles.statusConfirmed}>
            <CheckCircleIcon style={{ fontSize: '0.9rem', marginRight: '4px', verticalAlign: 'middle' }} />
            Успешно
          </span>
        );
      case 'needs_login':
        return (
          <span className={styles.statusRejected} style={{ backgroundColor: '#fef3c7', color: '#b45309' }}>
            🔑 Требуется вход
          </span>
        );
      case 'warning':
        return (
          <span className={styles.statusPending} style={{ backgroundColor: '#fff7ed', color: '#c2410c' }}>
            ⚠️ Предупреждение
          </span>
        );
      case 'failed':
      case 'error':
        return (
          <span className={styles.statusRejected}>
            <ErrorIcon style={{ fontSize: '0.9rem', marginRight: '4px', verticalAlign: 'middle' }} />
            Ошибка
          </span>
        );
      case 'started':
      case 'running':
        return (
          <span className={styles.statusPending} style={{ animation: 'pulse 1.5s infinite' }}>
            <HourglassEmptyIcon style={{ fontSize: '0.9rem', marginRight: '4px', verticalAlign: 'middle' }} />
            Выполняется...
          </span>
        );
      default:
        return <span className={styles.statusPending}>{status}</span>;
    }
  };

  const isScraperBusy = runs?.some(run => run.status === 'started' || run.status === 'running') ?? false;

  return (
    <div className={styles.container}>
      {/* Control panel card */}
      <div className={styles.filterCard} style={{ display: 'block', padding: '24px' }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '1.15rem', color: '#0f172a' }}>
          Управление фоновым парсером
        </h3>
        <p style={{ margin: '0 0 20px 0', fontSize: '0.875rem', color: '#64748b', lineHeight: '1.5' }}>
          Парсер автоматически сканирует личные кабинеты внешних поставщиков услуг (ЖКХ, Энергосбыт), чтобы скачать свежие начисления, лицевые счета и PDF-файлы инвойсов. Вы можете принудительно запустить сессию сканирования кнопкой ниже.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <button
            className={styles.downloadLink}
            style={{ 
              padding: '12px 24px', 
              fontSize: '0.875rem', 
              borderRadius: '8px', 
              cursor: isScraperBusy || triggering ? 'not-allowed' : 'pointer',
              backgroundColor: isScraperBusy || triggering ? '#94a3b8' : '#2563eb',
              border: 'none',
              pointerEvents: isScraperBusy || triggering ? 'none' : 'auto'
            }}
            onClick={handleStartScan}
            disabled={isScraperBusy || triggering}
          >
            <PlayArrowIcon style={{ fontSize: '1.2rem', marginRight: '4px' }} />
            {isScraperBusy ? 'Выполняется сканирование...' : triggering ? 'Запуск...' : 'Запустить сканирование'}
          </button>

          {isScraperBusy && (
            <span style={{ fontSize: '0.875rem', color: '#2563eb', fontWeight: 600 }}>
              Парсер занят, история логов обновляется автоматически...
            </span>
          )}
        </div>

        {/* Информационные плашки результатов для немедленного анализа */}
        {errorMsg && (
          <div style={{ 
            backgroundColor: lastRunResult?.status === 'needs_login' ? '#fef3c7' : '#fee2e2',
            color: lastRunResult?.status === 'needs_login' ? '#92400e' : '#991b1b',
            border: `1px solid ${lastRunResult?.status === 'needs_login' ? '#fde68a' : '#fecaca'}`,
            borderRadius: '8px',
            padding: '12px 16px',
            marginTop: '16px',
            fontSize: '0.875rem'
          }}>
            <div style={{ fontWeight: 700, marginBottom: '4px' }}>
              {lastRunResult?.status === 'needs_login' ? '🔑 Проблема с авторизацией' : '❌ Ошибка при сканировании'}
            </div>
            <div>{errorMsg}</div>
            {lastRunResult?.status === 'needs_login' && (
              <div style={{ marginTop: '8px', fontSize: '0.8rem', color: '#78350f' }}>
                💡 <b>Решение:</b> запустите контейнер <code>visual-browser</code> на сервере (порт 3002), залогиньтесь по SMS и сохраните сессию через <code>docker exec accruals-watcher npm run bootstrap</code>.
              </div>
            )}
          </div>
        )}

        {successMsg && (
          <div style={{ 
            backgroundColor: '#dcfce7',
            color: '#166534',
            border: '1px solid #bbf7d0',
            borderRadius: '8px',
            padding: '12px 16px',
            marginTop: '16px',
            fontSize: '0.875rem'
          }}>
            <span style={{ fontWeight: 600 }}>✅ {successMsg}</span>
          </div>
        )}
      </div>

      {/* History table */}
      <div>
        <h4 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: '#0f172a', fontWeight: 700 }}>
          История запусков парсера
        </h4>
        <TableContainer component={Paper} className={styles.tableCard}>
          <Table aria-label="scraper runs table">
            <TableHead>
              <TableRow>
                <TableCell style={{ fontWeight: 'bold' }}>ID запуск</TableCell>
                <TableCell style={{ fontWeight: 'bold' }}>Инициатор</TableCell>
                <TableCell style={{ fontWeight: 'bold' }}>Статус</TableCell>
                <TableCell style={{ fontWeight: 'bold' }}>Начало</TableCell>
                <TableCell style={{ fontWeight: 'bold' }}>Конец</TableCell>
                <TableCell style={{ fontWeight: 'bold' }}>Сканировано квартир</TableCell>
                <TableCell style={{ fontWeight: 'bold' }}>Новых счетов / PDF</TableCell>
                <TableCell style={{ fontWeight: 'bold' }}>Сообщение / Ошибка</TableCell>
                <TableCell style={{ fontWeight: 'bold', textAlign: 'center' }}>Действия</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {runs && runs.length > 0 ? (
                runs.map((row) => {
                  const isProblematic = row.status === 'needs_login' || row.status === 'error' || row.status === 'failed' || row.status === 'warning';
                  const isExpanded = expandedRowIds.has(row.id);
                  const isLongMsg = (row.message?.length ?? 0) > 110;

                  return (
                    <TableRow 
                      key={row.id} 
                      className={styles.interactiveRow}
                      style={{ backgroundColor: isProblematic ? '#fffbfb' : 'inherit', cursor: 'pointer' }}
                      onClick={() => handleRowClick(row.id)}
                    >
                      <TableCell>{row.id}</TableCell>
                      <TableCell style={{ fontWeight: 500 }}>
                        {row.trigger === 'manual' ? 'Вручную (Админ)' : row.trigger === 'cron' ? 'Планировщик (Cron)' : row.trigger}
                      </TableCell>
                      <TableCell>{renderRunStatus(row.status)}</TableCell>
                      <TableCell style={{ color: '#64748b' }}>{formatDate(row.startedAt)}</TableCell>
                      <TableCell style={{ color: '#64748b' }}>{formatDate(row.finishedAt)}</TableCell>
                      <TableCell style={{ fontWeight: 600, textAlign: 'center' }}>
                        {row.apartmentsScanned}
                      </TableCell>
                      <TableCell style={{ fontWeight: 600, color: '#2563eb', textAlign: 'center' }}>
                        {row.newAccruals} / {row.newInvoices}
                      </TableCell>
                      {/* Компактное отображение сообщения об ошибке с переключателем Развернуть / Свернуть */}
                      <TableCell style={{ 
                        color: isProblematic ? '#b91c1c' : '#475569', 
                        fontSize: '0.8rem', 
                        maxWidth: '320px', 
                        wordBreak: 'break-word',
                        fontWeight: isProblematic ? 500 : 400
                      }}>
                        {row.message ? (
                          <div>
                            <span>
                              {isExpanded || !isLongMsg ? row.message : `${row.message.slice(0, 110)}...`}
                            </span>
                            {isLongMsg && (
                              <button
                                type="button"
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#2563eb',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  padding: '2px 0 0 6px',
                                  fontSize: '0.75rem',
                                  textDecoration: 'underline',
                                  display: 'inline-block'
                                }}
                                onClick={(e) => toggleRowExpand(e, row.id)}
                              >
                                {isExpanded ? 'Свернуть' : 'Развернуть'}
                              </button>
                            )}
                          </div>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      {/* Кнопка перехода к подробной странице сканирования */}
                      <TableCell style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <button
                          className={styles.downloadLink}
                          style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                          onClick={() => handleRowClick(row.id)}
                          title="Открыть детальные результаты сканирования"
                        >
                          <VisibilityIcon style={{ fontSize: '0.95rem' }} />
                          Детали
                        </button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <div className={styles.emptyState}>
                      {isLoading ? 'Загрузка истории запусков...' : 'Запуски парсера не обнаружены'}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </div>
    </div>
  );
}
