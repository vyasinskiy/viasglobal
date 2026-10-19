'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Card, TextField, Button, Typography, Alert } from '@mui/material';
import { useAuth } from '@/lib/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const err = await login(email, password);
    setLoading(false);
    if (err) { setError(err); return; }
    router.push('/dashboard');
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#e8eaf6' }}>
      <Card sx={{ p: 4, width: 400, maxWidth: '90vw' }}>
        <Typography variant="h5" fontWeight={700} mb={1} textAlign="center">Viasglobal CRM</Typography>
        <Typography variant="body2" color="text.secondary" mb={3} textAlign="center">Войдите в систему управления</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <form onSubmit={handleSubmit}>
          <TextField fullWidth label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} sx={{ mb: 2 }} required />
          <TextField fullWidth label="Пароль" type="password" value={password} onChange={e => setPassword(e.target.value)} sx={{ mb: 3 }} required />
          <Button fullWidth type="submit" variant="contained" size="large" disabled={loading}>
            {loading ? 'Вход...' : 'Войти'}
          </Button>
        </form>
      </Card>
    </Box>
  );
}