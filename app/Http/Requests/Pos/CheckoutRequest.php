<?php

namespace App\Http\Requests\Pos;

use App\Enums\PaymentMethod;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CheckoutRequest extends FormRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'customer_id' => ['nullable', 'exists:customers,id'],
            'payment_method' => ['required', Rule::in(PaymentMethod::values())],
            'payment_amount' => ['nullable', 'integer', 'min:0'],
            'discount' => ['nullable', 'integer', 'min:0'],
            'notes' => ['nullable', 'string', 'max:500'],

            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'exists:products,id'],
            'items.*.product_variant_id' => ['nullable', 'exists:product_variants,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:999'],
            'items.*.temperature' => ['nullable', Rule::in(['hot', 'iced'])],
            'items.*.sugar_level' => ['nullable', Rule::in(['normal', 'less', 'more', 'none'])],
            'items.*.notes' => ['nullable', 'string', 'max:255'],

            'items.*.addons' => ['nullable', 'array'],
            'items.*.addons.*.product_addon_id' => ['required', 'exists:product_addons,id'],
            'items.*.addons.*.quantity' => ['required', 'integer', 'min:1', 'max:99'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'items.required' => 'Keranjang masih kosong.',
            'items.min' => 'Keranjang masih kosong.',
            'payment_method.required' => 'Pilih metode pembayaran terlebih dahulu.',
            'payment_method.in' => 'Metode pembayaran tidak dikenali.',
        ];
    }
}
