'use client';

import { useTheme } from 'next-themes';
import { useStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Sun, Moon, Monitor, Trash2, Database, Shield, Info } from 'lucide-react';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { resetData, coa, jurnal, mutasi, kontak, hutang, piutang, kategoriAkun, kategoriMutasi } = useStore();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Pengaturan</h1>
        <p className="text-muted-foreground text-sm mt-1">Konfigurasi aplikasi dan preferensi pengguna</p>
      </div>

      {/* Theme */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Tampilan</CardTitle>
          <CardDescription className="text-xs">Pilih tema tampilan aplikasi</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Label className="text-sm">Mode Tema</Label>
            <div className="flex gap-3">
              {[
                { value: 'light', label: 'Terang', icon: Sun },
                { value: 'dark', label: 'Gelap', icon: Moon },
                { value: 'system', label: 'Sistem', icon: Monitor },
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  className={`flex-1 flex flex-col items-center gap-2 py-4 px-3 rounded-xl border-2 transition-all ${
                    theme === value
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border hover:border-muted-foreground/50 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Info */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Database className="w-4 h-4" /> Data Tersimpan</CardTitle>
          <CardDescription className="text-xs">Ringkasan data yang tersimpan di Supabase</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Chart of Accounts', count: coa.length, color: 'text-blue-600' },
              { label: 'Jurnal Umum', count: jurnal.length, color: 'text-emerald-600' },
              { label: 'Mutasi Kas/Bank', count: mutasi.length, color: 'text-amber-600' },
              { label: 'Kontak Bisnis', count: kontak.length, color: 'text-red-500' },
              { label: 'Hutang Usaha', count: hutang.length, color: 'text-red-500' },
              { label: 'Piutang Usaha', count: piutang.length, color: 'text-blue-600' },
            ].map((d) => (
              <div key={d.label} className="bg-muted/40 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">{d.label}</p>
                <p className={`text-xl font-bold ${d.color}`}>{d.count}</p>
                <p className="text-xs text-muted-foreground">entri</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Shield className="w-4 h-4" /> Keamanan & Akun</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center py-2">
              <div>
                <p className="font-medium">Username</p>
                <p className="text-muted-foreground text-xs">admin</p>
              </div>
            </div>
            <Separator />
            <div className="flex justify-between items-center py-2">
              <div>
                <p className="font-medium">Hak Akses</p>
                <p className="text-muted-foreground text-xs">Administrator penuh</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reset */}
      <Card className="shadow-sm border-destructive/30">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-destructive"><Trash2 className="w-4 h-4" /> Zona Berbahaya</CardTitle>
          <CardDescription className="text-xs">Tindakan ini tidak dapat dibatalkan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex gap-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Tombol Reset Data akan menghapus SEMUA data jurnal, mutasi, dan pelanggan, lalu mengembalikan ke data demo awal. Akun COA default juga akan dipulihkan.
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="gap-2">
                  <Trash2 className="w-4 h-4" /> Reset Semua Data
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset Data?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Semua data akan dikembalikan ke kondisi awal (demo data). Tindakan ini tidak dapat dibatalkan.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => { void resetData(); }}>
                    Ya, Reset Data
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
