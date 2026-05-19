'use client';

import { useState, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { formatRupiah, MONTHS, getMonthFromStr, getYearFromStr } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

function ReportRow({ label, value, bold = false, indent = false }: { label: string; value: number; bold?: boolean; indent?: boolean }) {
  return (
    <div className={`flex justify-between py-1.5 ${indent ? 'pl-4' : ''} ${bold ? 'font-bold border-t border-border mt-1 pt-2' : ''}`}>
      <span className="text-sm">{label}</span>
      <span className={`text-sm font-mono ${bold ? 'font-bold' : ''} ${value < 0 ? 'text-red-500' : ''}`}>{formatRupiah(value)}</span>
    </div>
  );
}

export default function LaporanPage() {
  const { coa, jurnal } = useStore();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const [month, setMonth] = useState(currentMonth.toString());
  const [year, setYear] = useState(currentYear.toString());
  const years = Array.from({ length: 5 }, (_, i) => (currentYear - 2 + i).toString());

  const { pendapatan, beban, aktiva, kewajiban, ekuitas, kasFlow } = useMemo(() => {
    const saldo: Record<string, number> = {};
    coa.forEach((c) => { saldo[c.kode] = 0; });

    // For income stmt: filter current month
    const pendMap: Record<string, number> = {};
    const bebanMap: Record<string, number> = {};
    // For balance sheet: cumulative
    const aktivaMap: Record<string, number> = {};
    const kewajibanMap: Record<string, number> = {};
    const ekuitasMap: Record<string, number> = {};

    const kasOps: { desc: string; amount: number }[] = [];

    jurnal.forEach((j) => {
      const jy = getYearFromStr(j.tgl);
      const jm = getMonthFromStr(j.tgl);
      const inPeriod = jy === parseInt(year) && jm === parseInt(month);
      const cumulative = jy < parseInt(year) || (jy === parseInt(year) && jm <= parseInt(month));

      j.lines.forEach((l) => {
        const akun = coa.find((c) => c.kode === l.kodeAkun);
        if (!akun) return;

        if (inPeriod) {
          if (akun.tipe === 'Pendapatan') {
            if (!pendMap[l.kodeAkun]) pendMap[l.kodeAkun] = 0;
            pendMap[l.kodeAkun] += l.kredit - l.debit;
          }
          if (akun.tipe === 'Beban') {
            if (!bebanMap[l.kodeAkun]) bebanMap[l.kodeAkun] = 0;
            bebanMap[l.kodeAkun] += l.debit - l.kredit;
          }
          if (akun.kategori2 === 'Kas & Setara Kas') {
            const net = l.debit - l.kredit;
            if (net !== 0) kasOps.push({ desc: j.desc, amount: net });
          }
        }

        if (cumulative) {
          if (!saldo[l.kodeAkun]) saldo[l.kodeAkun] = 0;
          if (akun.saldoNormal === 'Debit') saldo[l.kodeAkun] += l.debit - l.kredit;
          else saldo[l.kodeAkun] += l.kredit - l.debit;
        }
      });
    });

    coa.forEach((c) => {
      const s = saldo[c.kode] ?? 0;
      if (c.tipe === 'Aktiva') aktivaMap[c.kode] = s;
      if (c.tipe === 'Kewajiban') kewajibanMap[c.kode] = s;
      if (c.tipe === 'Ekuitas') ekuitasMap[c.kode] = s;
    });

    return {
      pendapatan: Object.entries(pendMap).map(([kode, v]) => ({ kode, nama: coa.find((c) => c.kode === kode)?.nama ?? kode, value: v })).filter((x) => x.value !== 0),
      beban: Object.entries(bebanMap).map(([kode, v]) => ({ kode, nama: coa.find((c) => c.kode === kode)?.nama ?? kode, value: v })).filter((x) => x.value !== 0),
      aktiva: Object.entries(aktivaMap).map(([kode, v]) => ({ kode, nama: coa.find((c) => c.kode === kode)?.nama ?? kode, value: v, kat: coa.find((c) => c.kode === kode)?.kategori2 ?? '' })).filter((x) => x.value !== 0),
      kewajiban: Object.entries(kewajibanMap).map(([kode, v]) => ({ kode, nama: coa.find((c) => c.kode === kode)?.nama ?? kode, value: v, kat: coa.find((c) => c.kode === kode)?.kategori2 ?? '' })).filter((x) => x.value !== 0),
      ekuitas: Object.entries(ekuitasMap).map(([kode, v]) => ({ kode, nama: coa.find((c) => c.kode === kode)?.nama ?? kode, value: v })).filter((x) => x.value !== 0),
      kasFlow: kasOps,
    };
  }, [coa, jurnal, month, year]);

  const totalPendapatan = pendapatan.reduce((a, x) => a + x.value, 0);
  const totalBeban = beban.reduce((a, x) => a + x.value, 0);
  const labaRugi = totalPendapatan - totalBeban;

  const aktivaLancar = aktiva.filter((a) => ['Kas & Setara Kas', 'Aset Lancar'].includes(a.kat));
  const aktivaTetap = aktiva.filter((a) => a.kat === 'Aset Tetap');
  const totalAktiva = aktiva.reduce((a, x) => a + x.value, 0);
  const totalKewajiban = kewajiban.reduce((a, x) => a + x.value, 0);
  const totalEkuitas = ekuitas.reduce((a, x) => a + x.value, 0);
  const totalPasiva = totalKewajiban + totalEkuitas + labaRugi;

  const kasNet = kasFlow.reduce((a, x) => a + x.amount, 0);

  const FilterBar = () => (
    <div className="flex gap-3 flex-wrap mb-4">
      <div className="space-y-1">
        <Label className="text-xs">Bulan</Label>
        <Select value={month} onValueChange={setMonth}>
          <SelectTrigger className="h-8 w-36 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>{MONTHS.map((m, i) => <SelectItem key={i + 1} value={(i + 1).toString()}>{m}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Tahun</Label>
        <Select value={year} onValueChange={setYear}>
          <SelectTrigger className="h-8 w-28 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>{years.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Laporan Keuangan</h1>
        <p className="text-muted-foreground text-sm mt-1">Laporan keuangan lengkap perusahaan</p>
      </div>

      <Tabs defaultValue="labarugi">
        <TabsList className="grid grid-cols-4 w-full max-w-xl">
          <TabsTrigger value="labarugi">Laba Rugi</TabsTrigger>
          <TabsTrigger value="neraca">Neraca</TabsTrigger>
          <TabsTrigger value="aruskas">Arus Kas</TabsTrigger>
          <TabsTrigger value="ekuitas">Ekuitas</TabsTrigger>
        </TabsList>

        {/* Laba Rugi */}
        <TabsContent value="labarugi" className="mt-4">
          <Card className="max-w-2xl shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Laporan Laba Rugi</CardTitle>
              <p className="text-xs text-muted-foreground">Periode: {MONTHS[parseInt(month) - 1]} {year}</p>
              <FilterBar />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Pendapatan</p>
                  {pendapatan.length === 0 ? <p className="text-sm text-muted-foreground pl-4">Tidak ada pendapatan</p> : pendapatan.map((p) => <ReportRow key={p.kode} label={p.nama} value={p.value} indent />)}
                  <ReportRow label="Total Pendapatan" value={totalPendapatan} bold />
                </div>
                <Separator />
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Beban</p>
                  {beban.length === 0 ? <p className="text-sm text-muted-foreground pl-4">Tidak ada beban</p> : beban.map((b) => <ReportRow key={b.kode} label={b.nama} value={b.value} indent />)}
                  <ReportRow label="Total Beban" value={totalBeban} bold />
                </div>
                <Separator />
                <div className={`flex justify-between py-2 px-3 rounded-lg font-bold text-base ${labaRugi >= 0 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'}`}>
                  <span>{labaRugi >= 0 ? 'Laba Bersih' : 'Rugi Bersih'}</span>
                  <span className="font-mono">{formatRupiah(Math.abs(labaRugi))}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Neraca */}
        <TabsContent value="neraca" className="mt-4">
          <Card className="max-w-2xl shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Neraca / Balance Sheet</CardTitle>
              <p className="text-xs text-muted-foreground">Per: {MONTHS[parseInt(month) - 1]} {year}</p>
              <FilterBar />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Aktiva */}
                <div className="space-y-3">
                  <p className="font-bold text-sm border-b border-border pb-1.5">AKTIVA</p>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1.5">Aset Lancar</p>
                    {aktivaLancar.map((a) => <ReportRow key={a.kode} label={a.nama} value={a.value} indent />)}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1.5">Aset Tetap</p>
                    {aktivaTetap.map((a) => <ReportRow key={a.kode} label={a.nama} value={a.value} indent />)}
                  </div>
                  <div className="flex justify-between py-2 px-3 bg-blue-50 dark:bg-blue-900/20 rounded font-bold text-sm">
                    <span>Total Aktiva</span>
                    <span className="font-mono text-blue-700 dark:text-blue-300">{formatRupiah(totalAktiva)}</span>
                  </div>
                </div>

                {/* Pasiva */}
                <div className="space-y-3">
                  <p className="font-bold text-sm border-b border-border pb-1.5">KEWAJIBAN & EKUITAS</p>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1.5">Kewajiban</p>
                    {kewajiban.map((k) => <ReportRow key={k.kode} label={k.nama} value={k.value} indent />)}
                    <ReportRow label="Total Kewajiban" value={totalKewajiban} bold />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1.5">Ekuitas</p>
                    {ekuitas.map((e) => <ReportRow key={e.kode} label={e.nama} value={e.value} indent />)}
                    <ReportRow label="Laba/Rugi Periode" value={labaRugi} indent />
                    <ReportRow label="Total Ekuitas" value={totalEkuitas + labaRugi} bold />
                  </div>
                  <div className="flex justify-between py-2 px-3 bg-emerald-50 dark:bg-emerald-900/20 rounded font-bold text-sm">
                    <span>Total Pasiva</span>
                    <span className="font-mono text-emerald-700 dark:text-emerald-300">{formatRupiah(totalPasiva)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Arus Kas */}
        <TabsContent value="aruskas" className="mt-4">
          <Card className="max-w-2xl shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Laporan Arus Kas</CardTitle>
              <p className="text-xs text-muted-foreground">Periode: {MONTHS[parseInt(month) - 1]} {year}</p>
              <FilterBar />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Aktivitas Operasional</p>
                {kasFlow.length === 0 ? (
                  <p className="text-sm text-muted-foreground pl-4">Tidak ada mutasi kas</p>
                ) : kasFlow.map((k, i) => (
                  <ReportRow key={i} label={k.desc} value={k.amount} indent />
                ))}
                <div className={`flex justify-between py-2 px-3 rounded font-bold text-sm mt-2 ${kasNet >= 0 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20' : 'bg-red-50 text-red-700 dark:bg-red-900/20'}`}>
                  <span>Net Arus Kas Operasional</span>
                  <span className="font-mono">{formatRupiah(kasNet)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Perubahan Ekuitas */}
        <TabsContent value="ekuitas" className="mt-4">
          <Card className="max-w-2xl shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Laporan Perubahan Ekuitas</CardTitle>
              <p className="text-xs text-muted-foreground">Periode: {MONTHS[parseInt(month) - 1]} {year}</p>
              <FilterBar />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {ekuitas.map((e) => <ReportRow key={e.kode} label={e.nama} value={e.value} />)}
                <Separator />
                <ReportRow label="Laba/Rugi Periode" value={labaRugi} />
                <div className="flex justify-between py-2 px-3 bg-blue-50 dark:bg-blue-900/20 rounded font-bold text-sm mt-1">
                  <span>Total Ekuitas Akhir</span>
                  <span className="font-mono text-blue-700 dark:text-blue-300">{formatRupiah(totalEkuitas + labaRugi)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
