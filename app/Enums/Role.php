<?php

namespace App\Enums;

/**
 * Application roles.
 *
 * The `barista` role was removed — the order flow now completes at the cashier.
 */
enum Role: string
{
    case Owner = 'owner';
    case Kasir = 'kasir';

    public function label(): string
    {
        return match ($this) {
            self::Owner => 'Owner',
            self::Kasir => 'Kasir',
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::Owner => 'Akses penuh: dashboard, laporan, HPP, pengaturan, dan manajemen pengguna.',
            self::Kasir => 'Akses operasional: kasir, produk, pelanggan, dan inventori.',
        };
    }

    /** @return array<int, string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    /** @return array<int, array{value: string, label: string, description: string}> */
    public static function options(): array
    {
        return array_map(fn (self $r) => [
            'value' => $r->value,
            'label' => $r->label(),
            'description' => $r->description(),
        ], self::cases());
    }
}
