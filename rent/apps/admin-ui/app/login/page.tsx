// rent/apps/admin-ui/app/login/page.tsx
// Страница входа в панель администратора по паролю
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
  // Состояние процесса отправки запроса
  const [loading, setLoading] = useState(false);
  // Сообщение об ошибке авторизации
  const [error, setError] = useState<string | null>(null);

  // Обработчик отправки формы
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || loading) return;

    setLoading(true);
    setError(null);

    try {
      // Отправляем POST запрос с паролем на API авторизации
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

      // При успешном входе перенаправляем на главную страницу
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
            <h1 className={styles.brandTitle}>Accruals Admin</h1>
          </div>
          <Typography className={styles.subtitle}>
            Система учета коммунальных начислений и аренды. Введите пароль для входа.
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
                'Войти'
              )}
            </Button>
          </form>

          <p className={styles.footerNote}>
            Viasglobal Infrastructure &copy; 2026
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
