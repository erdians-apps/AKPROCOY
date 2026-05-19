'use client';

import { useState } from 'react';
import { useStore, Piutang } from '@/lib/store';
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

export default function PiutangPage() {
  const { piutang, kontak, coa, addPiutang, prosesPembayaranPiutang, addJurnal } = useStore();
  const customers = kontak.filter((k) => k.tipe === 'Pelanggan');
  const kasAccounts = coa.filter((c) => c.kategori2 === 'Kas & Setara Kas');

  const [addOpen, setAddOpen] = useState(false);
  const [payOpen, setPayOpen] = useState<string | null>(null);
  const [payNominal, setPayNominal] = useState('');
  const [payAkun, setPayAkun] = useState('');
  const [addForm, setAddForm] = useState({ tgl: new Date().toISOString().split('T')[0], kontakId: '', deskripsi: '', nominal: '' });

  const totalPiutang = piutang.reduce((a, p) => a + p.nominalTotal, 0);
  const totalTerbayar = piutang.reduce((a, p) => a + p.nominalTerbayar, 0);
  const totalSisa = totalPiutang - totalTerbayar;

  const handleAdd = () => {
    if (!addForm.tgl || !addForm.kontakId || !addForm.deskripsi || !addForm.nominal) return;
    const nominal = parseFloat(addForm.nominal);
    const id = generateId('AR');
    void addPiutang({ id, tgl: addForm.tgl, kontakId: addForm.kontakId, deskripsi: addForm.deskripsi, nominalTotal: nominal, nominalTerbayar: 0, status: 'BELUM LUNAS' });
    void addJurnal({
      id: generateId('JU'), tgl: addForm.tgl,
      desc: `[AR] ${addForm.deskripsi}`,
      lines: [
        { kodeAkun: '1-1101', debit: nominal, kredit: 0 },
        { kodeAkun: '4-1001', debit: 0, kredit: nominal },
      ],
    });
    setAddOpen(false);
    setAddForm({ tgl: new Date().toISOString().split('T')[0], kontakId: '', deskripsi: '', nominal: '' });
  };

  const handlePay = () => {
    if (!payOpen || !payNominal || !payAkun) return;
    void prosesPembayaranPiutang(payOpen, parseFloat(payNominal), payAkun);
    setPayOpen(null);
    setPayNominal('');
    setPayAkun('');
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Piutang Usaha</h1><p className="text-muted-foreground text-sm mt-1">Manajemen piutang dan penerimaan dari pelanggan</p></div>
        <Button onClick={() => setAddOpen(true)} className="gap-2"><Plus className="w-4 h-4" /> Piutang Baru</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="shadow-sm"><CardContent className="p-4 flex items-center gap-3"><HandCoins className="w-8 h-8 text-blue-600" /><div><p className="text-xs text-muted-foreground">Total Piutang</p><p className="text-lg font-bold text-blue-600">{formatRupiah(totalPiutang)}</p></div></CardContent></Card>
        <Card className="shadow-sm"><CardContent className="p-4 flex items-center gap-3"><Wallet className="w-8 h-8 text-emerald-600" /><div><p className="text-xs text-muted-foreground">Total Diterima</p><p className="text-lg font-bold text-emerald-600">{formatRupiah(totalTerbayar)}</p></div></CardContent></Card>
        <Card className="shadow-sm border-amber-200 dark:border-amber-800"><CardContent className="p-4 flex items-center gap-3"><HandCoins className="w-8 h-8 text-amber-600" /><div><p className="text-xs text-muted-foreground">Sisa Piutang</p><p className="text-lg font-bold text-amber-600">{formatRupiah(totalSisa)}</p></div></CardContent></Card>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-xs text-muted-foreground border-b border-border">
                  {['ID', 'Tanggal', 'Pelanggan', 'Deskripsi', 'Total', 'Diterima', 'Sisa', 'Status', 'Aksi'].map((h) => (
                    <th key={h} className="text-left py-3 px-4 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {piutang.length === 0 ? (
                  <tr><td colSpan={9} className="py-12 text-center text-muted-foreground">Tidak ada data piutang</td></tr>
                ) : piutang.map((p) => {
                  const customer = kontak.find((k) => k.id === p.kontakId);
                  const sisa = p.nominalTotal - p.nominalTerbayar;
                  return (
                    <tr key={p.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-mono text-xs text-primary">{p.id}</td>
                      <td className="py-3 px-4 whitespace-nowrap">{formatDate(p.tgl)}</td>
                      <td className="py-3 px-4">{customer?.nama ?? '-'}</td>
                      <td className="py-3 px-4 max-w-[200px] truncate">{p.deskripsi}</td>
                      <td className="py-3 px-4 font-semibold">{formatRupiah(p.nominalTotal)}</td>
                      <td className="py-3 px-4 text-emerald-600">{formatRupiah(p.nominalTerbayar)}</td>
                      <td className="py-3 px-4 text-amber-600 font-semibold">{formatRupiah(sisa)}</td>
                      <td className="py-3 px-4"><Badge variant="outline" className={STATUS_COLOR[p.status]}>{p.status}</Badge></td>
                      <td className="py-3 px-4">
                        {p.status !== 'LUNAS' && (
                          <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs" onClick={() => { setPayOpen(p.id); setPayNominal(''); setPayAkun(''); }}>
                            <Wallet className="w-3 h-3" /> Terima
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
          <DialogHeader><DialogTitle>Catat Piutang Baru</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5"><Label>Tanggal</Label><Input type="date" value={addForm.tgl} onChange={(e) => setAddForm({ ...addForm, tgl: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Pelanggan</Label><Select value={addForm.kontakId} onValueChange={(v) => setAddForm({ ...addForm, kontakId: v })}><SelectTrigger><SelectValue placeholder="Pilih pelanggan..." /></SelectTrigger><SelectContent>{customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.nama}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Deskripsi</Label><Input placeholder="Keterangan piutang" value={addForm.deskripsi} onChange={(e) => setAddForm({ ...addForm, deskripsi: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Nominal Total (Rp)</Label><Input type="number" min="0" placeholder="0" value={addForm.nominal} onChange={(e) => setAddForm({ ...addForm, nominal: e.target.value })} /></div>
            <p className="text-xs text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-md">Jurnal pengakuan piutang akan otomatis dibuat.</p>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setAddOpen(false)}>Batal</Button><Button onClick={handleAdd} disabled={!addForm.tgl || !addForm.kontakId || !addForm.deskripsi || !addForm.nominal}>Simpan</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!payOpen} onOpenChange={(o) => { if (!o) setPayOpen(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Catat Penerimaan Piutang</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            {payOpen && (() => {
              const p = piutang.find((x) => x.id === payOpen);
              if (!p) return null;
              const sisa = p.nominalTotal - p.nominalTerbayar;
              return <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1"><div className="flex justify-between"><span className="text-muted-foreground">ID</span><span className="font-mono">{p.id}</span></div><div className="flex justify-between"><span className="text-muted-foreground">Sisa Piutang</span><span className="font-bold text-amber-600">{formatRupiah(sisa)}</span></div></div>;
            })()}
            <div className="space-y-1.5"><Label>Nominal Diterima (Rp)</Label><Input type="number" min="0" placeholder="0" value={payNominal} onChange={(e) => setPayNominal(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Akun Kas/Bank</Label><Select value={payAkun} onValueChange={setPayAkun}><SelectTrigger><SelectValue placeholder="Pilih akun..." /></SelectTrigger><SelectContent>{kasAccounts.map((c) => <SelectItem key={c.kode} value={c.kode}>{c.kode} - {c.nama}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setPayOpen(null)}>Batal</Button><Button onClick={handlePay} disabled={!payNominal || !payAkun}>Terima</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
