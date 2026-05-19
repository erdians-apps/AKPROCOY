'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useStore } from '@/lib/store';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { LayoutDashboard, ArrowLeftRight, Clock, BookOpen, FileText, BookMarked, Scale, ChartBar as BarChart3, Users, Package, Settings, ChevronLeft, ChevronRight, ChevronDown, LogOut, Building2, Moon, Sun, Menu, UserPlus, HandCoins, CircleDollarSign, Tags } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SubItem { href: string; label: string; icon: React.ComponentType<{ className?: string }> }
interface NavGroup { label: string; icon: React.ComponentType<{ className?: string }>; items: SubItem[] }

const navGroups: NavGroup[] = [
  {
    label: 'Dashboard', icon: LayoutDashboard,
    items: [{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Kas & Bank', icon: ArrowLeftRight,
    items: [
      { href: '/mutasi', label: 'Mutasi Kas/Bank', icon: ArrowLeftRight },
      { href: '/kategori-mutasi', label: 'Kategori Mutasi', icon: Tags },
      { href: '/pending', label: 'Pending Jurnal', icon: Clock },
    ],
  },
  {
    label: 'Penjualan & Piutang', icon: CircleDollarSign,
    items: [
      { href: '/pelanggan', label: 'Data Pelanggan', icon: Users },
      { href: '/piutang', label: 'Piutang Usaha', icon: HandCoins },
    ],
  },
  {
    label: 'Pembelian & Hutang', icon: CircleDollarSign,
    items: [
      { href: '/supplier', label: 'Data Supplier', icon: UserPlus },
      { href: '/hutang', label: 'Hutang Usaha', icon: HandCoins },
    ],
  },
  {
    label: 'Buku Besar', icon: BookMarked,
    items: [
      { href: '/coa', label: 'Chart of Accounts', icon: BookOpen },
      { href: '/jurnal', label: 'Jurnal Umum', icon: FileText },
      { href: '/buku-besar', label: 'Buku Besar', icon: BookMarked },
      { href: '/trial-balance', label: 'Neraca Saldo', icon: Scale },
    ],
  },
  {
    label: 'Laporan', icon: BarChart3,
    items: [{ href: '/laporan', label: 'Laporan Keuangan', icon: BarChart3 }],
  },
  {
    label: 'Pengaturan', icon: Settings,
    items: [
      { href: '/aset', label: 'Aset Tetap', icon: Package },
      { href: '/settings', label: 'Pengaturan Sistem', icon: Settings },
    ],
  },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useStore((s) => s.isAuthenticated);
  const loading = useStore((s) => s.loading);
  const logout = useStore((s) => s.logout);
  const fetchAllData = useStore((s) => s.fetchAllData);
  const { theme, setTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({ 'Dashboard': true, 'Kas & Bank': true });

  useEffect(() => {
    if (isAuthenticated) {
      fetchAllData();
    } else {
      router.replace('/login');
    }
  }, [isAuthenticated, router, fetchAllData]);

  if (!isAuthenticated) return null;

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Memuat data...</p>
        </div>
      </div>
    );
  }

  const handleLogout = () => { logout(); router.replace('/login'); };

  const toggleGroup = (label: string) => {
    setExpandedGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const isGroupActive = (group: NavGroup) => group.items.some((i) => pathname === i.href);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className={cn('flex items-center gap-3 px-4 py-5 border-b border-white/10', collapsed && 'justify-center px-2')}>
        <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center shrink-0 shadow-lg">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div>
            <div className="text-white font-bold text-sm leading-tight">Akuntansi Pro</div>
            <div className="text-blue-300 text-xs">Enterprise</div>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {navGroups.map((group, gi) => {
          const isSingle = group.items.length === 1;
          const groupExp = expandedGroups[group.label] ?? false;
          const active = isGroupActive(group);

          if (isSingle) {
            const item = group.items[0];
            return (
              <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group',
                  pathname === item.href
                    ? 'bg-blue-600/25 text-blue-300 border-l-2 border-blue-400 pl-[10px]'
                    : 'text-slate-300 hover:bg-white/8 hover:text-white',
                  collapsed && 'justify-center px-2'
                )}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className={cn('w-4 h-4 shrink-0', pathname === item.href ? 'text-blue-400' : 'text-slate-400 group-hover:text-white')} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          }

          return (
            <div key={group.label} className={cn(gi > 0 && 'mt-3')}>
              <button
                onClick={() => { if (!collapsed) toggleGroup(group.label); }}
                className={cn(
                  'flex items-center gap-3 w-full px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-widest transition-all',
                  active ? 'text-blue-400' : 'text-slate-600 hover:text-slate-400',
                  collapsed && 'justify-center px-2'
                )}
                title={collapsed ? group.label : undefined}
              >
                <group.icon className="w-3.5 h-3.5 shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">{group.label}</span>
                    <ChevronDown className={cn('w-3 h-3 transition-transform', groupExp && 'rotate-180')} />
                  </>
                )}
              </button>
              {groupExp && !collapsed && (
                <div className="ml-2 pl-3 border-l border-white/8 space-y-px mt-1 mb-1">
                  {group.items.map((item) => (
                    <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 group',
                        pathname === item.href
                          ? 'bg-blue-600/20 text-blue-300'
                          : 'text-slate-400 hover:bg-white/6 hover:text-slate-200'
                      )}
                    >
                      <item.icon className={cn('w-3.5 h-3.5 shrink-0', pathname === item.href ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300')} />
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className={cn('p-3 border-t border-white/10', collapsed && 'flex justify-center')}>
        <button onClick={handleLogout}
          className={cn('flex items-center gap-2 text-slate-400 hover:text-red-400 transition-colors text-sm w-full px-3 py-2 rounded-lg hover:bg-white/5', collapsed && 'justify-center')}>
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Keluar</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className={cn('hidden md:flex flex-col h-full bg-slate-900 transition-all duration-200 shrink-0', collapsed ? 'w-16' : 'w-60')}>
        <SidebarContent />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-60 bg-slate-900 flex flex-col">
            <SidebarContent />
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-card border-b border-border flex items-center gap-3 px-4 shrink-0 shadow-sm transition-colors duration-200">
          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-1.5 rounded-md hover:bg-accent text-muted-foreground">
            <Menu className="w-5 h-5" />
          </button>
          <button onClick={() => setCollapsed(!collapsed)} className="hidden md:flex p-1.5 rounded-md hover:bg-accent text-muted-foreground transition-colors">
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          <div className="flex-1">
            <h2 className="text-sm font-semibold text-foreground">
              {(() => {
                for (const g of navGroups) for (const i of g.items) if (i.href === pathname) return i.label;
                return 'Akuntansi Pro';
              })()}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full hover:ring-2 hover:ring-primary/30 transition-all">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-blue-600 text-white text-xs font-bold">AD</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-3 py-2">
                  <p className="text-sm font-semibold">Administrator</p>
                  <p className="text-xs text-muted-foreground">admin@akuntansipro.id</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                  <LogOut className="w-4 h-4 mr-2" /> Keluar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
