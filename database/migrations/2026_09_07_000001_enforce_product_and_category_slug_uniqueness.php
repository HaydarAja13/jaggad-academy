<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        $this->repairSlugs('products', 'product');
        $this->repairSlugs('categories', 'category');

        Schema::table('products', fn (Blueprint $table) => $table->unique('slug'));
        Schema::table('categories', fn (Blueprint $table) => $table->unique('slug'));
    }

    public function down(): void
    {
        Schema::table('products', fn (Blueprint $table) => $table->dropUnique(['slug']));
        Schema::table('categories', fn (Blueprint $table) => $table->dropUnique(['slug']));
    }

    private function repairSlugs(string $table, string $fallback): void
    {
        $used = [];

        foreach (DB::table($table)->orderBy('id')->get(['id', 'name', 'slug']) as $row) {
            $base = Str::slug($row->slug ?: $row->name) ?: $fallback;
            $slug = isset($used[$base]) ? "{$base}-{$row->id}" : $base;

            while (isset($used[$slug])) {
                $slug .= '-'.$row->id;
            }

            DB::table($table)->where('id', $row->id)->update(['slug' => $slug]);
            $used[$slug] = true;
        }
    }
};
