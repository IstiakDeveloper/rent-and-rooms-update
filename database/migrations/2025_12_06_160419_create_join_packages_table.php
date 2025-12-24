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
        Schema::create('join_packages', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('subtitle')->nullable();
            $table->text('description');
            $table->text('whats_included'); // JSON format for list items
            $table->text('ideal_for')->nullable();
            $table->string('price')->nullable();
            $table->string('price_note')->nullable();
            $table->integer('display_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Create join_with_us_header table for page header content
        Schema::create('join_with_us_header', function (Blueprint $table) {
            $table->id();
            $table->string('main_title')->default('Rent & Rooms Packages');
            $table->text('subtitle');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('join_packages');
        Schema::dropIfExists('join_with_us_header');
    }
};
