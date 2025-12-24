<?php

namespace App\Notifications;

use App\Models\Booking;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Carbon;

class BookingVerificationNotification extends Notification
{
    use Queueable;

    protected $booking;

    /**
     * Create a new notification instance.
     */
    public function __construct(Booking $booking)
    {
        $this->booking = $booking;
    }

    /**
     * Get the notification's delivery channels.
     */
    public function via($notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail($notifiable): MailMessage
    {
        $verificationUrl = $this->verificationUrl();

        return (new MailMessage)
            ->subject('Verify Your Booking - RentAndRooms')
            ->view('emails.verify-booking', [
                'user' => $notifiable,
                'booking' => $this->booking,
                'verificationUrl' => $verificationUrl,
                'appName' => config('app.name', 'RentAndRooms'),
            ]);
    }

    /**
     * Get the verification URL for this booking.
     */
    protected function verificationUrl(): string
    {
        return URL::temporarySignedRoute(
            'booking.verify',
            Carbon::now()->addHours(24), // 24 hours expiry
            [
                'booking' => $this->booking->id,
                'token' => $this->booking->booking_verification_token,
            ]
        );
    }
}
