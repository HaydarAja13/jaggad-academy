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
        Schema::table('users', function (Blueprint $table) {
            $table->string('phone')->nullable();
            $table->integer('purchase_count')->default(0);
            $table->decimal('total_spent', 15, 2)->default(0);
            $table->string('status')->default('active'); // active, inactive
            $table->string('role')->default('customer'); // customer, admin
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['phone', 'purchase_count', 'total_spent', 'status', 'role']);
        });
    }
};
