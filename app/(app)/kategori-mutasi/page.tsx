'use client';

import { useState } from 'react';
import { useStore, KategoriMutasi } from '@/lib/store';
import { generateId } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import * as Icons from 'lucide-react';

// Daftar Ikon yang sudah diperbanyak
const ICON_LIST = [
  "ArrowDownToLine", "ArrowUpFromLine", "Cog", "TrendingUp", "ArrowLeftRight",
  "Wallet", "CreditCard", "Landmark", "PiggyBank", "Receipt", "ShoppingCart",
  "Briefcase", "Building", "Car", "Home", "Monitor", "Smartphone", "Truck", "Plane",
  "Coffee", "Utensils", "Wrench", "HeartPulse", "GraduationCap"
];

const emptyKat: Omit<KategoriMutasi, 'id'> = { nama: '', iconName: 'ArrowLeftRight', urutan: 0 };

export default function KategoriMutasiPage() {
  const { kategoriMutasi, addKategoriMutasi, updateKategoriMutasi, deleteKategoriMutasi, moveKategoriMutasi } = useStore();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<KategoriMutasi, 'id'>>(emptyKat);

  const openAdd = () => { setForm(emptyKat); setEditId(null); setOpen(true); };
  const openEdit = (k: KategoriMutasi) => { setForm({ nama: k.nama, iconName: k.iconName, urutan: k.urutan }); setEditId(k.id); setOpen(true); };

  const handleSubmit = () => {
    if (!form.nama) return;
    if (editId) {
      void updateKategoriMutasi(editId, { id: editId, ...form });
    } else {
      const maxUrutan = kategoriMutasi.length > 0 ? Math.max(...kategoriMutasi.map(k => k.urutan || 0)) : 0;
      void addKategoriMutasi({ id: generateId('KM'), ...form, urutan: maxUrutan + 1 });
    }
    setOpen(false);
  };

  // Fungsi pintar untuk merender ikon string menjadi Komponen Icon beneran
  const renderIcon = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName] || Icons.HelpCircle;
    return <IconComponent className="w-4 h-4" />;
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kategori Mutasi</h1>
          <p className="text-muted-foreground text-sm mt-1">Kelola kategori transaksi kas & bank</p>
        </div>
        <Button onClick={openAdd} className="gap-2"><Plus className="w-4 h-4" /> Tambah Kategori</Button>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          <div className="space-y-1 p-4">
            {[...kategoriMutasi].sort((a, b) => (a.urutan || 0) - (b.urutan || 0)).map((k) => (
              <div key={k.id} className="flex items-center justify-between py-3 px-4 bg-muted/30 rounded-lg group border border-transparent hover:border-border transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 text-primary rounded-md flex items-center justify-center">
                    {renderIcon(k.iconName)}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{k.nama}</p>
                    <p className="text-xs text-muted-foreground font-mono">{k.id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" onClick={() => moveKategoriMutasi(k.id, 'up')}><ChevronUp className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => moveKategoriMutasi(k.id, 'down')}><ChevronDown className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" className="ml-2" onClick={() => openEdit(k)}><Pencil className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteId(k.id)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
            ))}
            {kategoriMutasi.length === 0 && (
              <div className="py-8 text-center text-muted-foreground text-sm">Belum ada kategori mutasi. Silakan tambahkan.</div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editId ? 'Edit Kategori Mutasi' : 'Tambah Kategori Baru'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nama Kategori <span className="text-destructive">*</span></Label>
              <Input placeholder="cth: Pembayaran Listrik" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Ikon Kategori</Label>
              <Select value={form.iconName} onValueChange={(v) => setForm({ ...form, iconName: v })}>
                <SelectTrigger className="w-full h-10">
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      {renderIcon(form.iconName)}
                      <span>{form.iconName}</span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {ICON_LIST.map((icon) => (
                    <SelectItem key={icon} value={icon}>
                      <div className="flex items-center gap-2">
                        {renderIcon(icon)}
                        <span>{icon}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button onClick={handleSubmit} disabled={!form.nama}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Kategori?</AlertDialogTitle>
            <AlertDialogDescription>
              Kategori &quot;{kategoriMutasi.find(k => k.id === deleteId)?.nama}&quot; akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => { if (deleteId) { void deleteKategoriMutasi(deleteId); } setDeleteId(null); }}>
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}