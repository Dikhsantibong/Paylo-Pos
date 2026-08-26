<?php

namespace Database\Seeders;

use App\Models\Setting;
use App\Services\Settings\SettingsRepository;
use Illuminate\Database\Seeder;

/**
 * Sensible opening configuration.
 *
 * Only keys that have never been saved are written, so re-running the seeder
 * never overwrites something the owner has already tuned in Pengaturan. Keys
 * absent from this list keep the defaults declared in config/paylo.php.
 */
class SettingsSeeder extends Seeder
{
    private const STARTER = [
        'shop_name' => 'Paylo Coffee',
        'shop_tagline' => 'Specialty coffee & roastery',
        'shop_address' => 'Jl. Kopi Nusantara No. 1, Bandung',
        'shop_phone' => '0812-0000-0000',

        // Most small coffee shops quote prices already inclusive of tax, so tax
        // starts off. Switch it on in Pengaturan → Pajak when needed.
        'tax_enabled' => false,
        'tax_rate' => 11,
        'tax_label' => 'PPN',

        'payment_cash' => true,
        'payment_qris' => true,
        'payment_debit_card' => true,
        'payment_bank_transfer' => false,
        'payment_credit_card' => false,

        'addon_enabled' => true,
        'customer_enabled' => true,
        'discount_enabled' => true,
        'order_note_enabled' => true,

        'receipt_enabled' => true,
        'receipt_footer' => 'Terima kasih atas kunjungan Anda.',

        // A cashier terminal should stay signed in for the whole shift.
        'session_lifetime' => 0,
        'session_keepalive' => true,
    ];

    public function run(): void
    {
        $existing = Setting::query()->pluck('key')->all();

        $missing = array_diff_key(self::STARTER, array_flip($existing));

        if ($missing === []) {
            $this->command?->line('Pengaturan sudah ada, tidak diubah.');

            return;
        }

        app(SettingsRepository::class)->put($missing);

        $this->command?->info(count($missing).' pengaturan awal disimpan.');
    }
}
