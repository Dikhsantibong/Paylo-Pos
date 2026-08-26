<?php

namespace App\Services\Reporting;

use App\Enums\PaymentMethod;
use App\Models\Transaction;
use App\Models\TransactionItem;
use App\Services\Settings\SettingsRepository;
use App\Support\Database\DateExpression;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

/**
 * Builds the sales / financial report for a given period.
 *
 * One method per section so the screen, the PDF and the spreadsheet all render
 * the exact same numbers from a single payload.
 */
class ReportService
{
    public function __construct(
        private readonly SettingsRepository $settings,
    ) {}

    /** @return array<string, mixed> */
    public function build(ReportPeriod $period): array
    {
        $summary = $this->summary($period);

        return [
            'period' => $period->toArray(),
            'summary' => $summary,
            'timeline' => $this->timeline($period),
            'products' => $this->products($period),
            'categories' => $this->categories($period),
            'payments' => $this->payments($period),
            'cashiers' => $this->cashiers($period),
            'transactions' => $this->transactions($period),
            'shop' => $this->shopProfile(),
        ];
    }

    /**
     * Headline totals plus the same totals for the preceding window.
     *
     * @return array<string, mixed>
     */
    public function summary(ReportPeriod $period): array
    {
        $current = $this->totals($period);
        $previous = $this->totals($period->previous());

        return $current + [
            'previous' => $previous,
            'revenueTrend' => $this->trend($current['revenue'], $previous['revenue']),
            'transactionsTrend' => $this->trend($current['transactions'], $previous['transactions']),
            'profitTrend' => $this->trend($current['grossProfit'], $previous['grossProfit']),
            'netProfitTrend' => $this->trend($current['netProfit'], $previous['netProfit']),
            'expensesTrend' => $this->trend($current['expenses'], $previous['expenses']),
        ];
    }

    /**
     * Revenue over time — hourly for a single day, daily otherwise.
     *
     * @return array<int, array<string, mixed>>
     */
    public function timeline(ReportPeriod $period): array
    {
        $byHour = $period->granularity() === 'hour';
        $expression = $byHour
            ? DateExpression::hour('transactions.created_at')
            : DateExpression::date('transactions.created_at');

        $rows = DB::table('transactions')
            ->leftJoin('transaction_items', 'transaction_items.transaction_id', '=', 'transactions.id')
            ->where('transactions.status', 'completed')
            ->whereBetween('transactions.created_at', [$period->start, $period->end])
            ->groupBy('bucket')
            ->orderBy('bucket')
            ->selectRaw("{$expression} as bucket, COUNT(DISTINCT transactions.id) as transactions, COALESCE(SUM(transaction_items.subtotal), 0) as revenue, COALESCE(SUM(transaction_items.cost_subtotal), 0) as cost")
            ->get();

        return $rows->map(fn ($row) => [
            'bucket' => (string) $row->bucket,
            'label' => $byHour
                ? str_pad((string) $row->bucket, 2, '0', STR_PAD_LEFT).':00'
                : CarbonImmutable::parse($row->bucket)->translatedFormat('d M'),
            'transactions' => (int) $row->transactions,
            'revenue' => (int) $row->revenue,
            'cost' => (int) $row->cost,
            'profit' => (int) $row->revenue - (int) $row->cost,
        ])->all();
    }

    /**
     * Per-product sales with the HPP recorded at the time of each sale.
     *
     * @return array<int, array<string, mixed>>
     */
    public function products(ReportPeriod $period, int $limit = 100): array
    {
        return TransactionItem::query()
            ->whereHas('transaction', fn (Builder $q) => $q
                ->where('status', 'completed')
                ->whereBetween('created_at', [$period->start, $period->end])
            )
            ->selectRaw('product_name, SUM(quantity) as quantity, SUM(subtotal) as revenue, SUM(cost_subtotal) as cost')
            ->groupBy('product_name')
            ->orderByDesc('revenue')
            ->limit($limit)
            ->get()
            ->map(fn ($row) => [
                'name' => $row->product_name,
                'quantity' => (int) $row->quantity,
                'revenue' => (int) $row->revenue,
                'cost' => (int) $row->cost,
                'profit' => (int) $row->revenue - (int) $row->cost,
                'margin_percent' => $row->revenue > 0
                    ? round(((int) $row->revenue - (int) $row->cost) / (int) $row->revenue * 100, 1)
                    : 0.0,
            ])
            ->all();
    }

    /** @return array<int, array<string, mixed>> */
    public function categories(ReportPeriod $period): array
    {
        $rows = DB::table('transaction_items')
            ->join('transactions', 'transaction_items.transaction_id', '=', 'transactions.id')
            ->leftJoin('products', 'transaction_items.product_id', '=', 'products.id')
            ->leftJoin('categories', 'products.category_id', '=', 'categories.id')
            ->where('transactions.status', 'completed')
            ->whereBetween('transactions.created_at', [$period->start, $period->end])
            ->groupBy('categories.name')
            ->selectRaw('COALESCE(categories.name, "Lainnya") as name, SUM(transaction_items.quantity) as quantity, SUM(transaction_items.subtotal) as revenue, SUM(transaction_items.cost_subtotal) as cost')
            ->orderByDesc('revenue')
            ->get();

        $total = (int) $rows->sum('revenue');

        return $rows->map(fn ($row) => [
            'name' => $row->name,
            'quantity' => (int) $row->quantity,
            'revenue' => (int) $row->revenue,
            'profit' => (int) $row->revenue - (int) $row->cost,
            'share' => $total > 0 ? round((int) $row->revenue / $total * 100, 1) : 0.0,
        ])->all();
    }

    /** @return array<int, array<string, mixed>> */
    public function payments(ReportPeriod $period): array
    {
        $rows = Transaction::query()
            ->completed()
            ->whereBetween('created_at', [$period->start, $period->end])
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

    /** @return array<int, array<string, mixed>> */
    public function cashiers(ReportPeriod $period): array
    {
        return DB::table('transactions')
            ->leftJoin('users', 'transactions.user_id', '=', 'users.id')
            ->where('transactions.status', 'completed')
            ->whereBetween('transactions.created_at', [$period->start, $period->end])
            ->groupBy('users.id', 'users.name')
            ->selectRaw('COALESCE(users.name, "—") as name, COUNT(*) as transactions, COALESCE(SUM(transactions.total), 0) as revenue')
            ->orderByDesc('revenue')
            ->get()
            ->map(fn ($row) => [
                'name' => $row->name,
                'transactions' => (int) $row->transactions,
                'revenue' => (int) $row->revenue,
                'average' => $row->transactions > 0 ? (int) round((int) $row->revenue / (int) $row->transactions) : 0,
            ])
            ->all();
    }

    /**
     * Transaction ledger. Capped so a year-long report does not blow up the
     * page; the PDF/Excel exports use the same cap.
     *
     * @return array<int, array<string, mixed>>
     */
    public function transactions(ReportPeriod $period, int $limit = 500): array
    {
        return Transaction::query()
            ->completed()
            ->with(['customer:id,name', 'cashier:id,name'])
            ->withSum('items as cost_total', 'cost_subtotal')
            ->withSum('items as quantity_total', 'quantity')
            ->whereBetween('created_at', [$period->start, $period->end])
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get()
            ->map(fn (Transaction $t) => [
                'id' => $t->id,
                'number' => $t->transaction_number,
                'datetime' => $t->created_at->translatedFormat('d M Y H:i'),
                'date' => $t->created_at->format('Y-m-d'),
                'time' => $t->created_at->format('H:i'),
                'customer' => $t->customer?->name ?? 'Walk-in',
                'cashier' => $t->cashier?->name ?? '—',
                'quantity' => (int) ($t->quantity_total ?? 0),
                'subtotal' => (int) $t->subtotal,
                'discount' => (int) $t->discount,
                'tax' => (int) $t->tax_amount,
                'total' => (int) $t->total,
                'cost' => (int) ($t->cost_total ?? 0),
                'profit' => (int) $t->total - (int) ($t->cost_total ?? 0),
                'payment_method' => $t->payment_method,
                'payment_label' => PaymentMethod::tryFrom($t->payment_method)?->label() ?? ucfirst($t->payment_method),
            ])
            ->all();
    }

    /**
     * Shop identity printed on every export.
     *
     * @return array<string, mixed>
     */
    public function shopProfile(): array
    {
        return [
            'name' => $this->settings->string('shop_name', 'Paylo Coffee'),
            'tagline' => $this->settings->string('shop_tagline'),
            'address' => $this->settings->string('shop_address'),
            'phone' => $this->settings->string('shop_phone'),
            'email' => $this->settings->string('shop_email'),
            'logo_url' => $this->settings->imageUrl('shop_logo'),
            'tax_label' => $this->settings->string('tax_label', 'PPN'),
        ];
    }

    /** @return array<string, int|float> */
    private function totals(ReportPeriod $period): array
    {
        $sales = Transaction::query()
            ->completed()
            ->whereBetween('created_at', [$period->start, $period->end])
            ->selectRaw('COUNT(*) as transactions, COALESCE(SUM(subtotal), 0) as subtotal, COALESCE(SUM(discount), 0) as discount, COALESCE(SUM(tax_amount), 0) as tax, COALESCE(SUM(total), 0) as revenue')
            ->first();

        $items = DB::table('transaction_items')
            ->join('transactions', 'transaction_items.transaction_id', '=', 'transactions.id')
            ->where('transactions.status', 'completed')
            ->whereBetween('transactions.created_at', [$period->start, $period->end])
            ->selectRaw('COALESCE(SUM(transaction_items.quantity), 0) as quantity, COALESCE(SUM(transaction_items.cost_subtotal), 0) as cost')
            ->first();

        $transactions = (int) ($sales->transactions ?? 0);
        $revenue = (int) ($sales->revenue ?? 0);
        $tax = (int) ($sales->tax ?? 0);
        $cost = (int) ($items->cost ?? 0);
        $netRevenue = $revenue - $tax;
        $grossProfit = $netRevenue - $cost;

        $expenses = (int) DB::table('expenses')
            ->whereBetween('date', [$period->start->format('Y-m-d'), $period->end->format('Y-m-d')])
            ->sum('amount');
        
        $netProfit = $grossProfit - $expenses;

        return [
            'transactions' => $transactions,
            'itemsSold' => (int) ($items->quantity ?? 0),
            'subtotal' => (int) ($sales->subtotal ?? 0),
            'discount' => (int) ($sales->discount ?? 0),
            'tax' => $tax,
            'revenue' => $revenue,
            'netRevenue' => $netRevenue,
            'cogs' => $cost,
            'grossProfit' => $grossProfit,
            'expenses' => $expenses,
            'netProfit' => $netProfit,
            'marginPercent' => $netRevenue > 0 ? round($grossProfit / $netRevenue * 100, 1) : 0.0,
            'foodCostPercent' => $netRevenue > 0 ? round($cost / $netRevenue * 100, 1) : 0.0,
            'averageOrderValue' => $transactions > 0 ? (int) round($revenue / $transactions) : 0,
            'averageItemsPerOrder' => $transactions > 0
                ? round((int) ($items->quantity ?? 0) / $transactions, 1)
                : 0.0,
            'dailyAverage' => (int) round($revenue / $period->days()),
        ];
    }

    private function trend(int|float $current, int|float $previous): float
    {
        if ($previous == 0) {
            return $current > 0 ? 100.0 : 0.0;
        }

        return round(($current - $previous) / abs($previous) * 100, 1);
    }
}
