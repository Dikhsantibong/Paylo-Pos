# Arsitektur Paylo

Dokumen ini menjelaskan bagaimana kode Paylo disusun dan di mana menaruh
perubahan berikutnya. Tujuannya satu: menambah fitur baru seharusnya berarti
menambah file, bukan membedah file yang sudah ada.

---

## 1. Peta lapisan

```
routes/            Definisi URL + middleware peran
  └── Controller   Tipis. Validasi lewat FormRequest, delegasi ke Service.
        └── Service    Semua aturan bisnis dan bentuk data
              └── Model    Akses data, relasi, scope
```

Aturan mainnya:

| Lapisan | Boleh berisi | Tidak boleh berisi |
|---|---|---|
| Controller | Ambil dependensi, panggil service, kembalikan `Inertia::render` / `back()` | Query, perhitungan, format angka |
| FormRequest | Aturan validasi dan pesan error | Logika bisnis |
| Service | Query, agregasi, perhitungan, bentuk payload | Referensi ke `request()` global |
| Model | Relasi, cast, scope, helper kecil | Query khusus laporan |

---

## 2. Backend

### `app/Enums`

| Enum | Fungsi |
|---|---|
| `Role` | `owner`, `kasir`. Peran barista sudah dihapus. |
| `PaymentMethod` | Daftar metode + label, deskripsi, dan `requiresTenderedAmount()`. |
| `TransactionStatus` | Status transaksi. |

Menambah metode pembayaran = tambahkan case di `PaymentMethod`, lalu tambahkan
setting `payment_<value>` di `config/paylo.php`. Layar kasir, pengaturan,
dashboard, dan laporan otomatis ikut.

### `app/Services`

| Service | Tanggung jawab |
|---|---|
| `Settings\SettingsRepository` | Baca/tulis tabel `settings` dengan tipe + default dari `config/paylo.php`, di-cache, plus upload logo. |
| `Pos\CheckoutService` | Mengubah keranjang menjadi transaksi selesai: harga, add-on, diskon, pajak, kembalian, snapshot HPP, pengurangan stok. |
| `Costing\HppService` | Harga pokok penjualan per produk/varian, margin, food cost, harga saran. |
| `Analytics\DashboardService` | Satu method per panel dashboard. |
| `Reporting\ReportPeriod` | Nilai objek untuk rentang laporan + periode pembanding. |
| `Reporting\ReportService` | Satu method per bagian laporan; dipakai layar, PDF, dan Excel. |

### Pengaturan

`config/paylo.php` adalah **satu-satunya** tempat mendaftarkan setting:

```php
'nama_setting' => [
    'type' => 'bool',          // string|text|bool|int|float|image
    'default' => true,
    'group' => 'pos',          // menentukan tab di layar Pengaturan
    'label' => 'Judul',
    'help' => 'Penjelasan singkat',
    'rules' => 'nullable|boolean',
],
```

Setelah itu setting tersebut otomatis:

- punya default sebelum barisnya ada di database,
- tervalidasi di `UpdatePosSettingsRequest`,
- tersedia lewat `Settings::bool('nama_setting')` atau `SettingsRepository`.

Menambahkannya ke layar Pengaturan tinggal menaruh satu `<Toggle>` / `<Field>`
di tab yang sesuai pada `resources/js/pages/settings-pos/index.tsx`.

### Sesi

`ConfigureSessionLifetime` berjalan **sebelum** `StartSession` dan menerapkan
setting `session_lifetime`. Nilai `0` berarti tidak pernah kedaluwarsa
(`config('paylo.session_forever_minutes')`, 5 tahun). Selama tab terbuka,
`useSessionKeepAlive` mengirim ping ke `POST /session/heartbeat` sehingga
terminal kasir yang standby tidak diminta login ulang.

### HPP

HPP dihitung dari resep: `recipe.quantity × ingredient.cost_per_unit`. Baris
resep tanpa varian berlaku untuk semua varian; baris dengan varian ditambahkan
khusus untuk varian tersebut.

Saat checkout, `CheckoutService` menyimpan `unit_cost` dan `cost_subtotal` ke
`transaction_items`. Artinya laporan laba historis tetap akurat walaupun harga
bahan baku berubah kemudian — dan dashboard bisa menjumlahkan margin tanpa
menelusuri resep pada setiap request.

### Pengeluaran & Laba Bersih

Pengeluaran operasional dicatat secara bebas (tanpa kategori wajib) lewat layar
Pengeluaran. `ReportService` dan `DashboardService` otomatis mengakumulasi data 
ini berdasarkan rentang tanggal yang dipilih, lalu memotongnya dari Laba Kotor 
(Gross Profit) untuk menghasilkan Laba Bersih (Net Profit).

---

## 3. Frontend

```
resources/js/
├── components/paylo/     Komponen produk: PageHeader, KpiCard, Panel,
│                         DataTable, StatusBadge, EmptyState, MetricBar
├── components/ui/        Primitif shadcn — jangan diubah gayanya per halaman
├── features/pos/         Modul layar kasir (cart, dialog, grid produk)
├── hooks/                use-session-keepalive, use-pwa, use-online-status, …
├── lib/format.ts         rupiah(), percent(), number(), quantity() …
├── pages/                Satu file per rute Inertia
└── types/                Kontrak data yang dikirim backend
```

Aturan mainnya:

- **Jangan** menulis warna literal (`text-blue-600`). Pakai token dari
  `resources/css/app.css` (`text-primary`, `bg-success-soft`, …) supaya mode
  gelap dan perubahan brand berlaku serentak.
- **Jangan** memformat angka manual. Pakai `@/lib/format` — semua sudah tahan
  terhadap nilai string dari API.
- Halaman menyusun komponen `@/components/paylo`, bukan mendandani ulang
  primitif `ui/`.
- Layar yang kompleks dipecah ke `features/<nama>/` seperti `features/pos`.

Referensi visual lengkap ada di [`design.md`](../design.md).

---

## 4. Data awal (seeder)

`php artisan db:seed` menjalankan `StarterDataSeeder`. Isinya **hanya data
induk** — tidak ada pelanggan dan tidak ada transaksi, sehingga dashboard dan
laporan mulai dari nol.

| Seeder | Isi |
|---|---|
| `SettingsSeeder` | Identitas toko, pajak, metode pembayaran, sesi. Hanya menulis kunci yang belum pernah disimpan. |
| `UserSeeder` | `owner@paylo.com` dan `kasir@paylo.com` (kata sandi `password`), sudah terverifikasi. |
| `CategorySeeder` | Coffee, Non-Coffee, Snack, Pastry. |
| `IngredientSeeder` | 24 bahan baku dengan stok awal dan harga per satuan. |
| `ProductAddonSeeder` | 7 add-on berbayar. |
| `ProductSeeder` | 20 produk, varian ukuran, **dan resepnya**. |

Dua sifat penting:

- **Aman diulang.** Semua memakai `firstOrCreate`. Menjalankan ulang tidak
  menggandakan menu, tidak mereset stok, dan tidak menimpa harga yang sudah
  Anda ubah.
- **Setiap produk punya resep.** HPP, margin, dan pengurangan stok otomatis
  bekerja sejak transaksi pertama, bukan setelah Anda mengisi resep manual.

Menambah menu bawaan cukup menambahkan satu entri di `ProductSeeder::products()`;
`recipe` berlaku untuk semua penjualan, `variant_recipe` ditambahkan khusus untuk
varian tersebut.

---

## 5. Satu layar, satu jenis data

Setiap jenis data induk punya controller dan halamannya sendiri — tidak ada lagi
tab yang menumpuk beberapa entitas dalam satu layar.

| Data | Rute | Controller | Halaman |
|---|---|---|---|
| Produk | `/products` | `ProductController` | `pages/products/index.tsx` |
| Kategori | `/categories` | `CategoryController` | `pages/categories/index.tsx` |
| Add-on | `/product-addons` | `ProductAddonController` | `pages/product-addons/index.tsx` |
| Resep | `/recipes` | `RecipeController` | `pages/recipes/index.tsx` |
| Bahan baku | `/inventory` | `InventoryController` | `pages/inventory/index.tsx` |
| Pelanggan | `/customers` | `CustomerController` | `pages/customers/index.tsx` |
| Pengeluaran | `/expenses` | `ExpenseController` | `pages/expenses/index.tsx` |
| Pengguna | `/users` | `UserController` | `pages/users/index.tsx` |

Semua layar tersebut memakai pola yang sama: `PageHeader` → `Panel` →
`DataTable` → `RowActions`, dengan `Dialog` berisi `Field` dan `SwitchRow` untuk
form tambah/ubah. Menyalin salah satunya adalah cara tercepat membuat modul baru.

---

## 6. Menambah fitur baru

Contoh: menambah modul "Shift kasir".

1. **Migrasi** — `php artisan make:migration create_shifts_table`.
2. **Model** — `app/Models/Shift.php` berisi relasi, cast, dan scope.
3. **Service** — `app/Services/Shift/ShiftService.php` untuk aturan buka/tutup
   shift dan rekap kas.
4. **FormRequest** — `app/Http/Requests/Shift/OpenShiftRequest.php`.
5. **Controller** — tipis, hanya memanggil service.
6. **Route** — tambahkan di `routes/pos.php`, di grup peran yang tepat.
7. **Tipe** — tambahkan tipe di `resources/js/types/pos.ts`.
8. **Halaman** — `resources/js/pages/shifts/index.tsx` memakai `PageHeader`,
   `Panel`, `DataTable`.
9. **Navigasi** — tambahkan satu entri di `resources/js/components/app-sidebar.tsx`
   lengkap dengan `roles`.

Tidak ada file lain yang perlu disentuh.

---

## 7. Perintah harian

```bash
composer dev        # server + queue + vite bersamaan
php artisan migrate
php artisan db:seed          # data awal, aman diulang
npm run build       # aset produksi (service worker hanya aktif di build ini)
composer lint       # Pint
npm run lint        # ESLint + perbaikan otomatis
npm run types:check # TypeScript
php artisan test
```

---

## 8. Catatan operasional

- **Zona waktu.** `APP_TIMEZONE` di `.env` menentukan batas "hari ini" pada
  dashboard dan laporan. Samakan dengan zona waktu outlet.
- **Logo.** Diunggah lewat Pengaturan, disimpan di `storage/app/public/branding`.
  Jalankan `php artisan storage:link` sekali agar bisa diakses publik.
- **PWA.** Service worker (`public/sw.js`) hanya terdaftar pada build produksi
  dan pada origin yang aman (HTTPS atau `localhost`). Aset build dan ikon
  di-cache; halaman HTML tidak pernah di-cache karena membawa token CSRF, dan
  seluruh permintaan non-GET selalu langsung ke jaringan.
- **Halaman `/install`.** Publik dan tanpa login — berisi tombol pasang plus
  langkah manual untuk Android, iOS, dan desktop. Nama, logo, dan alamat
  mengikuti Informasi toko di Pengaturan, jadi tautannya langsung berjenama
  toko. Tautan ini juga tersedia di Pengaturan → Sesi & perangkat.
- **Tidak ada pendaftaran mandiri.** `Features::registration()` dihapus dari
  `config/fortify.php`, sehingga `/register` mengembalikan 404. Akun dibuat
  owner lewat menu Pengguna.
