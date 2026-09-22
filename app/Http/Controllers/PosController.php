<?php

namespace App\Http\Controllers;

use App\Http\Requests\Pos\CheckoutRequest;
use App\Models\Category;
use App\Models\Customer;
use App\Models\Product;
use App\Models\ProductAddon;
use App\Services\Pos\CheckoutService;
use App\Services\Settings\SettingsRepository;
use Inertia\Inertia;
use Inertia\Response;

class PosController extends Controller
{
    public function __construct(
        private readonly CheckoutService $checkout,
        private readonly SettingsRepository $settings,
    ) {}

    public function index(): Response
    {
        $addonsEnabled = $this->settings->bool('addon_enabled', true);
        $customersEnabled = $this->settings->bool('customer_enabled', true);

        return Inertia::render('pos/index', [
            'categories' => Category::query()
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->get(['id', 'name', 'slug', 'sort_order']),

            'products' => Product::query()
                ->with(['activeVariants:id,product_id,name,price_adjustment', 'category:id,name'])
                ->where('is_active', true)
                ->orderBy('name')
                ->get(),

            'addons' => $addonsEnabled
                ? ProductAddon::query()->where('is_active', true)->orderBy('name')->get()
                : [],

            'customers' => $customersEnabled
                ? Customer::query()->orderBy('name')->get(['id', 'name', 'phone', 'loyalty_points'])
                : [],

            'paymentMethods' => $this->checkout->availablePaymentMethods(),

            'config' => [
                'shop_name' => $this->settings->string('shop_name', 'Paylo Coffee'),
                'tax_enabled' => $this->settings->bool('tax_enabled'),
                'tax_rate' => $this->settings->bool('tax_enabled') ? $this->settings->float('tax_rate') : 0.0,
                'tax_label' => $this->settings->string('tax_label', 'PPN'),
                'addon_enabled' => $addonsEnabled,
                'customer_enabled' => $customersEnabled,
                'discount_enabled' => $this->settings->bool('discount_enabled', true),
                'order_note_enabled' => $this->settings->bool('order_note_enabled', true),
                'receipt_enabled' => $this->settings->bool('receipt_enabled', true),

                // The cashier screen drives the printer itself — see
                // resources/js/lib/printing. Only behaviour lives here; the
                // paired device is remembered by the browser.
                'printer_transport' => $this->settings->string('printer_transport', 'auto'),
                'printer_paper' => $this->settings->int('printer_paper', 58),
                'printer_auto_print' => $this->settings->bool('printer_auto_print'),
                'printer_copies' => max(1, $this->settings->int('printer_copies', 1)),
                'printer_cut' => $this->settings->bool('printer_cut', true),
                'printer_beep' => $this->settings->bool('printer_beep'),
                'printer_name' => $this->settings->string('printer_name'),
            ],
        ]);
    }

    /**
     * Charge the cart. The sale is complete the moment this returns — there is
     * no downstream queue to hand off to.
     */
    public function checkout(CheckoutRequest $request)
    {
        $transaction = $this->checkout->checkout($request->validated(), $request->user());

        return back()->with([
            'flash' => [
                'type' => 'success',
                'message' => "Transaksi {$transaction->transaction_number} berhasil disimpan.",
            ],
            'receipt' => $this->checkout->receiptFor($transaction),
        ]);
    }
}
