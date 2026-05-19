'use client';

import { useState, useMemo } from 'react';
import { useStore, Mutasi } from '@/lib/store';
import { formatRupiah, formatDate, generateId } from '@/lib/utils';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Search, ArrowRight, CircleArrowUp as ArrowUpCircle, CircleArrowDown as ArrowDownCircle, ArrowDownToLine, ArrowUpFromLine, Cog, TrendingUp, ArrowLeftRight, MoveHorizontal as MoreHorizontal, Wallet, Receipt, HandCoins, Banknote, CreditCard, PiggyBank, CircleDollarSign, BadgeDollarSign, Coins, DollarSign } from 'lucide-react';
import Link from 'next/link';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  ArrowDownToLine, ArrowUpFromLine, Cog, TrendingUp, ArrowLeftRight,
  MoreHorizontal, Wallet, Receipt, HandCoins, Banknote,
  CreditCard, PiggyBank, CircleDollarSign, BadgeDollarSign, Coins, DollarSign,
};

export default function MutasiPage() {
  const {
    mutasi, coa, jurnal, kategoriMutasi,
    addMutasi, updateMutasi, deleteMutasi,
  } = useStore();

  const [search, setSearch] = useState('');
  const [akunFilter, setAkunFilter] = useState('all');
  const [mutasiOpen, setMutasiOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    tgl: new Date().toISOString().split('T')[0],
    desc: '', akunKas: '', katTransaksi: '', tipe: 'masuk' as 'masuk' | 'keluar', nominal: '',
  });

  const kasAccounts = coa.filter((c) => c.kategori2 === 'Kas & Setara Kas');

  const filtered = useMemo(() => {
    return mutasi.filter((m) => {
      const matchSearch = m.desc.toLowerCase().includes(search.toLowerCase()) || m.akunKas.includes(search) || m.katTransaksi.toLowerCase().includes(search.toLowerCase());
      const matchAkun = akunFilter === 'all' || m.akunKas === akunFilter;
      return matchSearch && matchAkun;
    });
  }, [mutasi, search, akunFilter]);

  const saldoInfo = useMemo(() => {
    if (akunFilter === 'all') {
      let total = 0;
      jurnal.forEach((j) => { j.lines.forEach((l) => { const akun = coa.find((c) => c.kode === l.kodeAkun); if (!akun || akun.kategori2 !== 'Kas & Setara Kas') return; if (akun.saldoNormal === 'Debit') total += l.debit - l.kredit; else total += l.kredit - l.debit; }); });
      return { label: 'Total Saldo Kas & Bank', value: total };
    }
    const akun = coa.find((c) => c.kode === akunFilter);
    if (!akun) return { label: 'Saldo', value: 0 };
    let total = 0;
    jurnal.forEach((j) => { j.lines.forEach((l) => { if (l.kodeAkun !== akunFilter) return; if (akun.saldoNormal === 'Debit') total += l.debit - l.kredit; else total += l.kredit - l.debit; }); });
    return { label: `Saldo ${akun.nama}`, value: total };
  }, [akunFilter, coa, jurnal]);

  const totalMasuk = filtered.filter((m) => m.tipe === 'masuk').reduce((a, m) => a + m.nominal, 0);
  const totalKeluar = filtered.filter((m) => m.tipe === 'keluar').reduce((a, m) => a + m.nominal, 0);

  const openAdd = () => { setForm({ tgl: new Date().toISOString().split('T')[0], desc: '', akunKas: '', katTransaksi: '', tipe: 'masuk', nominal: '' }); setEditId(null); setMutasiOpen(true); };
  const openEdit = (m: Mutasi) => { setForm({ tgl: m.tgl, desc: m.desc, akunKas: m.akunKas, katTransaksi: m.katTransaksi, tipe: m.tipe, nominal: m.nominal.toString() }); setEditId(m.id); setMutasiOpen(true); };

  const handleSubmit = () => {
    if (!form.tgl || !form.desc || !form.akunKas || !form.katTransaksi || !form.nominal) return;
    const nominal = parseFloat(form.nominal);
    if (editId) void updateMutasi(editId, { tgl: form.tgl, desc: form.desc, akunKas: form.akunKas, katTransaksi: form.katTransaksi, tipe: form.tipe, nominal });
    else void addMutasi({ id: generateId('MT'), tgl: form.tgl, desc: form.desc, akunKas: form.akunKas, katTransaksi: form.katTransaksi, tipe: form.tipe, nominal, status: 'PENDING' });
    setMutasiOpen(false);
  };

  const getKatIcon = (iconName: string) => ICON_MAP[iconName] ?? MoreHorizontal;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Mutasi Kas / Bank</h1><p className="text-muted-foreground text-sm mt-1">Riwayat transaksi kas masuk dan keluar</p></div>
        <Button onClick={openAdd} className="gap-2"><Plus className="w-4 h-4" /> Tambah Mutasi</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="shadow-sm border-blue-200 dark:border-blue-800">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center"><Wallet className="w-5 h-5 text-blue-600" /></div>
            <div><p className="text-xs text-muted-foreground">{saldoInfo.label}</p><p className="text-lg font-bold text-blue-600">{formatRupiah(saldoInfo.value)}</p></div>
          </CardContent>
        </Card>
        <Card className="shadow-sm"><CardContent className="p-4 flex items-center gap-3"><ArrowUpCircle className="w-8 h-8 text-emerald-600" /><div><p className="text-xs text-muted-foreground">Total Masuk</p><p className="text-lg font-bold text-emerald-600">{formatRupiah(totalMasuk)}</p></div></CardContent></Card>
        <Card className="shadow-sm"><CardContent className="p-4 flex items-center gap-3"><ArrowDownCircle className="w-8 h-8 text-red-500" /><div><p className="text-xs text-muted-foreground">Total Keluar</p><p className="text-lg font-bold text-red-500">{formatRupiah(totalKeluar)}</p></div></CardContent></Card>
        <Card className="shadow-sm"><CardContent className="p-4 flex items-center gap-3">{(totalMasuk - totalKeluar) >= 0 ? <ArrowUpCircle className="w-8 h-8 text-blue-600" /> : <ArrowDownCircle className="w-8 h-8 text-red-500" />}<div><p className="text-xs text-muted-foreground">Net Arus Kas</p><p className={`text-lg font-bold ${(totalMasuk - totalKeluar) >= 0 ? 'text-blue-600' : 'text-red-500'}`}>{formatRupiah(totalMasuk - totalKeluar)}</p></div></CardContent></Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Cari mutasi..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
            </div>
            <Select value={akunFilter} onValueChange={setAkunFilter}>
              <SelectTrigger className="h-9 w-48"><SelectValue placeholder="Filter Akun..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Akun Kas/Bank</SelectItem>
                {kasAccounts.map((c) => <SelectItem key={c.kode} value={c.kode}>{c.kode} - {c.nama}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-xs text-muted-foreground border-b border-border">
                  {['ID', 'Tanggal', 'Deskripsi', 'Akun Kas', 'Kategori', 'Tipe', 'Nominal', 'Status', 'Aksi'].map((h) => (
                    <th key={h} className="text-left py-3 px-4 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={9} className="py-12 text-center text-muted-foreground">Tidak ada data mutasi</td></tr>
                ) : filtered.map((m) => {
                  const katObj = kategoriMutasi.find((k) => k.nama === m.katTransaksi);
                  const KatIcon = katObj ? getKatIcon(katObj.iconName) : null;
                  return (
                    <tr key={m.id} className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${m.status === 'PENDING' ? 'bg-amber-50/30 dark:bg-amber-900/5' : ''}`}>
                      <td className="py-3 px-4 font-mono text-xs text-primary">{m.id}</td>
                      <td className="py-3 px-4 whitespace-nowrap">{formatDate(m.tgl)}</td>
                      <td className="py-3 px-4 max-w-[200px] truncate">{m.desc}</td>
                      <td className="py-3 px-4 text-xs">{coa.find((c) => c.kode === m.akunKas)?.nama ?? m.akunKas}</td>
                      <td className="py-3 px-4"><span className="inline-flex items-center gap-1.5 text-xs">{KatIcon && <KatIcon className="w-3.5 h-3.5 text-muted-foreground" />}{m.katTransaksi}</span></td>
                      <td className="py-3 px-4"><Badge variant={m.tipe === 'masuk' ? 'default' : 'destructive'} className={m.tipe === 'masuk' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400'}>{m.tipe === 'masuk' ? '▲ Masuk' : '▼ Keluar'}</Badge></td>
                      <td className={`py-3 px-4 font-semibold whitespace-nowrap ${m.tipe === 'masuk' ? 'text-emerald-600' : 'text-red-500'}`}>{m.tipe === 'masuk' ? '+' : '-'}{formatRupiah(m.nominal)}</td>
                      <td className="py-3 px-4"><Badge variant="outline" className={m.status === 'DONE' ? 'border-emerald-500 text-emerald-600' : 'border-amber-500 text-amber-600'}>{m.status}</Badge></td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(m)}><Pencil className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteId(m.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={mutasiOpen} onOpenChange={setMutasiOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editId ? 'Edit Mutasi Kas/Bank' : 'Tambah Mutasi Kas/Bank'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Tanggal</Label><Input type="date" value={form.tgl} onChange={(e) => setForm({ ...form, tgl: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Tipe Transaksi</Label><Select value={form.tipe} onValueChange={(v) => setForm({ ...form, tipe: v as 'masuk' | 'keluar' })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="masuk">Kas Masuk</SelectItem><SelectItem value="keluar">Kas Keluar</SelectItem></SelectContent></Select></div>
            </div>
            <div className="space-y-1.5"><Label>Deskripsi</Label><Input placeholder="Keterangan transaksi" value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Akun Kas/Bank</Label><Select value={form.akunKas} onValueChange={(v) => setForm({ ...form, akunKas: v })}><SelectTrigger><SelectValue placeholder="Pilih akun..." /></SelectTrigger><SelectContent>{kasAccounts.map((c) => <SelectItem key={c.kode} value={c.kode}>{c.kode} - {c.nama}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between"><Label>Kategori Transaksi</Label><Link href="/kategori-mutasi" className="h-6 gap-1 text-xs text-muted-foreground hover:text-primary flex items-center"><ArrowRight className="w-3 h-3" /> Kelola</Link></div>
              <Select value={form.katTransaksi} onValueChange={(v) => setForm({ ...form, katTransaksi: v })}>
                <SelectTrigger><SelectValue placeholder="Pilih kategori..." /></SelectTrigger>
                <SelectContent>{kategoriMutasi.map((k) => { const Icon = getKatIcon(k.iconName); return <SelectItem key={k.id} value={k.nama}><span className="inline-flex items-center gap-2"><Icon className="w-3.5 h-3.5" /> {k.nama}</span></SelectItem>; })}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Nominal (Rp)</Label><Input type="number" placeholder="0" min="0" value={form.nominal} onChange={(e) => setForm({ ...form, nominal: e.target.value })} /></div>
            {!editId && <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-md">Status mutasi akan otomatis menjadi PENDING dan perlu diproses di halaman Pending Jurnal.</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMutasiOpen(false)}>Batal</Button>
            <Button onClick={handleSubmit} disabled={!form.tgl || !form.desc || !form.akunKas || !form.katTransaksi || !form.nominal}>{editId ? 'Simpan Perubahan' : 'Simpan'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Hapus Mutasi?</AlertDialogTitle><AlertDialogDescription>Mutasi {deleteId} akan dihapus permanen.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Batal</AlertDialogCancel><AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => { void deleteMutasi(deleteId!); setDeleteId(null); }}>Hapus</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
