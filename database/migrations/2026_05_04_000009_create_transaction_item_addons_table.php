<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transaction_item_addons', function (Blueprint $table) {
            $table->id();
            $table->foreignId('transaction_item_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_addon_id')->constrained()->cascadeOnDelete();
            $table->string('addon_name'); // snapshot
            $table->unsignedInteger('addon_price')->default(0); // snapshot
            $table->unsignedInteger('quantity')->default(1);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transaction_item_addons');
    }
};
