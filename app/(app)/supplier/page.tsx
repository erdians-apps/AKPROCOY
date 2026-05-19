'use client';

import { useState } from 'react';
import { useStore, Kontak } from '@/lib/store';
import { generateId } from '@/lib/utils';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Search, UserPlus } from 'lucide-react';

export default function SupplierPage() {
  const { kontak, addKontak, updateKontak, deleteKontak } = useStore();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<Omit<Kontak, 'id'>>({ no: '', nama: '', alamat: '', telp: '', tipe: 'Supplier' });

  const filtered = kontak.filter((k) => k.tipe === 'Supplier' && (
    k.nama.toLowerCase().includes(search.toLowerCase()) || k.no.includes(search) || k.telp.includes(search)
  ));

  const openAdd = () => { setForm({ no: String(kontak.filter((k) => k.tipe === 'Supplier').length + 1).padStart(3, '0'), nama: '', alamat: '', telp: '', tipe: 'Supplier' }); setEditId(null); setOpen(true); };
  const openEdit = (k: Kontak) => { setForm({ no: k.no, nama: k.nama, alamat: k.alamat, telp: k.telp, tipe: k.tipe }); setEditId(k.id); setOpen(true); };

  const handleSubmit = () => {
    if (!form.nama) return;
    if (editId) void updateKontak(editId, { ...form, id: editId });
    else void addKontak({ ...form, id: generateId('KON') });
    setOpen(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Data Supplier</h1><p className="text-muted-foreground text-sm mt-1">Kelola data supplier/vendor</p></div>
        <Button onClick={openAdd} className="gap-2"><Plus className="w-4 h-4" /> Tambah Supplier</Button>
      </div>

      <Card className="shadow-sm"><CardContent className="p-4 flex items-center gap-3"><UserPlus className="w-8 h-8 text-emerald-500" /><div><p className="text-xs text-muted-foreground">Total Supplier</p><p className="text-xl font-bold">{filtered.length}</p></div></CardContent></Card>

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="relative max-w-xs"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Cari supplier..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" /></div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50"><tr className="text-xs text-muted-foreground border-b border-border">{['No.', 'Nama Supplier', 'Alamat', 'Telepon', 'Aksi'].map((h) => (<th key={h} className="text-left py-3 px-4 font-medium">{h}</th>))}</tr></thead>
              <tbody>
                {filtered.length === 0 ? (<tr><td colSpan={5} className="py-12 text-center text-muted-foreground">Tidak ada supplier</td></tr>) : filtered.map((s) => (
                  <tr key={s.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs font-semibold">{s.no}</td>
                    <td className="py-3 px-4 font-medium">{s.nama}</td>
                    <td className="py-3 px-4 text-muted-foreground max-w-[200px] truncate">{s.alamat}</td>
                    <td className="py-3 px-4 font-mono text-sm">{s.telp}</td>
                    <td className="py-3 px-4"><div className="flex gap-1"><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(s)}><Pencil className="w-3.5 h-3.5" /></Button><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteId(s.id)}><Trash2 className="w-3.5 h-3.5" /></Button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editId ? 'Edit Supplier' : 'Tambah Supplier Baru'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>No.</Label><Input placeholder="001" value={form.no} onChange={(e) => setForm({ ...form, no: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Nama <span className="text-destructive">*</span></Label><Input placeholder="Nama perusahaan" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} /></div>
            </div>
            <div className="space-y-1.5"><Label>Alamat</Label><Input placeholder="Alamat lengkap" value={form.alamat} onChange={(e) => setForm({ ...form, alamat: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Telepon</Label><Input placeholder="021-xxxxxxx" value={form.telp} onChange={(e) => setForm({ ...form, telp: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Batal</Button><Button onClick={handleSubmit} disabled={!form.nama}>Simpan</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Hapus Supplier?</AlertDialogTitle><AlertDialogDescription>&quot;{kontak.find((k) => k.id === deleteId)?.nama}&quot; akan dihapus permanen.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Batal</AlertDialogCancel><AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => { void deleteKontak(deleteId!); setDeleteId(null); }}>Hapus</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
