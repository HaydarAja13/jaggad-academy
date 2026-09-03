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
            $table->string('slug')->nullable()->unique()->after('name');
        });

        Schema::table('payment_methods', function (Blueprint $table) {
            $table->string('slug')->nullable()->unique()->after('bank_name');
        });

        // Populate existing data
        \App\Models\User::all()->each(function ($user) {
            $user->slug = \Illuminate\Support\Str::slug($user->name) . '-' . $user->id;
            $user->save();
        });

        \App\Models\PaymentMethod::all()->each(function ($pm) {
            $pm->slug = \Illuminate\Support\Str::slug($pm->bank_name) . '-' . $pm->id;
            $pm->save();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('slug');
        });

        Schema::table('payment_methods', function (Blueprint $table) {
            $table->dropColumn('slug');
        });
    }
};
