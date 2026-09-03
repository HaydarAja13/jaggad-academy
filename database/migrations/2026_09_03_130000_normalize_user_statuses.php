<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('users')->whereIn('status', ['Aktif', 'active'])->update(['status' => 'active']);
        DB::table('users')->whereIn('status', ['Nonaktif', 'inactive'])->update(['status' => 'inactive']);
    }

    public function down(): void
    {
        // Status values remain valid when rolling back this data cleanup.
    }
};
