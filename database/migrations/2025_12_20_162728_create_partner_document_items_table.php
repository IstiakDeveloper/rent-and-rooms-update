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
        Schema::create('partner_document_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('package_id')->nullable()->constrained()->onDelete('cascade');
            $table->string('document_type'); // 'partner' or 'package'
            $table->string('document_name'); // Custom name like "HMO Licence", "Gas Certificate"
            $table->string('file_path')->nullable();
            $table->date('expiry_date')->nullable();
            $table->string('status')->default('active'); // active, expired, pending
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'package_id', 'document_type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('partner_document_items');
    }
};
