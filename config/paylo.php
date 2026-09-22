<?php

use App\Enums\PaymentMethod;

/*
|--------------------------------------------------------------------------
| Paylo Application Settings
|--------------------------------------------------------------------------
|
| Single source of truth for every runtime setting stored in the `settings`
| table. Each entry declares a cast + default, so a new setting only needs to
| be added here — the repository, the request validation and the settings
| screen all read from this definition.
|
| Supported types: string, text, bool, int, float, image
|
*/

return [

    'cache_key' => 'paylo.settings',
    'cache_ttl' => 3600,

    'branding_disk' => 'public',
    'branding_path' => 'branding',

    /**
     * Setting groups rendered on the settings screen, in order.
     */
    'groups' => [
        'shop' => ['label' => 'Informasi toko', 'description' => 'Identitas toko yang tampil di struk dan laporan.'],
        'branding' => ['label' => 'Logo & branding', 'description' => 'Logo yang dipakai aplikasi, struk, dan ekspor laporan.'],
        'tax' => ['label' => 'Pajak', 'description' => 'Perhitungan pajak pada setiap transaksi.'],
        'payment' => ['label' => 'Metode pembayaran', 'description' => 'Metode yang bisa dipilih kasir saat menyelesaikan transaksi.'],
        'pos' => ['label' => 'Perilaku kasir', 'description' => 'Fitur opsional pada layar kasir.'],
        'receipt' => ['label' => 'Struk & printer', 'description' => 'Tampilan struk dan cara Paylo terhubung ke printer thermal.'],
        'session' => ['label' => 'Sesi & perangkat', 'description' => 'Berapa lama kasir tetap login tanpa aktivitas.'],
    ],

    /**
     * key => [type, default, group, label, help, rules]
     */
    'settings' => [
        // Shop -------------------------------------------------
        'shop_name' => [
            'type' => 'string', 'default' => 'Paylo Coffee', 'group' => 'shop',
            'label' => 'Nama toko', 'help' => 'Tampil pada header laporan dan struk.',
            'rules' => 'nullable|string|max:120',
        ],
        'shop_tagline' => [
            'type' => 'string', 'default' => '', 'group' => 'shop',
            'label' => 'Tagline', 'help' => 'Baris pendek di bawah nama toko. Opsional.',
            'rules' => 'nullable|string|max:160',
        ],
        'shop_address' => [
            'type' => 'text', 'default' => '', 'group' => 'shop',
            'label' => 'Alamat', 'help' => '',
            'rules' => 'nullable|string|max:500',
        ],
        'shop_phone' => [
            'type' => 'string', 'default' => '', 'group' => 'shop',
            'label' => 'Telepon', 'help' => '',
            'rules' => 'nullable|string|max:40',
        ],
        'shop_email' => [
            'type' => 'string', 'default' => '', 'group' => 'shop',
            'label' => 'Email', 'help' => '',
            'rules' => 'nullable|email|max:120',
        ],

        // Branding ---------------------------------------------
        'shop_logo' => [
            'type' => 'image', 'default' => '', 'group' => 'branding',
            'label' => 'Logo toko', 'help' => 'PNG, JPG, WEBP atau SVG. Maksimal 2 MB, rasio 1:1 disarankan.',
            'rules' => 'nullable|string|max:255',
        ],

        // Tax --------------------------------------------------
        'tax_enabled' => [
            'type' => 'bool', 'default' => false, 'group' => 'tax',
            'label' => 'Terapkan pajak', 'help' => 'Pajak dihitung dari subtotal setelah diskon.',
            'rules' => 'nullable|boolean',
        ],
        'tax_rate' => [
            'type' => 'float', 'default' => 11, 'group' => 'tax',
            'label' => 'Persentase pajak (%)', 'help' => 'Contoh: 11 untuk PPN 11%.',
            'rules' => 'nullable|numeric|min:0|max:100',
        ],
        'tax_label' => [
            'type' => 'string', 'default' => 'PPN', 'group' => 'tax',
            'label' => 'Label pajak', 'help' => 'Nama yang tampil di struk, misalnya PPN atau Tax.',
            'rules' => 'nullable|string|max:30',
        ],

        // Payment ----------------------------------------------
        'payment_cash' => [
            'type' => 'bool', 'default' => true, 'group' => 'payment',
            'label' => 'Tunai', 'help' => 'Satu-satunya metode yang menghitung kembalian.',
            'rules' => 'nullable|boolean',
        ],
        'payment_qris' => [
            'type' => 'bool', 'default' => true, 'group' => 'payment',
            'label' => 'QRIS', 'help' => 'Dicatat sebagai label. Paylo tidak menerbitkan kode QR.',
            'rules' => 'nullable|boolean',
        ],
        'payment_bank_transfer' => [
            'type' => 'bool', 'default' => false, 'group' => 'payment',
            'label' => 'Transfer bank', 'help' => 'Transfer manual ke rekening toko.',
            'rules' => 'nullable|boolean',
        ],
        'payment_debit_card' => [
            'type' => 'bool', 'default' => true, 'group' => 'payment',
            'label' => 'Kartu debit', 'help' => 'Diproses di mesin EDC, dicatat sebagai label.',
            'rules' => 'nullable|boolean',
        ],
        'payment_credit_card' => [
            'type' => 'bool', 'default' => false, 'group' => 'payment',
            'label' => 'Kartu kredit', 'help' => 'Diproses di mesin EDC, dicatat sebagai label.',
            'rules' => 'nullable|boolean',
        ],

        // POS behaviour ----------------------------------------
        'addon_enabled' => [
            'type' => 'bool', 'default' => true, 'group' => 'pos',
            'label' => 'Add-on produk', 'help' => 'Matikan untuk menyembunyikan seluruh pilihan add-on di layar kasir.',
            'rules' => 'nullable|boolean',
        ],
        'customer_enabled' => [
            'type' => 'bool', 'default' => true, 'group' => 'pos',
            'label' => 'Pilih pelanggan', 'help' => 'Matikan jika semua transaksi dicatat sebagai walk-in.',
            'rules' => 'nullable|boolean',
        ],
        'discount_enabled' => [
            'type' => 'bool', 'default' => true, 'group' => 'pos',
            'label' => 'Diskon manual', 'help' => 'Izinkan kasir memberi diskon nominal pada satu transaksi.',
            'rules' => 'nullable|boolean',
        ],
        'order_note_enabled' => [
            'type' => 'bool', 'default' => true, 'group' => 'pos',
            'label' => 'Catatan pesanan', 'help' => 'Kolom catatan bebas per transaksi.',
            'rules' => 'nullable|boolean',
        ],

        // Receipt ----------------------------------------------
        'receipt_enabled' => [
            'type' => 'bool', 'default' => true, 'group' => 'receipt',
            'label' => 'Tampilkan struk setelah transaksi', 'help' => 'Struk muncul otomatis dan siap dicetak.',
            'rules' => 'nullable|boolean',
        ],
        'receipt_footer' => [
            'type' => 'text', 'default' => 'Terima kasih atas kunjungan Anda.', 'group' => 'receipt',
            'label' => 'Catatan kaki struk', 'help' => '',
            'rules' => 'nullable|string|max:300',
        ],
        'printer_name' => [
            'type' => 'string', 'default' => '', 'group' => 'receipt',
            'label' => 'Nama printer', 'help' => 'Nama perangkat seperti yang terlihat saat pairing. Dipakai untuk menyambung ulang otomatis.',
            'rules' => 'nullable|string|max:120',
        ],
        'printer_transport' => [
            'type' => 'string', 'default' => 'auto', 'group' => 'receipt',
            'label' => 'Jalur printer', 'help' => 'Cara Paylo mengirim struk ke printer. Otomatis memilih jalur terbaik yang didukung perangkat ini.',
            'rules' => 'nullable|string|in:auto,bluetooth,usb,serial,rawbt,browser',
        ],
        'printer_paper' => [
            'type' => 'int', 'default' => 58, 'group' => 'receipt',
            'label' => 'Lebar kertas (mm)', 'help' => '58 mm = 32 karakter, 80 mm = 48 karakter.',
            'rules' => 'nullable|integer|in:58,80',
        ],
        'printer_auto_print' => [
            'type' => 'bool', 'default' => false, 'group' => 'receipt',
            'label' => 'Cetak otomatis setelah bayar', 'help' => 'Struk langsung dikirim ke printer begitu transaksi tersimpan, tanpa kasir menekan tombol.',
            'rules' => 'nullable|boolean',
        ],
        'printer_copies' => [
            'type' => 'int', 'default' => 1, 'group' => 'receipt',
            'label' => 'Jumlah salinan', 'help' => 'Salinan kedua dan seterusnya ditandai "SALINAN".',
            'rules' => 'nullable|integer|min:1|max:5',
        ],
        'printer_cut' => [
            'type' => 'bool', 'default' => true, 'group' => 'receipt',
            'label' => 'Potong kertas otomatis', 'help' => 'Matikan jika printer tidak punya pemotong — kertas akan dimajukan saja.',
            'rules' => 'nullable|boolean',
        ],
        'printer_beep' => [
            'type' => 'bool', 'default' => false, 'group' => 'receipt',
            'label' => 'Bunyikan buzzer', 'help' => 'Menandai struk selesai dicetak. Diabaikan printer tanpa buzzer.',
            'rules' => 'nullable|boolean',
        ],

        // Session ----------------------------------------------
        'session_lifetime' => [
            'type' => 'int', 'default' => 0, 'group' => 'session',
            'label' => 'Batas sesi tidak aktif (menit)', 'help' => 'Isi 0 agar kasir tidak pernah logout otomatis — cocok untuk terminal yang standby seharian.',
            'rules' => 'nullable|integer|min:0|max:525600',
        ],
        'session_keepalive' => [
            'type' => 'bool', 'default' => true, 'group' => 'session',
            'label' => 'Jaga sesi tetap hidup', 'help' => 'Aplikasi mengirim sinyal berkala selama tab terbuka sehingga sesi tidak putus.',
            'rules' => 'nullable|boolean',
        ],
    ],

    /**
     * Session lifetime (minutes) used when the operator picks "never expire".
     * Five years — effectively permanent for a dedicated POS terminal.
     */
    'session_forever_minutes' => 2628000,

    'payment_methods' => PaymentMethod::class,
];
