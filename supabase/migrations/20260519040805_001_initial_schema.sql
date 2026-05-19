/*
  # Initial Schema for Akuntansi Pro Enterprise

  1. New Tables
    - `kategori_akun`: Account categories (e.g., Kas & Setara Kas, Aset Lancar)
      - `id` (text, primary key)
      - `nama` (text, category name)
      - `tipe` (text, account type: Aktiva/Kewajiban/Ekuitas/Pendapatan/Beban)
      - `created_at` (timestamptz)

    - `kategori_mutasi`: Transaction categories (e.g., Penerimaan, Pembayaran)
      - `id` (text, primary key)
      - `nama` (text, category name)
      - `icon_name` (text, Lucide icon name)
      - `created_at` (timestamptz)

    - `kontak`: Contacts (Pelanggan/Supplier)
      - `id` (text, primary key)
      - `no` (text, contact number)
      - `nama` (text, contact name)
      - `alamat` (text, address)
      - `telp` (text, phone)
      - `tipe` (text, Pelanggan or Supplier)
      - `created_at` (timestamptz)

    - `coa`: Chart of Accounts
      - `kode` (text, primary key, account code)
      - `nama` (text, account name)
      - `tipe` (text, account type)
      - `kategori` (text, category name referencing kategori_akun)
      - `saldo_normal` (text, Debit or Kredit)
      - `created_at` (timestamptz)

    - `mutasi`: Cash/Bank transactions
      - `id` (text, primary key)
      - `tgl` (date, transaction date)
      - `deskripsi` (text, description)
      - `akun_kas` (text, cash account code)
      - `kategori_mutasi_id` (text, category reference)
      - `tipe` (text, masuk or keluar)
      - `nominal` (bigint, amount)
      - `status` (text, PENDING or DONE)
      - `created_at` (timestamptz)

    - `hutang_piutang`: Payables and Receivables
      - `id` (text, primary key)
      - `tgl` (date, transaction date)
      - `kontak_id` (text, contact reference)
      - `deskripsi` (text, description)
      - `nominal_total` (bigint, total amount)
      - `nominal_terbayar` (bigint, paid amount)
      - `status` (text, BELUM LUNAS/SEBAGIAN/LUNAS)
      - `tipe` (text, Hutang or Piutang)
      - `created_at` (timestamptz)

    - `jurnal`: Journal entries (single source of truth)
      - `id` (text, primary key)
      - `tgl` (date, entry date)
      - `deskripsi` (text, description)
      - `sumber_modul` (text, source module: jurnal/mutasi/hutang/piutang/aset)
      - `referensi_id` (text, reference to source record)
      - `created_at` (timestamptz)

    - `jurnal_lines`: Journal entry lines (double-entry bookkeeping)
      - `id` (uuid, primary key)
      - `jurnal_id` (text, references jurnal.id)
      - `kode_akun` (text, account code)
      - `debit` (bigint, debit amount)
      - `kredit` (bigint, credit amount)

    - `aset_tetap`: Fixed assets with depreciation
      - `id` (text, primary key)
      - `jurnal_ref` (text, journal reference)
      - `masa_manfaat` (integer, useful life)
      - `tipe_masa` (text, bulan or tahun)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on ALL tables
    - Policies allow authenticated users full CRUD on all tables
    - No unauthenticated access

  3. Indexes
    - Performance indexes on frequently queried columns:
      jurnal(tgl), jurnal_lines(jurnal_id), jurnal_lines(kode_akun),
      mutasi(tgl), mutasi(status), mutasi(akun_kas),
      hutang_piutang(tipe), hutang_piutang(kontak_id), hutang_piutang(status),
      coa(tipe), kontak(tipe)

  4. Important Notes
    1. Column `deskripsi` used instead of `desc` to avoid PostgreSQL reserved keyword conflict
    2. `jurnal_lines` uses UUID primary key for uniqueness across journal entries
    3. `hutang_piutang` combines both AP and AR in one table with `tipe` discriminator
    4. All monetary values use bigint to avoid floating-point precision issues
*/

-- ── Kategori Akun ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kategori_akun (
  id text PRIMARY KEY,
  nama text NOT NULL DEFAULT '',
  tipe text NOT NULL DEFAULT 'Aktiva',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE kategori_akun ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read kategori_akun"
  ON kategori_akun FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert kategori_akun"
  ON kategori_akun FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update kategori_akun"
  ON kategori_akun FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete kategori_akun"
  ON kategori_akun FOR DELETE TO authenticated USING (true);

-- ── Kategori Mutasi ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kategori_mutasi (
  id text PRIMARY KEY,
  nama text NOT NULL DEFAULT '',
  icon_name text NOT NULL DEFAULT 'MoreHorizontal',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE kategori_mutasi ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read kategori_mutasi"
  ON kategori_mutasi FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert kategori_mutasi"
  ON kategori_mutasi FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update kategori_mutasi"
  ON kategori_mutasi FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete kategori_mutasi"
  ON kategori_mutasi FOR DELETE TO authenticated USING (true);

-- ── Kontak ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kontak (
  id text PRIMARY KEY,
  no text NOT NULL DEFAULT '',
  nama text NOT NULL DEFAULT '',
  alamat text NOT NULL DEFAULT '',
  telp text NOT NULL DEFAULT '',
  tipe text NOT NULL DEFAULT 'Pelanggan',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE kontak ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read kontak"
  ON kontak FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert kontak"
  ON kontak FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update kontak"
  ON kontak FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete kontak"
  ON kontak FOR DELETE TO authenticated USING (true);

-- ── Chart of Accounts ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coa (
  kode text PRIMARY KEY,
  nama text NOT NULL DEFAULT '',
  tipe text NOT NULL DEFAULT 'Aktiva',
  kategori text NOT NULL DEFAULT '',
  saldo_normal text NOT NULL DEFAULT 'Debit',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE coa ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read coa"
  ON coa FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert coa"
  ON coa FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update coa"
  ON coa FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete coa"
  ON coa FOR DELETE TO authenticated USING (true);

-- ── Mutasi (Cash/Bank Transactions) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS mutasi (
  id text PRIMARY KEY,
  tgl date NOT NULL DEFAULT CURRENT_DATE,
  deskripsi text NOT NULL DEFAULT '',
  akun_kas text NOT NULL DEFAULT '',
  kategori_mutasi_id text NOT NULL DEFAULT '',
  tipe text NOT NULL DEFAULT 'masuk',
  nominal bigint NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'PENDING',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE mutasi ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read mutasi"
  ON mutasi FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert mutasi"
  ON mutasi FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update mutasi"
  ON mutasi FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete mutasi"
  ON mutasi FOR DELETE TO authenticated USING (true);

-- ── Hutang Piutang (AP/AR) ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hutang_piutang (
  id text PRIMARY KEY,
  tgl date NOT NULL DEFAULT CURRENT_DATE,
  kontak_id text NOT NULL DEFAULT '',
  deskripsi text NOT NULL DEFAULT '',
  nominal_total bigint NOT NULL DEFAULT 0,
  nominal_terbayar bigint NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'BELUM LUNAS',
  tipe text NOT NULL DEFAULT 'Hutang',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE hutang_piutang ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read hutang_piutang"
  ON hutang_piutang FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert hutang_piutang"
  ON hutang_piutang FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update hutang_piutang"
  ON hutang_piutang FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete hutang_piutang"
  ON hutang_piutang FOR DELETE TO authenticated USING (true);

-- ── Jurnal (Single Source of Truth) ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS jurnal (
  id text PRIMARY KEY,
  tgl date NOT NULL DEFAULT CURRENT_DATE,
  deskripsi text NOT NULL DEFAULT '',
  sumber_modul text NOT NULL DEFAULT 'jurnal',
  referensi_id text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE jurnal ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read jurnal"
  ON jurnal FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert jurnal"
  ON jurnal FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update jurnal"
  ON jurnal FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete jurnal"
  ON jurnal FOR DELETE TO authenticated USING (true);

-- ── Jurnal Lines ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS jurnal_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jurnal_id text NOT NULL REFERENCES jurnal(id) ON DELETE CASCADE,
  kode_akun text NOT NULL DEFAULT '',
  debit bigint NOT NULL DEFAULT 0,
  kredit bigint NOT NULL DEFAULT 0
);
ALTER TABLE jurnal_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read jurnal_lines"
  ON jurnal_lines FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert jurnal_lines"
  ON jurnal_lines FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update jurnal_lines"
  ON jurnal_lines FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete jurnal_lines"
  ON jurnal_lines FOR DELETE TO authenticated USING (true);

-- ── Aset Tetap ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS aset_tetap (
  id text PRIMARY KEY,
  jurnal_ref text NOT NULL DEFAULT '',
  masa_manfaat integer NOT NULL DEFAULT 0,
  tipe_masa text NOT NULL DEFAULT 'bulan',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE aset_tetap ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read aset_tetap"
  ON aset_tetap FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert aset_tetap"
  ON aset_tetap FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update aset_tetap"
  ON aset_tetap FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete aset_tetap"
  ON aset_tetap FOR DELETE TO authenticated USING (true);

-- ── Indexes ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_jurnal_tgl ON jurnal(tgl);
CREATE INDEX IF NOT EXISTS idx_jurnal_lines_jurnal_id ON jurnal_lines(jurnal_id);
CREATE INDEX IF NOT EXISTS idx_jurnal_lines_kode_akun ON jurnal_lines(kode_akun);
CREATE INDEX IF NOT EXISTS idx_mutasi_tgl ON mutasi(tgl);
CREATE INDEX IF NOT EXISTS idx_mutasi_status ON mutasi(status);
CREATE INDEX IF NOT EXISTS idx_mutasi_akun_kas ON mutasi(akun_kas);
CREATE INDEX IF NOT EXISTS idx_hutang_piutang_tipe ON hutang_piutang(tipe);
CREATE INDEX IF NOT EXISTS idx_hutang_piutang_kontak_id ON hutang_piutang(kontak_id);
CREATE INDEX IF NOT EXISTS idx_hutang_piutang_status ON hutang_piutang(status);
CREATE INDEX IF NOT EXISTS idx_coa_tipe ON coa(tipe);
CREATE INDEX IF NOT EXISTS idx_kontak_tipe ON kontak(tipe);
