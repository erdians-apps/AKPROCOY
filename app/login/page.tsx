'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const login = useStore((s) => s.login);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const success = await login(email, password);
    setIsLoading(false);
    if (success) router.push('/dashboard');
  };

  return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <form onSubmit={handleLogin} className="w-full max-w-sm p-8 bg-white rounded-xl shadow-lg space-y-4">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Akuntansi Pro</h1>
          <p className="text-slate-500 text-sm">Masuk ke akun Anda</p>
        </div>
        <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <Button type="submit" className="w-full bg-blue-600" disabled={isLoading}>
          {isLoading ? 'Authenticating...' : 'Login'}
        </Button>
        <div className="text-center mt-4 text-sm text-slate-500">
          Belum punya akun? <Link href="/register" className="text-blue-600 font-semibold hover:underline">Daftar sekarang</Link>
        </div>
      </form>
    </div>
  );
}