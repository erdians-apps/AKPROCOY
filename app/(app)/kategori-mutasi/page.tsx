'use client';

import { useState } from 'react';
import { useStore, KategoriMutasi } from '@/lib/store';
import { generateId } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, ArrowDownToLine, ArrowUpFromLine, Cog, TrendingUp, ArrowLeftRight, MoveHorizontal as MoreHorizontal, Wallet, Receipt, HandCoins, Banknote, CreditCard, PiggyBank, CircleDollarSign, BadgeDollarSign, Coins, DollarSign, Tags } from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  ArrowDownToLine, ArrowUpFromLine, Cog, TrendingUp, ArrowLeftRight,
  MoreHorizontal, Wallet, Receipt, HandCoins, Banknote,
  CreditCard, PiggyBank, CircleDollarSign, BadgeDollarSign, Coins, DollarSign,
};
const ICON_OPTIONS = Object.keys(ICON_MAP);
const emptyKat: Omit<KategoriMutasi, 'id'> = { nama: '', iconName: 'MoreHorizontal' };

export default function KategoriMutasiPage() {
  const { kategoriMutasi, addKategoriMutasi, updateKategoriMutasi, deleteKategoriMutasi } = useStore();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<KategoriMutasi, 'id'>>(emptyKat);

  const getKatIcon = (iconName: string) => ICON_MAP[iconName] ?? MoreHorizontal;

  const openAdd = () => { setForm({ ...emptyKat }); setEditId(null); setOpen(true); };
  const openEdit = (k: KategoriMutasi) => { setForm({ nama: k.nama, iconName: k.iconName }); setEditId(k.id); setOpen(true); };

  const handleSubmit = () => {
    if (!form.nama) return;
    if (editId) void updateKategoriMutasi(editId, { id: editId, ...form });
    else void addKategoriMutasi({ id: generateId('KM'), ...form });
    setOpen(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kategori Mutasi</h1>
          <p className="text-muted-foreground text-sm mt-1">Kelola kategori transaksi kas masuk dan keluar</p>
        </div>
        <Button onClick={openAdd} className="gap-2"><Plus className="w-4 h-4" /> Tambah Kategori</Button>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Tags className="w-4 h-4 text-muted-foreground" />
            <CardTitle className="text-sm">Daftar Kategori Mutasi</CardTitle>
            <CardDescription className="text-xs ml-auto">{kategoriMutasi.length} kategori</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-xs text-muted-foreground border-b border-border">
                  {['Icon', 'Nama Kategori', 'Aksi'].map((h) => (
                    <th key={h} className="text-left py-3 px-4 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {kategoriMutasi.length === 0 ? (
                  <tr><td colSpan={3} className="py-12 text-center text-muted-foreground">Tidak ada kategori mutasi</td></tr>
                ) : kategoriMutasi.map((k) => {
                  const Icon = getKatIcon(k.iconName);
                  return (
                    <tr key={k.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="w-8 h-8 bg-muted/50 rounded-lg flex items-center justify-center">
                          <Icon className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium">{k.nama}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(k)}><Pencil className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteId(k.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editId ? 'Edit Kategori Mutasi' : 'Tambah Kategori Mutasi'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nama Kategori <span className="text-destructive">*</span></Label>
              <Input placeholder="cth: Penerimaan" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Pilih Icon</Label>
              <div className="grid grid-cols-8 gap-1.5">
                {ICON_OPTIONS.map((name) => {
                  const Icon = ICON_MAP[name];
                  const selected = form.iconName === name;
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setForm({ ...form, iconName: name })}
                      className={`w-9 h-9 rounded-lg flex items-center justify-center border-2 transition-all ${
                        selected
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-muted-foreground/50 text-muted-foreground'
                      }`}
                      title={name}
                    >
                      <Icon className="w-4 h-4" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            {editId && <Button variant="outline" onClick={() => { setEditId(null); setForm(emptyKat); }}>Batal Edit</Button>}
            <Button onClick={handleSubmit} disabled={!form.nama}>{editId ? 'Simpan Perubahan' : 'Tambah Kategori'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Kategori?</AlertDialogTitle>
            <AlertDialogDescription>Kategori &quot;{kategoriMutasi.find((k) => k.id === deleteId)?.nama}&quot; akan dihapus.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => { void deleteKategoriMutasi(deleteId!); setDeleteId(null); }}>Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
