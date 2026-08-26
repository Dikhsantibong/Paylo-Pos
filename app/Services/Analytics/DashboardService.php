<?php

namespace App\Services\Analytics;

use App\Enums\PaymentMethod;
use App\Models\Customer;
use App\Models\Ingredient;
use App\Models\Transaction;
use App\Models\TransactionItem;
use App\Support\Database\DateExpression;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

/**
 * Every number on the dashboard.
 *
 * The dashboard shows charts straight away — no filters, no view switcher — so
 * this service returns one complete, self-describing payload per request. Each
 * public method owns a single panel, which keeps them individually testable and
 * makes adding a new panel a one-method change.
 */
class DashboardService
{
    private CarbonImmutable $now;

    public function __construct()
    {
        $this->now = CarbonImmutable::now();
    }

    /** @return array<string, mixed> */
    public function payload(): array
    {
        $salesTrend = $this->salesTrend();
        $hourlyTraffic = $this->hourlyTraffic();
        $topProducts = $this->topProducts();
        $lowStock = $this->lowStock();

        return [
            'generatedAt' => $this->now->toIso8601String(),
            'kpis' => $this->kpis(),
            'salesTrend' => $salesTrend,
            'hourlyTraffic' => $hourlyTraffic,
            'topProducts' => $topProducts,
            'categoryMix' => $this->categoryMix(),
            'paymentMix' => $this->paymentMix(),
            'weekdayPerformance' => $this->weekdayPerformance(),
            'profitTrend' => $this->profitTrend(),
            'lowStock' => $lowStock,
            'recentTransactions' => $this->recentTransactions(),
            'topCustomers' => $this->topCustomers(),
            'highlights' => $this->highlights($salesTrend, $hourlyTraffic, $topProducts, $lowStock),
        ];
    }

    /**
     * Headline figures for today, each with a day-over-day comparison.
     *
     * @return array<string, mixed>
     */
    public function kpis(): array
    {
        $today = $this->aggregate($this->now->startOfDay(), $this->now->endOfDay());
        $yesterday = $this->aggregate(
            $this->now->subDay()->startOfDay(),
            $this->now->subDay()->endOfDay()
        );

        $monthToDate = $this->aggregate($this->now->startOfMonth(), $this->now->endOfDay());

        return [
            'revenue' => $this->metric($today['revenue'], $yesterday['revenue']),
            'transactions' => $this->metric($today['transactions'], $yesterday['transactions']),
            'itemsSold' => $this->metric($today['items'], $yesterday['items']),
            'averageOrder' => $this->metric($today['average'], $yesterday['average']),
            'grossProfit' => $this->metric($today['profit'], $yesterday['profit']),
            'marginPercent' => $today['revenue'] > 0
                ? round($today['profit'] / $today['revenue'] * 100, 1)
                : 0.0,
            'cogs' => $today['cost'],
            'monthToDate' => [
                'revenue' => $monthToDate['revenue'],
                'transactions' => $monthToDate['transactions'],
                'profit' => $monthToDate['profit'],
                'label' => $this->now->translatedFormat('F Y'),
            ],
        ];
    }

    /**
     * Revenue and transaction count per day for the last 14 days, including
     * days with no sales so the line never jumps a gap.
     *
     * @return array<int, array<string, mixed>>
     */
    public function salesTrend(int $days = 14): array
    {
        $start = $this->now->subDays($days - 1)->startOfDay();

        $rows = Transaction::query()
            ->completed()
            ->whereBetween('created_at', [$start, $this->now->endOfDay()])
            ->selectRaw(DateExpression::date('created_at').' as day, COUNT(*) as transactions, COALESCE(SUM(total), 0) as revenue')
            ->groupBy('day')
            ->get()
            ->keyBy('day');

        $series = [];

        for ($i = 0; $i < $days; $i++) {
            $date = $start->addDays($i);
            $row = $rows->get($date->format('Y-m-d'));

            $series[] = [
                'date' => $date->format('Y-m-d'),
                'label' => $date->translatedFormat('d M'),
                'revenue' => (int) ($row->revenue ?? 0),
                'transactions' => (int) ($row->transactions ?? 0),
            ];
        }

        return $series;
    }

    /**
     * Which hours the shop is busiest, averaged over the last 30 days, with
     * today's actual counts overlaid.
     *
     * @return array<string, mixed>
     */
    public function hourlyTraffic(int $days = 30): array
    {
        $start = $this->now->subDays($days - 1)->startOfDay();

        $historic = Transaction::query()
            ->completed()
            ->whereBetween('created_at', [$start, $this->now->endOfDay()])
            ->selectRaw(DateExpression::hour('created_at').' as hour, COUNT(*) as transactions, COALESCE(SUM(total), 0) as revenue')
            ->groupBy('hour')
            ->get()
            ->keyBy('hour');

        $today = Transaction::query()
            ->completed()
            ->whereBetween('created_at', [$this->now->startOfDay(), $this->now->endOfDay()])
            ->selectRaw(DateExpression::hour('created_at').' as hour, COUNT(*) as transactions')
            ->groupBy('hour')
            ->pluck('transactions', 'hour');

        // Only render hours the shop actually trades in, so the chart is not
        // padded with 18 empty bars. Falls back to a sensible café day.
        $activeHours = $historic->keys()->map(fn ($h) => (int) $h)->all();
        $from = $activeHours ? max(0, min($activeHours) - 1) : 7;
        $to = $activeHours ? min(23, max($activeHours) + 1) : 22;

        $series = [];

        for ($hour = $from; $hour <= $to; $hour++) {
            $row = $historic->get($hour);
            $count = (int) ($row->transactions ?? 0);

            $series[] = [
                'hour' => $hour,
                'label' => str_pad((string) $hour, 2, '0', STR_PAD_LEFT).':00',
                'transactions' => $count,
                'average' => $days > 0 ? round($count / $days, 1) : 0,
                'revenue' => (int) ($row->revenue ?? 0),
                'today' => (int) ($today[$hour] ?? 0),
            ];
        }

        $peak = $historic->sortByDesc('transactions')->first();
        $peakToday = $today->sortDesc()->keys()->first();

        return [
            'series' => $series,
            'peakHour' => $peak ? (int) $peak->hour : null,
            'peakHourLabel' => $peak
                ? str_pad((string) $peak->hour, 2, '0', STR_PAD_LEFT).':00 – '.str_pad((string) ($peak->hour + 1), 2, '0', STR_PAD_LEFT).':00'
                : null,
            'peakHourTransactions' => $peak ? (int) $peak->transactions : 0,
            'peakHourToday' => $peakToday !== null ? (int) $peakToday : null,
            'windowDays' => $days,
        ];
    }

    /**
     * Best sellers over the last 30 days by quantity, with revenue and the
     * margin each product actually contributed.
     *
     * @return array<int, array<string, mixed>>
     */
    public function topProducts(int $limit = 8, int $days = 30): array
    {
        return TransactionItem::query()
            ->whereHas('transaction', fn (Builder $q) => $q
                ->where('status', 'completed')
                ->where('created_at', '>=', $this->now->subDays($days))
            )
            ->selectRaw('product_name, SUM(quantity) as quantity, SUM(subtotal) as revenue, SUM(cost_subtotal) as cost')
            ->groupBy('product_name')
            ->orderByDesc('quantity')
            ->limit($limit)
            ->get()
            ->map(fn ($row) => [
                'name' => $row->product_name,
                'quantity' => (int) $row->quantity,
                'revenue' => (int) $row->revenue,
                'profit' => (int) $row->revenue - (int) $row->cost,
                'margin_percent' => $row->revenue > 0
                    ? round(((int) $row->revenue - (int) $row->cost) / (int) $row->revenue * 100, 1)
                    : 0.0,
            ])
            ->all();
    }

    /**
     * Revenue share per product category over the last 30 days.
     *
     * @return array<int, array<string, mixed>>
     */
    public function categoryMix(int $days = 30): array
    {
        $rows = DB::table('transaction_items')
            ->join('transactions', 'transaction_items.transaction_id', '=', 'transactions.id')
            ->leftJoin('products', 'transaction_items.product_id', '=', 'products.id')
            ->leftJoin('categories', 'products.category_id', '=', 'categories.id')
            ->where('transactions.status', 'completed')
            ->where('transactions.created_at', '>=', $this->now->subDays($days))
            ->groupBy('categories.name')
            ->selectRaw('COALESCE(categories.name, "Lainnya") as name, SUM(transaction_items.subtotal) as revenue, SUM(transaction_items.quantity) as quantity')
            ->orderByDesc('revenue')
            ->get();

        $total = (int) $rows->sum('revenue');

        return $rows->map(fn ($row) => [
            'name' => $row->name,
            'revenue' => (int) $row->revenue,
            'quantity' => (int) $row->quantity,
            'share' => $total > 0 ? round((int) $row->revenue / $total * 100, 1) : 0.0,
        ])->all();
    }

    /**
     * How customers pay, over the last 30 days.
     *
     * @return array<int, array<string, mixed>>
     */
    public function paymentMix(int $days = 30): array
    {
        $rows = Transaction::query()
            ->completed()
            ->where('created_at', '>=', $this->now->subDays($days))
            ->selectRaw('payment_method, COUNT(*) as transactions, COALESCE(SUM(total), 0) as revenue')
            ->groupBy('payment_method')
            ->orderByDesc('revenue')
            ->get();

        $total = (int) $rows->sum('revenue');

        return $rows->map(fn ($row) => [
            'method' => $row->payment_method,
            'label' => PaymentMethod::tryFrom($row->payment_method)?->label() ?? ucfirst($row->payment_method),
            'transactions' => (int) $row->transactions,
            'revenue' => (int) $row->revenue,
            'share' => $total > 0 ? round((int) $row->revenue / $total * 100, 1) : 0.0,
        ])->all();
    }

    /**
     * Average revenue per weekday over the last 8 weeks — shows which days of
     * the week carry the shop.
     *
     * @return array<int, array<string, mixed>>
     */
    public function weekdayPerformance(int $weeks = 8): array
    {
        $start = $this->now->subWeeks($weeks)->startOfDay();

        $rows = Transaction::query()
            ->completed()
            ->where('created_at', '>=', $start)
            ->selectRaw(
                DateExpression::weekday('created_at').' as weekday, '
                .'COUNT(DISTINCT '.DateExpression::date('created_at').') as days, '
                .'COALESCE(SUM(total), 0) as revenue, COUNT(*) as transactions'
            )
            ->groupBy('weekday')
            ->get()
            ->keyBy('weekday');

        // MySQL DAYOFWEEK(): 1 = Sunday … 7 = Saturday.
        $names = [2 => 'Sen', 3 => 'Sel', 4 => 'Rab', 5 => 'Kam', 6 => 'Jum', 7 => 'Sab', 1 => 'Min'];
        $series = [];

        foreach ($names as $key => $label) {
            $row = $rows->get($key);
            $days = max(1, (int) ($row->days ?? 1));

            $series[] = [
                'weekday' => $label,
                'revenue' => (int) round((int) ($row->revenue ?? 0) / $days),
                'transactions' => (int) round((int) ($row->transactions ?? 0) / $days),
            ];
        }

        return $series;
    }

    /**
     * Revenue vs. HPP vs. gross profit per day for the last 14 days.
     *
     * @return array<int, array<string, mixed>>
     */
    public function profitTrend(int $days = 14): array
    {
        $start = $this->now->subDays($days - 1)->startOfDay();

        $rows = DB::table('transaction_items')
            ->join('transactions', 'transaction_items.transaction_id', '=', 'transactions.id')
            ->where('transactions.status', 'completed')
            ->whereBetween('transactions.created_at', [$start, $this->now->endOfDay()])
            ->groupBy('day')
            ->selectRaw(DateExpression::date('transactions.created_at').' as day, SUM(transaction_items.subtotal) as revenue, SUM(transaction_items.cost_subtotal) as cost')
            ->get()
            ->keyBy('day');

        $series = [];

        for ($i = 0; $i < $days; $i++) {
            $date = $start->addDays($i);
            $row = $rows->get($date->format('Y-m-d'));

            $revenue = (int) ($row->revenue ?? 0);
            $cost = (int) ($row->cost ?? 0);

            $series[] = [
                'date' => $date->format('Y-m-d'),
                'label' => $date->translatedFormat('d M'),
                'revenue' => $revenue,
                'cost' => $cost,
                'profit' => $revenue - $cost,
            ];
        }

        return $series;
    }

    /**
     * Ingredients at or below their minimum stock level.
     *
     * @return array<int, array<string, mixed>>
     */
    public function lowStock(int $limit = 8): array
    {
        return Ingredient::query()
            ->whereColumn('current_stock', '<=', 'min_stock')
            ->where('min_stock', '>', 0)
            ->orderByRaw('(current_stock / NULLIF(min_stock, 0)) asc')
            ->limit($limit)
            ->get()
            ->map(fn (Ingredient $ingredient) => [
                'id' => $ingredient->id,
                'name' => $ingredient->name,
                'unit' => $ingredient->unit,
                'current_stock' => (float) $ingredient->current_stock,
                'min_stock' => (float) $ingredient->min_stock,
                'ratio' => $ingredient->min_stock > 0
                    ? round((float) $ingredient->current_stock / (float) $ingredient->min_stock * 100)
                    : 0,
                'is_out' => (float) $ingredient->current_stock <= 0,
            ])
            ->all();
    }

    /** @return array<int, array<string, mixed>> */
    public function recentTransactions(int $limit = 8): array
    {
        return Transaction::query()
            ->completed()
            ->with(['customer:id,name', 'cashier:id,name'])
            ->withCount('items')
            ->latest()
            ->limit($limit)
            ->get()
            ->map(fn (Transaction $t) => [
                'id' => $t->id,
                'number' => $t->transaction_number,
                'customer' => $t->customer?->name ?? 'Walk-in',
                'cashier' => $t->cashier?->name,
                'items' => $t->items_count,
                'total' => (int) $t->total,
                'payment_method' => $t->payment_method,
                'payment_label' => PaymentMethod::tryFrom($t->payment_method)?->label() ?? ucfirst($t->payment_method),
                'time' => $t->created_at->format('H:i'),
                'date' => $t->created_at->translatedFormat('d M Y'),
            ])
            ->all();
    }

    /** @return array<int, array<string, mixed>> */
    public function topCustomers(int $limit = 5, int $days = 90): array
    {
        return Customer::query()
            ->select('customers.id', 'customers.name', 'customers.loyalty_points')
            ->join('transactions', 'transactions.customer_id', '=', 'customers.id')
            ->where('transactions.status', 'completed')
            ->where('transactions.created_at', '>=', $this->now->subDays($days))
            ->groupBy('customers.id', 'customers.name', 'customers.loyalty_points')
            ->selectRaw('COUNT(transactions.id) as visits, COALESCE(SUM(transactions.total), 0) as spent')
            ->orderByDesc('spent')
            ->limit($limit)
            ->get()
            ->map(fn ($row) => [
                'id' => $row->id,
                'name' => $row->name,
                'visits' => (int) $row->visits,
                'spent' => (int) $row->spent,
                'loyalty_points' => (int) $row->loyalty_points,
            ])
            ->all();
    }

    /**
     * Plain-language callouts shown above the charts. Takes the already-built
     * panels so nothing is queried twice.
     *
     * @param  array<int, array<string, mixed>>  $salesTrend
     * @param  array<string, mixed>  $hourlyTraffic
     * @param  array<int, array<string, mixed>>  $topProducts
     * @param  array<int, array<string, mixed>>  $lowStock
     * @return array<int, array<string, string>>
     */
    public function highlights(array $salesTrend, array $hourlyTraffic, array $topProducts, array $lowStock): array
    {
        $highlights = [];

        $bestDay = collect($salesTrend)->sortByDesc('revenue')->first();

        if ($bestDay && $bestDay['revenue'] > 0) {
            $highlights[] = [
                'tone' => 'info',
                'title' => 'Hari terbaik 14 hari terakhir',
                'body' => $bestDay['label'].' membukukan '.$this->rupiah($bestDay['revenue']).' dari '.$bestDay['transactions'].' transaksi.',
            ];
        }

        if ($hourlyTraffic['peakHourLabel']) {
            $highlights[] = [
                'tone' => 'info',
                'title' => 'Jam paling ramai',
                'body' => $hourlyTraffic['peakHourLabel'].' — '.$hourlyTraffic['peakHourTransactions'].' transaksi dalam '.$hourlyTraffic['windowDays'].' hari terakhir.',
            ];
        }

        $best = $topProducts[0] ?? null;

        if ($best) {
            $highlights[] = [
                'tone' => 'success',
                'title' => 'Produk terlaris',
                'body' => $best['name'].' terjual '.$best['quantity'].' porsi dengan margin '.number_format($best['margin_percent'], 1, ',', '.').'%.',
            ];
        }

        if ($lowStock !== []) {
            $highlights[] = [
                'tone' => 'warning',
                'title' => count($lowStock).' bahan menipis',
                'body' => 'Segera restock: '.implode(', ', array_slice(array_column($lowStock, 'name'), 0, 3)).'.',
            ];
        }

        return $highlights;
    }

    /**
     * Revenue, cost, transaction and item totals for one window.
     *
     * @return array<string, int|float>
     */
    private function aggregate(CarbonImmutable $from, CarbonImmutable $to): array
    {
        $sales = Transaction::query()
            ->completed()
            ->whereBetween('created_at', [$from, $to])
            ->selectRaw('COUNT(*) as transactions, COALESCE(SUM(total), 0) as revenue')
            ->first();

        $items = DB::table('transaction_items')
            ->join('transactions', 'transaction_items.transaction_id', '=', 'transactions.id')
            ->where('transactions.status', 'completed')
            ->whereBetween('transactions.created_at', [$from, $to])
            ->selectRaw('COALESCE(SUM(transaction_items.quantity), 0) as quantity, COALESCE(SUM(transaction_items.cost_subtotal), 0) as cost')
            ->first();

        $transactions = (int) ($sales->transactions ?? 0);
        $revenue = (int) ($sales->revenue ?? 0);
        $cost = (int) ($items->cost ?? 0);

        return [
            'transactions' => $transactions,
            'revenue' => $revenue,
            'items' => (int) ($items->quantity ?? 0),
            'cost' => $cost,
            'profit' => $revenue - $cost,
            'average' => $transactions > 0 ? (int) round($revenue / $transactions) : 0,
        ];
    }

    /** @return array{value: int|float, previous: int|float, trend: float} */
    private function metric(int|float $current, int|float $previous): array
    {
        return [
            'value' => $current,
            'previous' => $previous,
            'trend' => $this->trend($current, $previous),
        ];
    }

    private function trend(int|float $current, int|float $previous): float
    {
        if ($previous == 0) {
            return $current > 0 ? 100.0 : 0.0;
        }

        return round(($current - $previous) / abs($previous) * 100, 1);
    }

    private function rupiah(int $amount): string
    {
        return 'Rp '.number_format($amount, 0, ',', '.');
    }
}
