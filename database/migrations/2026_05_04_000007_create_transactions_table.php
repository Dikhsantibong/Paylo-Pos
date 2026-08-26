<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->string('transaction_number')->unique();
            $table->foreignId('customer_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete(); // cashier
            $table->unsignedInteger('subtotal')->default(0);
            $table->decimal('tax_rate', 5, 2)->default(0);
            $table->unsignedInteger('tax_amount')->default(0);
            $table->unsignedInteger('discount')->default(0);
            $table->unsignedInteger('total')->default(0);
            $table->enum('payment_method', ['cash', 'qris'])->default('cash');
            $table->unsignedInteger('payment_amount')->default(0);
            $table->unsignedInteger('change_amount')->default(0);
            $table->enum('status', ['completed', 'voided', 'held'])->default('completed');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
