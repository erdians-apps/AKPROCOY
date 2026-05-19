// Di dalam file COA page.tsx, saat merender Kategori Akun:

// ... Logika dependent dropdown (Tipe & Kategori) ...
const tipeAkunTerpilih = form.tipe;
const filteredKategori = kategoriAkun.filter(k => k.tipe === tipeAkunTerpilih);

// Di dalam Modal "Kelola Kategori", tambahkan tombol Reorder:
{kategoriAkun.sort((a,b) => a.urutan - b.urutan).map((k) => (
  <div key={k.id} className="flex items-center justify-between p-2 border-b">
    <div className="flex flex-col">
       <span className="text-sm font-semibold">{k.nama}</span>
       <span className="text-xs text-muted-foreground">{k.tipe}</span>
    </div>
    <div className="flex items-center gap-1">
       {/* Tombol Pindah Posisi (Sangat Cepat Optimistic) */}
       <Button variant="ghost" size="icon" onClick={() => moveKategoriAkun(k.id, 'up')}><ChevronUp className="w-3 h-3" /></Button>
       <Button variant="ghost" size="icon" onClick={() => moveKategoriAkun(k.id, 'down')}><ChevronDown className="w-3 h-3" /></Button>
       <Button variant="ghost" size="icon" className="text-red-500" onClick={() => deleteKategoriAkun(k.id)}><Trash2 className="w-3 h-3" /></Button>
    </div>
  </div>
))}