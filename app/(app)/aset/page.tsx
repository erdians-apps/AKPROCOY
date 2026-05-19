'use client';

import { useState, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { formatRupiah, formatDate } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Settings2 } from 'lucide-react';

export default function AsetPage() {
  const { jurnal, coa, aset, setAset } = useStore();
  const [editId, setEditId] = useState<string | null>(null);
  const [masaManfaat, setMasaManfaat] = useState('');
  const [tipeMasa, setTipeMasa] = useState<'bulan' | 'tahun'>('tahun');

  const ASET_TETAP_KODES = coa.filter((c) => c.kategori2 === 'Aset Tetap' && c.saldoNormal === 'Debit').map((c) => c.kode);

  const asetItems = useMemo(() => {
    const items: {
      jurnalId: string; tgl: string; desc: string; akunKode: string; akunNama: string;
      nilaiPerolehan: number;
    }[] = [];

    jurnal.forEach((j) => {
      j.lines.forEach((l) => {
        if (!ASET_TETAP_KODES.includes(l.kodeAkun) || l.debit <= 0) return;
        const akun = coa.find((c) => c.kode === l.kodeAkun);
        if (!akun) return;
        items.push({
          jurnalId: j.id, tgl: j.tgl, desc: j.desc,
          akunKode: l.kodeAkun, akunNama: akun.nama,
          nilaiPerolehan: l.debit,
        });
      });
    });
    return items;
  }, [jurnal, coa, ASET_TETAP_KODES]);

  const today = new Date();

  const getCalc = (item: typeof asetItems[0]) => {
    const asetData = aset.find((a) => a.id === item.jurnalId);
    if (!asetData) return null;

    const masaBulan = asetData.tipeMasa === 'tahun' ? asetData.masaManfaat * 12 : asetData.masaManfaat;
    const depPerBulan = item.nilaiPerolehan / masaBulan;

    const perolehanDate = new Date(item.tgl + 'T00:00:00');
    const bulanBerlalu = Math.max(0, (today.getFullYear() - perolehanDate.getFullYear()) * 12 + (today.getMonth() - perolehanDate.getMonth()));
    const bulanTerpakai = Math.min(bulanBerlalu, masaBulan);

    const akumulasi = depPerBulan * bulanTerpakai;
    const nilaiBuku = Math.max(0, item.nilaiPerolehan - akumulasi);

    return { depPerBulan, akumulasi, nilaiBuku, masaBulan, bulanTerpakai };
  };

  const handleSave = () => {
    if (!editId || !masaManfaat) return;
    void setAset(editId, parseInt(masaManfaat), tipeMasa);
    setEditId(null);
    setMasaManfaat('');
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Aset Tetap</h1>
        <p className="text-muted-foreground text-sm mt-1">Pengelolaan aset tetap dan perhitungan depresiasi garis lurus</p>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Daftar Aset Tetap</CardTitle>
          <CardDescription className="text-xs">Aset dari jurnal yang mendebetkan akun Aset Tetap</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-xs text-muted-foreground border-b border-border">
                  {['Ref Jurnal', 'Tanggal', 'Deskripsi', 'Akun', 'Nilai Perolehan', 'Masa Manfaat', 'Dep./Bulan', 'Akumulasi', 'Nilai Buku', 'Aksi'].map((h) => (
                    <th key={h} className="text-left py-3 px-3 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {asetItems.length === 0 ? (
                  <tr><td colSpan={10} className="py-12 text-center text-muted-foreground">Tidak ada aset tetap ditemukan</td></tr>
                ) : asetItems.map((item) => {
                  const calc = getCalc(item);
                  return (
                    <tr key={`${item.jurnalId}-${item.akunKode}`} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-3 font-mono text-xs text-primary">{item.jurnalId}</td>
                      <td className="py-3 px-3 text-xs whitespace-nowrap">{formatDate(item.tgl)}</td>
                      <td className="py-3 px-3 max-w-[150px] truncate text-xs">{item.desc}</td>
                      <td className="py-3 px-3 text-xs">{item.akunNama}</td>
                      <td className="py-3 px-3 font-semibold text-xs whitespace-nowrap">{formatRupiah(item.nilaiPerolehan)}</td>
                      <td className="py-3 px-3 text-xs">
                        {calc ? (
                          <Badge variant="outline" className="border-blue-400 text-blue-600">{aset.find((a) => a.id === item.jurnalId)?.masaManfaat} {aset.find((a) => a.id === item.jurnalId)?.tipeMasa}</Badge>
                        ) : <span className="text-muted-foreground italic">Belum diset</span>}
                      </td>
                      <td className="py-3 px-3 text-xs">{calc ? formatRupiah(calc.depPerBulan) : '-'}</td>
                      <td className="py-3 px-3 text-xs text-red-500">{calc ? formatRupiah(calc.akumulasi) : '-'}</td>
                      <td className="py-3 px-3 text-xs font-semibold text-emerald-600">{calc ? formatRupiah(calc.nilaiBuku) : '-'}</td>
                      <td className="py-3 px-3">
                        <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs" onClick={() => {
                          const existing = aset.find((a) => a.id === item.jurnalId);
                          setEditId(item.jurnalId);
                          setMasaManfaat(existing ? existing.masaManfaat.toString() : '');
                          setTipeMasa(existing?.tipeMasa ?? 'tahun');
                        }}>
                          <Settings2 className="w-3 h-3" /> Atur
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!editId} onOpenChange={(o) => { if (!o) setEditId(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Atur Masa Manfaat</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="bg-muted/30 rounded p-3 text-xs text-muted-foreground">
              Jurnal Ref: <span className="font-mono font-semibold text-foreground">{editId}</span>
            </div>
            <div className="space-y-1.5">
              <Label>Tipe Masa</Label>
              <Select value={tipeMasa} onValueChange={(v) => setTipeMasa(v as 'bulan' | 'tahun')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bulan">Bulan</SelectItem>
                  <SelectItem value="tahun">Tahun</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Masa Manfaat ({tipeMasa})</Label>
              <Input type="number" min="1" placeholder="cth: 5" value={masaManfaat} onChange={(e) => setMasaManfaat(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditId(null)}>Batal</Button>
            <Button onClick={handleSave} disabled={!masaManfaat}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
