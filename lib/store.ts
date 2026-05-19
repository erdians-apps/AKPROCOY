'use client';

import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

// ── Types ─────────────────────────────────────────────────────────────────

export type AkunTipe = 'Aktiva' | 'Kewajiban' | 'Ekuitas' | 'Pendapatan' | 'Beban';
export type SaldoNormal = 'Debit' | 'Kredit';

export interface COA {
  kode: string;
  nama: string;
  tipe: AkunTipe;
  kategori2: string;
  saldoNormal: SaldoNormal;
}

export interface JurnalLine {
  kodeAkun: string;
  debit: number;
  kredit: number;
}

export interface Jurnal {
  id: string;
  tgl: string;
  desc: string;
  lines: JurnalLine[];
}

export interface Mutasi {
  id: string;
  tgl: string;
  desc: string;
  akunKas: string;
  katTransaksi: string;
  tipe: 'masuk' | 'keluar';
  nominal: number;
  status: 'PENDING' | 'DONE';
}

export interface Kontak {
  id: string;
  no: string;
  nama: string;
  alamat: string;
  telp: string;
  tipe: 'Pelanggan' | 'Supplier';
}

export interface Aset {
  id: string;
  jurnalRef: string;
  masaManfaat: number;
  tipeMasa: 'bulan' | 'tahun';
}

export interface KategoriMutasi {
  id: string;
  nama: string;
  iconName: string;
}

export interface KategoriAkun {
  id: string;
  nama: string;
  tipe: AkunTipe;
}

export type HutangPiutangStatus = 'BELUM LUNAS' | 'SEBAGIAN' | 'LUNAS';

export interface Hutang {
  id: string;
  tgl: string;
  kontakId: string;
  deskripsi: string;
  nominalTotal: number;
  nominalTerbayar: number;
  status: HutangPiutangStatus;
}

export interface Piutang {
  id: string;
  tgl: string;
  kontakId: string;
  deskripsi: string;
  nominalTotal: number;
  nominalTerbayar: number;
  status: HutangPiutangStatus;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function computeStatus(total: number, terbayar: number): HutangPiutangStatus {
  if (terbayar <= 0) return 'BELUM LUNAS';
  if (terbayar >= total) return 'LUNAS';
  return 'SEBAGIAN';
}

function generateJurnalId(): string {
  return `JU-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
}

// ── State Interface ────────────────────────────────────────────────────────

interface AppState {
  coa: COA[];
  jurnal: Jurnal[];
  mutasi: Mutasi[];
  kontak: Kontak[];
  aset: Aset[];
  kategoriMutasi: KategoriMutasi[];
  kategoriAkun: KategoriAkun[];
  hutang: Hutang[];
  piutang: Piutang[];
  isAuthenticated: boolean;
  loading: boolean;

  login: (user: string, pass: string) => boolean;
  logout: () => void;
  fetchAllData: () => Promise<void>;

  addCOA: (item: COA) => Promise<void>;
  updateCOA: (kode: string, item: COA) => Promise<void>;
  deleteCOA: (kode: string) => Promise<void>;

  addJurnal: (item: Jurnal) => Promise<void>;
  updateJurnal: (id: string, item: Jurnal) => Promise<void>;
  deleteJurnal: (id: string) => Promise<void>;

  addMutasi: (item: Mutasi) => Promise<void>;
  updateMutasi: (id: string, item: Partial<Mutasi>) => Promise<void>;
  updateMutasiStatus: (id: string, status: 'PENDING' | 'DONE') => Promise<void>;
  deleteMutasi: (id: string) => Promise<void>;

  processPendingJurnals: (ids: string[], akunLawanMap: Record<string, string>) => Promise<void>;

  addKontak: (item: Kontak) => Promise<void>;
  updateKontak: (id: string, item: Kontak) => Promise<void>;
  deleteKontak: (id: string) => Promise<void>;

  addHutang: (item: Hutang) => Promise<void>;
  prosesPembayaranHutang: (id: string, nominal: number, akunKas: string) => Promise<void>;

  addPiutang: (item: Piutang) => Promise<void>;
  prosesPembayaranPiutang: (id: string, nominal: number, akunKas: string) => Promise<void>;

  setAset: (id: string, masaManfaat: number, tipeMasa: 'bulan' | 'tahun') => Promise<void>;

  addKategoriMutasi: (item: KategoriMutasi) => Promise<void>;
  updateKategoriMutasi: (id: string, item: KategoriMutasi) => Promise<void>;
  deleteKategoriMutasi: (id: string) => Promise<void>;

  addKategoriAkun: (item: KategoriAkun) => Promise<void>;
  updateKategoriAkun: (id: string, item: KategoriAkun) => Promise<void>;
  deleteKategoriAkun: (id: string) => Promise<void>;

  resetData: () => Promise<void>;
}

// ── Store ───────────────────────────────────────────────────────────────────

export const useStore = create<AppState>()((set, get) => ({
  coa: [],
  jurnal: [],
  mutasi: [],
  kontak: [],
  aset: [],
  kategoriMutasi: [],
  kategoriAkun: [],
  hutang: [],
  piutang: [],
  isAuthenticated: false,
  loading: true,

  login: (user, pass) => {
    if ((user === 'admin' && pass === 'admin123') || (user === 'demo' && pass === 'demo')) {
      set({ isAuthenticated: true });
      return true;
    }
    return false;
  },
  logout: () => set({ isAuthenticated: false }),

  fetchAllData: async () => {
    set({ loading: true });
    try {
      const [coaRes, katAkunRes, katMutasiRes, kontakRes, mutasiRes, hpRes, jurnalRes, asetRes] = await Promise.all([
        supabase.from('coa').select('*').order('kode'),
        supabase.from('kategori_akun').select('*').order('id'),
        supabase.from('kategori_mutasi').select('*').order('id'),
        supabase.from('kontak').select('*').order('id'),
        supabase.from('mutasi').select('*').order('tgl'),
        supabase.from('hutang_piutang').select('*').order('tgl'),
        supabase.from('jurnal').select('*, jurnal_lines(*)').order('tgl'),
        supabase.from('aset_tetap').select('*').order('id'),
      ]);

      const coa: COA[] = (coaRes.data ?? []).map((r: Record<string, unknown>) => ({
        kode: r.kode as string,
        nama: r.nama as string,
        tipe: r.tipe as AkunTipe,
        kategori2: r.kategori as string,
        saldoNormal: r.saldo_normal as SaldoNormal,
      }));

      const kategoriAkun: KategoriAkun[] = (katAkunRes.data ?? []).map((r: Record<string, unknown>) => ({
        id: r.id as string,
        nama: r.nama as string,
        tipe: r.tipe as AkunTipe,
      }));

      const kategoriMutasi: KategoriMutasi[] = (katMutasiRes.data ?? []).map((r: Record<string, unknown>) => ({
        id: r.id as string,
        nama: r.nama as string,
        iconName: r.icon_name as string,
      }));

      const kontak: Kontak[] = (kontakRes.data ?? []).map((r: Record<string, unknown>) => ({
        id: r.id as string,
        no: r.no as string,
        nama: r.nama as string,
        alamat: r.alamat as string,
        telp: r.telp as string,
        tipe: r.tipe as Kontak['tipe'],
      }));

      const mutasi: Mutasi[] = (mutasiRes.data ?? []).map((r: Record<string, unknown>) => ({
        id: r.id as string,
        tgl: r.tgl as string,
        desc: r.deskripsi as string,
        akunKas: r.akun_kas as string,
        katTransaksi: r.kategori_mutasi_id as string,
        tipe: r.tipe as Mutasi['tipe'],
        nominal: r.nominal as number,
        status: r.status as Mutasi['status'],
      }));

      const hutang: Hutang[] = (hpRes.data ?? []).filter((r: Record<string, unknown>) => r.tipe === 'Hutang').map((r: Record<string, unknown>) => ({
        id: r.id as string,
        tgl: r.tgl as string,
        kontakId: r.kontak_id as string,
        deskripsi: r.deskripsi as string,
        nominalTotal: r.nominal_total as number,
        nominalTerbayar: r.nominal_terbayar as number,
        status: r.status as HutangPiutangStatus,
      }));

      const piutang: Piutang[] = (hpRes.data ?? []).filter((r: Record<string, unknown>) => r.tipe === 'Piutang').map((r: Record<string, unknown>) => ({
        id: r.id as string,
        tgl: r.tgl as string,
        kontakId: r.kontak_id as string,
        deskripsi: r.deskripsi as string,
        nominalTotal: r.nominal_total as number,
        nominalTerbayar: r.nominal_terbayar as number,
        status: r.status as HutangPiutangStatus,
      }));

      const jurnal: Jurnal[] = (jurnalRes.data ?? []).map((r: Record<string, unknown>) => ({
        id: r.id as string,
        tgl: r.tgl as string,
        desc: r.deskripsi as string,
        lines: ((r.jurnal_lines as Record<string, unknown>[]) ?? []).map((l: Record<string, unknown>) => ({
          kodeAkun: l.kode_akun as string,
          debit: l.debit as number,
          kredit: l.kredit as number,
        })),
      }));

      const aset: Aset[] = (asetRes.data ?? []).map((r: Record<string, unknown>) => ({
        id: r.id as string,
        jurnalRef: r.jurnal_ref as string,
        masaManfaat: r.masa_manfaat as number,
        tipeMasa: r.tipe_masa as Aset['tipeMasa'],
      }));

      set({ coa, jurnal, mutasi, kontak, aset, kategoriMutasi, kategoriAkun, hutang, piutang, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  // ── COA ──────────────────────────────────────────────────────────────────
  addCOA: async (item) => {
    const { error } = await supabase.from('coa').insert({
      kode: item.kode, nama: item.nama, tipe: item.tipe,
      kategori: item.kategori2, saldo_normal: item.saldoNormal,
    });
    if (!error) set((s) => ({ coa: [...s.coa, item] }));
  },
  updateCOA: async (kode, item) => {
    const { error } = await supabase.from('coa').update({
      nama: item.nama, tipe: item.tipe,
      kategori: item.kategori2, saldo_normal: item.saldoNormal,
    }).eq('kode', kode);
    if (!error) set((s) => ({ coa: s.coa.map((c) => (c.kode === kode ? item : c)) }));
  },
  deleteCOA: async (kode) => {
    const { error } = await supabase.from('coa').delete().eq('kode', kode);
    if (!error) set((s) => ({ coa: s.coa.filter((c) => c.kode !== kode) }));
  },

  // ── Jurnal ───────────────────────────────────────────────────────────────
  addJurnal: async (item) => {
    const { error } = await supabase.from('jurnal').insert({
      id: item.id, tgl: item.tgl, deskripsi: item.desc,
      sumber_modul: 'jurnal', referensi_id: '',
    });
    if (error) return;
    const lines = item.lines.map((l) => ({
      jurnal_id: item.id, kode_akun: l.kodeAkun, debit: l.debit, kredit: l.kredit,
    }));
    const { error: lineError } = await supabase.from('jurnal_lines').insert(lines);
    if (!lineError) set((s) => ({ jurnal: [...s.jurnal, item] }));
  },
  updateJurnal: async (id, item) => {
    const { error } = await supabase.from('jurnal').update({
      tgl: item.tgl, deskripsi: item.desc,
    }).eq('id', id);
    if (error) return;
    await supabase.from('jurnal_lines').delete().eq('jurnal_id', id);
    const lines = item.lines.map((l) => ({
      jurnal_id: id, kode_akun: l.kodeAkun, debit: l.debit, kredit: l.kredit,
    }));
    await supabase.from('jurnal_lines').insert(lines);
    set((s) => ({ jurnal: s.jurnal.map((j) => (j.id === id ? item : j)) }));
  },
  deleteJurnal: async (id) => {
    const { error } = await supabase.from('jurnal').delete().eq('id', id);
    if (!error) set((s) => ({ jurnal: s.jurnal.filter((j) => j.id !== id) }));
  },

  // ── Mutasi ───────────────────────────────────────────────────────────────
  addMutasi: async (item) => {
    const { error } = await supabase.from('mutasi').insert({
      id: item.id, tgl: item.tgl, deskripsi: item.desc,
      akun_kas: item.akunKas, kategori_mutasi_id: item.katTransaksi,
      tipe: item.tipe, nominal: item.nominal, status: item.status,
    });
    if (!error) set((s) => ({ mutasi: [...s.mutasi, item] }));
  },
  updateMutasi: async (id, item) => {
    const updateObj: Record<string, unknown> = {};
    if (item.tgl !== undefined) updateObj.tgl = item.tgl;
    if (item.desc !== undefined) updateObj.deskripsi = item.desc;
    if (item.akunKas !== undefined) updateObj.akun_kas = item.akunKas;
    if (item.katTransaksi !== undefined) updateObj.kategori_mutasi_id = item.katTransaksi;
    if (item.tipe !== undefined) updateObj.tipe = item.tipe;
    if (item.nominal !== undefined) updateObj.nominal = item.nominal;
    if (item.status !== undefined) updateObj.status = item.status;
    const { error } = await supabase.from('mutasi').update(updateObj).eq('id', id);
    if (!error) set((s) => ({ mutasi: s.mutasi.map((m) => (m.id === id ? { ...m, ...item } : m)) }));
  },
  updateMutasiStatus: async (id, status) => {
    const { error } = await supabase.from('mutasi').update({ status }).eq('id', id);
    if (!error) set((s) => ({ mutasi: s.mutasi.map((m) => (m.id === id ? { ...m, status } : m)) }));
  },
  deleteMutasi: async (id) => {
    const { error } = await supabase.from('mutasi').delete().eq('id', id);
    if (!error) set((s) => ({ mutasi: s.mutasi.filter((m) => m.id !== id) }));
  },

  // ── Process Pending Jurnals (Bulk) ───────────────────────────────────────
  processPendingJurnals: async (ids, akunLawanMap) => {
    const state = get();
    const newJurnals: Jurnal[] = [];
    const updatedMutasi = [...state.mutasi];

    for (const mId of ids) {
      const m = state.mutasi.find((x) => x.id === mId);
      if (!m) continue;
      const akunLawan = akunLawanMap[mId];
      if (!akunLawan) continue;

      let lines: JurnalLine[];
      if (m.tipe === 'masuk') {
        lines = [
          { kodeAkun: m.akunKas, debit: m.nominal, kredit: 0 },
          { kodeAkun: akunLawan, debit: 0, kredit: m.nominal },
        ];
      } else {
        lines = [
          { kodeAkun: akunLawan, debit: m.nominal, kredit: 0 },
          { kodeAkun: m.akunKas, debit: 0, kredit: m.nominal },
        ];
      }
      const jId = generateJurnalId();
      const newJurnal: Jurnal = { id: jId, tgl: m.tgl, desc: `[AUTO] ${m.desc}`, lines };
      newJurnals.push(newJurnal);

      await supabase.from('jurnal').insert({
        id: jId, tgl: m.tgl, deskripsi: `[AUTO] ${m.desc}`,
        sumber_modul: 'mutasi', referensi_id: mId,
      });
      const dbLines = lines.map((l) => ({
        jurnal_id: jId, kode_akun: l.kodeAkun, debit: l.debit, kredit: l.kredit,
      }));
      await supabase.from('jurnal_lines').insert(dbLines);
      await supabase.from('mutasi').update({ status: 'DONE' }).eq('id', mId);

      const idx = updatedMutasi.findIndex((x) => x.id === mId);
      if (idx >= 0) updatedMutasi[idx] = { ...updatedMutasi[idx], status: 'DONE' };
    }

    set({ mutasi: updatedMutasi, jurnal: [...state.jurnal, ...newJurnals] });
  },

  // ── Kontak ───────────────────────────────────────────────────────────────
  addKontak: async (item) => {
    const { error } = await supabase.from('kontak').insert({
      id: item.id, no: item.no, nama: item.nama,
      alamat: item.alamat, telp: item.telp, tipe: item.tipe,
    });
    if (!error) set((s) => ({ kontak: [...s.kontak, item] }));
  },
  updateKontak: async (id, item) => {
    const { error } = await supabase.from('kontak').update({
      no: item.no, nama: item.nama, alamat: item.alamat, telp: item.telp, tipe: item.tipe,
    }).eq('id', id);
    if (!error) set((s) => ({ kontak: s.kontak.map((k) => (k.id === id ? item : k)) }));
  },
  deleteKontak: async (id) => {
    const { error } = await supabase.from('kontak').delete().eq('id', id);
    if (!error) set((s) => ({ kontak: s.kontak.filter((k) => k.id !== id) }));
  },

  // ── Hutang (AP) ──────────────────────────────────────────────────────────
  addHutang: async (item) => {
    const { error } = await supabase.from('hutang_piutang').insert({
      id: item.id, tgl: item.tgl, kontak_id: item.kontakId,
      deskripsi: item.deskripsi, nominal_total: item.nominalTotal,
      nominal_terbayar: item.nominalTerbayar, status: item.status, tipe: 'Hutang',
    });
    if (error) return;
    set((s) => ({ hutang: [...s.hutang, item] }));
  },
  prosesPembayaranHutang: async (id, nominal, akunKas) => {
    const state = get();
    const h = state.hutang.find((x) => x.id === id);
    if (!h) return;
    const newTerbayar = Math.min(h.nominalTotal, h.nominalTerbayar + nominal);
    const newStatus = computeStatus(h.nominalTotal, newTerbayar);
    const kontak = state.kontak.find((k) => k.id === h.kontakId);
    const jId = generateJurnalId();
    const bayarNominal = newTerbayar - h.nominalTerbayar;
    const newJurnal: Jurnal = {
      id: jId,
      tgl: new Date().toISOString().split('T')[0],
      desc: `Pelunasan Hutang ${h.id} ke ${kontak?.nama ?? 'Kontak'}`,
      lines: [
        { kodeAkun: '2-1001', debit: bayarNominal, kredit: 0 },
        { kodeAkun: akunKas, debit: 0, kredit: bayarNominal },
      ],
    };

    await supabase.from('hutang_piutang').update({
      nominal_terbayar: newTerbayar, status: newStatus,
    }).eq('id', id);
    await supabase.from('jurnal').insert({
      id: jId, tgl: newJurnal.tgl, deskripsi: newJurnal.desc,
      sumber_modul: 'hutang', referensi_id: id,
    });
    const dbLines = newJurnal.lines.map((l) => ({
      jurnal_id: jId, kode_akun: l.kodeAkun, debit: l.debit, kredit: l.kredit,
    }));
    await supabase.from('jurnal_lines').insert(dbLines);

    set({
      hutang: state.hutang.map((x) => (x.id === id ? { ...x, nominalTerbayar: newTerbayar, status: newStatus } : x)),
      jurnal: [...state.jurnal, newJurnal],
    });
  },

  // ── Piutang (AR) ─────────────────────────────────────────────────────────
  addPiutang: async (item) => {
    const { error } = await supabase.from('hutang_piutang').insert({
      id: item.id, tgl: item.tgl, kontak_id: item.kontakId,
      deskripsi: item.deskripsi, nominal_total: item.nominalTotal,
      nominal_terbayar: item.nominalTerbayar, status: item.status, tipe: 'Piutang',
    });
    if (error) return;
    set((s) => ({ piutang: [...s.piutang, item] }));
  },
  prosesPembayaranPiutang: async (id, nominal, akunKas) => {
    const state = get();
    const p = state.piutang.find((x) => x.id === id);
    if (!p) return;
    const newTerbayar = Math.min(p.nominalTotal, p.nominalTerbayar + nominal);
    const newStatus = computeStatus(p.nominalTotal, newTerbayar);
    const kontak = state.kontak.find((k) => k.id === p.kontakId);
    const jId = generateJurnalId();
    const bayarNominal = newTerbayar - p.nominalTerbayar;
    const newJurnal: Jurnal = {
      id: jId,
      tgl: new Date().toISOString().split('T')[0],
      desc: `Pelunasan Piutang ${p.id} dari ${kontak?.nama ?? 'Kontak'}`,
      lines: [
        { kodeAkun: akunKas, debit: bayarNominal, kredit: 0 },
        { kodeAkun: '1-1101', debit: 0, kredit: bayarNominal },
      ],
    };

    await supabase.from('hutang_piutang').update({
      nominal_terbayar: newTerbayar, status: newStatus,
    }).eq('id', id);
    await supabase.from('jurnal').insert({
      id: jId, tgl: newJurnal.tgl, deskripsi: newJurnal.desc,
      sumber_modul: 'piutang', referensi_id: id,
    });
    const dbLines = newJurnal.lines.map((l) => ({
      jurnal_id: jId, kode_akun: l.kodeAkun, debit: l.debit, kredit: l.kredit,
    }));
    await supabase.from('jurnal_lines').insert(dbLines);

    set({
      piutang: state.piutang.map((x) => (x.id === id ? { ...x, nominalTerbayar: newTerbayar, status: newStatus } : x)),
      jurnal: [...state.jurnal, newJurnal],
    });
  },

  // ── Aset ─────────────────────────────────────────────────────────────────
  setAset: async (id, masaManfaat, tipeMasa) => {
    const existing = get().aset.find((a) => a.id === id);
    if (existing) {
      await supabase.from('aset_tetap').update({ masa_manfaat: masaManfaat, tipe_masa: tipeMasa }).eq('id', id);
      set((s) => ({ aset: s.aset.map((a) => (a.id === id ? { ...a, masaManfaat, tipeMasa } : a)) }));
    } else {
      await supabase.from('aset_tetap').insert({ id, jurnal_ref: id, masa_manfaat: masaManfaat, tipe_masa: tipeMasa });
      set((s) => ({ aset: [...s.aset, { id, jurnalRef: id, masaManfaat, tipeMasa }] }));
    }
  },

  // ── Kategori Mutasi ──────────────────────────────────────────────────────
  addKategoriMutasi: async (item) => {
    const { error } = await supabase.from('kategori_mutasi').insert({
      id: item.id, nama: item.nama, icon_name: item.iconName,
    });
    if (!error) set((s) => ({ kategoriMutasi: [...s.kategoriMutasi, item] }));
  },
  updateKategoriMutasi: async (id, item) => {
    const { error } = await supabase.from('kategori_mutasi').update({
      nama: item.nama, icon_name: item.iconName,
    }).eq('id', id);
    if (!error) set((s) => ({ kategoriMutasi: s.kategoriMutasi.map((k) => (k.id === id ? item : k)) }));
  },
  deleteKategoriMutasi: async (id) => {
    const { error } = await supabase.from('kategori_mutasi').delete().eq('id', id);
    if (!error) set((s) => ({ kategoriMutasi: s.kategoriMutasi.filter((k) => k.id !== id) }));
  },

  // ── Kategori Akun ────────────────────────────────────────────────────────
  addKategoriAkun: async (item) => {
    const { error } = await supabase.from('kategori_akun').insert({
      id: item.id, nama: item.nama, tipe: item.tipe,
    });
    if (!error) set((s) => ({ kategoriAkun: [...s.kategoriAkun, item] }));
  },
  updateKategoriAkun: async (id, item) => {
    const { error } = await supabase.from('kategori_akun').update({
      nama: item.nama, tipe: item.tipe,
    }).eq('id', id);
    if (!error) set((s) => ({ kategoriAkun: s.kategoriAkun.map((k) => (k.id === id ? item : k)) }));
  },
  deleteKategoriAkun: async (id) => {
    const { error } = await supabase.from('kategori_akun').delete().eq('id', id);
    if (!error) set((s) => ({ kategoriAkun: s.kategoriAkun.filter((k) => k.id !== id) }));
  },

  // ── Reset ────────────────────────────────────────────────────────────────
  resetData: async () => {
    await supabase.from('jurnal_lines').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('jurnal').delete().neq('id', '');
    await supabase.from('mutasi').delete().neq('id', '');
    await supabase.from('hutang_piutang').delete().neq('id', '');
    await supabase.from('aset_tetap').delete().neq('id', '');
    await supabase.from('coa').delete().neq('kode', '');
    await supabase.from('kontak').delete().neq('id', '');
    await supabase.from('kategori_akun').delete().neq('id', '');
    await supabase.from('kategori_mutasi').delete().neq('id', '');

    // Re-seed defaults
    const { error: kaErr } = await supabase.from('kategori_akun').insert([
      { id: 'KA-001', nama: 'Kas & Setara Kas', tipe: 'Aktiva' },
      { id: 'KA-002', nama: 'Aset Lancar', tipe: 'Aktiva' },
      { id: 'KA-003', nama: 'Aset Tetap', tipe: 'Aktiva' },
      { id: 'KA-004', nama: 'Kewajiban Lancar', tipe: 'Kewajiban' },
      { id: 'KA-005', nama: 'Kewajiban Jangka Panjang', tipe: 'Kewajiban' },
      { id: 'KA-006', nama: 'Ekuitas', tipe: 'Ekuitas' },
      { id: 'KA-007', nama: 'Pendapatan', tipe: 'Pendapatan' },
      { id: 'KA-008', nama: 'Pendapatan Lain-Lain', tipe: 'Pendapatan' },
      { id: 'KA-009', nama: 'Beban Operasional', tipe: 'Beban' },
      { id: 'KA-010', nama: 'Beban Lain-Lain', tipe: 'Beban' },
    ]);
    if (kaErr) console.error('Reset kategori_akun error:', kaErr);

    await supabase.from('kategori_mutasi').insert([
      { id: 'KM-001', nama: 'Penerimaan', icon_name: 'ArrowDownToLine' },
      { id: 'KM-002', nama: 'Pembayaran', icon_name: 'ArrowUpFromLine' },
      { id: 'KM-003', nama: 'Operasional', icon_name: 'Cog' },
      { id: 'KM-004', nama: 'Investasi', icon_name: 'TrendingUp' },
      { id: 'KM-005', nama: 'Transfer', icon_name: 'ArrowLeftRight' },
      { id: 'KM-006', nama: 'Lainnya', icon_name: 'MoreHorizontal' },
    ]);

    await supabase.from('kontak').insert([
      { id: 'KON-001', no: '001', nama: 'PT. Maju Bersama', alamat: 'Jl. Sudirman No. 10, Jakarta', telp: '021-5551234', tipe: 'Pelanggan' },
      { id: 'KON-002', no: '002', nama: 'CV. Sejahtera Abadi', alamat: 'Jl. Gatot Subroto No. 45, Bandung', telp: '022-7778888', tipe: 'Pelanggan' },
      { id: 'KON-003', no: '003', nama: 'Toko Berkah Jaya', alamat: 'Jl. Malioboro No. 3, Yogyakarta', telp: '0274-999000', tipe: 'Pelanggan' },
      { id: 'KON-004', no: '004', nama: 'PT. Sumber Makmur', alamat: 'Jl. Ahmad Yani No. 88, Surabaya', telp: '031-3334444', tipe: 'Supplier' },
      { id: 'KON-005', no: '005', nama: 'CV. Mitra Abadi', alamat: 'Jl. Diponegoro No. 12, Semarang', telp: '024-6667777', tipe: 'Supplier' },
    ]);

    await supabase.from('coa').insert([
      { kode: '1-1001', nama: 'Kas', tipe: 'Aktiva', kategori: 'Kas & Setara Kas', saldo_normal: 'Debit' },
      { kode: '1-1002', nama: 'Bank BCA', tipe: 'Aktiva', kategori: 'Kas & Setara Kas', saldo_normal: 'Debit' },
      { kode: '1-1101', nama: 'Piutang Usaha', tipe: 'Aktiva', kategori: 'Aset Lancar', saldo_normal: 'Debit' },
      { kode: '1-1201', nama: 'Persediaan', tipe: 'Aktiva', kategori: 'Aset Lancar', saldo_normal: 'Debit' },
      { kode: '1-2001', nama: 'Tanah', tipe: 'Aktiva', kategori: 'Aset Tetap', saldo_normal: 'Debit' },
      { kode: '1-2002', nama: 'Bangunan', tipe: 'Aktiva', kategori: 'Aset Tetap', saldo_normal: 'Debit' },
      { kode: '1-2003', nama: 'Kendaraan', tipe: 'Aktiva', kategori: 'Aset Tetap', saldo_normal: 'Debit' },
      { kode: '1-2004', nama: 'Peralatan', tipe: 'Aktiva', kategori: 'Aset Tetap', saldo_normal: 'Debit' },
      { kode: '1-2091', nama: 'Akum. Penyusutan Bangunan', tipe: 'Aktiva', kategori: 'Aset Tetap', saldo_normal: 'Kredit' },
      { kode: '1-2092', nama: 'Akum. Penyusutan Kendaraan', tipe: 'Aktiva', kategori: 'Aset Tetap', saldo_normal: 'Kredit' },
      { kode: '2-1001', nama: 'Utang Usaha', tipe: 'Kewajiban', kategori: 'Kewajiban Lancar', saldo_normal: 'Kredit' },
      { kode: '2-1002', nama: 'Utang Pajak', tipe: 'Kewajiban', kategori: 'Kewajiban Lancar', saldo_normal: 'Kredit' },
      { kode: '2-2001', nama: 'Utang Bank Jangka Panjang', tipe: 'Kewajiban', kategori: 'Kewajiban Jangka Panjang', saldo_normal: 'Kredit' },
      { kode: '3-1001', nama: 'Modal Disetor', tipe: 'Ekuitas', kategori: 'Ekuitas', saldo_normal: 'Kredit' },
      { kode: '3-1002', nama: 'Laba Ditahan', tipe: 'Ekuitas', kategori: 'Ekuitas', saldo_normal: 'Kredit' },
      { kode: '3-1003', nama: 'Laba/Rugi Berjalan', tipe: 'Ekuitas', kategori: 'Ekuitas', saldo_normal: 'Kredit' },
      { kode: '4-1001', nama: 'Pendapatan Usaha', tipe: 'Pendapatan', kategori: 'Pendapatan', saldo_normal: 'Kredit' },
      { kode: '4-1002', nama: 'Pendapatan Jasa', tipe: 'Pendapatan', kategori: 'Pendapatan', saldo_normal: 'Kredit' },
      { kode: '4-2001', nama: 'Pendapatan Lain-Lain', tipe: 'Pendapatan', kategori: 'Pendapatan Lain-Lain', saldo_normal: 'Kredit' },
      { kode: '5-1001', nama: 'Beban Gaji', tipe: 'Beban', kategori: 'Beban Operasional', saldo_normal: 'Debit' },
      { kode: '5-1002', nama: 'Beban Sewa', tipe: 'Beban', kategori: 'Beban Operasional', saldo_normal: 'Debit' },
      { kode: '5-1003', nama: 'Beban Listrik & Air', tipe: 'Beban', kategori: 'Beban Operasional', saldo_normal: 'Debit' },
      { kode: '5-1004', nama: 'Beban Perlengkapan', tipe: 'Beban', kategori: 'Beban Operasional', saldo_normal: 'Debit' },
      { kode: '5-1005', nama: 'Beban Penyusutan', tipe: 'Beban', kategori: 'Beban Operasional', saldo_normal: 'Debit' },
      { kode: '5-2001', nama: 'Beban Bunga', tipe: 'Beban', kategori: 'Beban Lain-Lain', saldo_normal: 'Debit' },
      { kode: '5-2002', nama: 'Beban Pajak', tipe: 'Beban', kategori: 'Beban Lain-Lain', saldo_normal: 'Debit' },
    ]);

    await supabase.from('mutasi').insert([
      { id: 'MT-001', tgl: '2026-01-08', deskripsi: 'Terima Pembayaran Customer A', akun_kas: '1-1002', kategori_mutasi_id: 'Penerimaan', tipe: 'masuk', nominal: 5000000, status: 'DONE' },
      { id: 'MT-002', tgl: '2026-01-12', deskripsi: 'Bayar Supplier B', akun_kas: '1-1001', kategori_mutasi_id: 'Pembayaran', tipe: 'keluar', nominal: 2500000, status: 'DONE' },
      { id: 'MT-003', tgl: '2026-02-05', deskripsi: 'Terima DP Proyek C', akun_kas: '1-1002', kategori_mutasi_id: 'Penerimaan', tipe: 'masuk', nominal: 10000000, status: 'PENDING' },
      { id: 'MT-004', tgl: '2026-02-18', deskripsi: 'Biaya Operasional', akun_kas: '1-1001', kategori_mutasi_id: 'Operasional', tipe: 'keluar', nominal: 750000, status: 'PENDING' },
    ]);

    await supabase.from('hutang_piutang').insert([
      { id: 'AP-001', tgl: '2026-01-15', kontak_id: 'KON-004', deskripsi: 'Pembelian Bahan Baku', nominal_total: 15000000, nominal_terbayar: 5000000, status: 'SEBAGIAN', tipe: 'Hutang' },
      { id: 'AP-002', tgl: '2026-02-20', kontak_id: 'KON-005', deskripsi: 'Jasa Konsultasi IT', nominal_total: 8000000, nominal_terbayar: 0, status: 'BELUM LUNAS', tipe: 'Hutang' },
      { id: 'AR-001', tgl: '2026-01-10', kontak_id: 'KON-001', deskripsi: 'Invoice Jasa Konsultasi Jan', nominal_total: 25000000, nominal_terbayar: 10000000, status: 'SEBAGIAN', tipe: 'Piutang' },
      { id: 'AR-002', tgl: '2026-02-05', kontak_id: 'KON-002', deskripsi: 'Invoice Pengadaan Sistem', nominal_total: 35000000, nominal_terbayar: 0, status: 'BELUM LUNAS', tipe: 'Piutang' },
    ]);

    await supabase.from('jurnal').insert([
      { id: 'JU-001', tgl: '2026-01-05', deskripsi: 'Setoran Modal Awal', sumber_modul: 'jurnal', referensi_id: '' },
      { id: 'JU-002', tgl: '2026-01-10', deskripsi: 'Pendapatan Jasa Konsultasi', sumber_modul: 'jurnal', referensi_id: '' },
      { id: 'JU-003', tgl: '2026-01-15', deskripsi: 'Pembayaran Beban Gaji', sumber_modul: 'jurnal', referensi_id: '' },
      { id: 'JU-004', tgl: '2026-01-20', deskripsi: 'Pembelian Peralatan', sumber_modul: 'jurnal', referensi_id: '' },
      { id: 'JU-005', tgl: '2026-01-25', deskripsi: 'Pendapatan Usaha Penjualan', sumber_modul: 'jurnal', referensi_id: '' },
      { id: 'JU-006', tgl: '2026-02-03', deskripsi: 'Pembayaran Beban Sewa Kantor', sumber_modul: 'jurnal', referensi_id: '' },
      { id: 'JU-007', tgl: '2026-02-10', deskripsi: 'Pendapatan Jasa Februari', sumber_modul: 'jurnal', referensi_id: '' },
      { id: 'JU-008', tgl: '2026-02-15', deskripsi: 'Pembayaran Beban Gaji Februari', sumber_modul: 'jurnal', referensi_id: '' },
      { id: 'JU-009', tgl: '2026-03-05', deskripsi: 'Pendapatan Usaha Maret', sumber_modul: 'jurnal', referensi_id: '' },
      { id: 'JU-010', tgl: '2026-03-20', deskripsi: 'Beban Listrik & Air', sumber_modul: 'jurnal', referensi_id: '' },
    ]);

    await supabase.from('jurnal_lines').insert([
      { jurnal_id: 'JU-001', kode_akun: '1-1001', debit: 50000000, kredit: 0 },
      { jurnal_id: 'JU-001', kode_akun: '3-1001', debit: 0, kredit: 50000000 },
      { jurnal_id: 'JU-002', kode_akun: '1-1001', debit: 15000000, kredit: 0 },
      { jurnal_id: 'JU-002', kode_akun: '4-1002', debit: 0, kredit: 15000000 },
      { jurnal_id: 'JU-003', kode_akun: '5-1001', debit: 8000000, kredit: 0 },
      { jurnal_id: 'JU-003', kode_akun: '1-1001', debit: 0, kredit: 8000000 },
      { jurnal_id: 'JU-004', kode_akun: '1-2004', debit: 12000000, kredit: 0 },
      { jurnal_id: 'JU-004', kode_akun: '1-1002', debit: 0, kredit: 12000000 },
      { jurnal_id: 'JU-005', kode_akun: '1-1002', debit: 22000000, kredit: 0 },
      { jurnal_id: 'JU-005', kode_akun: '4-1001', debit: 0, kredit: 22000000 },
      { jurnal_id: 'JU-006', kode_akun: '5-1002', debit: 3500000, kredit: 0 },
      { jurnal_id: 'JU-006', kode_akun: '1-1001', debit: 0, kredit: 3500000 },
      { jurnal_id: 'JU-007', kode_akun: '1-1001', debit: 18000000, kredit: 0 },
      { jurnal_id: 'JU-007', kode_akun: '4-1002', debit: 0, kredit: 18000000 },
      { jurnal_id: 'JU-008', kode_akun: '5-1001', debit: 8000000, kredit: 0 },
      { jurnal_id: 'JU-008', kode_akun: '1-1001', debit: 0, kredit: 8000000 },
      { jurnal_id: 'JU-009', kode_akun: '1-1002', debit: 25000000, kredit: 0 },
      { jurnal_id: 'JU-009', kode_akun: '4-1001', debit: 0, kredit: 25000000 },
      { jurnal_id: 'JU-010', kode_akun: '5-1003', debit: 1200000, kredit: 0 },
      { jurnal_id: 'JU-010', kode_akun: '1-1001', debit: 0, kredit: 1200000 },
    ]);

    await supabase.from('aset_tetap').insert({ id: 'JU-004', jurnal_ref: 'JU-004', masa_manfaat: 48, tipe_masa: 'bulan' });

    await get().fetchAllData();
  },
}));
