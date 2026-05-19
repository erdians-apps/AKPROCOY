'use client';

import { useState, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { formatRupiah, MONTHS, getMonthFromStr, getYearFromStr } from '@/lib/utils';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CircleCheck as CheckCircle, CircleAlert as AlertCircle } from 'lucide-react';

export default function TrialBalancePage() {
  const { coa, jurnal } = useStore();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const [month, setMonth] = useState(currentMonth.toString());
  const [year, setYear] = useState(currentYear.toString());
  const years = Array.from({ length: 5 }, (_, i) => (currentYear - 2 + i).toString());

  const trialBalance = useMemo(() => {
    const saldo: Record<string, { debit: number; kredit: number }> = {};
    coa.forEach((c) => { saldo[c.kode] = { debit: 0, kredit: 0 }; });

    jurnal.forEach((j) => {
      const jy = getYearFromStr(j.tgl);
      const jm = getMonthFromStr(j.tgl);
      if (jy > parseInt(year)) return;
      if (jy === parseInt(year) && jm > parseInt(month)) return;
      j.lines.forEach((l) => {
        if (!saldo[l.kodeAkun]) saldo[l.kodeAkun] = { debit: 0, kredit: 0 };
        saldo[l.kodeAkun].debit += l.debit;
        saldo[l.kodeAkun].kredit += l.kredit;
      });
    });

    return coa
      .filter((c) => saldo[c.kode].debit > 0 || saldo[c.kode].kredit > 0)
      .sort((a, b) => a.kode.localeCompare(b.kode))
      .map((c) => ({ ...c, debit: saldo[c.kode].debit, kredit: saldo[c.kode].kredit }));
  }, [coa, jurnal, month, year]);

  const totalDebit = trialBalance.reduce((a, r) => a + r.debit, 0);
  const totalKredit = trialBalance.reduce((a, r) => a + r.kredit, 0);
  const isBalanced = totalDebit === totalKredit;

  const TIPE_COLOR: Record<string, string> = {
    Aktiva: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    Kewajiban: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    Ekuitas: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    Pendapatan: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
    Beban: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Neraca Saldo</h1>
        <p className="text-muted-foreground text-sm mt-1">Trial Balance kumulatif hingga periode terpilih</p>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap gap-3 items-end justify-between">
            <div className="flex gap-3 flex-wrap">
              <div className="space-y-1.5">
                <Label className="text-xs">Sampai Bulan</Label>
                <Select value={month} onValueChange={setMonth}>
                  <SelectTrigger className="h-9 w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>{MONTHS.map((m, i) => <SelectItem key={i + 1} value={(i + 1).toString()}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Tahun</Label>
                <Select value={year} onValueChange={setYear}>
                  <SelectTrigger className="h-9 w-28"><SelectValue /></SelectTrigger>
                  <SelectContent>{years.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg ${isBalanced ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20' : 'bg-red-50 text-red-600 dark:bg-red-900/20'}`}>
              {isBalanced ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {isBalanced ? 'Neraca Seimbang' : 'Neraca Tidak Seimbang'}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-xs text-muted-foreground border-b border-border">
                  <th className="text-left py-3 px-4 font-medium">Kode</th>
                  <th className="text-left py-3 px-4 font-medium">Nama Akun</th>
                  <th className="text-left py-3 px-4 font-medium">Tipe</th>
                  <th className="text-right py-3 px-4 font-medium">Debit (Rp)</th>
                  <th className="text-right py-3 px-4 font-medium">Kredit (Rp)</th>
                </tr>
              </thead>
              <tbody>
                {trialBalance.length === 0 ? (
                  <tr><td colSpan={5} className="py-12 text-center text-muted-foreground">Tidak ada data untuk periode ini</td></tr>
                ) : trialBalance.map((r) => (
                  <tr key={r.kode} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-2.5 px-4 font-mono text-xs text-primary font-semibold">{r.kode}</td>
                    <td className="py-2.5 px-4 font-medium">{r.nama}</td>
                    <td className="py-2.5 px-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TIPE_COLOR[r.tipe]}`}>{r.tipe}</span>
                    </td>
                    <td className="py-2.5 px-4 text-right text-blue-600 font-mono">{r.debit > 0 ? formatRupiah(r.debit) : '-'}</td>
                    <td className="py-2.5 px-4 text-right text-orange-600 font-mono">{r.kredit > 0 ? formatRupiah(r.kredit) : '-'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-muted/50 font-bold border-t-2 border-border">
                <tr>
                  <td colSpan={3} className="py-3 px-4 text-right text-sm">TOTAL</td>
                  <td className="py-3 px-4 text-right text-blue-700 font-mono">{formatRupiah(totalDebit)}</td>
                  <td className="py-3 px-4 text-right text-orange-700 font-mono">{formatRupiah(totalKredit)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          {!isBalanced && (
            <div className="p-3 m-4 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Selisih: {formatRupiah(Math.abs(totalDebit - totalKredit))}. Periksa kembali jurnal Anda.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
