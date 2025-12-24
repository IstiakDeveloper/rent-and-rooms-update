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
        Schema::table('bookings', function (Blueprint $table) {
            $table->string('booking_verification_token')->nullable()->after('status');
            $table->timestamp('booking_verified_at')->nullable()->after('booking_verification_token');
            $table->boolean('requires_booking_verification')->default(true)->after('booking_verified_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn(['booking_verification_token', 'booking_verified_at', 'requires_booking_verification']);
        });
    }
};
