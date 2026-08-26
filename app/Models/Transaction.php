<?php

namespace App\Models;

use App\Enums\PaymentMethod;
use App\Enums\TransactionStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Transaction extends Model
{
    protected $fillable = [
        'transaction_number',
        'customer_id',
        'user_id',
        'subtotal',
        'tax_rate',
        'tax_amount',
        'discount',
        'total',
        'payment_method',
        'payment_amount',
        'change_amount',
        'status',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'subtotal' => 'integer',
            'tax_rate' => 'float',
            'tax_amount' => 'integer',
            'discount' => 'integer',
            'total' => 'integer',
            'payment_amount' => 'integer',
            'change_amount' => 'integer',
        ];
    }

    // -- Relationships -------------------------------------

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function cashier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(TransactionItem::class);
    }

    // -- Scopes --------------------------------------------

    public function scopeCompleted(Builder $query): Builder
    {
        return $query->where('status', TransactionStatus::Completed->value);
    }

    public function scopeBetween(Builder $query, mixed $from, mixed $to): Builder
    {
        return $query->whereBetween('created_at', [$from, $to]);
    }

    // -- Derived attributes --------------------------------

    /** Label for the payment method, e.g. "Kartu Debit". */
    protected function paymentMethodLabel(): Attribute
    {
        return Attribute::get(
            fn () => PaymentMethod::tryFrom($this->payment_method)?->label()
                ?? ucfirst(str_replace('_', ' ', (string) $this->payment_method))
        );
    }

    /** HPP of the whole basket, snapshotted per line at checkout. */
    protected function cost(): Attribute
    {
        return Attribute::get(fn () => (int) $this->items->sum('cost_subtotal'));
    }

    /** Revenue minus HPP. */
    protected function grossProfit(): Attribute
    {
        return Attribute::get(fn () => (int) $this->total - $this->cost);
    }

    /**
     * Generate a unique transaction number: TRX-YYYYMMDD-XXXX
     */
    public static function generateNumber(): string
    {
        $prefix = 'TRX-'.now()->format('Ymd').'-';

        $latest = static::query()
            ->where('transaction_number', 'like', "{$prefix}%")
            ->orderByDesc('transaction_number')
            ->value('transaction_number');

        $next = $latest ? ((int) substr($latest, -4)) + 1 : 1;

        return $prefix.str_pad((string) $next, 4, '0', STR_PAD_LEFT);
    }
}
