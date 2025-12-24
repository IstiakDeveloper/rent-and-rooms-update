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
        Schema::create('partner_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');

            // Partner Personal Documents
            $table->string('photo_id')->nullable();
            $table->date('photo_id_expiry')->nullable();
            $table->string('authorised_letter')->nullable();
            $table->date('authorised_letter_expiry')->nullable();
            $table->string('management_agreement')->nullable();
            $table->date('management_agreement_expiry')->nullable();
            $table->string('management_maintain_agreement')->nullable();
            $table->date('management_maintain_agreement_expiry')->nullable();
            $table->string('franchise_agreement')->nullable();
            $table->date('franchise_agreement_expiry')->nullable();
            $table->string('investor_agreement')->nullable();
            $table->date('investor_agreement_expiry')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('partner_documents');
    }
};
