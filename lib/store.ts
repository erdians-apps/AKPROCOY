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

export function generateJurnalId() { return `JU-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`; }
export function computeStatus(total: number, terbayar: number): HutangPiutangStatus { if (terbayar <= 0) return 'BELUM LUNAS'; if (terbayar >= total) return 'LUNAS'; return 'SEBAGIAN'; }

// --- APP STATE INTERFACE FULL ---
export interface AppState {
  appUsers: AppUser[]; currentUser: AppUser | null;
  coa: COA[]; jurnal: Jurnal[]; mutasi: Mutasi[]; kontak: Kontak[]; aset: Aset[];
  kategoriMutasi: KategoriMutasi[]; kategoriAkun: KategoriAkun[]; hutang: Hutang[]; piutang: Piutang[];
  isAuthenticated: boolean; loading: boolean;

  // SYSTEM & AUTH
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => Promise<void>;
  fetchAllData: () => Promise<void>;
  fetchJurnalByDate: (from: string, to: string) => Promise<void>;
  fetchAppUsers: () => Promise<void>;
  updateUserAccess: (id: string, updates: Partial<AppUser>) => Promise<void>;
  
  // SORTING & SETTINGS
  moveKategoriAkun: (id: string, direction: 'up' | 'down') => Promise<void>;
  moveKategoriMutasi: (id: string, direction: 'up' | 'down') => Promise<void>;
  setAset: (jurnalRef: string, masaManfaat: number, tipeMasa: 'bulan' | 'tahun') => Promise<void>;

  // COA & KATEGORI
  addCOA: (item: COA) => Promise<void>; 
  updateCOA: (kode: string, item: COA) => Promise<void>; 
  deleteCOA: (kode: string) => Promise<void>;
  addKategoriAkun: (item: KategoriAkun) => Promise<void>; 
  updateKategoriAkun: (id: string, item: KategoriAkun) => Promise<void>; 
  deleteKategoriAkun: (id: string) => Promise<void>;
  addKategoriMutasi: (item: KategoriMutasi) => Promise<void>; 
  updateKategoriMutasi: (id: string, item: KategoriMutasi) => Promise<void>; 
  deleteKategoriMutasi: (id: string) => Promise<void>;

  // JURNAL & MUTASI
  addJurnal: (item: Jurnal) => Promise<void>; 
  deleteJurnal: (id: string) => Promise<void>;
  addMutasi: (item: Mutasi) => Promise<void>; 
  updateMutasi: (id: string, item: Mutasi) => Promise<void>; 
  deleteMutasi: (id: string) => Promise<void>;
  processPendingJurnals: (mutasiIds: string[], lawanAkun: Record<string, string>) => Promise<void>;

  // KONTAK, HUTANG & PIUTANG
  addKontak: (item: Kontak) => Promise<void>; 
  updateKontak: (id: string, item: Kontak) => Promise<void>; 
  deleteKontak: (id: string) => Promise<void>;
  addHutang: (item: Hutang) => Promise<void>; 
  deleteHutang: (id: string) => Promise<void>; 
  prosesPembayaranHutang: (id: string, nominal: number, akunKas: string) => Promise<void>;
  addPiutang: (item: Piutang) => Promise<void>; 
  deletePiutang: (id: string) => Promise<void>; 
  prosesPembayaranPiutang: (id: string, nominal: number, akunKas: string) => Promise<void>;
}

// --- STORE IMPLEMENTATION ---
export const useStore = create<AppState>()((set, get) => ({
  appUsers: [], currentUser: null,
  coa: [], jurnal: [], mutasi: [], kontak: [], aset: [], kategoriMutasi: [], kategoriAkun: [], hutang: [], piutang: [],
  isAuthenticated: false, loading: true,

  // 1. AUTHENTICATION
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
  logout: async () => { 
    await supabase.auth.signOut(); 
    set({ isAuthenticated: false, currentUser: null }); 
  },

  // 2. DEVELOPER CONTROLS
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

  // 3. FETCH ALL DATA
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
      const aset: Aset[] = (asetRes.data ?? []).map((r: any) => ({ id: r.jurnal_ref, jurnalRef: r.jurnal_ref, masaManfaat: r.masa_manfaat, tipeMasa: r.tipe_masa }));
      
      const hutang: Hutang[] = [];
      const piutang: Piutang[] = [];
      (hpRes.data ?? []).forEach((r: any) => {
        const d = { id: r.id, tgl: r.tgl, kontakId: r.kontak_id, deskripsi: r.deskripsi, nominalTotal: r.nominal_total, nominalTerbayar: r.nominal_terbayar, status: r.status };
        if (r.tipe === 'Hutang') hutang.push(d); else piutang.push(d);
      });
      const kontak: Kontak[] = (kontakRes.data ?? []).map((r: any) => ({ id: r.id, no: r.no, nama: r.nama, alamat: r.alamat, telp: r.telp, tipe: r.tipe }));

      set({ coa, kategoriAkun, kategoriMutasi, mutasi, jurnal, aset, hutang, piutang, kontak, loading: false });
      if (me?.role === 'developer') get().fetchAppUsers();

    } catch (error: any) { set({ loading: false }); toast.error(`Gagal muat data: ${error.message}`); }
  },
  
  fetchJurnalByDate: async (from, to) => {
    try {
      const { data } = await supabase.from('jurnal').select('*, jurnal_lines(*)').gte('tgl', from).lte('tgl', to).order('tgl', { ascending: false });
      if(data) {
        const jurnal: Jurnal[] = data.map((r: any) => ({ id: r.id, tgl: r.tgl, desc: r.deskripsi, lines: (r.jurnal_lines ?? []).map((l: any) => ({ kodeAkun: l.kode_akun, debit: l.debit, kredit: l.kredit })) }));
        set({ jurnal });
      }
    } catch (error) { toast.error('Gagal filter jurnal'); }
  },

  // 4. SORTING & ASET
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
  setAset: async (jurnalRef, masaManfaat, tipeMasa) => {
    set((state) => {
      const exists = state.aset.find(a => a.id === jurnalRef);
      if (exists) return { aset: state.aset.map(a => a.id === jurnalRef ? { ...a, masaManfaat, tipeMasa } : a) };
      return { aset: [...state.aset, { id: jurnalRef, jurnalRef, masaManfaat, tipeMasa }] };
    });
    const { data } = await supabase.from('aset_tetap').select('id').eq('jurnal_ref', jurnalRef).maybeSingle();
    if (data) await supabase.from('aset_tetap').update({ masa_manfaat: masaManfaat, tipe_masa: tipeMasa }).eq('jurnal_ref', jurnalRef);
    else await supabase.from('aset_tetap').insert({ id: `AST-${Date.now()}`, jurnal_ref: jurnalRef, masa_manfaat: masaManfaat, tipe_masa: tipeMasa });
  },

  // 5. CRUD KATEGORI & COA
  addCOA: async (item) => {
    set((s) => ({ coa: [...s.coa, item] }));
    await supabase.from('coa').insert({ kode: item.kode, nama: item.nama, tipe: item.tipe, kategori: item.kategori2, saldo_normal: item.saldoNormal });
  },
  updateCOA: async (kode, item) => {
    set((s) => ({ coa: s.coa.map((c) => (c.kode === kode ? item : c)) }));
    await supabase.from('coa').update({ nama: item.nama, tipe: item.tipe, kategori: item.kategori2, saldo_normal: item.saldoNormal }).eq('kode', kode);
  },
  deleteCOA: async (kode) => {
    set((s) => ({ coa: s.coa.filter((c) => c.kode !== kode) }));
    await supabase.from('coa').delete().eq('kode', kode);
  },
  addKategoriAkun: async (item) => {
    set((s) => ({ kategoriAkun: [...s.kategoriAkun, item] }));
    await supabase.from('kategori_akun').insert({ id: item.id, nama: item.nama, tipe: item.tipe, urutan: item.urutan });
  },
  updateKategoriAkun: async (id, item) => {
    set((s) => ({ kategoriAkun: s.kategoriAkun.map((k) => (k.id === id ? item : k)) }));
    await supabase.from('kategori_akun').update({ nama: item.nama, tipe: item.tipe }).eq('id', id);
  },
  deleteKategoriAkun: async (id) => {
    set((s) => ({ kategoriAkun: s.kategoriAkun.filter(k => k.id !== id) }));
    await supabase.from('kategori_akun').delete().eq('id', id);
  },
  addKategoriMutasi: async (item) => {
    set((s) => ({ kategoriMutasi: [...s.kategoriMutasi, item] }));
    await supabase.from('kategori_mutasi').insert({ id: item.id, nama: item.nama, icon_name: item.iconName, urutan: item.urutan });
  },
  updateKategoriMutasi: async (id, item) => {
    set((s) => ({ kategoriMutasi: s.kategoriMutasi.map((k) => (k.id === id ? item : k)) }));
    await supabase.from('kategori_mutasi').update({ nama: item.nama, icon_name: item.iconName }).eq('id', id);
  },
  deleteKategoriMutasi: async (id) => {
    set((s) => ({ kategoriMutasi: s.kategoriMutasi.filter(k => k.id !== id) }));
    await supabase.from('kategori_mutasi').delete().eq('id', id);
  },

  // 6. CRUD JURNAL & MUTASI
  addJurnal: async (item) => {
    set(s => ({ jurnal: [item, ...s.jurnal] }));
    await supabase.from('jurnal').insert({ id: item.id, tgl: item.tgl, deskripsi: item.desc, sumber_modul: 'jurnal', referensi_id: 'manual' });
    const lines = item.lines.map(l => ({ jurnal_id: item.id, kode_akun: l.kodeAkun, debit: l.debit, kredit: l.kredit }));
    await supabase.from('jurnal_lines').insert(lines);
  },
  deleteJurnal: async (id) => {
    set(s => ({ jurnal: s.jurnal.filter(j => j.id !== id) }));
    await supabase.from('jurnal').delete().eq('id', id);
  },
  addMutasi: async (item) => {
    set(s => ({ mutasi: [item, ...s.mutasi] }));
    await supabase.from('mutasi').insert({ id: item.id, tgl: item.tgl, deskripsi: item.desc, akun_kas: item.akunKas, kategori_mutasi_id: item.katTransaksi, tipe: item.tipe, nominal: item.nominal, status: item.status });
  },
  updateMutasi: async (id, item) => {
    set(s => ({ mutasi: s.mutasi.map(m => m.id === id ? item : m) }));
    await supabase.from('mutasi').update({ tgl: item.tgl, deskripsi: item.desc, akun_kas: item.akunKas, kategori_mutasi_id: item.katTransaksi, tipe: item.tipe, nominal: item.nominal, status: item.status }).eq('id', id);
  },
  deleteMutasi: async (id) => {
    set(s => ({ mutasi: s.mutasi.filter(m => m.id !== id) }));
    await supabase.from('mutasi').delete().eq('id', id);
  },
  processPendingJurnals: async (mutasiIds, lawanAkunMap) => {
    const state = get();
    const updatedMutasi = [...state.mutasi];
    const newJurnals: Jurnal[] = [];

    for (const id of mutasiIds) {
      const mIdx = updatedMutasi.findIndex(m => m.id === id);
      if(mIdx === -1) continue;
      const mut = updatedMutasi[mIdx];
      const lawanAkun = lawanAkunMap[id];
      if(!lawanAkun) continue;

      updatedMutasi[mIdx] = { ...mut, status: 'DONE' };
      await supabase.from('mutasi').update({ status: 'DONE' }).eq('id', id);

      const jId = generateJurnalId();
      const debitKode = mut.tipe === 'masuk' ? mut.akunKas : lawanAkun;
      const kreditKode = mut.tipe === 'masuk' ? lawanAkun : mut.akunKas;

      newJurnals.push({ id: jId, tgl: mut.tgl, desc: mut.desc, lines: [{ kodeAkun: debitKode, debit: mut.nominal, kredit: 0 }, { kodeAkun: kreditKode, debit: 0, kredit: mut.nominal }]});
      await supabase.from('jurnal').insert({ id: jId, tgl: mut.tgl, deskripsi: mut.desc, sumber_modul: 'mutasi', referensi_id: mut.id });
      await supabase.from('jurnal_lines').insert([{ jurnal_id: jId, kode_akun: debitKode, debit: mut.nominal, kredit: 0 }, { jurnal_id: jId, kode_akun: kreditKode, debit: 0, kredit: mut.nominal }]);
    }
    set({ mutasi: updatedMutasi, jurnal: [...newJurnals, ...state.jurnal] });
    toast.success(`${mutasiIds.length} transaksi berhasil diproses ke Jurnal`);
  },

  // 7. CRUD KONTAK, HUTANG & PIUTANG
  addKontak: async (item) => {
    set(s => ({ kontak: [...s.kontak, item] }));
    await supabase.from('kontak').insert({ id: item.id, no: item.no, nama: item.nama, alamat: item.alamat, telp: item.telp, tipe: item.tipe });
  },
  updateKontak: async (id, item) => {
    set(s => ({ kontak: s.kontak.map(k => k.id === id ? item : k) }));
    await supabase.from('kontak').update({ no: item.no, nama: item.nama, alamat: item.alamat, telp: item.telp, tipe: item.tipe }).eq('id', id);
  },
  deleteKontak: async (id) => {
    set(s => ({ kontak: s.kontak.filter(k => k.id !== id) }));
    await supabase.from('kontak').delete().eq('id', id);
  },
  addHutang: async (item) => {
    set(s => ({ hutang: [...s.hutang, item] }));
    await supabase.from('hutang_piutang').insert({ id: item.id, tgl: item.tgl, kontak_id: item.kontakId, deskripsi: item.deskripsi, nominal_total: item.nominalTotal, nominal_terbayar: item.nominalTerbayar, status: item.status, tipe: 'Hutang' });
  },
  deleteHutang: async (id) => {
    set(s => ({ hutang: s.hutang.filter(h => h.id !== id) }));
    await supabase.from('hutang_piutang').delete().eq('id', id);
  },
  prosesPembayaranHutang: async (id, nominal, akunKas) => {
    set(s => ({ hutang: s.hutang.map(h => h.id === id ? { ...h, nominalTerbayar: h.nominalTerbayar + nominal, status: computeStatus(h.nominalTotal, h.nominalTerbayar + nominal) } : h) }));
    const { data } = await supabase.from('hutang_piutang').select('*').eq('id', id).single();
    if(data) {
      const terbayar = data.nominal_terbayar + nominal;
      await supabase.from('hutang_piutang').update({ nominal_terbayar: terbayar, status: computeStatus(data.nominal_total, terbayar) }).eq('id', id);
      const jId = generateJurnalId();
      await supabase.from('jurnal').insert({ id: jId, tgl: new Date().toISOString().split('T')[0], deskripsi: `Pembayaran Hutang: ${data.deskripsi}`, sumber_modul: 'hutang', referensi_id: id });
      await supabase.from('jurnal_lines').insert([{ jurnal_id: jId, kode_akun: '2-1001', debit: nominal, kredit: 0 }, { jurnal_id: jId, kode_akun: akunKas, debit: 0, kredit: nominal }]);
    }
  },
  addPiutang: async (item) => {
    set(s => ({ piutang: [...s.piutang, item] }));
    await supabase.from('hutang_piutang').insert({ id: item.id, tgl: item.tgl, kontak_id: item.kontakId, deskripsi: item.deskripsi, nominal_total: item.nominalTotal, nominal_terbayar: item.nominalTerbayar, status: item.status, tipe: 'Piutang' });
  },
  deletePiutang: async (id) => {
    set(s => ({ piutang: s.piutang.filter(p => p.id !== id) }));
    await supabase.from('hutang_piutang').delete().eq('id', id);
  },
  prosesPembayaranPiutang: async (id, nominal, akunKas) => {
    set(s => ({ piutang: s.piutang.map(p => p.id === id ? { ...p, nominalTerbayar: p.nominalTerbayar + nominal, status: computeStatus(p.nominalTotal, p.nominalTerbayar + nominal) } : p) }));
    const { data } = await supabase.from('hutang_piutang').select('*').eq('id', id).single();
    if(data) {
      const terbayar = data.nominal_terbayar + nominal;
      await supabase.from('hutang_piutang').update({ nominal_terbayar: terbayar, status: computeStatus(data.nominal_total, terbayar) }).eq('id', id);
      const jId = generateJurnalId();
      await supabase.from('jurnal').insert({ id: jId, tgl: new Date().toISOString().split('T')[0], deskripsi: `Pelunasan Piutang: ${data.deskripsi}`, sumber_modul: 'piutang', referensi_id: id });
      await supabase.from('jurnal_lines').insert([{ jurnal_id: jId, kode_akun: akunKas, debit: nominal, kredit: 0 }, { jurnal_id: jId, kode_akun: '1-1101', debit: 0, kredit: nominal }]);
    }
  }
}));