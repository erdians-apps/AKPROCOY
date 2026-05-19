'use client';

import { useState, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { formatRupiah, formatDate, MONTHS, getMonthFromStr, getYearFromStr } from '@/lib/utils';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZE = 20;

export default function BukuBesarPage() {
  const { coa, jurnal } = useStore();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [akunKode, setAkunKode] = useState(coa[0]?.kode ?? '');
  const [month, setMonth] = useState(currentMonth.toString());
  const [year, setYear] = useState(currentYear.toString());
  const [page, setPage] = useState(1);

  const akun = coa.find((c) => c.kode === akunKode);

  const { entries, openingBalance } = useMemo(() => {
    if (!akunKode || !akun) return { entries: [], openingBalance: 0 };

    let ob = 0;
    jurnal.forEach((j) => {
      const jy = getYearFromStr(j.tgl);
      const jm = getMonthFromStr(j.tgl);
      if (jy < parseInt(year) || (jy === parseInt(year) && jm < parseInt(month))) {
        j.lines.forEach((l) => {
          if (l.kodeAkun !== akunKode) return;
          if (akun.saldoNormal === 'Debit') ob += l.debit - l.kredit;
          else ob += l.kredit - l.debit;
        });
      }
    });

    const monthEntries: {
      tgl: string; desc: string; ref: string;
      debit: number; kredit: number; saldo: number;
    }[] = [];

    let runBalance = ob;
    const relevantJurnals = jurnal
      .filter((j) => {
        const jy = getYearFromStr(j.tgl);
        const jm = getMonthFromStr(j.tgl);
        return jy === parseInt(year) && jm === parseInt(month) &&
          j.lines.some((l) => l.kodeAkun === akunKode);
      })
      .sort((a, b) => a.tgl.localeCompare(b.tgl));

    relevantJurnals.forEach((j) => {
      j.lines.forEach((l) => {
        if (l.kodeAkun !== akunKode) return;
        if (akun.saldoNormal === 'Debit') runBalance += l.debit - l.kredit;
        else runBalance += l.kredit - l.debit;
        monthEntries.push({ tgl: j.tgl, desc: j.desc, ref: j.id, debit: l.debit, kredit: l.kredit, saldo: runBalance });
      });
    });

    return { entries: monthEntries, openingBalance: ob };
  }, [akunKode, month, year, jurnal, coa, akun]);

  const years = Array.from({ length: 5 }, (_, i) => (currentYear - 2 + i).toString());

  // Pagination
  const totalPages = Math.max(1, Math.ceil(entries.length / PAGE_SIZE));
  const paginatedEntries = entries.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset page when filters change
  const handleAkunChange = (v: string) => { setAkunKode(v); setPage(1); };
  const handleMonthChange = (v: string) => { setMonth(v); setPage(1); };
  const handleYearChange = (v: string) => { setYear(v); setPage(1); };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Buku Besar</h1>
        <p className="text-muted-foreground text-sm mt-1">Rincian mutasi per akun dengan saldo berjalan</p>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap gap-3">
            <div className="space-y-1.5 min-w-[200px]">
              <Label className="text-xs">Pilih Akun</Label>
              <Select value={akunKode} onValueChange={handleAkunChange}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-64">
                  {coa.sort((a, b) => a.kode.localeCompare(b.kode)).map((c) => (
                    <SelectItem key={c.kode} value={c.kode}>{c.kode} - {c.nama}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Bulan</Label>
              <Select value={month} onValueChange={handleMonthChange}>
                <SelectTrigger className="h-9 w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m, i) => <SelectItem key={i + 1} value={(i + 1).toString()}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Tahun</Label>
              <Select value={year} onValueChange={handleYearChange}>
                <SelectTrigger className="h-9 w-28"><SelectValue /></SelectTrigger>
                <SelectContent>{years.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        {akun && (
          <CardContent>
            <div className="flex items-center gap-3 mb-4 p-3 bg-muted/30 rounded-lg">
              <div>
                <p className="text-xs text-muted-foreground">Akun</p>
                <p className="font-semibold">{akun.kode} - {akun.nama}</p>
              </div>
              <div className="ml-4">
                <p className="text-xs text-muted-foreground">Tipe</p>
                <p className="text-sm font-medium">{akun.tipe}</p>
              </div>
              <div className="ml-4">
                <p className="text-xs text-muted-foreground">Saldo Normal</p>
                <Badge variant="outline">{akun.saldoNormal}</Badge>
              </div>
              <div className="ml-auto text-right">
                <p className="text-xs text-muted-foreground">Saldo Akhir Bulan</p>
                <p className={`text-lg font-bold ${(entries[entries.length - 1]?.saldo ?? openingBalance) >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
                  {formatRupiah(entries[entries.length - 1]?.saldo ?? openingBalance)}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr className="text-xs text-muted-foreground border-b border-border">
                    {['Tanggal', 'Referensi', 'Keterangan', 'Debit', 'Kredit', 'Saldo'].map((h) => (
                      <th key={h} className={`py-3 px-4 font-medium ${['Debit', 'Kredit', 'Saldo'].includes(h) ? 'text-right' : 'text-left'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Opening balance row */}
                  <tr className="bg-blue-50/50 dark:bg-blue-900/10 border-b border-border/50">
                    <td className="py-2.5 px-4 text-xs text-muted-foreground">
                      {MONTHS[parseInt(month) - 2] ?? 'Awal'} {year}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-xs text-muted-foreground">-</td>
                    <td className="py-2.5 px-4 text-muted-foreground italic text-xs">Saldo Awal Periode</td>
                    <td className="py-2.5 px-4 text-right">-</td>
                    <td className="py-2.5 px-4 text-right">-</td>
                    <td className="py-2.5 px-4 text-right font-bold">{formatRupiah(openingBalance)}</td>
                  </tr>
                  {entries.length === 0 ? (
                    <tr><td colSpan={6} className="py-8 text-center text-muted-foreground text-sm">Tidak ada mutasi pada periode ini</td></tr>
                  ) : paginatedEntries.map((e, i) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 px-4 whitespace-nowrap">{formatDate(e.tgl)}</td>
                      <td className="py-2.5 px-4 font-mono text-xs text-primary">{e.ref}</td>
                      <td className="py-2.5 px-4">{e.desc}</td>
                      <td className="py-2.5 px-4 text-right text-blue-600">{e.debit > 0 ? formatRupiah(e.debit) : '-'}</td>
                      <td className="py-2.5 px-4 text-right text-orange-600">{e.kredit > 0 ? formatRupiah(e.kredit) : '-'}</td>
                      <td className={`py-2.5 px-4 text-right font-semibold ${e.saldo >= 0 ? 'text-foreground' : 'text-red-500'}`}>{formatRupiah(e.saldo)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  Menampilkan {((page - 1) * PAGE_SIZE) + 1}-{Math.min(page * PAGE_SIZE, entries.length)} dari {entries.length} entri
                </p>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="h-8 w-8" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
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
        )}
      </Card>
    </div>
  );
}
