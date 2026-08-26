<?php

namespace App\Enums;

enum TransactionStatus: string
{
    case Completed = 'completed';
    case Voided = 'voided';
    case Held = 'held';

    public function label(): string
    {
        return match ($this) {
            self::Completed => 'Selesai',
            self::Voided => 'Dibatalkan',
            self::Held => 'Ditahan',
        };
    }
}
