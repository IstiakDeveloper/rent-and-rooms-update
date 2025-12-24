<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JoinPackage extends Model
{
    protected $fillable = [
        'title',
        'subtitle',
        'description',
        'whats_included',
        'ideal_for',
        'price',
        'price_note',
        'display_order',
        'is_active',
    ];

    protected $casts = [
        'whats_included' => 'array',
        'is_active' => 'boolean',
    ];
}
