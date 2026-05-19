'use client';

import { useState } from 'react';
import { useStore, COA, AkunTipe, SaldoNormal, KategoriAkun } from '@/lib/store';
import { generateId } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Search, Settings2, ChevronUp, ChevronDown } from 'lucide-react';

const TIPE_OPTIONS: AkunTipe[] = ['Aktiva', 'Kewajiban', 'Ekuitas', 'Pendapatan', 'Beban'];
const SALDO_OPTIONS: SaldoNormal[] = ['Debit', 'Kredit'];
const TIPE_COLOR: Record<AkunTipe, string> = {
  Aktiva: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  Kewajiban: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  Ekuitas: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  Pendapatan: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
  Beban: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
};

const emptyCOA: COA = { kode: '', nama: '', tipe: 'Aktiva', kategori2: '', saldoNormal: 'Debit' };
const emptyKat: Omit<KategoriAkun, 'id'> = { nama: '', tipe: 'Aktiva', urutan: 0 };

export default function CoaPage() {
  const { 
    coa, kategoriAkun, addCOA, updateCOA, deleteCOA, 
    addKategoriAkun, updateKategoriAkun, deleteKategoriAkun, moveKategoriAkun 
  } = useStore();
  
  const [open, setOpen] = useState(false);
  const [katOpen, setKatOpen] = useState(false);
  const [editKode, setEditKode] = useState<string | null>(null);
  const [deleteKode, setDeleteKode] = useState<string | null>(null);
  const [form, setForm] = useState<COA>(emptyCOA);
  const [search, setSearch] = useState('');
  const [filterTipe, setFilterTipe] = useState<string>('all');
  const [katEditId, setKatEditId] = useState<string | null>(null);
  const [katDeleteId, setKatDeleteId] = useState<string | null>(null);
  const [katForm, setKatForm] = useState<Omit<KategoriAkun, 'id'>>(emptyKat);

  const filtered = coa.filter((c) => {
    const matchSearch = c.kode.toLowerCase().includes(search.toLowerCase()) || c.nama.toLowerCase().includes(search.toLowerCase());
    const matchTipe = filterTipe === 'all' || c.tipe === filterTipe;
    return matchSearch && matchTipe;
  });

  const filteredKategori = kategoriAkun.filter((k) => k.tipe === form.tipe);

  const openAdd = () => { setForm({ ...emptyCOA, kategori2: '' }); setEditKode(null); setOpen(true); };
  const openEdit = (c: COA) => { setForm({ ...c }); setEditKode(c.kode); setOpen(true); };

  const handleTipeChange = (tipe: AkunTipe) => {
    const sn: SaldoNormal = ['Aktiva', 'Beban'].includes(tipe) ? 'Debit' : 'Kredit';
    const kats = kategoriAkun.filter((k) => k.tipe === tipe);
    const katMatch = kats.find((k) => k.nama === form.kategori2);
    setForm({ ...form, tipe, saldoNormal: sn, kategori2: katMatch ? form.kategori2 : '' });
  };

  const handleSubmit = () => {
    if (!form.kode || !form.nama || !form.kategori2) return;
    if (editKode) void updateCOA(editKode, form);
    else void addCOA(form);
    setOpen(false);
  };

  const openKatAdd = () => { setKatForm(emptyKat); setKatEditId(null); setKatOpen(true); };
  const openKatEdit = (k: KategoriAkun) => { setKatForm({ nama: k.nama, tipe: k.tipe, urutan: k.urutan }); setKatEditId(k.id); setKatOpen(true); };
  
  const handleKatSubmit = () => {
    if (!katForm.nama) return;
    if (katEditId) {
      void updateKategoriAkun(katEditId, { id: katEditId, ...katForm });
    } else {
      // Auto-assign urutan terakhir
      const tipeKats = kategoriAkun.filter(k => k.tipe === katForm.tipe);
      const maxUrutan = tipeKats.length > 0 ? Math.max(...tipeKats.map(k => k.urutan || 0)) : 0;
      void addKategoriAkun({ id: generateId('KA'), ...katForm, urutan: maxUrutan + 1 });
    }
    setKatOpen(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Chart of Accounts</h1>
          <p className="text-muted-foreground text-sm mt-1">Daftar akun keuangan perusahaan</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={openKatAdd} className="gap-2"><Settings2 className="w-4 h-4" /> Kelola Kategori</Button>
          <Button onClick={openAdd} className="gap-2"><Plus className="w-4 h-4" /> Tambah Akun</Button>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Cari akun..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 w-64" />
        </div>
        <Select value={filterTipe} onValueChange={setFilterTipe}>
          <SelectTrigger className="w-40 h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Tipe</SelectItem>
            {TIPE_OPTIONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-xs text-muted-foreground border-b border-border">
                  {['Kode', 'Nama Akun', 'Tipe', 'Kategori', 'Saldo Normal', 'Aksi'].map((h) => (
                    <th key={h} className="text-left py-3 px-4 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="py-12 text-center text-muted-foreground">Tidak ada akun ditemukan</td></tr>
                ) : filtered.sort((a, b) => a.kode.localeCompare(b.kode)).map((c) => (
                  <tr key={c.kode} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-2.5 px-4 font-mono text-xs font-semibold text-primary">{c.kode}</td>
                    <td className="py-2.5 px-4 font-medium">{c.nama}</td>
                    <td className="py-2.5 px-4"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TIPE_COLOR[c.tipe]}`}>{c.tipe}</span></td>
                    <td className="py-2.5 px-4 text-muted-foreground text-xs">{c.kategori2}</td>
                    <td className="py-2.5 px-4"><Badge variant="outline" className={c.saldoNormal === 'Debit' ? 'border-blue-400 text-blue-600' : 'border-orange-400 text-orange-600'}>{c.saldoNormal}</Badge></td>
                    <td className="py-2.5 px-4">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)}><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteKode(c.kode)}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editKode ? 'Edit Akun' : 'Tambah Akun Baru'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Kode Akun <span className="text-destructive">*</span></Label>
                <Input placeholder="cth: 1-1001" value={form.kode} onChange={(e) => setForm({ ...form, kode: e.target.value })} disabled={!!editKode} />
              </div>
              <div className="space-y-1.5">
                <Label>Tipe Akun</Label>
                <Select value={form.tipe} onValueChange={(v) => handleTipeChange(v as AkunTipe)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TIPE_OPTIONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Nama Akun <span className="text-destructive">*</span></Label>
              <Input placeholder="Nama akun lengkap" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Kategori Akun <span className="text-destructive">*</span></Label>
              <Select value={form.kategori2} onValueChange={(v) => setForm({ ...form, kategori2: v })}>
                <SelectTrigger><SelectValue placeholder="Pilih kategori..." /></SelectTrigger>
                <SelectContent>
                  {filteredKategori.sort((a,b) => (a.urutan || 0) - (b.urutan || 0)).map((k) => (
                    <SelectItem key={k.id} value={k.nama}>{k.nama} ({k.tipe})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {filteredKategori.length === 0 && <p className="text-xs text-muted-foreground">Tidak ada kategori untuk tipe &quot;{form.tipe}&quot;. Tambahkan melalui &quot;Kelola Kategori&quot;.</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Saldo Normal</Label>
              <Select value={form.saldoNormal} onValueChange={(v) => setForm({ ...form, saldoNormal: v as SaldoNormal })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{SALDO_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button onClick={handleSubmit} disabled={!form.kode || !form.nama || !form.kategori2}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={katOpen} onOpenChange={setKatOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Kelola Kategori Akun</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {[...kategoriAkun].sort((a, b) => (a.urutan || 0) - (b.urutan || 0)).map((k) => (
              <div key={k.id} className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded-lg group">
                <span className="inline-flex items-center gap-2 text-sm">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TIPE_COLOR[k.tipe]}`}>{k.tipe}</span> {k.nama}
                </span>
                <div className="flex gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                  {/* Tombol Pindah Posisi / Sorting Cepat */}
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveKategoriAkun(k.id, 'up')}><ChevronUp className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveKategoriAkun(k.id, 'down')}><ChevronDown className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6 ml-2" onClick={() => openKatEdit(k)}><Pencil className="w-3 h-3" /></Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => setKatDeleteId(k.id)}><Trash2 className="w-3 h-3" /></Button>
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-4 py-2 border-t border-border pt-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{katEditId ? 'Edit Kategori' : 'Tambah Kategori Baru'}</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Nama Kategori</Label><Input placeholder="cth: Aset Lancar" value={katForm.nama} onChange={(e) => setKatForm({ ...katForm, nama: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Tipe Akun</Label><Select value={katForm.tipe} onValueChange={(v) => setKatForm({ ...katForm, tipe: v as AkunTipe })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TIPE_OPTIONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
            </div>
          </div>
          <DialogFooter>
            {katEditId && <Button variant="outline" onClick={() => { setKatEditId(null); setKatForm(emptyKat); }}>Batal Edit</Button>}
            <Button onClick={handleKatSubmit} disabled={!katForm.nama}>{katEditId ? 'Simpan Perubahan' : 'Tambah Kategori'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteKode} onOpenChange={(o) => { if (!o) setDeleteKode(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Hapus Akun?</AlertDialogTitle><AlertDialogDescription>Akun &quot;{coa.find((c) => c.kode === deleteKode)?.nama}&quot; akan dihapus permanen.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Batal</AlertDialogCancel><AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => { void deleteCOA(deleteKode!); setDeleteKode(null); }}>Hapus</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!katDeleteId} onOpenChange={(o) => { if (!o) setKatDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Hapus Kategori?</AlertDialogTitle><AlertDialogDescription>Kategori &quot;{kategoriAkun.find((k) => k.id === katDeleteId)?.nama}&quot; akan dihapus.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Batal</AlertDialogCancel><AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => { void deleteKategoriAkun(katDeleteId!); setKatDeleteId(null); }}>Hapus</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}