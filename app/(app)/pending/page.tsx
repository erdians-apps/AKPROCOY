'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { formatRupiah, formatDate } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CircleAlert as AlertCircle, CircleCheck as CheckCircle, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function PendingPage() {
  const { mutasi, coa, processPendingJurnals } = useStore();
  const { toast } = useToast();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [akunLawanMap, setAkunLawanMap] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState(false);

  const pending = mutasi.filter((m) => m.status === 'PENDING');
  const allSelected = pending.length > 0 && pending.every((m) => selectedIds.has(m.id));

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };

  const toggleSelectAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(pending.map((m) => m.id)));
  };

  const setAkunLawan = (mutasiId: string, akunKode: string) => {
    setAkunLawanMap((prev) => ({ ...prev, [mutasiId]: akunKode }));
  };

  const handleBulkProcess = async () => {
    const selectedArr = Array.from(selectedIds);
    const missing = selectedArr.filter((id) => !akunLawanMap[id]);

    if (missing.length > 0) {
      toast({
        title: 'Validasi Gagal',
        description: 'Ada transaksi terpilih yang belum ditentukan lawan akunnya!',
        variant: 'destructive',
      });
      return;
    }

    setProcessing(true);
    await processPendingJurnals(selectedArr, akunLawanMap);
    setSelectedIds(new Set());
    setAkunLawanMap({});
    setProcessing(false);

    toast({
      title: 'Berhasil',
      description: `${selectedArr.length} mutasi berhasil diproses menjadi jurnal.`,
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pending Jurnal</h1>
          <p className="text-muted-foreground text-sm mt-1">Proses mutasi pending menjadi jurnal double-entry</p>
        </div>
        {selectedIds.size > 0 && (
          <Button className="gap-2 bg-amber-500 hover:bg-amber-600 text-white" onClick={handleBulkProcess} disabled={processing}>
            <Zap className="w-4 h-4" /> {processing ? 'Memproses...' : `Proses Terpilih (${selectedIds.size})`}
          </Button>
        )}
      </div>

      {pending.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="py-16 flex flex-col items-center gap-3 text-center">
            <CheckCircle className="w-12 h-12 text-emerald-500" />
            <h3 className="text-lg font-semibold">Semua Bersih!</h3>
            <p className="text-muted-foreground text-sm">Tidak ada mutasi pending. Semua transaksi sudah diproses.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <CardTitle className="text-base">{pending.length} Mutasi Menunggu Proses</CardTitle>
            </div>
            <CardDescription className="text-xs">Pilih transaksi, tentukan lawan akun, lalu klik &quot;Proses Terpilih&quot;</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr className="text-xs text-muted-foreground border-b border-border">
                    <th className="py-3 px-3 w-10">
                      <Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} aria-label="Pilih semua" />
                    </th>
                    {['ID', 'Tanggal', 'Deskripsi', 'Akun Kas', 'Tipe', 'Nominal', 'Lawan Akun'].map((h) => (
                      <th key={h} className="text-left py-3 px-4 font-medium whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pending.map((m) => {
                    const isSelected = selectedIds.has(m.id);
                    return (
                      <tr key={m.id} className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${isSelected ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''}`}>
                        <td className="py-3 px-3">
                          <Checkbox checked={isSelected} onCheckedChange={() => toggleSelect(m.id)} aria-label={`Pilih ${m.id}`} />
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-primary">{m.id}</td>
                        <td className="py-3 px-4 whitespace-nowrap">{formatDate(m.tgl)}</td>
                        <td className="py-3 px-4 max-w-[200px] truncate">{m.desc}</td>
                        <td className="py-3 px-4 text-xs">{coa.find((c) => c.kode === m.akunKas)?.nama ?? m.akunKas}</td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className={m.tipe === 'masuk' ? 'border-emerald-500 text-emerald-600' : 'border-red-500 text-red-600'}>
                            {m.tipe === 'masuk' ? 'Masuk' : 'Keluar'}
                          </Badge>
                        </td>
                        <td className={`py-3 px-4 font-semibold ${m.tipe === 'masuk' ? 'text-emerald-600' : 'text-red-500'}`}>
                          {formatRupiah(m.nominal)}
                        </td>
                        <td className="py-3 px-4 min-w-[200px]">
                          <Select value={akunLawanMap[m.id] ?? ''} onValueChange={(v) => setAkunLawan(m.id, v)}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Pilih lawan akun..." /></SelectTrigger>
                            <SelectContent className="max-h-64">
                              {coa.filter((c) => c.kode !== m.akunKas).sort((a, b) => a.kode.localeCompare(b.kode)).map((c) => (
                                <SelectItem key={c.kode} value={c.kode} className="text-xs">{c.kode} - {c.nama} ({c.tipe})</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
