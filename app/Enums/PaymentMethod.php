<?php

namespace App\Enums;

/**
 * Payment methods supported by the cashier screen.
 *
 * Non-cash methods are *labels only* — Paylo does not process the payment,
 * it only records which method the customer used.
 */
enum PaymentMethod: string
{
    case Cash = 'cash';
    case Qris = 'qris';
    case BankTransfer = 'bank_transfer';
    case DebitCard = 'debit_card';
    case CreditCard = 'credit_card';

    public function label(): string
    {
        return match ($this) {
            self::Cash => 'Tunai',
            self::Qris => 'QRIS',
            self::BankTransfer => 'Transfer Bank',
            self::DebitCard => 'Kartu Debit',
            self::CreditCard => 'Kartu Kredit',
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::Cash => 'Pembayaran tunai dengan perhitungan kembalian',
            self::Qris => 'QRIS, GoPay, OVO, Dana, ShopeePay',
            self::BankTransfer => 'Transfer manual ke rekening toko',
            self::DebitCard => 'Mesin EDC — kartu debit',
            self::CreditCard => 'Mesin EDC — kartu kredit',
        };
    }

    /** Cash is the only method that needs a tendered amount + change. */
    public function requiresTenderedAmount(): bool
    {
        return $this === self::Cash;
    }

    public function settingKey(): string
    {
        return 'payment_'.$this->value;
    }

    /** @return array<int, string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    /** @return array<int, string> */
    public static function settingKeys(): array
    {
        return array_map(fn (self $m) => $m->settingKey(), self::cases());
    }
}
