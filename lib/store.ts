'use client';

import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

// --- TYPES ---
export type AkunTipe = 'Aktiva' | 'Kewajiban' | 'Ekuitas' | 'Pendapatan' | 'Beban';
export type SaldoNormal = 'Debit' | 'Kredit';

export interface AppUser { id: string; email: string; role: string; is_approved: boolean; permissions: string[]; }
export interface COA { kode: string; nama: string; tipe: AkunTipe; kategori2: string; saldoNormal: SaldoNormal; }
export interface JurnalLine { kodeAkun: string; debit: number; kredit: number; }
export interface Jurnal { id: string; tgl: string; desc: string; lines: JurnalLine[]; }
export interface Mutasi { id: string; tgl: string; desc: string; akunKas: string; katTransaksi: string; tipe: 'masuk' | 'keluar'; nominal: number; status: 'PENDING' | 'DONE'; }
export interface Kontak { id: string; no: string; nama: string; alamat: string; telp: string; tipe: 'Pelanggan' | 'Supplier'; }
export interface Aset { id: string; jurnalRef: string; masaManfaat: number; tipeMasa: 'bulan' | 'tahun'; }
export interface KategoriMutasi { id: string; nama: string; iconName: string; urutan: number; }
export interface KategoriAkun { id: string; nama: string; tipe: AkunTipe; urutan: number; }
export type HutangPiutangStatus = 'BELUM LUNAS' | 'SEBAGIAN' | 'LUNAS';
export interface Hutang { id: string; tgl: string; kontakId: string; deskripsi: string; nominalTotal: number; nominalTerbayar: number; status: HutangPiutangStatus; }
export interface Piutang { id: string; tgl: string; kontakId: string; deskripsi: string; nominalTotal: number; nominalTerbayar: number; status: HutangPiutangStatus; }

function generateJurnalId() { return `JU-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`; }
function computeStatus(total: number, terbayar: number): HutangPiutangStatus { if (terbayar <= 0) return 'BELUM LUNAS'; if (terbayar >= total) return 'LUNAS'; return 'SEBAGIAN'; }

interface AppState {
  appUsers: AppUser[]; currentUser: AppUser | null;
  coa: COA[]; jurnal: Jurnal[]; mutasi: Mutasi[]; kontak: Kontak[]; aset: Aset[];
  
  // PERBAIKAN 1: Tipe data disesuaikan dengan halaman Aset (3 parameter)
  setAset: (jurnalRef: string, masaManfaat: number, tipeMasa: 'bulan' | 'tahun') => Promise<void>;
  
  kategoriMutasi: KategoriMutasi[]; kategoriAkun: KategoriAkun[]; hutang: Hutang[]; piutang: Piutang[];
  isAuthenticated: boolean; loading: boolean;

  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => Promise<void>;
  fetchAllData: () => Promise<void>;
  fetchJurnalByDate: (from: string, to: string) => Promise<void>;
  
  fetchAppUsers: () => Promise<void>;
  updateUserAccess: (id: string, updates: Partial<AppUser>) => Promise<void>;
  
  moveKategoriAkun: (id: string, direction: 'up' | 'down') => Promise<void>;
  moveKategoriMutasi: (id: string, direction: 'up' | 'down') => Promise<void>;

  addCOA: (item: COA) => Promise<void>; updateCOA: (kode: string, item: COA) => Promise<void>; deleteCOA: (kode: string) => Promise<void>;
  addKategoriAkun: (item: KategoriAkun) => Promise<void>; updateKategoriAkun: (id: string, item: KategoriAkun) => Promise<void>; deleteKategoriAkun: (id: string) => Promise<void>;
  addKategoriMutasi: (item: KategoriMutasi) => Promise<void>; updateKategoriMutasi: (id: string, item: KategoriMutasi) => Promise<void>; deleteKategoriMutasi: (id: string) => Promise<void>;
}

export const useStore = create<AppState>()((set, get) => ({
  appUsers: [], currentUser: null,
  coa: [], jurnal: [], mutasi: [], kontak: [], aset: [], kategoriMutasi: [], kategoriAkun: [], hutang: [], piutang: [],
  isAuthenticated: false, loading: true,

  // PERBAIKAN 2: Implementasi fungsi setAset dan simpan ke Supabase
  setAset: async (jurnalRef, masaManfaat, tipeMasa) => {
    set((state) => {
      const exists = state.aset.find(a => a.id === jurnalRef);
      if (exists) {
        return { aset: state.aset.map(a => a.id === jurnalRef ? { ...a, masaManfaat, tipeMasa } : a) };
      }
      return { aset: [...state.aset, { id: jurnalRef, jurnalRef, masaManfaat, tipeMasa }] };
    });

    const { data } = await supabase.from('aset_tetap').select('id').eq('jurnal_ref', jurnalRef).maybeSingle();
    if (data) {
      await supabase.from('aset_tetap').update({ masa_manfaat: masaManfaat, tipe_masa: tipeMasa }).eq('jurnal_ref', jurnalRef);
    } else {
      await supabase.from('aset_tetap').insert({
        id: `AST-${Date.now()}`,
        jurnal_ref: jurnalRef,
        masa_manfaat: masaManfaat,
        tipe_masa: tipeMasa
      });
    }
  },

  login: async (email, pass) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (error) throw error;
      const { data: userData } = await supabase.from('app_users').select('*').eq('id', data.user.id).single();
      
      if (!userData?.is_approved && userData?.role !== 'developer') {
        await supabase.auth.signOut();
        throw new Error("Akun sedang ditinjau. Mohon tunggu ACC dari Developer.");
      }
      
      set({ currentUser: userData, isAuthenticated: true, loading: false });
      toast.success('Login berhasil!');
      return true;
    } catch (error: any) {
      toast.error(error.message);
      set({ loading: false });
      return false;
    }
  },

  logout: async () => { await supabase.auth.signOut(); set({ isAuthenticated: false, currentUser: null }); },

  fetchAppUsers: async () => {
    const state = get();
    if (state.currentUser?.role !== 'developer') return;
    const { data } = await supabase.from('app_users').select('*').order('created_at', { ascending: false });
    if (data) set({ appUsers: data as AppUser[] });
  },

  updateUserAccess: async (id, updates) => {
    set((s) => ({ appUsers: s.appUsers.map(u => u.id === id ? { ...u, ...updates } : u) })); 
    await supabase.from('app_users').update(updates).eq('id', id);
    toast.success('Akses user diperbarui');
  },

  fetchAllData: async () => {
    set({ loading: true });
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) { set({ isAuthenticated: false, loading: false }); return; }

      const { data: me } = await supabase.from('app_users').select('*').eq('id', session.session.user.id).single();
      set({ currentUser: me, isAuthenticated: true });

      const { data: checkKat } = await supabase.from('kategori_akun').select('id').limit(1);
      if (!checkKat || checkKat.length === 0) {
        await supabase.from('kategori_akun').insert([
          { id: 'KAT-01', nama: 'Kas & Bank', tipe: 'Aktiva', urutan: 1 },
          { id: 'KAT-02', nama: 'Piutang Usaha', tipe: 'Aktiva', urutan: 2 },
          { id: 'KAT-03', nama: 'Aset Tetap', tipe: 'Aktiva', urutan: 3 },
          { id: 'KAT-04', nama: 'Utang Jangka Pendek', tipe: 'Kewajiban', urutan: 4 },
          { id: 'KAT-05', nama: 'Modal', tipe: 'Ekuitas', urutan: 5 },
          { id: 'KAT-06', nama: 'Pendapatan Usaha', tipe: 'Pendapatan', urutan: 6 },
          { id: 'KAT-07', nama: 'Beban Operasional', tipe: 'Beban', urutan: 7 },
        ]);
        await supabase.from('kategori_mutasi').insert([
          { id: 'KM-01', nama: 'Penerimaan Pelanggan', icon_name: 'ArrowDownToLine', urutan: 1 },
          { id: 'KM-02', nama: 'Pembayaran Supplier', icon_name: 'ArrowUpFromLine', urutan: 2 },
          { id: 'KM-03', nama: 'Beban Operasional', icon_name: 'Receipt', urutan: 3 },
        ]);
      }

      // PERBAIKAN 3: Jangan lupa menarik data tabel aset_tetap dari Supabase
      const [coaRes, katAkunRes, katMutasiRes, kontakRes, mutasiRes, hpRes, jurnalRes, asetRes] = await Promise.all([
        supabase.from('coa').select('*').order('kode'),
        supabase.from('kategori_akun').select('*').order('urutan'),
        supabase.from('kategori_mutasi').select('*').order('urutan'),
        supabase.from('kontak').select('*').order('id'),
        supabase.from('mutasi').select('*').order('tgl', { ascending: false }).limit(100),
        supabase.from('hutang_piutang').select('*').order('tgl'),
        supabase.from('jurnal').select('*, jurnal_lines(*)').order('tgl', { ascending: false }).limit(50), 
        supabase.from('aset_tetap').select('*')
      ]);

      const coa: COA[] = (coaRes.data ?? []).map((r: any) => ({ kode: r.kode, nama: r.nama, tipe: r.tipe, kategori2: r.kategori, saldoNormal: r.saldo_normal }));
      const kategoriAkun: KategoriAkun[] = (katAkunRes.data ?? []).map((r: any) => ({ id: r.id, nama: r.nama, tipe: r.tipe, urutan: r.urutan }));
      const kategoriMutasi: KategoriMutasi[] = (katMutasiRes.data ?? []).map((r: any) => ({ id: r.id, nama: r.nama, iconName: r.icon_name, urutan: r.urutan }));
      const mutasi: Mutasi[] = (mutasiRes.data ?? []).map((r: any) => ({ id: r.id, tgl: r.tgl, desc: r.deskripsi, akunKas: r.akun_kas, katTransaksi: r.kategori_mutasi_id, tipe: r.tipe, nominal: r.nominal, status: r.status }));
      const jurnal: Jurnal[] = (jurnalRes.data ?? []).map((r: any) => ({ id: r.id, tgl: r.tgl, desc: r.deskripsi, lines: (r.jurnal_lines ?? []).map((l: any) => ({ kodeAkun: l.kode_akun, debit: l.debit, kredit: l.kredit })) }));
      
      const aset: Aset[] = (asetRes.data ?? []).map((r: any) => ({
        id: r.jurnal_ref, 
        jurnalRef: r.jurnal_ref, 
        masaManfaat: r.masa_manfaat, 
        tipeMasa: r.tipe_masa 
      }));

      // Aset sekarang ikut dimasukkan ke state
      set({ coa, kategoriAkun, kategoriMutasi, mutasi, jurnal, aset, loading: false });
      if (me?.role === 'developer') get().fetchAppUsers();

    } catch (error: any) { set({ loading: false }); toast.error(`Gagal muat data: ${error.message}`); }
  },

  fetchJurnalByDate: async (from, to) => { },

  moveKategoriAkun: async (id, direction) => {
    const list = [...get().kategoriAkun].sort((a, b) => a.urutan - b.urutan);
    const idx = list.findIndex(k => k.id === id);
    if ((direction === 'up' && idx > 0) || (direction === 'down' && idx < list.length - 1)) {
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      const temp = list[idx].urutan;
      list[idx].urutan = list[swapIdx].urutan;
      list[swapIdx].urutan = temp;
      set({ kategoriAkun: list.sort((a, b) => a.urutan - b.urutan) }); 
      
      await Promise.all([
        supabase.from('kategori_akun').update({ urutan: list[idx].urutan }).eq('id', list[idx].id),
        supabase.from('kategori_akun').update({ urutan: list[swapIdx].urutan }).eq('id', list[swapIdx].id)
      ]);
    }
  },

  moveKategoriMutasi: async (id, direction) => {
    const list = [...get().kategoriMutasi].sort((a, b) => a.urutan - b.urutan);
    const idx = list.findIndex(k => k.id === id);
    if ((direction === 'up' && idx > 0) || (direction === 'down' && idx < list.length - 1)) {
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      const temp = list[idx].urutan;
      list[idx].urutan = list[swapIdx].urutan;
      list[swapIdx].urutan = temp;
      set({ kategoriMutasi: list.sort((a, b) => a.urutan - b.urutan) }); 
      
      await Promise.all([
        supabase.from('kategori_mutasi').update({ urutan: list[idx].urutan }).eq('id', list[idx].id),
        supabase.from('kategori_mutasi').update({ urutan: list[swapIdx].urutan }).eq('id', list[swapIdx].id)
      ]);
    }
  },

  addCOA: async (item) => {
    set((s) => ({ coa: [...s.coa, item] }));
    const { error } = await supabase.from('coa').insert({
      kode: item.kode, nama: item.nama, tipe: item.tipe, kategori: item.kategori2, saldo_normal: item.saldoNormal,
    });
    if (error) { toast.error("Gagal menyimpan COA"); get().fetchAllData(); } 
  },

  updateCOA: async (kode, item) => {
    set((s) => ({ coa: s.coa.map((c) => (c.kode === kode ? item : c)) }));
    await supabase.from('coa').update({ nama: item.nama, tipe: item.tipe, kategori: item.kategori2, saldo_normal: item.saldoNormal }).eq('kode', kode);
  },

  deleteCOA: async (kode) => {
    const backup = get().coa;
    set((s) => ({ coa: s.coa.filter((c) => c.kode !== kode) }));
    const { error } = await supabase.from('coa').delete().eq('kode', kode);
    if(error) { set({ coa: backup }); toast.error("Data ini sedang digunakan di transaksi!"); }
  },

  addKategoriAkun: async (item) => {
    set((s) => ({ kategoriAkun: [...s.kategoriAkun, item] }));
    await supabase.from('kategori_akun').insert({ id: item.id, nama: item.nama, tipe: item.tipe, urutan: item.urutan });
  },
  deleteKategoriAkun: async (id) => {
    set((s) => ({ kategoriAkun: s.kategoriAkun.filter(k => k.id !== id) }));
    await supabase.from('kategori_akun').delete().eq('id', id);
  },

  addKategoriMutasi: async (item) => {
    set((s) => ({ kategoriMutasi: [...s.kategoriMutasi, item] }));
    await supabase.from('kategori_mutasi').insert({ id: item.id, nama: item.nama, icon_name: item.iconName, urutan: item.urutan });
  },
  deleteKategoriMutasi: async (id) => {
    set((s) => ({ kategoriMutasi: s.kategoriMutasi.filter(k => k.id !== id) }));
    await supabase.from('kategori_mutasi').delete().eq('id', id);
  }
}));