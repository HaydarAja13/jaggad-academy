<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->foreignId('category_id')->nullable()->constrained()->nullOnDelete();
            $table->decimal('price', 15, 2);
            $table->decimal('normal_price', 15, 2)->nullable();
            $table->integer('sold_count')->default(0);
            $table->string('image')->nullable();
            $table->string('badge')->nullable(); // Label (Best Seller, Promo, etc)
            $table->text('short_description')->nullable();
            $table->text('description')->nullable();
            $table->json('benefits')->nullable();
            $table->json('materials')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
