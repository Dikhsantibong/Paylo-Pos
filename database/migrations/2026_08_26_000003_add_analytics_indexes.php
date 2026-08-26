<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The dashboard and reports filter almost every query by status + date.
     * These composite indexes keep those aggregations fast as the transaction
     * table grows.
     */
    public function up(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->index(['status', 'created_at'], 'transactions_status_created_at_index');
            $table->index('payment_method', 'transactions_payment_method_index');
        });

        Schema::table('transaction_items', function (Blueprint $table) {
            $table->index('product_name', 'transaction_items_product_name_index');
        });
    }

    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropIndex('transactions_status_created_at_index');
            $table->dropIndex('transactions_payment_method_index');
        });

        Schema::table('transaction_items', function (Blueprint $table) {
            $table->dropIndex('transaction_items_product_name_index');
        });
    }
};
