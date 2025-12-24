<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JoinWithUsHeader extends Model
{
    protected $table = 'join_with_us_header';

    protected $fillable = [
        'main_title',
        'subtitle',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];
}
