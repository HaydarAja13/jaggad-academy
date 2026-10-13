<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            // 'fixed' = harga tetap (termasuk gratis Rp 0), 'donation' = pay-what-you-want.
            $table->string('pricing_type', 20)->default('fixed');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('pricing_type');
        });
    }
};
