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
        Schema::table('categories', function (Blueprint $table) {
            $table->string('slug')->nullable()->after('name');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->string('slug')->nullable()->after('name');
            $table->decimal('rating', 3, 1)->default(0)->after('price');
            $table->integer('total_ratings')->default(0)->after('rating');
            $table->boolean('featured')->default(false)->after('badge');
        });

        Schema::table('transactions', function (Blueprint $table) {
            $table->timestamp('paid_at')->nullable()->after('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->dropColumn('slug');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['slug', 'rating', 'total_ratings', 'featured']);
        });
        
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropColumn('paid_at');
        });
    }
};
