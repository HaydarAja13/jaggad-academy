<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('consultation_appointments', function (Blueprint $table) {
            $table->id();
            $table->string('booking_code')->unique();
            $table->string('customer_name');
            $table->string('whatsapp', 24);
            $table->string('package_slug');
            $table->string('package_name');
            $table->string('option_key');
            $table->string('option_label');
            $table->unsignedSmallInteger('duration_minutes');
            $table->decimal('total_price', 15, 2);
            $table->decimal('deposit_amount', 15, 2);
            $table->text('consultation_need');
            $table->dateTime('requested_start_at');
            $table->dateTime('scheduled_start_at')->nullable();
            $table->string('mentor_key')->nullable();
            $table->string('mentor_name')->nullable();
            $table->string('location')->nullable();
            $table->string('status')->default('requested')->index();
            $table->dateTime('deposit_due_at')->nullable()->index();
            $table->unsignedTinyInteger('customer_reschedule_count')->default(0);
            $table->text('rejection_reason')->nullable();
            $table->string('cancellation_initiator')->nullable();
            $table->text('cancellation_reason')->nullable();
            $table->decimal('refund_amount', 15, 2)->nullable();
            $table->dateTime('refund_at')->nullable();
            $table->text('refund_note')->nullable();
            $table->timestamps();

            $table->index(['mentor_key', 'scheduled_start_at']);
        });

        Schema::table('transactions', function (Blueprint $table) {
            $table->string('purpose')->default('product_purchase')->after('transaction_code')->index();
            $table->foreignId('consultation_appointment_id')->nullable()->after('user_id')
                ->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        DB::table('transactions')->where('purpose', '!=', 'product_purchase')->delete();

        Schema::table('transactions', function (Blueprint $table) {
            $table->dropConstrainedForeignId('consultation_appointment_id');
            $table->dropIndex(['purpose']);
            $table->dropColumn('purpose');
            $table->foreignId('user_id')->nullable(false)->change();
        });

        Schema::dropIfExists('consultation_appointments');
    }
};
