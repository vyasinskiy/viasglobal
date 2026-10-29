// ecommerce/crm/app/finance/page.tsx
// Сводный финансовый дашборд Viasglobal по всем 3 направлениям деятельности
'use client';
import * as React from 'react';
import useSWR from 'swr';
import axios from 'axios';
import styles from './finance.module.css';
import tableStyles from '../shared-table.module.css';

// Иконки Material UI
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CodeIcon from '@mui/icons-material/Code';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import ApartmentIcon from '@mui/icons-material/Apartment';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import PrintIcon from '@mui/icons-material/Print';
import DescriptionIcon from '@mui/icons-material/Description';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import CloseIcon from '@mui/icons-material/Close';

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

export default function ConsolidatedFinancePage() {
  const [selectedYear, setSelectedYear] = React.useState<number>(2026);
  const [currencyMode, setCurrencyMode] = React.useState<'EUR' | 'ORIGINAL' | 'DUAL'>('DUAL');
  const [scopeFilter, setScopeFilter] = React.useState<'ALL' | 'SPAIN_AUTONOMO' | 'RENT_RU'>('ALL');
  
  // Состояния модальных окон
  const [isEntryModalOpen, setIsEntryModalOpen] = React.useState(false);
  const [docModalData, setDocModalData] = React.useState<any>(null);

  // Форма добавления/редактирования записи реестра
  const [entryForm, setEntryForm] = React.useState({
    segment: 'IT_DEV',
    type: 'INCOME',
    date: '2026-10-31',
    invoiceNumber: '',
    counterpartyName: '',
    description: '',
    amountNetto: 4000,
    vatRate: 0,
    createdInTaxfix: false,
    uploadedToTaxfix: false,
    paymentLinkedInTaxfix: false,
    paymentStatus: 'PAID',
    notes: '',
  });

  // Запрос сводного финансового дашборда
  const { data, error, isLoading, mutate } = useSWR(
    `/api/backend/finance/dashboard?year=${selectedYear}`,
    fetcher,
    { refreshInterval: 30000 }
  );

  if (isLoading) {
    return <div className={tableStyles.emptyState}>Загрузка сводного финансового дашборда...</div>;
  }

  if (error || !data) {
    return (
      <div className={tableStyles.emptyState} style={{ color: '#ef4444' }}>
        Ошибка при получении финансовых данных. Проверьте соединение с бэкендом.
      </div>
    );
  }

  const { annual, months, taxpayerProfile, rentService, taxfixComplianceSummary, eurRubRate } = data;

  // Открытие модального окна Word/PDF инвойса
  const handleOpenDoc = async (idOrPeriod: string) => {
    try {
      const res = await axios.get(`/api/backend/finance/it-invoice/${idOrPeriod}/document`);
      setDocModalData(res.data);
    } catch (err: any) {
      alert(`Ошибка загрузки документа: ${err?.response?.data?.message || err.message}`);
    }
  };

  // Сохранение новой финансовой записи
  const handleCreateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/backend/finance/ledger', entryForm);
      setIsEntryModalOpen(false);
      mutate();
    } catch (err: any) {
      alert(`Ошибка при сохранении: ${err?.response?.data?.message || err.message}`);
    }
  };

  // Переключение чекбокса Taxfix в записи реестра
  const handleToggleTaxfix = async (entryId: string, field: 'createdInTaxfix' | 'uploadedToTaxfix' | 'paymentLinkedInTaxfix', currentVal: boolean) => {
    try {
      await axios.patch(`/api/backend/finance/ledger/${entryId}`, {
        [field]: !currentVal,
      });
      mutate();
    } catch (err: any) {
      alert(`Ошибка обновления Taxfix: ${err?.response?.data?.message || err.message}`);
    }
  };

  return (
    <div className={styles.container}>
      {/* Главный баннер */}
      <section className={styles.heroCard}>
        <div>
          <h1 className={styles.heroTitle}>Сводный финансовый дашборд</h1>
          <p className={styles.heroSubtitle}>
            Консолидированный учет доходов и расходов по всем направлениям бизнеса:
            IT-разработка (IAE 763 / 4 000 € в мес), E-Commerce Amazon Wholesale (IAE 665 / закупки и продажи) и Аренда квартир (РФ, отдельное юрлицо).
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            className={tableStyles.primaryBtn}
            onClick={() => {
              setEntryForm({
                segment: 'IT_DEV',
                type: 'INCOME',
                date: `${selectedYear}-10-31`,
                invoiceNumber: `FACT-IT-${selectedYear}-10`,
                counterpartyName: 'IT B2B Client (Software Development)',
                description: 'IT Architecture & Software Development Services',
                amountNetto: 4000,
                vatRate: 0,
                createdInTaxfix: false,
                uploadedToTaxfix: false,
                paymentLinkedInTaxfix: false,
                paymentStatus: 'PAID',
                notes: 'Ежемесячный инвойс по IT-разработке',
              });
              setIsEntryModalOpen(true);
            }}
          >
            <AddCircleOutlineIcon style={{ fontSize: '1.1rem', marginRight: '6px' }} />
            Добавить операцию / инвойс
          </button>
        </div>
      </section>

      {/* Панель управления: выбор года, фильтрация контуров и валютный режим */}
      <section className={styles.controlsBar}>
        <div className={styles.filterGroup}>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748b' }}>ГОД:</span>
          {[2024, 2025, 2026, 2027].map((yr) => (
            <button
              key={yr}
              className={`${styles.filterBtn} ${selectedYear === yr ? styles.activeFilterBtn : ''}`}
              onClick={() => setSelectedYear(yr)}
            >
              {yr}
            </button>
          ))}
        </div>

        <div className={styles.filterGroup}>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748b' }}>КОНТУР:</span>
          <button
            className={`${styles.filterBtn} ${scopeFilter === 'ALL' ? styles.activeFilterBtn : ''}`}
            onClick={() => setScopeFilter('ALL')}
          >
            Все 3 направления
          </button>
          <button
            className={`${styles.filterBtn} ${scopeFilter === 'SPAIN_AUTONOMO' ? styles.activeFilterBtn : ''}`}
            onClick={() => setScopeFilter('SPAIN_AUTONOMO')}
          >
            Только Испания (Autónomo)
          </button>
          <button
            className={`${styles.filterBtn} ${scopeFilter === 'RENT_RU' ? styles.activeFilterBtn : ''}`}
            onClick={() => setScopeFilter('RENT_RU')}
          >
            Только Аренда (РФ)
          </button>
        </div>

        <div className={styles.filterGroup}>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748b' }}>ВАЛЮТА:</span>
          <button
            className={`${styles.filterBtn} ${currencyMode === 'DUAL' ? styles.activeFilterBtn : ''}`}
            onClick={() => setCurrencyMode('DUAL')}
          >
            EUR + RUB
          </button>
          <button
            className={`${styles.filterBtn} ${currencyMode === 'EUR' ? styles.activeFilterBtn : ''}`}
            onClick={() => setCurrencyMode('EUR')}
          >
            Все в EUR ({eurRubRate} ₽)
          </button>
        </div>
      </section>

      {/* Сетка основных KPI за выбранный год */}
      <section className={styles.gridKpi}>
        {/* KPI 1: IT-разработка */}
        <div id="it-section" className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiLabel}>IT-разработка (IAE 763)</span>
            <CodeIcon style={{ color: '#2563eb' }} />
          </div>
          <div className={styles.kpiValue} style={{ color: '#16a34a' }}>
            +{annual.itDev.incomeEur.toLocaleString('ru-RU')} €
          </div>
          <div className={styles.kpiMeta}>
            <span>Правило: <b>4 000 € / месяц</b> (в конце месяца)</span>
            <span>Выставлено инвойсов: <b>{annual.itDev.invoicesCount} шт.</b></span>
            <span>Статус: <b>Word/PDF + Гос. фактура Taxfix</b></span>
          </div>
        </div>

        {/* KPI 2: E-Commerce Amazon */}
        <div id="amazon-section" className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiLabel}>E-Commerce Amazon (IAE 665)</span>
            <ShoppingBagIcon style={{ color: '#f59e0b' }} />
          </div>
          <div className={styles.kpiValue} style={{ color: '#0f172a' }}>
            {annual.ecommerce.netCashflowEur >= 0 ? '+' : ''}
            {annual.ecommerce.netCashflowEur.toLocaleString('ru-RU')} €
          </div>
          <div className={styles.kpiMeta}>
            <span>Продажи Amazon: <b>+{annual.ecommerce.salesGrossEur.toFixed(2)} €</b></span>
            <span>Закупки у дистрибьюторов: <b>-{annual.ecommerce.purchasesGrossEur.toFixed(2)} €</b></span>
            <span>Операц. фактуры (упаковка/софт): <b>-{annual.ecommerce.extraExpensesEur.toFixed(2)} €</b></span>
          </div>
        </div>

        {/* KPI 3: Аренда квартир (РФ) */}
        <div id="rent-section" className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiLabel}>Аренда квартир (РФ юрлицо)</span>
            <ApartmentIcon style={{ color: '#8b5cf6' }} />
          </div>
          <div className={styles.kpiValue} style={{ color: '#16a34a' }}>
            +{annual.rentRu.incomeRub.toLocaleString('ru-RU')} ₽
          </div>
          <div className={styles.kpiMeta}>
            <span>Эквивалент в EUR: <b>~{annual.rentRu.incomeEurEquivalent.toLocaleString('ru-RU')} €</b></span>
            <span>ЖКУ расходы: <b>-{annual.rentRu.expensesRub.toLocaleString('ru-RU')} ₽</b></span>
            <span>Чистый доход: <b>+{annual.rentRu.netRub.toLocaleString('ru-RU')} ₽</b></span>
          </div>
        </div>

        {/* KPI 4: Глобальный результат */}
        <div id="pl-kpi-section" className={styles.kpiCard} style={{ backgroundColor: '#f8fafc', borderColor: '#cbd5e1' }}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiLabel}>
              {scopeFilter === 'SPAIN_AUTONOMO' ? 'Итого Autónomo (Испания)' : 'Общий консолидированный Cashflow'}
            </span>
            <AccountBalanceWalletIcon style={{ color: '#0f172a' }} />
          </div>
          <div className={styles.kpiValue} style={{ color: '#1e3a8a' }}>
            {scopeFilter === 'SPAIN_AUTONOMO'
              ? `${annual.spainAutonomoTotal.netCashflowEur.toLocaleString('ru-RU')} €`
              : `${annual.globalConsolidated.netCashflowEur.toLocaleString('ru-RU')} €`}
          </div>
          <div className={styles.kpiMeta}>
            {scopeFilter === 'SPAIN_AUTONOMO' ? (
              <>
                <span>Доходы Autónomo: <b>+{annual.spainAutonomoTotal.incomeEur.toLocaleString('ru-RU')} €</b></span>
                <span>Расходы Autónomo: <b>-{annual.spainAutonomoTotal.expensesEur.toLocaleString('ru-RU')} €</b></span>
              </>
            ) : (
              <>
                <span>Все доходы: <b>+{annual.globalConsolidated.incomeEur.toLocaleString('ru-RU')} €</b></span>
                <span>Все расходы: <b>-{annual.globalConsolidated.expensesEur.toLocaleString('ru-RU')} €</b></span>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Помесячная сводная таблица (12 месяцев) */}
      <section id="monthly-pl-section" className={styles.sectionBox}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>
            Помесячная динамика доходов и расходов ({selectedYear} год)
          </h3>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Курс пересчета: 1 EUR = {eurRubRate} RUB
          </span>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.customTable}>
            <thead>
              <tr>
                <th>Период</th>
                <th>IT-разработка (4 000 €/мес)</th>
                <th>E-Commerce (Закупки / Продажи)</th>
                <th>Аренда (РФ, ₽ / €)</th>
                <th>Итого за месяц (Cashflow)</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {months.map((m: any) => {
                const hasItInvoice = m.itDev.incomeEur > 0;
                return (
                  <tr key={m.period}>
                    <td>
                      <b>{m.period}</b>
                    </td>
                    <td>
                      {hasItInvoice ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className={styles.badgeSuccess}>+{m.itDev.incomeEur.toLocaleString('ru-RU')} €</span>
                          <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Word + Taxfix</span>
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>—</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.82rem' }}>
                        {m.ecommerce.salesGrossEur > 0 && (
                          <span style={{ color: '#16a34a' }}>Продажи: +{m.ecommerce.salesGrossEur.toFixed(2)} €</span>
                        )}
                        {m.ecommerce.purchasesGrossEur > 0 && (
                          <span style={{ color: '#dc2626' }}>Закупки: -{m.ecommerce.purchasesGrossEur.toFixed(2)} €</span>
                        )}
                        {m.ecommerce.extraExpensesEur > 0 && (
                          <span style={{ color: '#d97706' }}>Упаковка/Софт: -{m.ecommerce.extraExpensesEur.toFixed(2)} €</span>
                        )}
                        {m.ecommerce.salesGrossEur === 0 && m.ecommerce.purchasesGrossEur === 0 && m.ecommerce.extraExpensesEur === 0 && (
                          <span style={{ color: '#94a3b8' }}>—</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.82rem' }}>
                        {m.rentRu.incomeRub > 0 ? (
                          <>
                            <span style={{ color: '#16a34a' }}>+{m.rentRu.incomeRub.toLocaleString('ru-RU')} ₽</span>
                            <span style={{ color: '#64748b' }}>~{m.rentRu.incomeEurEquivalent.toFixed(0)} €</span>
                          </>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>—</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <b style={{ color: m.globalConsolidated.netCashflowEur >= 0 ? '#16a34a' : '#dc2626' }}>
                        {m.globalConsolidated.netCashflowEur >= 0 ? '+' : ''}
                        {m.globalConsolidated.netCashflowEur.toLocaleString('ru-RU')} €
                      </b>
                    </td>
                    <td>
                      {hasItInvoice && (
                        <button
                          className={styles.filterBtn}
                          style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                          onClick={() => handleOpenDoc(m.period)}
                        >
                          <DescriptionIcon style={{ fontSize: '0.9rem', marginRight: '4px', verticalAlign: 'middle' }} />
                          Инвойс Word/PDF
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Реестр фактур и комплаенс Taxfix (государственная система электронных счетов AEAT) */}
      <section id="taxfix-section" className={styles.sectionBox}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>
            Налоговый комплаенс Taxfix и реестр фактур Autónomo
          </h3>
          <span className={taxfixComplianceSummary.totalPendingCount === 0 ? styles.badgeSuccess : styles.badgeWarning}>
            {taxfixComplianceSummary.totalPendingCount === 0
              ? '✅ Все фактуры учтены в Taxfix'
              : `⚠️ Ожидают действий в Taxfix: ${taxfixComplianceSummary.totalPendingCount}`}
          </span>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.customTable}>
            <thead>
              <tr>
                <th>Дата</th>
                <th>Направление</th>
                <th>№ Документа</th>
                <th>Контрагент</th>
                <th>Сумма Брутто</th>
                <th>Создано в Taxfix (Гос. система)</th>
                <th>PDF в Taxfix</th>
                <th>Линковка с банком</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {data.ledgerEntries.map((entry: any) => (
                <tr key={entry.id}>
                  <td>{entry.date}</td>
                  <td>
                    <span className={entry.segment === 'IT_DEV' ? styles.badgeInfo : styles.badgePurple}>
                      {entry.segment === 'IT_DEV' ? 'IT-разработка' : 'E-Commerce'}
                    </span>
                  </td>
                  <td><b>{entry.invoiceNumber}</b></td>
                  <td>{entry.counterpartyName}</td>
                  <td>
                    <b style={{ color: entry.type === 'INCOME' ? '#16a34a' : '#dc2626' }}>
                      {entry.type === 'INCOME' ? '+' : '-'}
                      {entry.amountGross.toFixed(2)} €
                    </b>
                  </td>
                  <td>
                    <button
                      className={`${styles.badge} ${entry.createdInTaxfix ? styles.badgeSuccess : styles.badgeWarning}`}
                      style={{ cursor: 'pointer', border: 'none' }}
                      onClick={() => handleToggleTaxfix(entry.id, 'createdInTaxfix', entry.createdInTaxfix)}
                    >
                      {entry.createdInTaxfix ? '✅ Создано' : '⏳ Ожидает'}
                    </button>
                  </td>
                  <td>
                    <button
                      className={`${styles.badge} ${entry.uploadedToTaxfix ? styles.badgeSuccess : styles.badgeWarning}`}
                      style={{ cursor: 'pointer', border: 'none' }}
                      onClick={() => handleToggleTaxfix(entry.id, 'uploadedToTaxfix', entry.uploadedToTaxfix)}
                    >
                      {entry.uploadedToTaxfix ? '✅ Загружен' : '⏳ Не загружен'}
                    </button>
                  </td>
                  <td>
                    <button
                      className={`${styles.badge} ${entry.paymentLinkedInTaxfix ? styles.badgeSuccess : styles.badgeWarning}`}
                      style={{ cursor: 'pointer', border: 'none' }}
                      onClick={() => handleToggleTaxfix(entry.id, 'paymentLinkedInTaxfix', entry.paymentLinkedInTaxfix)}
                    >
                      {entry.paymentLinkedInTaxfix ? '✅ Слинкован' : '⏳ Не слинкован'}
                    </button>
                  </td>
                  <td>
                    {entry.segment === 'IT_DEV' && (
                      <button
                        className={styles.filterBtn}
                        style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                        onClick={() => handleOpenDoc(entry.id)}
                      >
                        Word / PDF
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Модальное окно просмотра / печати инвойса Word и PDF */}
      {docModalData && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: '840px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0 }}>
                Счет-фактура: {docModalData.entry.invoiceNumber}
              </h3>
              <button
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                onClick={() => setDocModalData(null)}
              >
                <CloseIcon />
              </button>
            </div>

            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem' }}>
              <b>Обязательное требование для Taxfix:</b>
              <p style={{ margin: '4px 0 0 0' }}>
                Данные услуги: <i>{docModalData.taxfixElectronicInvoicePayload.concept}</i>. Сумма: <b>{docModalData.taxfixElectronicInvoicePayload.baseImponibleEur} €</b> (0% VAT ROI/VIES).
                Создайте этот счет в Taxfix для отправки в испанскую государственную систему электронных фактур Verifactu.
              </p>
            </div>

            <div
              style={{
                border: '1px solid #cbd5e1',
                padding: '20px',
                borderRadius: '8px',
                maxHeight: '400px',
                overflowY: 'auto',
                background: '#ffffff',
              }}
              dangerouslySetInnerHTML={{ __html: docModalData.htmlDocument }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button
                className={tableStyles.primaryBtn}
                onClick={() => {
                  const printWin = window.open('', '_blank');
                  if (printWin) {
                    printWin.document.write(docModalData.htmlDocument);
                    printWin.document.close();
                    printWin.focus();
                    printWin.print();
                  }
                }}
              >
                <PrintIcon style={{ fontSize: '1.1rem', marginRight: '6px' }} />
                Печать / Сохранить как PDF
              </button>
              <button
                className={styles.filterBtn}
                onClick={() => {
                  const blob = new Blob([docModalData.htmlDocument], { type: 'application/msword' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = docModalData.wordFileName;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                Скачать Word (.doc)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно добавления новой финансовой записи */}
      {isEntryModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0 }}>Добавить операцию в реестр Autónomo</h3>
              <button
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                onClick={() => setIsEntryModalOpen(false)}
              >
                <CloseIcon />
              </button>
            </div>

            <form onSubmit={handleCreateEntry}>
              <div className={styles.formGrid}>
                <div>
                  <label className={styles.label}>Направление деятельности:</label>
                  <select
                    className={styles.inputField}
                    value={entryForm.segment}
                    onChange={(e) => setEntryForm({ ...entryForm, segment: e.target.value })}
                  >
                    <option value="IT_DEV">IT-разработка (IAE 763 / CNAE 6201)</option>
                    <option value="ECOMMERCE">E-Commerce Amazon (IAE 665 / CNAE 4791)</option>
                    <option value="COMMON_AUTONOMO">Общие расходы Autónomo (RETA / Taxfix)</option>
                  </select>
                </div>

                <div>
                  <label className={styles.label}>Тип операции:</label>
                  <select
                    className={styles.inputField}
                    value={entryForm.type}
                    onChange={(e) => setEntryForm({ ...entryForm, type: e.target.value })}
                  >
                    <option value="INCOME">Доход (Выставленный инвойс)</option>
                    <option value="EXPENSE">Расход (Полученная фактура)</option>
                  </select>
                </div>

                <div>
                  <label className={styles.label}>Дата (YYYY-MM-DD):</label>
                  <input
                    type="date"
                    className={styles.inputField}
                    value={entryForm.date}
                    onChange={(e) => setEntryForm({ ...entryForm, date: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className={styles.label}>Номер инвойса / фактуры:</label>
                  <input
                    type="text"
                    className={styles.inputField}
                    placeholder="Например: FACT-IT-2026-10"
                    value={entryForm.invoiceNumber}
                    onChange={(e) => setEntryForm({ ...entryForm, invoiceNumber: e.target.value })}
                    required
                  />
                </div>

                <div className={styles.formFull}>
                  <label className={styles.label}>Контрагент:</label>
                  <input
                    type="text"
                    className={styles.inputField}
                    placeholder="Название компании или имя клиента"
                    value={entryForm.counterpartyName}
                    onChange={(e) => setEntryForm({ ...entryForm, counterpartyName: e.target.value })}
                    required
                  />
                </div>

                <div className={styles.formFull}>
                  <label className={styles.label}>Описание услуги или товара:</label>
                  <input
                    type="text"
                    className={styles.inputField}
                    placeholder="Описание назначения платежа"
                    value={entryForm.description}
                    onChange={(e) => setEntryForm({ ...entryForm, description: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className={styles.label}>Сумма Netto (€):</label>
                  <input
                    type="number"
                    step="0.01"
                    className={styles.inputField}
                    value={entryForm.amountNetto}
                    onChange={(e) => setEntryForm({ ...entryForm, amountNetto: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>

                <div>
                  <label className={styles.label}>Ставка НДС (IVA %):</label>
                  <select
                    className={styles.inputField}
                    value={entryForm.vatRate}
                    onChange={(e) => setEntryForm({ ...entryForm, vatRate: parseInt(e.target.value) || 0 })}
                  >
                    <option value={0}>0% (B2B Intra-EU / Reverse Charge)</option>
                    <option value={21}>21% (Стандартная ставка в Испании)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
                <button
                  type="button"
                  className={styles.filterBtn}
                  onClick={() => setIsEntryModalOpen(false)}
                >
                  Отмена
                </button>
                <button type="submit" className={tableStyles.primaryBtn}>
                  Сохранить запись
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

