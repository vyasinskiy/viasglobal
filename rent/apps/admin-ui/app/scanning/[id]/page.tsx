'use client';
import * as React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import axios from 'axios';
import styles from '../../shared-table.module.css';

// MUI Icons
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import RefreshIcon from '@mui/icons-material/Refresh';
import LaunchIcon from '@mui/icons-material/Launch';

interface ScraperRunDetail {
  id: number;
  startedAt: string;
  finishedAt: string | null;
  trigger: string;
  status: string;
  message: string | null;
  apartmentsScanned: number;
  accrualsObserved: number;
  invoicesObserved: number;
  newApartments: number;
  newAccruals: number;
  newInvoices: number;
  needsLogin: boolean;
  summaryJson: string;
}

interface ParsedSummary {
  startedAt?: string;
  finishedAt?: string;
  trigger?: string;
  status?: string;
  message?: string;
  error?: string;
  errors?: string[];
  apartmentsScanned?: number;
  accrualsObserved?: number;
  invoicesObserved?: number;
  newApartments?: number;
  newAccruals?: number;
  newInvoices?: number;
  needsLogin?: boolean;
  [key: string]: unknown;
}

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

export default function ScraperRunDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const runId = params.id;
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isJsonOpen, setIsJsonOpen] = useState(false);

  // Запрашиваем детализированные данные конкретного запуска
  const { data: run, error, isLoading, mutate } = useSWR<ScraperRunDetail>(
    `/api/watcher/runs/${runId}`,
    fetcher
  );

  // Парсим сырой summaryJson для извлечения массива точечных ошибок
  const parsedSummary: ParsedSummary | null = React.useMemo(() => {
    if (!run?.summaryJson) return null;
    try {
      return JSON.parse(run.summaryJson);
    } catch {
      return null;
    }
  }, [run?.summaryJson]);

  // Копирование текста в буфер обмена с визуальной индикацией
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Форматирование даты со временем
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  // Вычисление длительности выполнения запуска
  const calculateDuration = (startStr: string, endStr: string | null) => {
    if (!endStr) return 'Выполняется...';
    try {
      const diffMs = new Date(endStr).getTime() - new Date(startStr).getTime();
      if (diffMs <= 0) return '0 сек';
      const seconds = Math.floor(diffMs / 1000);
      if (seconds < 60) return `${seconds} сек`;
      const minutes = Math.floor(seconds / 60);
      const remSec = seconds % 60;
      return `${minutes} мин ${remSec} сек`;
    } catch {
      return '—';
    }
  };

  // Рендеринг красивого бейджа статуса
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
      case 'completed':
        return (
          <span className={styles.statusConfirmed} style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
            <CheckCircleIcon style={{ fontSize: '1rem', marginRight: '6px', verticalAlign: 'middle' }} />
            Успешно завершено
          </span>
        );
      case 'needs_login':
        return (
          <span
            className={styles.statusRejected}
            style={{ backgroundColor: '#fef3c7', color: '#b45309', padding: '6px 12px', fontSize: '0.85rem' }}
          >
            🔑 Требуется вход
          </span>
        );
      case 'warning':
        return (
          <span
            className={styles.statusPending}
            style={{ backgroundColor: '#fff7ed', color: '#c2410c', padding: '6px 12px', fontSize: '0.85rem' }}
          >
            ⚠️ Завершено с предупреждениями
          </span>
        );
      case 'failed':
      case 'error':
        return (
          <span className={styles.statusRejected} style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
            <ErrorIcon style={{ fontSize: '1rem', marginRight: '6px', verticalAlign: 'middle' }} />
            Ошибка выполнения
          </span>
        );
      case 'started':
      case 'running':
        return (
          <span className={styles.statusPending} style={{ padding: '6px 12px', fontSize: '0.85rem', animation: 'pulse 1.5s infinite' }}>
            <HourglassEmptyIcon style={{ fontSize: '1rem', marginRight: '6px', verticalAlign: 'middle' }} />
            В процессе сканирования...
          </span>
        );
      default:
        return <span className={styles.statusPending}>{status}</span>;
    }
  };

  if (isLoading) {
    return <div className={styles.emptyState}>Загрузка деталей сканирования #{runId}...</div>;
  }

  if (error || !run) {
    return (
      <div className={styles.container}>
        <div style={{ marginBottom: '20px' }}>
          <button
            className={styles.downloadLink}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
            onClick={() => router.push('/scanning')}
          >
            <ArrowBackIcon style={{ fontSize: '1rem' }} />
            Назад к истории сканирований
          </button>
        </div>
        <div className={styles.emptyState}>
          Не удалось найти или загрузить запуск сканирования #{runId}.
        </div>
      </div>
    );
  }

  const isProblematic =
    run.status === 'needs_login' || run.status === 'error' || run.status === 'failed' || run.status === 'warning';

  const errorsList: string[] =
    parsedSummary?.errors && Array.isArray(parsedSummary.errors) && parsedSummary.errors.length > 0
      ? parsedSummary.errors
      : parsedSummary?.error
      ? [parsedSummary.error]
      : [];

  return (
    <div className={styles.container}>
      {/* Верхняя навигационная панель */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <button
          className={styles.downloadLink}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', backgroundColor: '#f1f5f9', color: '#334155' }}
          onClick={() => router.push('/scanning')}
        >
          <ArrowBackIcon style={{ fontSize: '1rem' }} />
          Назад к списку сканирований
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            className={styles.downloadLink}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', backgroundColor: '#e2e8f0', color: '#0f172a' }}
            onClick={() => mutate()}
            title="Обновить данные запуска"
          >
            <RefreshIcon style={{ fontSize: '1rem' }} />
            Обновить
          </button>
        </div>
      </div>

      {/* Заголовок страницы и статус */}
      <div className={styles.filterCard} style={{ display: 'block', padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#0f172a' }}>
                Запуск сканирования #{run.id}
              </h2>
              {renderStatusBadge(run.status)}
            </div>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
              Инициатор:{' '}
              <b>
                {run.trigger === 'manual'
                  ? 'Вручную (Администратор)'
                  : run.trigger === 'cron'
                  ? 'Планировщик (Cron-расписание)'
                  : run.trigger}
              </b>
              {' • '}
              Длительность: <b>{calculateDuration(run.startedAt, run.finishedAt)}</b>
            </p>
          </div>
        </div>
      </div>

      {/* Метрики и сводные счетчики */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {/* Карточка времени */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600, marginBottom: '8px' }}>
            Временной интервал
          </div>
          <div style={{ fontSize: '0.875rem', color: '#0f172a', marginBottom: '4px' }}>
            <b>Старт:</b> {formatDate(run.startedAt)}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#0f172a' }}>
            <b>Финиш:</b> {formatDate(run.finishedAt)}
          </div>
        </div>

        {/* Карточка квартир */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600, marginBottom: '8px' }}>
            Квартиры
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#0f172a', lineHeight: 1 }}>
            {run.apartmentsScanned}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#10b981', marginTop: '6px', fontWeight: 500 }}>
            +{run.newApartments} новых обнаружено
          </div>
        </div>

        {/* Карточка начислений */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600, marginBottom: '8px' }}>
            Начисления (ЖКУ)
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#2563eb', lineHeight: 1 }}>
            {run.accrualsObserved}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#10b981', marginTop: '6px', fontWeight: 500 }}>
            +{run.newAccruals} новых записей
          </div>
        </div>

        {/* Карточка инвойсов/квитанций */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600, marginBottom: '8px' }}>
            Квитанции (PDF)
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#7c3aed', lineHeight: 1 }}>
            {run.invoicesObserved}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#10b981', marginTop: '6px', fontWeight: 500 }}>
            +{run.newInvoices} загружено в хранилище
          </div>
        </div>
      </div>

      {/* Предупреждение о необходимости авторизации */}
      {run.needsLogin && (
        <div
          style={{
            backgroundColor: '#fef3c7',
            color: '#92400e',
            border: '1px solid #fde68a',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '24px',
          }}
        >
          <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🔑 Сессия авторизации kvartplata.online истекла
          </div>
          <p style={{ margin: '0 0 12px 0', fontSize: '0.875rem', lineHeight: '1.5' }}>
            Парсер не смог получить доступ к личным кабинетам, так как требуется повторная авторизация по SMS.
          </p>
          <div style={{ fontSize: '0.85rem', backgroundColor: '#fffbeb', padding: '12px', borderRadius: '8px', border: '1px dashed #fcd34d' }}>
            <b>Инструкция по входу:</b>
            <ol style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
              <li>Запустите удаленный браузер кнопкой в панели управления или через API.</li>
              <li>Откройте ссылку удаленного браузера (порт 3002).</li>
              <li>Войдите в личный кабинет kvartplata.online и подтвердите SMS-код.</li>
              <li>Сохраните профиль: <code>docker exec accruals-watcher npm run bootstrap</code>.</li>
            </ol>
          </div>
        </div>
      )}

      {/* Блок ошибок и сообщений */}
      {isProblematic && (
        <div
          style={{
            backgroundColor: '#fff',
            border: '1px solid #fecaca',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ErrorIcon style={{ fontSize: '1.3rem' }} />
              Диагностика и ошибки сессии
            </h3>
            {run.message && (
              <button
                className={styles.downloadLink}
                style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', backgroundColor: '#fee2e2', color: '#991b1b' }}
                onClick={() => handleCopy(run.message || '', 'all-errors')}
              >
                <ContentCopyIcon style={{ fontSize: '0.9rem' }} />
                {copiedKey === 'all-errors' ? 'Скопировано!' : 'Скопировать текст ошибки'}
              </button>
            )}
          </div>

          {/* Общий текст сообщения */}
          {run.message && (
            <div
              style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fee2e2',
                borderRadius: '8px',
                padding: '16px',
                fontFamily: 'monospace',
                fontSize: '0.85rem',
                color: '#991b1b',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                lineHeight: '1.6',
                marginBottom: errorsList.length > 0 ? '16px' : 0,
              }}
            >
              {run.message}
            </div>
          )}

          {/* Список раздельных ошибок, если они есть в summaryJson */}
          {errorsList.length > 0 && (
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                Детализированный список инцидентов ({errorsList.length}):
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {errorsList.map((errItem, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '12px 16px',
                      fontSize: '0.85rem',
                      fontFamily: 'monospace',
                      color: '#475569',
                      wordBreak: 'break-word',
                      gap: '12px',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <span style={{ color: '#ef4444', fontWeight: 700, marginRight: '8px' }}>
                        #{idx + 1}
                      </span>
                      {errItem}
                    </div>
                    <button
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#64748b',
                        cursor: 'pointer',
                        padding: '2px',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                      onClick={() => handleCopy(errItem, `err-${idx}`)}
                      title="Скопировать"
                    >
                      <ContentCopyIcon style={{ fontSize: '0.9rem' }} />
                      {copiedKey === `err-${idx}` && (
                        <span style={{ fontSize: '0.7rem', color: '#10b981', marginLeft: '4px' }}>
                          ✓
                        </span>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Карточка успешного сообщения, если ошибок не было */}
      {!isProblematic && run.message && (
        <div
          style={{
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '24px',
            color: '#166534',
            fontSize: '0.9rem',
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: '4px' }}>Результат сканирования:</div>
          <div>{run.message}</div>
        </div>
      )}

      {/* Сворачиваемый блок с полным сырым JSON для разработчиков */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#0f172a', fontWeight: 600 }}>
              Сырые диагностические данные (JSON)
            </h4>
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
              Полная структура ответа парсера со всеми метаданными
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className={styles.downloadLink}
              style={{ padding: '6px 12px', fontSize: '0.8rem', cursor: 'pointer', backgroundColor: '#f1f5f9', color: '#334155' }}
              onClick={() => handleCopy(run.summaryJson || '{}', 'raw-json')}
            >
              <ContentCopyIcon style={{ fontSize: '0.9rem', marginRight: '4px', verticalAlign: 'middle' }} />
              {copiedKey === 'raw-json' ? 'Скопировано!' : 'Скопировать JSON'}
            </button>
            <button
              className={styles.downloadLink}
              style={{ padding: '6px 12px', fontSize: '0.8rem', cursor: 'pointer', backgroundColor: '#e2e8f0', color: '#0f172a' }}
              onClick={() => setIsJsonOpen(!isJsonOpen)}
            >
              {isJsonOpen ? 'Свернуть' : 'Развернуть JSON'}
            </button>
          </div>
        </div>

        {isJsonOpen && (
          <div style={{ marginTop: '16px' }}>
            <pre
              style={{
                backgroundColor: '#0f172a',
                color: '#f8fafc',
                padding: '16px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontFamily: 'monospace',
                overflowX: 'auto',
                maxHeight: '450px',
                lineHeight: '1.5',
                margin: 0,
              }}
            >
              {(() => {
                try {
                  return JSON.stringify(JSON.parse(run.summaryJson || '{}'), null, 2);
                } catch {
                  return run.summaryJson;
                }
              })()}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
