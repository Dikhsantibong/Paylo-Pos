<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TransactionItemAddon extends Model
{
    protected $fillable = [
        'transaction_item_id',
        'product_addon_id',
        'addon_name',
        'addon_price',
        'quantity',
    ];

    protected function casts(): array
    {
        return [
            'addon_price' => 'integer',
            'quantity' => 'integer',
        ];
    }

    public function transactionItem(): BelongsTo
    {
        return $this->belongsTo(TransactionItem::class);
    }

    public function productAddon(): BelongsTo
    {
        return $this->belongsTo(ProductAddon::class);
    }
}
