<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Ingredient extends Model
{
    protected $fillable = [
        'name',
        'unit',
        'current_stock',
        'min_stock',
        'cost_per_unit',
    ];

    protected function casts(): array
    {
        return [
            // Cast to float, not decimal: `decimal` serialises to a JSON
            // string, and the React screens do arithmetic on these values.
            'current_stock' => 'float',
            'min_stock' => 'float',
            'cost_per_unit' => 'integer',
        ];
    }

    public function entries(): HasMany
    {
        return $this->hasMany(IngredientEntry::class);
    }

    public function recipes(): HasMany
    {
        return $this->hasMany(Recipe::class);
    }

    /**
     * Check if stock is below minimum threshold.
     */
    public function isLowStock(): bool
    {
        return $this->current_stock <= $this->min_stock;
    }

    /**
     * Add stock and create an entry log.
     */
    public function addStock(float $quantity, int $userId, ?string $notes = null): IngredientEntry
    {
        $this->increment('current_stock', $quantity);

        return $this->entries()->create([
            'type' => 'in',
            'quantity' => $quantity,
            'reference_type' => 'manual',
            'notes' => $notes,
            'user_id' => $userId,
        ]);
    }

    /**
     * Deduct stock and create an entry log.
     */
    public function deductStock(float $quantity, int $userId, ?string $referenceType = null, ?int $referenceId = null): IngredientEntry
    {
        $this->decrement('current_stock', $quantity);

        return $this->entries()->create([
            'type' => 'out',
            'quantity' => $quantity,
            'reference_type' => $referenceType,
            'reference_id' => $referenceId,
            'user_id' => $userId,
        ]);
    }
}
