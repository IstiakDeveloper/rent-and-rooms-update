<?php

namespace App\Services\User;

use App\Models\User;
use App\Models\Booking;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use App\Mail\InvoiceMail;

class InvoiceService
{
    public function downloadInvoice(User $user, Booking $booking)
    {
        $booking->load(['user', 'package', 'payments']);
        $invoiceData = $this->prepareInvoiceData($booking);

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('admin.invoice-template', $invoiceData);
        $pdf->setPaper('A4', 'portrait');

        session()->flash('success', 'Invoice downloaded successfully!');

        return $pdf->download("invoice-{$booking->id}.pdf");
    }

    public function emailInvoice(User $user, Booking $booking)
    {
        $booking->load(['user', 'package', 'payments']);

        if (!$booking->user->email) {
            throw new \Exception('Cannot send invoice: User has no email address.');
        }

        $invoiceData = $this->prepareInvoiceData($booking);

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('admin.invoice-template', $invoiceData);
        $pdf->setPaper('A4', 'portrait');
        $pdfContent = $pdf->output();

        $invoiceNumber = 'INV-' . date('Y') . '-' . str_pad($booking->id, 4, '0', STR_PAD_LEFT);

        Mail::to($booking->user->email)
            ->send(new InvoiceMail($booking, $invoiceNumber, $pdfContent));

        return $booking->user->email;
    }

    private function prepareInvoiceData($booking)
    {
        $invoiceNumber = 'INV-' . date('Y') . '-' . str_pad($booking->id, 4, '0', STR_PAD_LEFT);

        $header = \App\Models\Header::first();
        $logo = $header ? $header->logo : null;

        return [
            'invoice_number' => $invoiceNumber,
            'date' => now()->format('d/m/Y'),
            'due_date' => now()->addDays(7)->format('d/m/Y'),
            'logo' => $logo,
            'booking' => $booking,
            'customer' => [
                'name' => $booking->user->name,
                'email' => $booking->user->email,
                'phone' => $booking->user->phone ?? 'N/A',
            ],
            'company' => [
                'name' => 'Rent and Rooms',
                'address' => '60 Sceptre Street, Newcastle, NE4 6PR',
                'phone' => '03301339494',
                'email' => 'rentandrooms@gmail.com'
            ],
            'items' => [
                [
                    'description' => $booking->package->name . ' Package',
                    'amount' => $booking->price,
                    'type' => 'Package Price'
                ],
                [
                    'description' => 'Booking Fee',
                    'amount' => $booking->booking_price,
                    'type' => 'Booking Fee'
                ]
            ],
            'payments' => $booking->payments,
            'summary' => [
                'total_price' => $booking->price + $booking->booking_price,
                'total_paid' => $booking->payments->where('status', 'Paid')->sum('amount'),
                'remaining_balance' => ($booking->price + $booking->booking_price) - $booking->payments->where('status', 'Paid')->sum('amount')
            ]
        ];
    }
}
