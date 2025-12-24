<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>Invoice #{{ $invoice_number }}</title>
    <style>
        @page {
            size: A4;
            margin: 15mm;
        }

        body {
            font-family: Arial, sans-serif;
            color: #000;
            font-size: 12px;
            line-height: 1.5;
            margin: 0;
            padding: 0;
        }

        .invoice-box {
            width: 100%;
            max-width: 100%;
        }

        .header {
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 2px solid #2563eb;
        }

        .header-table {
            width: 100%;
        }

        .logo-img {
            max-width: 150px;
            height: auto;
            max-height: 70px;
        }

        .company-name {
            font-size: 28px;
            font-weight: bold;
            color: #2563eb;
        }

        .invoice-title {
            font-size: 32px;
            font-weight: bold;
            color: #2563eb;
            text-align: right;
        }

        .invoice-meta {
            text-align: right;
            font-size: 12px;
            color: #555;
        }

        .info-section {
            margin-bottom: 20px;
            width: 100%;
        }

        .info-section::after {
            content: "";
            display: table;
            clear: both;
        }

        .info-left {
            float: left;
            width: 48%;
        }

        .info-right {
            float: right;
            width: 48%;
            text-align: right;
        }

        .info-label {
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 5px;
        }

        .booking-info {
            background: #f0f9ff;
            padding: 12px;
            margin-bottom: 20px;
            border-left: 4px solid #2563eb;
        }

        .booking-info strong {
            color: #2563eb;
        }

        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }

        .items-table thead th {
            background: #2563eb;
            color: white;
            padding: 10px;
            text-align: left;
            font-size: 11px;
        }

        .items-table tbody td {
            padding: 10px;
            border-bottom: 1px solid #ddd;
        }

        .summary-table {
            width: 350px;
            float: right;
            border-collapse: collapse;
        }

        .summary-table td {
            padding: 8px 10px;
            font-size: 12px;
        }

        .summary-table .total-row {
            background: #2563eb;
            color: white;
            font-size: 14px;
            font-weight: bold;
        }

        .payment-history {
            clear: both;
            margin-top: 30px;
        }

        .section-title {
            font-size: 14px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
            padding-bottom: 5px;
            border-bottom: 1px solid #ddd;
        }

        .payment-table {
            width: 100%;
            border-collapse: collapse;
        }

        .payment-table thead th {
            background: #f3f4f6;
            padding: 8px;
            text-align: left;
            font-size: 11px;
            border-bottom: 1px solid #ddd;
        }

        .payment-table tbody td {
            padding: 8px;
            border-bottom: 1px solid #eee;
            font-size: 11px;
        }

        .badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 3px;
            font-size: 9px;
            font-weight: bold;
        }

        .badge-paid {
            background: #d1fae5;
            color: #065f46;
        }

        .badge-pending {
            background: #fef3c7;
            color: #92400e;
        }

        .badge-partially_paid {
            background: #fed7aa;
            color: #9a3412;
        }

        .footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #ddd;
            font-size: 10px;
            color: #555;
        }

        .footer-table {
            width: 100%;
        }

        .text-right {
            text-align: right;
        }
    </style>
</head>

<body>
    <div class="invoice-box">
        <!-- Header -->
        <div class="header">
            <table class="header-table">
                <tr>
                    <td style="width: 50%; vertical-align: top;">
                        @if (isset($logo) && $logo)
                            <img src="{{ public_path('storage/' . $logo) }}" alt="Logo" class="logo-img">
                        @else
                            <div class="company-name">Rent and Rooms</div>
                        @endif
                    </td>
                    <td style="width: 50%; vertical-align: top;">
                        <div class="invoice-title">INVOICE</div>
                        <div class="invoice-meta">
                            <strong>Invoice #:</strong> {{ $invoice_number }}<br>
                            <strong>Date:</strong> {{ $date }}<br>
                            <strong>Due Date:</strong> {{ $due_date }}
                        </div>
                    </td>
                </tr>
            </table>
        </div>

        <!-- Company and Customer Info -->
        <div class="info-section">
            <div class="info-left">
                <div class="info-label">From:</div>
                <strong>{{ $company['name'] }}</strong><br>
                {{ $company['address'] }}<br>
                Phone: {{ $company['phone'] }}<br>
                Email: {{ $company['email'] }}
            </div>
            <div class="info-right">
                <div class="info-label">Bill To:</div>
                <strong>{{ $customer['name'] }}</strong><br>
                Email: {{ $customer['email'] }}<br>
                Phone: {{ $customer['phone'] }}
            </div>
        </div>

        <!-- Booking Details -->
        <div class="booking-info">
            <strong>Booking ID:</strong> #{{ $booking->id }} |
            <strong>Package:</strong> {{ $booking->package->name ?? 'N/A' }} |
            <strong>Duration:</strong> {{ $booking->number_of_days ?? 'N/A' }} days
            ({{ \Carbon\Carbon::parse($booking->from_date)->format('d/m/Y') }} -
            {{ \Carbon\Carbon::parse($booking->to_date)->format('d/m/Y') }})
        </div>

        <!-- Items Table -->
        <table class="items-table">
            <thead>
                <tr>
                    <th style="width: 60%">Description</th>
                    <th style="width: 20%">Type</th>
                    <th style="width: 20%" class="text-right">Amount</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($items as $item)
                    <tr>
                        <td>{{ $item['description'] }}</td>
                        <td>{{ $item['type'] }}</td>
                        <td class="text-right"><strong>£{{ number_format($item['amount'], 2) }}</strong></td>
                    </tr>
                @endforeach
            </tbody>
        </table>

        <!-- Summary -->
        <table class="summary-table">
            <tr>
                <td>Subtotal:</td>
                <td class="text-right"><strong>£{{ number_format($summary['total_price'], 2) }}</strong></td>
            </tr>
            <tr>
                <td>Amount Paid:</td>
                <td class="text-right" style="color: #10b981;">
                    <strong>£{{ number_format($summary['total_paid'], 2) }}</strong></td>
            </tr>
            @php
                $upcomingPayment = $booking->bookingPayments()
                    ->where('payment_status', '!=', 'paid')
                    ->orderBy('due_date', 'asc')
                    ->first();
            @endphp
            @if($upcomingPayment)
                <tr class="total-row">
                    <td>Upcoming Payment:</td>
                    <td class="text-right">£{{ number_format($upcomingPayment->amount, 2) }}</td>
                </tr>
                <tr>
                    <td colspan="2" style="text-align: right; font-size: 10px; color: white; padding: 5px 10px;">
                        Due: {{ \Carbon\Carbon::parse($upcomingPayment->due_date)->format('d/m/Y') }}
                    </td>
                </tr>
            @endif
        </table>

        <!-- Payment History -->
        @if (count($payments) > 0)
            @php
                $paidPayments = $payments->where('status', 'Paid');
                $lastPaidPayment = $paidPayments->sortByDesc('created_at')->first();
                $sortedPayments = $payments->sortByDesc('created_at');
            @endphp
            <div class="payment-history">
                <div class="section-title">Payment History</div>
                <table class="payment-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Method</th>
                            <th>Status</th>
                            <th class="text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach ($sortedPayments as $payment)
                            @php
                                $isLastPayment = $lastPaidPayment && $payment->id === $lastPaidPayment->id && $payment->status === 'Paid';
                            @endphp
                            <tr style="{{ $isLastPayment ? 'background-color: #fef3c7;' : '' }}">
                                <td>{{ \Carbon\Carbon::parse($payment->created_at)->format('d M Y') }}</td>
                                <td>{{ ucfirst($payment->payment_method ?? 'N/A') }}</td>
                                <td>
                                    <span class="badge badge-{{ strtolower($payment->status) }}">
                                        {{ $isLastPayment ? 'LAST PAYMENT' : strtoupper($payment->status) }}
                                    </span>
                                </td>
                                <td class="text-right"><strong>£{{ number_format($payment->amount, 2) }}</strong></td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
        @endif

        <!-- Footer -->
        <div class="footer">
            <table class="footer-table">
                <tr>
                    <td style="width: 50%">
                        <strong>Payment Terms:</strong> Due within 7 days<br>
                        <strong>Bank Details:</strong><br>
                        Bank: Netsoftuk Solution<br>
                        Account: 17855008 | Sort Code: 04-06-05
                    </td>
                    <td style="width: 50%; text-align: right;">
                        <strong>{{ $company['name'] }}</strong><br>
                        {{ $company['address'] }}<br>
                        Phone: {{ $company['phone'] }}<br>
                        Email: {{ $company['email'] }}
                    </td>
                </tr>
            </table>
            <div style="text-align: center; margin-top: 15px; font-style: italic;">
                Thank you for your business!
            </div>
        </div>

    </div>
</body>
