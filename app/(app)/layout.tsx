// Di dalam komponen AppLayout pada app/(app)/layout.tsx
// Cari baris deklarasi const currentUser
const currentUser = useStore((s) => s.currentUser);

// Lalu buat variabel permittedGroups SEBELUM merender SidebarContent
const permittedGroups = navGroups.filter(group => {
  // Developer bisa lihat semua
  if (currentUser?.role === 'developer') return true;
  // User/Staff hanya lihat menu yang ada di permissions array
  return currentUser?.permissions.includes(group.label);
});

// Ganti `navGroups.map(...)` di dalam SidebarContent menjadi `permittedGroups.map(...)`