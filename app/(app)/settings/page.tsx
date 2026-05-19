'use client';
import { useStore } from '@/lib/store';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const MENUS = ['Dashboard', 'Kas & Bank', 'Penjualan & Piutang', 'Pembelian & Hutang', 'Buku Besar', 'Laporan', 'Pengaturan'];

export default function SettingsPage() {
  const { currentUser, appUsers, updateUserAccess } = useStore();

  const handlePermissionChange = (userId: string, currentPerms: string[], menu: string, checked: boolean) => {
    const newPerms = checked ? [...currentPerms, menu] : currentPerms.filter(p => p !== menu);
    updateUserAccess(userId, { permissions: newPerms });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Pengaturan Sistem</h1>
      
      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">Umum</TabsTrigger>
          {currentUser?.role === 'developer' && <TabsTrigger value="developer">Menu Developer (Akses & User)</TabsTrigger>}
        </TabsList>

        <TabsContent value="general" className="mt-4">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-2">Profil Perusahaan</h2>
            <p className="text-muted-foreground text-sm">Pengaturan profil perusahaan akan segera hadir.</p>
          </Card>
        </TabsContent>

        {currentUser?.role === 'developer' && (
          <TabsContent value="developer" className="mt-4 space-y-4">
            <div className="bg-amber-50 text-amber-800 p-3 rounded-lg border border-amber-200 text-sm">
              <strong>Info Developer:</strong> Centang hak akses ke samping untuk setiap pengguna. Akun yang belum di-Approve tidak akan bisa login.
            </div>

            {/* List User Menyusun ke Bawah */}
            {appUsers.map(user => (
              <Card key={user.id} className="p-4 flex flex-col md:flex-row gap-6 items-start border-l-4 border-l-blue-500">
                {/* Kolom Kiri: Info & Status */}
                <div className="w-full md:w-1/3 flex flex-col gap-3 border-r border-slate-100 pr-4">
                  <div>
                    <div className="text-sm font-bold text-slate-800">{user.email}</div>
                    <div className="text-xs text-slate-500">ID: {user.id.substring(0,8)}...</div>
                  </div>
                  
                  <Select value={user.role} onValueChange={(v) => updateUserAccess(user.id, { role: v })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User Biasa</SelectItem>
                      <SelectItem value="admin">Administrator</SelectItem>
                      <SelectItem value="developer">Developer</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="flex items-center justify-between bg-slate-50 p-2 rounded-md">
                    <span className="text-xs font-semibold">Approve Login</span>
                    <Switch checked={user.is_approved} onCheckedChange={(c) => updateUserAccess(user.id, { is_approved: c })} />
                  </div>
                </div>

                {/* Kolom Kanan: Hak Akses Menyamping */}
                <div className="w-full md:w-2/3">
                  <div className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">Akses Menu Tersedia</div>
                  <div className="flex flex-wrap gap-4">
                    {MENUS.map(menu => (
                      <label key={menu} className="flex items-center gap-2 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                        <Checkbox 
                          checked={user.permissions.includes(menu)}
                          onCheckedChange={(c) => handlePermissionChange(user.id, user.permissions, menu, c === true)}
                        />
                        <span className="text-sm font-medium text-slate-700">{menu}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}