'use client';

import { useState } from 'react';
import { useStore, Jurnal, JurnalLine } from '@/lib/store';
import { formatRupiah, formatDate, generateId } from '@/lib/utils';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import {
  Plus, Pencil, Trash2, CircleAlert as AlertCircle, CircleCheck as CheckCircle,
  Search, ChevronDown, ChevronRight, ChevronLeft,
} from 'lucide-react';

const PAGE_SIZE = 10;

export default function JurnalPage() {
  const { jurnal, coa, addJurnal, updateJurnal, deleteJurnal } = useStore();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const emptyLines = [{ kodeAkun: '', debit: 0, kredit: 0 }, { kodeAkun: '', debit: 0, kredit: 0 }] as JurnalLine[];
  const [form, setForm] = useState({
    tgl: new Date().toISOString().split('T')[0],
    desc: '',
    lines: emptyLines,
  });

  const totalDebit = form.lines.reduce((a, l) => a + (l.debit || 0), 0);
  const totalKredit = form.lines.reduce((a, l) => a + (l.kredit || 0), 0);
  const isBalanced = totalDebit === totalKredit && totalDebit > 0;

  const addLine = () => setForm({ ...form, lines: [...form.lines, { kodeAkun: '', debit: 0, kredit: 0 }] });
  const removeLine = (i: number) => {
    if (form.lines.length <= 2) return;
    setForm({ ...form, lines: form.lines.filter((_, idx) => idx !== i) });
  };
  const updateLine = (i: number, field: keyof JurnalLine, value: string | number) => {
    const lines = form.lines.map((l, idx) => idx === i ? { ...l, [field]: field === 'kodeAkun' ? value : parseFloat(value as string) || 0 } : l);
    setForm({ ...form, lines });
  };

  const openAdd = () => {
    setForm({ tgl: new Date().toISOString().split('T')[0], desc: '', lines: [...emptyLines] });
    setEditId(null);
    setOpen(true);
  };

  const openEdit = (j: Jurnal) => {
    setForm({ tgl: j.tgl, desc: j.desc, lines: j.lines.map((l) => ({ ...l })) });
    setEditId(j.id);
    setOpen(true);
  };

  const handleSubmit = () => {
    if (!isBalanced || !form.desc) return;
    if (editId) {
      void updateJurnal(editId, { id: editId, tgl: form.tgl, desc: form.desc, lines: form.lines });
    } else {
      void addJurnal({ id: generateId('JU'), tgl: form.tgl, desc: form.desc, lines: form.lines });
    }
    setOpen(false);
    setEditId(null);
  };

  const filtered = [...jurnal]
    .filter((j) => {
      const matchSearch = j.desc.toLowerCase().includes(search.toLowerCase()) || j.id.toLowerCase().includes(search.toLowerCase());
      const matchFrom = !dateFrom || j.tgl >= dateFrom;
      const matchTo = !dateTo || j.tgl <= dateTo;
      return matchSearch && matchFrom && matchTo;
    })
    .sort((a, b) => b.tgl.localeCompare(a.tgl));

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Jurnal Umum</h1>
          <p className="text-muted-foreground text-sm mt-1">Pencatatan jurnal double-entry</p>
        </div>
        <Button onClick={openAdd} className="gap-2"><Plus className="w-4 h-4" /> Buat Jurnal</Button>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Cari jurnal..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9 h-9" />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground whitespace-nowrap">Dari</Label>
              <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className="h-9 w-36 text-sm" />
              <Label className="text-xs text-muted-foreground whitespace-nowrap">Sampai</Label>
              <Input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} className="h-9 w-36 text-sm" />
              {(dateFrom || dateTo) && (
                <Button variant="ghost" size="sm" className="h-9 text-xs" onClick={() => { setDateFrom(''); setDateTo(''); setPage(1); }}>Reset</Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-xs text-muted-foreground border-b border-border">
                  <th className="w-8 py-3 px-2"></th>
                  {['ID Jurnal', 'Tanggal', 'Deskripsi', 'Jumlah Baris', 'Total Debit', 'Aksi'].map((h) => (
                    <th key={h} className="text-left py-3 px-4 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr><td colSpan={7} className="py-12 text-center text-muted-foreground">Tidak ada jurnal</td></tr>
                ) : paginated.map((j) => {
                  const td = j.lines.reduce((a, l) => a + l.debit, 0);
                  const isExp = expanded === j.id;
                  return (
                    <>
                      <tr key={j.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => setExpanded(isExp ? null : j.id)}>
                        <td className="py-3 px-2 text-muted-foreground">{isExp ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}</td>
                        <td className="py-3 px-4 font-mono text-xs text-primary font-semibold">{j.id}</td>
                        <td className="py-3 px-4 whitespace-nowrap">{formatDate(j.tgl)}</td>
                        <td className="py-3 px-4 font-medium">{j.desc}</td>
                        <td className="py-3 px-4 text-center">{j.lines.length}</td>
                        <td className="py-3 px-4 font-semibold">{formatRupiah(td)}</td>
                        <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(j)}><Pencil className="w-3.5 h-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteId(j.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                          </div>
                        </td>
                      </tr>
                      {isExp && (
                        <tr key={`${j.id}-detail`} className="bg-muted/20">
                          <td colSpan={7} className="px-8 py-3">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="text-muted-foreground border-b">
                                  <th className="text-left py-1 font-medium">Akun</th>
                                  <th className="text-right py-1 font-medium">Debit</th>
                                  <th className="text-right py-1 font-medium">Kredit</th>
                                </tr>
                              </thead>
                              <tbody>
                                {j.lines.map((l, i) => (
                                  <tr key={i}>
                                    <td className={`py-1 ${l.kredit > 0 ? 'pl-6 text-muted-foreground' : 'font-medium'}`}>
                                      {coa.find((c) => c.kode === l.kodeAkun)?.nama ?? l.kodeAkun} ({l.kodeAkun})
                                    </td>
                                    <td className="py-1 text-right text-blue-600">{l.debit > 0 ? formatRupiah(l.debit) : '-'}</td>
                                    <td className="py-1 text-right text-orange-600">{l.kredit > 0 ? formatRupiah(l.kredit) : '-'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Menampilkan {((page - 1) * PAGE_SIZE) + 1}-{Math.min(page * PAGE_SIZE, filtered.length)} dari {filtered.length} jurnal
              </p>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" className="h-8 w-8" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let p: number;
                  if (totalPages <= 7) p = i + 1;
                  else if (page <= 4) p = i + 1;
                  else if (page >= totalPages - 3) p = totalPages - 6 + i;
                  else p = page - 3 + i;
                  return p;
                }).map((p) => (
                  <Button key={p} variant={p === page ? 'default' : 'outline'} size="icon" className="h-8 w-8" onClick={() => setPage(p)}>
                    {p}
                  </Button>
                ))}
                <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Journal Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit Jurnal Umum' : 'Buat Jurnal Umum'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tanggal</Label>
                <Input type="date" value={form.tgl} onChange={(e) => setForm({ ...form, tgl: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Deskripsi / Keterangan <span className="text-destructive">*</span></Label>
                <Input placeholder="Keterangan transaksi" value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Baris Jurnal</Label>
                <Button type="button" variant="outline" size="sm" onClick={addLine} className="gap-1 h-7">
                  <Plus className="w-3 h-3" /> Tambah Baris
                </Button>
              </div>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr className="text-xs text-muted-foreground">
                      <th className="text-left py-2 px-3 font-medium">Akun</th>
                      <th className="text-left py-2 px-3 font-medium">Debit (Rp)</th>
                      <th className="text-left py-2 px-3 font-medium">Kredit (Rp)</th>
                      <th className="w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.lines.map((line, i) => (
                      <tr key={i} className="border-t border-border/50">
                        <td className="py-2 px-3">
                          <Select value={line.kodeAkun} onValueChange={(v) => updateLine(i, 'kodeAkun', v)}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Pilih akun..." /></SelectTrigger>
                            <SelectContent className="max-h-52">
                              {coa.sort((a, b) => a.kode.localeCompare(b.kode)).map((c) => (
                                <SelectItem key={c.kode} value={c.kode} className="text-xs">{c.kode} - {c.nama}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="py-2 px-3">
                          <Input type="number" min="0" className="h-8 text-xs" value={line.debit || ''} onChange={(e) => { updateLine(i, 'debit', e.target.value); if (parseFloat(e.target.value) > 0) updateLine(i, 'kredit', 0); }} placeholder="0" />
                        </td>
                        <td className="py-2 px-3">
                          <Input type="number" min="0" className="h-8 text-xs" value={line.kredit || ''} onChange={(e) => { updateLine(i, 'kredit', e.target.value); if (parseFloat(e.target.value) > 0) updateLine(i, 'debit', 0); }} placeholder="0" />
                        </td>
                        <td className="py-2 px-2">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeLine(i)} disabled={form.lines.length <= 2}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-muted/30 border-t border-border">
                    <tr>
                      <td className="py-2 px-3 text-xs font-semibold">Total</td>
                      <td className="py-2 px-3 text-xs font-bold text-blue-600">{formatRupiah(totalDebit)}</td>
                      <td className="py-2 px-3 text-xs font-bold text-orange-600">{formatRupiah(totalKredit)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${isBalanced ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'}`}>
              {isBalanced ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {isBalanced ? 'Jurnal seimbang! Debit = Kredit' : `Jurnal tidak seimbang. Selisih: ${formatRupiah(Math.abs(totalDebit - totalKredit))}`}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button onClick={handleSubmit} disabled={!isBalanced || !form.desc}>
              {editId ? 'Simpan Perubahan' : 'Simpan Jurnal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Jurnal?</AlertDialogTitle>
            <AlertDialogDescription>Jurnal {deleteId} akan dihapus permanen dan mempengaruhi saldo akun.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => { void deleteJurnal(deleteId!); setDeleteId(null); }}>Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
