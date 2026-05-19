'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import Link from 'next/link';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // 1. Daftarkan di Supabase Auth
    const { data, error } = await supabase.auth.signUp({ email, password });
    
    if (error) {
      toast.error(error.message);
      setIsLoading(false);
      return;
    }

    // 2. Simpan ke tabel metadata user kita
    if (data.user) {
      await supabase.from('app_users').insert({
        id: data.user.id,
        email: data.user.email,
        role: 'user',
        is_approved: false, // Wajib menunggu ACC developer
        permissions: ['Dashboard'] // Akses default minimal
      });
      
      toast.success('Pendaftaran Berhasil!', { 
        description: 'Akun sedang ditinjau oleh Developer, mohon tunggu.' 
      });
      
      // Alihkan ke halaman login
      setTimeout(() => router.push('/login'), 2000);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <form onSubmit={handleRegister} className="w-full max-w-sm p-8 bg-white rounded-xl shadow-lg space-y-4">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Daftar Akun</h1>
          <p className="text-slate-500 text-sm">Buat akun Akuntansi Pro Anda</p>
        </div>
        <Input type="email" placeholder="Email aktif" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input type="password" placeholder="Password min. 6 karakter" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <Button type="submit" className="w-full bg-blue-600" disabled={isLoading}>
          {isLoading ? 'Memproses...' : 'Daftar Sekarang'}
        </Button>
        <div className="text-center mt-4 text-sm text-slate-500">
          Sudah punya akun? <Link href="/login" className="text-blue-600 font-semibold hover:underline">Login di sini</Link>
        </div>
      </form>
    </div>
  );
}