'use client';

import { useState } from 'react';
import { useStore, Hutang } from '@/lib/store';
import { formatRupiah, formatDate, generateId } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, HandCoins, Wallet } from 'lucide-react';

const STATUS_COLOR: Record<string, string> = {
  'BELUM LUNAS': 'border-red-500 text-red-600',
  'SEBAGIAN': 'border-amber-500 text-amber-600',
  'LUNAS': 'border-emerald-500 text-emerald-600',
};

export default function HutangPage() {
  const { hutang, kontak, coa, addHutang, prosesPembayaranHutang, addJurnal } = useStore();
  const suppliers = kontak.filter((k) => k.tipe === 'Supplier');
  const kasAccounts = coa.filter((c) => c.kategori2 === 'Kas & Setara Kas');

  const [addOpen, setAddOpen] = useState(false);
  const [payOpen, setPayOpen] = useState<string | null>(null);
  const [payNominal, setPayNominal] = useState('');
  const [payAkun, setPayAkun] = useState('');
  const [addForm, setAddForm] = useState({ tgl: new Date().toISOString().split('T')[0], kontakId: '', deskripsi: '', nominal: '' });

  const totalHutang = hutang.reduce((a, h) => a + h.nominalTotal, 0);
  const totalTerbayar = hutang.reduce((a, h) => a + h.nominalTerbayar, 0);
  const totalSisa = totalHutang - totalTerbayar;

  const handleAdd = () => {
    if (!addForm.tgl || !addForm.kontakId || !addForm.deskripsi || !addForm.nominal) return;
    const nominal = parseFloat(addForm.nominal);
    const id = generateId('AP');
    void addHutang({ id, tgl: addForm.tgl, kontakId: addForm.kontakId, deskripsi: addForm.deskripsi, nominalTotal: nominal, nominalTerbayar: 0, status: 'BELUM LUNAS' });
    // Auto-generate initial recognition journal: D Hutang (2-1001) K Kas/Bank
    void addJurnal({
      id: generateId('JU'), tgl: addForm.tgl,
      desc: `[AP] ${addForm.deskripsi}`,
      lines: [
        { kodeAkun: '2-1001', debit: 0, kredit: nominal },
        { kodeAkun: '1-1001', debit: nominal, kredit: 0 },
      ],
    });
    setAddOpen(false);
    setAddForm({ tgl: new Date().toISOString().split('T')[0], kontakId: '', deskripsi: '', nominal: '' });
  };

  const handlePay = () => {
    if (!payOpen || !payNominal || !payAkun) return;
    void prosesPembayaranHutang(payOpen, parseFloat(payNominal), payAkun);
    setPayOpen(null);
    setPayNominal('');
    setPayAkun('');
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Hutang Usaha</h1><p className="text-muted-foreground text-sm mt-1">Manajemen hutang dan pembayaran ke supplier</p></div>
        <Button onClick={() => setAddOpen(true)} className="gap-2"><Plus className="w-4 h-4" /> Hutang Baru</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="shadow-sm"><CardContent className="p-4 flex items-center gap-3"><HandCoins className="w-8 h-8 text-red-500" /><div><p className="text-xs text-muted-foreground">Total Hutang</p><p className="text-lg font-bold text-red-500">{formatRupiah(totalHutang)}</p></div></CardContent></Card>
        <Card className="shadow-sm"><CardContent className="p-4 flex items-center gap-3"><Wallet className="w-8 h-8 text-emerald-600" /><div><p className="text-xs text-muted-foreground">Total Terbayar</p><p className="text-lg font-bold text-emerald-600">{formatRupiah(totalTerbayar)}</p></div></CardContent></Card>
        <Card className="shadow-sm border-blue-200 dark:border-blue-800"><CardContent className="p-4 flex items-center gap-3"><HandCoins className="w-8 h-8 text-blue-600" /><div><p className="text-xs text-muted-foreground">Sisa Hutang</p><p className="text-lg font-bold text-blue-600">{formatRupiah(totalSisa)}</p></div></CardContent></Card>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-xs text-muted-foreground border-b border-border">
                  {['ID', 'Tanggal', 'Supplier', 'Deskripsi', 'Total', 'Terbayar', 'Sisa', 'Status', 'Aksi'].map((h) => (
                    <th key={h} className="text-left py-3 px-4 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {hutang.length === 0 ? (
                  <tr><td colSpan={9} className="py-12 text-center text-muted-foreground">Tidak ada data hutang</td></tr>
                ) : hutang.map((h) => {
                  const supplier = kontak.find((k) => k.id === h.kontakId);
                  const sisa = h.nominalTotal - h.nominalTerbayar;
                  return (
                    <tr key={h.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-mono text-xs text-primary">{h.id}</td>
                      <td className="py-3 px-4 whitespace-nowrap">{formatDate(h.tgl)}</td>
                      <td className="py-3 px-4">{supplier?.nama ?? '-'}</td>
                      <td className="py-3 px-4 max-w-[200px] truncate">{h.deskripsi}</td>
                      <td className="py-3 px-4 font-semibold">{formatRupiah(h.nominalTotal)}</td>
                      <td className="py-3 px-4 text-emerald-600">{formatRupiah(h.nominalTerbayar)}</td>
                      <td className="py-3 px-4 text-blue-600 font-semibold">{formatRupiah(sisa)}</td>
                      <td className="py-3 px-4"><Badge variant="outline" className={STATUS_COLOR[h.status]}>{h.status}</Badge></td>
                      <td className="py-3 px-4">
                        {h.status !== 'LUNAS' && (
                          <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs" onClick={() => { setPayOpen(h.id); setPayNominal(''); setPayAkun(''); }}>
                            <Wallet className="w-3 h-3" /> Bayar
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Catat Hutang Baru</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5"><Label>Tanggal</Label><Input type="date" value={addForm.tgl} onChange={(e) => setAddForm({ ...addForm, tgl: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Supplier</Label><Select value={addForm.kontakId} onValueChange={(v) => setAddForm({ ...addForm, kontakId: v })}><SelectTrigger><SelectValue placeholder="Pilih supplier..." /></SelectTrigger><SelectContent>{suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.nama}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Deskripsi</Label><Input placeholder="Keterangan hutang" value={addForm.deskripsi} onChange={(e) => setAddForm({ ...addForm, deskripsi: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Nominal Total (Rp)</Label><Input type="number" min="0" placeholder="0" value={addForm.nominal} onChange={(e) => setAddForm({ ...addForm, nominal: e.target.value })} /></div>
            <p className="text-xs text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-md">Jurnal pengakuan hutang akan otomatis dibuat.</p>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setAddOpen(false)}>Batal</Button><Button onClick={handleAdd} disabled={!addForm.tgl || !addForm.kontakId || !addForm.deskripsi || !addForm.nominal}>Simpan</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!payOpen} onOpenChange={(o) => { if (!o) setPayOpen(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Catat Pembayaran Hutang</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            {payOpen && (() => {
              const h = hutang.find((x) => x.id === payOpen);
              if (!h) return null;
              const sisa = h.nominalTotal - h.nominalTerbayar;
              return (
                <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
                  <div className="flex justify-between"><span className="text-muted-foreground">ID</span><span className="font-mono">{h.id}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Sisa Hutang</span><span className="font-bold text-blue-600">{formatRupiah(sisa)}</span></div>
                </div>
              );
            })()}
            <div className="space-y-1.5"><Label>Nominal Bayar (Rp)</Label><Input type="number" min="0" placeholder="0" value={payNominal} onChange={(e) => setPayNominal(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Akun Kas/Bank</Label><Select value={payAkun} onValueChange={setPayAkun}><SelectTrigger><SelectValue placeholder="Pilih akun..." /></SelectTrigger><SelectContent>{kasAccounts.map((c) => <SelectItem key={c.kode} value={c.kode}>{c.kode} - {c.nama}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setPayOpen(null)}>Batal</Button><Button onClick={handlePay} disabled={!payNominal || !payAkun}>Bayar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
