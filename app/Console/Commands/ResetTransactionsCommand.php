<?php

namespace App\Console\Commands;

use App\Models\Customer;
use App\Models\Ingredient;
use App\Models\IngredientEntry;
use App\Models\Transaction;
use App\Models\TransactionItem;
use App\Models\TransactionItemAddon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Wipe trading history and keep the master data.
 *
 * The point in a shop's life this exists for: the menu, recipes and ingredient
 * prices are set up and correct, but the transactions in the database are test
 * sales from the trial run. Going live means the dashboard and reports must
 * start from zero without rebuilding the catalogue.
 *
 * Stock consumed by those test sales is put back by default, because a sale
 * that is being erased never really took the beans out of the jar.
 */
class ResetTransactionsCommand extends Command
{
    protected $signature = 'paylo:reset-transactions
                            {--force : Lewati konfirmasi}
                            {--keep-stock : Jangan kembalikan stok bahan yang terpakai}
                            {--customers : Hapus juga data pelanggan}';

    protected $description = 'Hapus seluruh data transaksi dan sisakan data master (produk, resep, bahan, pengaturan)';

    public function handle(): int
    {
        $counts = $this->counts();

        if (array_sum($counts) === 0) {
            $this->components->info('Tidak ada data transaksi. Database sudah bersih.');

            return self::SUCCESS;
        }

        $this->newLine();
        $this->components->warn('Data berikut akan DIHAPUS PERMANEN:');

        $this->table(
            ['Data', 'Jumlah'],
            collect($counts)
                ->filter()
                ->map(fn ($count, $label) => [$label, number_format($count, 0, ',', '.')])
                ->values()
                ->all(),
        );

        $this->components->info('Data master tetap utuh: kategori, produk, varian, resep, bahan baku, add-on, pengguna, dan pengaturan.');
        $this->newLine();

        if (! $this->option('force') && ! $this->confirm('Lanjutkan?', false)) {
            $this->components->info('Dibatalkan. Tidak ada yang dihapus.');

            return self::SUCCESS;
        }

        $restored = DB::transaction(fn () => $this->purge());

        $this->newLine();
        $this->components->info('Data transaksi dihapus.');

        if ($restored > 0) {
            $this->components->info("Stok {$restored} bahan dikembalikan ke jumlah sebelum transaksi uji.");
        }

        $this->components->info('Dashboard dan laporan sekarang mulai dari nol.');
        $this->newLine();

        return self::SUCCESS;
    }

    /** @return array<string, int> */
    private function counts(): array
    {
        return [
            'Transaksi' => Transaction::count(),
            'Item transaksi' => TransactionItem::count(),
            'Add-on pada item' => TransactionItemAddon::count(),
            'Riwayat stok dari penjualan' => IngredientEntry::where('reference_type', 'transaction')->count(),
            'Pelanggan' => $this->option('customers') ? Customer::count() : 0,
        ];
    }

    /**
     * @return int number of ingredients whose stock was restored
     */
    private function purge(): int
    {
        $restored = $this->option('keep-stock') ? 0 : $this->restoreStock();

        // Children first: the schema cascades, but being explicit keeps this
        // correct even on a connection with foreign keys disabled.
        TransactionItemAddon::query()->delete();
        TransactionItem::query()->delete();
        Transaction::query()->delete();

        IngredientEntry::where('reference_type', 'transaction')->delete();

        if ($this->option('customers')) {
            Customer::query()->delete();
        }

        return $restored;
    }

    /**
     * Add back every gram and millilitre the deleted sales took out.
     */
    private function restoreStock(): int
    {
        $deducted = IngredientEntry::query()
            ->where('reference_type', 'transaction')
            ->where('type', 'out')
            ->selectRaw('ingredient_id, SUM(quantity) as total')
            ->groupBy('ingredient_id')
            ->pluck('total', 'ingredient_id');

        foreach ($deducted as $ingredientId => $quantity) {
            Ingredient::whereKey($ingredientId)->increment('current_stock', (float) $quantity);
        }

        return $deducted->count();
    }
}
