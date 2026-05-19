'use client';

import { useMemo } from 'react';
import { useStore } from '@/lib/store';
import { formatRupiah, formatDate, MONTHS, getMonthFromStr } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { TrendingUp, TrendingDown, Wallet, Landmark, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4'];

export default function DashboardPage() {
  const { coa, jurnal } = useStore();

  const stats = useMemo(() => {
    const saldo: Record<string, number> = {};
    jurnal.forEach((j) => {
      j.lines.forEach((l) => {
        const akun = coa.find((c) => c.kode === l.kodeAkun);
        if (!akun) return;
        if (!saldo[l.kodeAkun]) saldo[l.kodeAkun] = 0;
        if (akun.saldoNormal === 'Debit') {
          saldo[l.kodeAkun] += l.debit - l.kredit;
        } else {
          saldo[l.kodeAkun] += l.kredit - l.debit;
        }
      });
    });

    let totalAktiva = 0, totalKewajiban = 0, totalKas = 0;
    coa.forEach((c) => {
      const s = saldo[c.kode] ?? 0;
      if (c.tipe === 'Aktiva') totalAktiva += s;
      if (c.tipe === 'Kewajiban') totalKewajiban += s;
      if (c.kategori2 === 'Kas & Setara Kas') totalKas += s;
    });
    const ekuitas = totalAktiva - totalKewajiban;
    return { totalAktiva, totalKewajiban, ekuitas, totalKas };
  }, [jurnal, coa]);

  const monthlyData = useMemo(() => {
    const data: Record<number, { pendapatan: number; beban: number }> = {};
    for (let i = 1; i <= 12; i++) data[i] = { pendapatan: 0, beban: 0 };
    jurnal.forEach((j) => {
      const m = getMonthFromStr(j.tgl);
      j.lines.forEach((l) => {
        const akun = coa.find((c) => c.kode === l.kodeAkun);
        if (!akun) return;
        if (akun.tipe === 'Pendapatan') data[m].pendapatan += l.kredit - l.debit;
        if (akun.tipe === 'Beban') data[m].beban += l.debit - l.kredit;
      });
    });
    return Object.entries(data)
      .filter(([, v]) => v.pendapatan > 0 || v.beban > 0)
      .map(([m, v]) => ({
        name: MONTHS[+m - 1].substring(0, 3),
        Pendapatan: v.pendapatan,
        Beban: v.beban,
        Laba: v.pendapatan - v.beban,
      }));
  }, [jurnal, coa]);

  const asetData = useMemo(() => {
    const saldo: Record<string, number> = {};
    jurnal.forEach((j) => {
      j.lines.forEach((l) => {
        const akun = coa.find((c) => c.kode === l.kodeAkun);
        if (!akun || akun.tipe !== 'Aktiva') return;
        if (!saldo[l.kodeAkun]) saldo[l.kodeAkun] = 0;
        if (akun.saldoNormal === 'Debit') saldo[l.kodeAkun] += l.debit - l.kredit;
        else saldo[l.kodeAkun] += l.kredit - l.debit;
      });
    });
    return Object.entries(saldo)
      .filter(([, v]) => v > 0)
      .map(([kode, v]) => ({
        name: coa.find((c) => c.kode === kode)?.nama ?? kode,
        value: v,
      }))
      .slice(0, 5);
  }, [jurnal, coa]);

  const recentJurnal = [...jurnal].sort((a, b) => b.tgl.localeCompare(a.tgl)).slice(0, 5);

  const statCards = [
    {
      title: 'Total Aktiva',
      value: formatRupiah(stats.totalAktiva),
      icon: Landmark,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      trend: '+5.2%',
      up: true,
    },
    {
      title: 'Total Kewajiban',
      value: formatRupiah(stats.totalKewajiban),
      icon: TrendingDown,
      color: 'text-red-500',
      bg: 'bg-red-50 dark:bg-red-900/20',
      trend: '+1.1%',
      up: false,
    },
    {
      title: 'Ekuitas Bersih',
      value: formatRupiah(stats.ekuitas),
      icon: TrendingUp,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      trend: '+8.4%',
      up: true,
    },
    {
      title: 'Total Kas',
      value: formatRupiah(stats.totalKas),
      icon: Wallet,
      color: 'text-amber-600',
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      trend: '+3.7%',
      up: true,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Ringkasan keuangan perusahaan Anda</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.title} className="border shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{s.title}</p>
                  <div className={`w-9 h-9 ${s.bg} rounded-lg flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${s.color}`} />
                  </div>
                </div>
                <p className="text-xl font-bold text-foreground">{s.value}</p>
                <p className={`text-xs mt-1 ${s.up ? 'text-emerald-600' : 'text-red-500'}`}>
                  {s.trend} dari bulan lalu
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Bar Chart */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Laba / Rugi per Bulan</CardTitle>
            <CardDescription className="text-xs">Perbandingan pendapatan vs beban</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `${(v / 1e6).toFixed(0)}jt`} />
                <Tooltip formatter={(v: number) => formatRupiah(v)} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Pendapatan" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Beban" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Komposisi Aset</CardTitle>
            <CardDescription className="text-xs">Distribusi nilai aset</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={asetData} cx="50%" cy="45%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name.slice(0, 8)} ${(percent * 100).toFixed(0)}%`} labelLine={false} style={{ fontSize: 10 }}>
                  {asetData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatRupiah(v)} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Line Chart */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Tren Pendapatan vs Beban</CardTitle>
          <CardDescription className="text-xs">Perkembangan bulanan sepanjang tahun</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthlyData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `${(v / 1e6).toFixed(0)}jt`} />
              <Tooltip formatter={(v: number) => formatRupiah(v)} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="Pendapatan" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="Beban" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Journals */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-base">Aktivitas Jurnal Terbaru</CardTitle>
            <CardDescription className="text-xs">5 jurnal terakhir yang dicatat</CardDescription>
          </div>
          <Link href="/jurnal" className="text-xs text-primary flex items-center gap-1 hover:underline">
            Lihat Semua <ArrowRight className="w-3 h-3" />
          </Link>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="text-left py-2 px-3 font-medium">ID</th>
                  <th className="text-left py-2 px-3 font-medium">Tanggal</th>
                  <th className="text-left py-2 px-3 font-medium">Deskripsi</th>
                  <th className="text-right py-2 px-3 font-medium">Total Debit</th>
                </tr>
              </thead>
              <tbody>
                {recentJurnal.map((j) => {
                  const totalDebit = j.lines.reduce((a, l) => a + l.debit, 0);
                  return (
                    <tr key={j.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-xs text-primary">{j.id}</td>
                      <td className="py-2.5 px-3 text-muted-foreground">{formatDate(j.tgl)}</td>
                      <td className="py-2.5 px-3 font-medium">{j.desc}</td>
                      <td className="py-2.5 px-3 text-right font-semibold">{formatRupiah(totalDebit)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
