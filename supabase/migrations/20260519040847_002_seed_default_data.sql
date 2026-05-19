/*
  # Seed Default Data

  1. Inserts
    - `kategori_akun`: 10 default account categories across all types
    - `kategori_mutasi`: 6 default transaction categories with Lucide icon names
    - `kontak`: 5 default contacts (3 Pelanggan, 2 Supplier)
    - `coa`: 26 default chart of accounts entries
    - `mutasi`: 4 default cash/bank transactions (2 DONE, 2 PENDING)
    - `hutang_piutang`: 4 default AP/AR entries (2 Hutang, 2 Piutang)
    - `jurnal`: 10 default journal entries
    - `jurnal_lines`: 20 default journal lines (2 per journal entry)
    - `aset_tetap`: 1 default fixed asset entry

  2. Important Notes
    1. Uses ON CONFLICT DO NOTHING to prevent duplicate key errors on re-seed
    2. All IDs match the original Zustand store defaults for consistency
    3. Journal entries serve as the single source of truth for all financial data
*/

-- ── Kategori Akun ──────────────────────────────────────────────────────────
INSERT INTO kategori_akun (id, nama, tipe) VALUES
  ('KA-001', 'Kas & Setara Kas', 'Aktiva'),
  ('KA-002', 'Aset Lancar', 'Aktiva'),
  ('KA-003', 'Aset Tetap', 'Aktiva'),
  ('KA-004', 'Kewajiban Lancar', 'Kewajiban'),
  ('KA-005', 'Kewajiban Jangka Panjang', 'Kewajiban'),
  ('KA-006', 'Ekuitas', 'Ekuitas'),
  ('KA-007', 'Pendapatan', 'Pendapatan'),
  ('KA-008', 'Pendapatan Lain-Lain', 'Pendapatan'),
  ('KA-009', 'Beban Operasional', 'Beban'),
  ('KA-010', 'Beban Lain-Lain', 'Beban')
ON CONFLICT (id) DO NOTHING;

-- ── Kategori Mutasi ────────────────────────────────────────────────────────
INSERT INTO kategori_mutasi (id, nama, icon_name) VALUES
  ('KM-001', 'Penerimaan', 'ArrowDownToLine'),
  ('KM-002', 'Pembayaran', 'ArrowUpFromLine'),
  ('KM-003', 'Operasional', 'Cog'),
  ('KM-004', 'Investasi', 'TrendingUp'),
  ('KM-005', 'Transfer', 'ArrowLeftRight'),
  ('KM-006', 'Lainnya', 'MoreHorizontal')
ON CONFLICT (id) DO NOTHING;

-- ── Kontak ─────────────────────────────────────────────────────────────────
INSERT INTO kontak (id, no, nama, alamat, telp, tipe) VALUES
  ('KON-001', '001', 'PT. Maju Bersama', 'Jl. Sudirman No. 10, Jakarta', '021-5551234', 'Pelanggan'),
  ('KON-002', '002', 'CV. Sejahtera Abadi', 'Jl. Gatot Subroto No. 45, Bandung', '022-7778888', 'Pelanggan'),
  ('KON-003', '003', 'Toko Berkah Jaya', 'Jl. Malioboro No. 3, Yogyakarta', '0274-999000', 'Pelanggan'),
  ('KON-004', '004', 'PT. Sumber Makmur', 'Jl. Ahmad Yani No. 88, Surabaya', '031-3334444', 'Supplier'),
  ('KON-005', '005', 'CV. Mitra Abadi', 'Jl. Diponegoro No. 12, Semarang', '024-6667777', 'Supplier')
ON CONFLICT (id) DO NOTHING;

-- ── Chart of Accounts ──────────────────────────────────────────────────────
INSERT INTO coa (kode, nama, tipe, kategori, saldo_normal) VALUES
  ('1-1001', 'Kas', 'Aktiva', 'Kas & Setara Kas', 'Debit'),
  ('1-1002', 'Bank BCA', 'Aktiva', 'Kas & Setara Kas', 'Debit'),
  ('1-1101', 'Piutang Usaha', 'Aktiva', 'Aset Lancar', 'Debit'),
  ('1-1201', 'Persediaan', 'Aktiva', 'Aset Lancar', 'Debit'),
  ('1-2001', 'Tanah', 'Aktiva', 'Aset Tetap', 'Debit'),
  ('1-2002', 'Bangunan', 'Aktiva', 'Aset Tetap', 'Debit'),
  ('1-2003', 'Kendaraan', 'Aktiva', 'Aset Tetap', 'Debit'),
  ('1-2004', 'Peralatan', 'Aktiva', 'Aset Tetap', 'Debit'),
  ('1-2091', 'Akum. Penyusutan Bangunan', 'Aktiva', 'Aset Tetap', 'Kredit'),
  ('1-2092', 'Akum. Penyusutan Kendaraan', 'Aktiva', 'Aset Tetap', 'Kredit'),
  ('2-1001', 'Utang Usaha', 'Kewajiban', 'Kewajiban Lancar', 'Kredit'),
  ('2-1002', 'Utang Pajak', 'Kewajiban', 'Kewajiban Lancar', 'Kredit'),
  ('2-2001', 'Utang Bank Jangka Panjang', 'Kewajiban', 'Kewajiban Jangka Panjang', 'Kredit'),
  ('3-1001', 'Modal Disetor', 'Ekuitas', 'Ekuitas', 'Kredit'),
  ('3-1002', 'Laba Ditahan', 'Ekuitas', 'Ekuitas', 'Kredit'),
  ('3-1003', 'Laba/Rugi Berjalan', 'Ekuitas', 'Ekuitas', 'Kredit'),
  ('4-1001', 'Pendapatan Usaha', 'Pendapatan', 'Pendapatan', 'Kredit'),
  ('4-1002', 'Pendapatan Jasa', 'Pendapatan', 'Pendapatan', 'Kredit'),
  ('4-2001', 'Pendapatan Lain-Lain', 'Pendapatan', 'Pendapatan Lain-Lain', 'Kredit'),
  ('5-1001', 'Beban Gaji', 'Beban', 'Beban Operasional', 'Debit'),
  ('5-1002', 'Beban Sewa', 'Beban', 'Beban Operasional', 'Debit'),
  ('5-1003', 'Beban Listrik & Air', 'Beban', 'Beban Operasional', 'Debit'),
  ('5-1004', 'Beban Perlengkapan', 'Beban', 'Beban Operasional', 'Debit'),
  ('5-1005', 'Beban Penyusutan', 'Beban', 'Beban Operasional', 'Debit'),
  ('5-2001', 'Beban Bunga', 'Beban', 'Beban Lain-Lain', 'Debit'),
  ('5-2002', 'Beban Pajak', 'Beban', 'Beban Lain-Lain', 'Debit')
ON CONFLICT (kode) DO NOTHING;

-- ── Mutasi ─────────────────────────────────────────────────────────────────
INSERT INTO mutasi (id, tgl, deskripsi, akun_kas, kategori_mutasi_id, tipe, nominal, status) VALUES
  ('MT-001', '2026-01-08', 'Terima Pembayaran Customer A', '1-1002', 'Penerimaan', 'masuk', 5000000, 'DONE'),
  ('MT-002', '2026-01-12', 'Bayar Supplier B', '1-1001', 'Pembayaran', 'keluar', 2500000, 'DONE'),
  ('MT-003', '2026-02-05', 'Terima DP Proyek C', '1-1002', 'Penerimaan', 'masuk', 10000000, 'PENDING'),
  ('MT-004', '2026-02-18', 'Biaya Operasional', '1-1001', 'Operasional', 'keluar', 750000, 'PENDING')
ON CONFLICT (id) DO NOTHING;

-- ── Hutang Piutang ─────────────────────────────────────────────────────────
INSERT INTO hutang_piutang (id, tgl, kontak_id, deskripsi, nominal_total, nominal_terbayar, status, tipe) VALUES
  ('AP-001', '2026-01-15', 'KON-004', 'Pembelian Bahan Baku', 15000000, 5000000, 'SEBAGIAN', 'Hutang'),
  ('AP-002', '2026-02-20', 'KON-005', 'Jasa Konsultasi IT', 8000000, 0, 'BELUM LUNAS', 'Hutang'),
  ('AR-001', '2026-01-10', 'KON-001', 'Invoice Jasa Konsultasi Jan', 25000000, 10000000, 'SEBAGIAN', 'Piutang'),
  ('AR-002', '2026-02-05', 'KON-002', 'Invoice Pengadaan Sistem', 35000000, 0, 'BELUM LUNAS', 'Piutang')
ON CONFLICT (id) DO NOTHING;

-- ── Jurnal ─────────────────────────────────────────────────────────────────
INSERT INTO jurnal (id, tgl, deskripsi, sumber_modul, referensi_id) VALUES
  ('JU-001', '2026-01-05', 'Setoran Modal Awal', 'jurnal', ''),
  ('JU-002', '2026-01-10', 'Pendapatan Jasa Konsultasi', 'jurnal', ''),
  ('JU-003', '2026-01-15', 'Pembayaran Beban Gaji', 'jurnal', ''),
  ('JU-004', '2026-01-20', 'Pembelian Peralatan', 'jurnal', ''),
  ('JU-005', '2026-01-25', 'Pendapatan Usaha Penjualan', 'jurnal', ''),
  ('JU-006', '2026-02-03', 'Pembayaran Beban Sewa Kantor', 'jurnal', ''),
  ('JU-007', '2026-02-10', 'Pendapatan Jasa Februari', 'jurnal', ''),
  ('JU-008', '2026-02-15', 'Pembayaran Beban Gaji Februari', 'jurnal', ''),
  ('JU-009', '2026-03-05', 'Pendapatan Usaha Maret', 'jurnal', ''),
  ('JU-010', '2026-03-20', 'Beban Listrik & Air', 'jurnal', '')
ON CONFLICT (id) DO NOTHING;

-- ── Jurnal Lines ───────────────────────────────────────────────────────────
INSERT INTO jurnal_lines (jurnal_id, kode_akun, debit, kredit) VALUES
  ('JU-001', '1-1001', 50000000, 0),
  ('JU-001', '3-1001', 0, 50000000),
  ('JU-002', '1-1001', 15000000, 0),
  ('JU-002', '4-1002', 0, 15000000),
  ('JU-003', '5-1001', 8000000, 0),
  ('JU-003', '1-1001', 0, 8000000),
  ('JU-004', '1-2004', 12000000, 0),
  ('JU-004', '1-1002', 0, 12000000),
  ('JU-005', '1-1002', 22000000, 0),
  ('JU-005', '4-1001', 0, 22000000),
  ('JU-006', '5-1002', 3500000, 0),
  ('JU-006', '1-1001', 0, 3500000),
  ('JU-007', '1-1001', 18000000, 0),
  ('JU-007', '4-1002', 0, 18000000),
  ('JU-008', '5-1001', 8000000, 0),
  ('JU-008', '1-1001', 0, 8000000),
  ('JU-009', '1-1002', 25000000, 0),
  ('JU-009', '4-1001', 0, 25000000),
  ('JU-010', '5-1003', 1200000, 0),
  ('JU-010', '1-1001', 0, 1200000)
ON CONFLICT DO NOTHING;

-- ── Aset Tetap ────────────────────────────────────────────────────────────
INSERT INTO aset_tetap (id, jurnal_ref, masa_manfaat, tipe_masa) VALUES
  ('JU-004', 'JU-004', 48, 'bulan')
ON CONFLICT (id) DO NOTHING;
