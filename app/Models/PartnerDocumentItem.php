<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PartnerDocumentItem extends Model
{
    protected $fillable = [
        'user_id',
        'package_id',
        'document_type',
        'document_name',
        'file_path',
        'expiry_date',
        'status',
        'notes',
    ];

    protected $casts = [
        'expiry_date' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function package(): BelongsTo
    {
        return $this->belongsTo(Package::class);
    }

    /**
     * Check if document is expired
     */
    public function isExpired(): bool
    {
        if (!$this->expiry_date) {
            return false;
        }

        return $this->expiry_date->isPast();
    }

    /**
     * Check if document is expiring soon (within 30 days)
     */
    public function isExpiringSoon(): bool
    {
        if (!$this->expiry_date) {
            return false;
        }

        return $this->expiry_date->isFuture() &&
               $this->expiry_date->diffInDays(now()) <= 30;
    }

    /**
     * Get file URL
     */
    public function getFileUrlAttribute(): ?string
    {
        return $this->file_path ? asset('storage/' . $this->file_path) : null;
    }
}
