// ecommerce/crm/app/login/page.tsx
// Страница авторизации в панели управления Viasglobal E-Commerce CRM & WMS
'use client';

import React, { useState } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import styles from './login.module.css';

export default function LoginPage() {
  // Состояние введенного пароля
  const [password, setPassword] = useState('');
  // Состояние индикатора загрузки
  const [loading, setLoading] = useState(false);
  // Сообщение об ошибке входа
  const [error, setError] = useState<string | null>(null);

  // Отправка формы входа
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || loading) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: password.trim() }),
      });

      const json = (await response.json()) as { success: boolean; error?: string };

      if (!response.ok || !json.success) {
        setError(json.error || 'Неверный пароль. Доступ запрещен.');
        return;
      }

      // При успешной авторизации переходим на дашборд
      window.location.href = '/';
    } catch {
      setError('Ошибка сети при входе. Попробуйте еще раз.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <Card className={styles.loginCard}>
        <CardContent>
          <div className={styles.brandHeader}>
            <LockOutlinedIcon className={styles.brandIcon} />
            <h1 className={styles.brandTitle}>Viasglobal CRM</h1>
          </div>
          <Typography className={styles.subtitle}>
            Система управления товарами Amazon Wholesale, поставщиками B2B, складом СВХ/MAIN и юнит-экономикой.
          </Typography>

          {error && (
            <Alert severity="error" className={styles.errorAlert}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className={styles.form}>
            <TextField
              className={styles.inputField}
              type="password"
              label="Пароль администратора"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              autoFocus
              variant="outlined"
            />
            <Button
              className={styles.submitButton}
              type="submit"
              variant="contained"
              fullWidth
              disabled={!password.trim() || loading}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Войти в CRM'
              )}
            </Button>
          </form>

          <p className={styles.footerNote}>
            Viasglobal E-Commerce Infrastructure &copy; 2026
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

