'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';

export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();

  if (typeof window !== 'undefined') {
    router.replace(user ? '/dashboard' : '/login');
  }
  return null;
}