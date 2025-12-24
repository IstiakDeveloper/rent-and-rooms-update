<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Queue\SerializesModels;

class InvoiceMail extends Mailable
{
    use Queueable, SerializesModels;

    public $booking;
    public $invoiceNumber;
    public $pdfContent;

    /**
     * Create a new message instance.
     */
    public function __construct($booking, $invoiceNumber, $pdfContent)
    {
        $this->booking = $booking;
        $this->invoiceNumber = $invoiceNumber;
        $this->pdfContent = $pdfContent;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Your Invoice from Rent and Rooms - Booking #{$this->booking->id}",
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.invoice',
            with: [
                'booking' => $this->booking,
                'userName' => $this->booking->user->name,
                'invoiceNumber' => $this->invoiceNumber,
                'totalAmount' => number_format($this->booking->price + $this->booking->booking_price, 2),
                'dueDate' => now()->addDays(7)->format('d/m/Y')
            ]
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [
            Attachment::fromData(fn () => $this->pdfContent, "invoice-{$this->booking->id}.pdf")
                ->withMime('application/pdf'),
        ];
    }
}
