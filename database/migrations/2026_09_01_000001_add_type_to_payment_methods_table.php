<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payment_methods', function (Blueprint $table) {
            $table->string('type')->default('bank_transfer')->after('id');
        });

        DB::table('payment_methods')
            ->where('account_number', '-')
            ->orWhere('bank_name', 'like', '%Midtrans%')
            ->update(['type' => 'midtrans', 'status' => false]);
    }

    public function down(): void
    {
        Schema::table('payment_methods', function (Blueprint $table) {
            $table->dropColumn('type');
        });
    }
};
