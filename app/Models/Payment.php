<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    use HasFactory;
    protected $fillable = [
        'booking_id',
        'payment_method',
        'amount',
        'transaction_id',
        'booking_payment_id',
        'payment_type',
        'status',
        'reference_number',
        'admin_notes',
        'updated_by',
        'paid_at',
    ];

    /**
     * The attributes that should be guarded from mass assignment.
     * Only super critical fields that should never be mass assigned
     *
     * @var array<int, string>
     */
    protected $guarded = [
        'id',
    ];

    public function booking()
    {
        return $this->belongsTo(Booking::class);
    }

    public function bookingPayment()
    {
        return $this->belongsTo(BookingPayment::class);
    }

    public function user()
    {
        return $this->hasOneThrough(
            User::class,
            Booking::class,
            'id', // Foreign key on bookings table
            'id', // Foreign key on users table
            'booking_id', // Local key on payments table
            'user_id' // Local key on bookings table
        );
    }
}
