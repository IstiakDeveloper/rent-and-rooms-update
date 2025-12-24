<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Booking - {{ $appName }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #1e40af 0%, #7c3aed 100%);
            padding: 20px;
        }

        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }

        .header {
            background: linear-gradient(135deg, #1e40af 0%, #7c3aed 100%);
            padding: 40px 30px;
            text-align: center;
            position: relative;
            overflow: hidden;
        }

        .header::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
            animation: pulse 3s ease-in-out infinite;
        }

        @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 0.5; }
            50% { transform: scale(1.1); opacity: 0.3; }
        }

        .logo {
            font-size: 32px;
            font-weight: 900;
            color: #ffffff;
            margin-bottom: 10px;
            position: relative;
            z-index: 1;
            text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        }

        .header-subtitle {
            color: rgba(255, 255, 255, 0.9);
            font-size: 18px;
            position: relative;
            z-index: 1;
            font-weight: 600;
        }

        .content {
            padding: 50px 40px;
            background: #ffffff;
        }

        .icon-wrapper {
            text-align: center;
            margin-bottom: 30px;
        }

        .icon {
            width: 100px;
            height: 100px;
            background: linear-gradient(135deg, #1e40af 0%, #7c3aed 100%);
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 10px 30px rgba(30, 64, 175, 0.4);
            animation: bounce 2s ease-in-out infinite;
            font-size: 50px;
        }

        @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
        }

        h1 {
            color: #1a1a1a;
            font-size: 32px;
            font-weight: 800;
            margin-bottom: 20px;
            text-align: center;
            background: linear-gradient(135deg, #1e40af 0%, #7c3aed 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .greeting {
            font-size: 18px;
            color: #333;
            margin-bottom: 20px;
            font-weight: 600;
        }

        .message {
            color: #555;
            font-size: 16px;
            line-height: 1.8;
            margin-bottom: 30px;
        }

        .booking-details {
            background: linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%);
            border-radius: 15px;
            padding: 25px;
            margin: 30px 0;
            border: 2px solid #93c5fd;
        }

        .booking-details h3 {
            color: #1e40af;
            font-size: 20px;
            margin-bottom: 20px;
            font-weight: 700;
        }

        .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid rgba(147, 197, 253, 0.3);
        }

        .detail-row:last-child {
            border-bottom: none;
        }

        .detail-label {
            color: #64748b;
            font-weight: 600;
            font-size: 14px;
        }

        .detail-value {
            color: #1e293b;
            font-weight: 700;
            font-size: 14px;
            text-align: right;
        }

        .button-wrapper {
            text-align: center;
            margin: 40px 0;
        }

        .verify-button {
            display: inline-block;
            padding: 20px 60px;
            background: linear-gradient(135deg, #1e40af 0%, #7c3aed 100%);
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 50px;
            font-weight: 700;
            font-size: 18px;
            box-shadow: 0 10px 30px rgba(30, 64, 175, 0.4);
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }

        .verify-button::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
            transition: left 0.5s ease;
        }

        .verify-button:hover::before {
            left: 100%;
        }

        .verify-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 15px 40px rgba(30, 64, 175, 0.5);
        }

        .info-box {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            border-left: 4px solid #f59e0b;
            padding: 20px;
            border-radius: 10px;
            margin: 30px 0;
        }

        .info-box p {
            color: #78350f;
            font-size: 14px;
            margin: 0;
            line-height: 1.6;
        }

        .info-box strong {
            color: #92400e;
            display: block;
            margin-bottom: 8px;
            font-size: 15px;
        }

        .warning-box {
            background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
            border-left: 4px solid #ef4444;
            padding: 20px;
            border-radius: 10px;
            margin: 30px 0;
        }

        .warning-box p {
            color: #7f1d1d;
            font-size: 14px;
            margin: 0;
            line-height: 1.6;
        }

        .warning-box strong {
            color: #991b1b;
            display: block;
            margin-bottom: 8px;
            font-size: 15px;
        }

        .link-fallback {
            background: #f9fafb;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            word-break: break-all;
        }

        .link-fallback p {
            font-size: 13px;
            color: #666;
            margin-bottom: 8px;
        }

        .link-fallback a {
            color: #1e40af;
            text-decoration: none;
            font-size: 12px;
        }

        .steps {
            background: linear-gradient(135deg, #f8f9ff 0%, #f0f2ff 100%);
            border-radius: 15px;
            padding: 25px;
            margin: 30px 0;
        }

        .steps h3 {
            color: #1e40af;
            font-size: 18px;
            margin-bottom: 20px;
            font-weight: 700;
        }

        .step {
            display: flex;
            align-items: start;
            margin-bottom: 15px;
            padding: 15px;
            background: white;
            border-radius: 10px;
        }

        .step-number {
            width: 35px;
            height: 35px;
            background: linear-gradient(135deg, #1e40af 0%, #7c3aed 100%);
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            margin-right: 15px;
            flex-shrink: 0;
        }

        .step-text {
            color: #555;
            font-size: 14px;
            line-height: 1.6;
        }

        .footer {
            background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
            padding: 40px 30px;
            text-align: center;
            color: #9ca3af;
        }

        .footer-logo {
            font-size: 24px;
            font-weight: 900;
            color: #ffffff;
            margin-bottom: 15px;
        }

        .footer p {
            font-size: 14px;
            margin: 10px 0;
            line-height: 1.6;
        }

        .divider {
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
            margin: 25px 0;
        }

        .footer-links {
            margin: 20px 0;
        }

        .footer-links a {
            color: #9ca3af;
            text-decoration: none;
            margin: 0 12px;
            font-size: 13px;
            transition: color 0.3s ease;
        }

        .footer-links a:hover {
            color: #7c3aed;
        }

        @media only screen and (max-width: 600px) {
            .email-container {
                border-radius: 0;
            }

            .content {
                padding: 30px 20px;
            }

            h1 {
                font-size: 26px;
            }

            .verify-button {
                padding: 18px 40px;
                font-size: 16px;
            }

            .booking-details {
                padding: 20px 15px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header -->
        <div class="header">
            <div class="logo">🏠 {{ $appName }}</div>
            <div class="header-subtitle">Booking Verification Required</div>
        </div>

        <!-- Content -->
        <div class="content">
            <div class="icon-wrapper">
                <div class="icon">
                    🔐
                </div>
            </div>

            <h1>Verify Your Booking</h1>

            <p class="greeting">Hello {{ $user->name }},</p>

            <p class="message">
                Thank you for initiating a booking with <strong>{{ $appName }}</strong>!
                To ensure the security of your booking and prevent unauthorized reservations,
                we require you to verify this booking request by clicking the button below.
            </p>

            <!-- Booking Details -->
            <div class="booking-details">
                <h3>📋 Booking Details</h3>
                <div class="detail-row">
                    <span class="detail-label">Booking ID:</span>
                    <span class="detail-value">#{{ $booking->id }}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Property:</span>
                    <span class="detail-value">{{ $booking->package->name ?? 'N/A' }}</span>
                </div>
                @if($booking->from_date && $booking->to_date)
                <div class="detail-row">
                    <span class="detail-label">Check-in Date:</span>
                    <span class="detail-value">{{ \Carbon\Carbon::parse($booking->from_date)->format('d M, Y') }}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Check-out Date:</span>
                    <span class="detail-value">{{ \Carbon\Carbon::parse($booking->to_date)->format('d M, Y') }}</span>
                </div>
                @endif
                <div class="detail-row">
                    <span class="detail-label">Duration:</span>
                    <span class="detail-value">{{ $booking->number_of_days }} {{ $booking->number_of_days > 1 ? 'Days' : 'Day' }}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Total Amount:</span>
                    <span class="detail-value">£{{ number_format($booking->total_amount, 2) }}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Booking Status:</span>
                    <span class="detail-value" style="color: #f59e0b;">⏳ Pending Verification</span>
                </div>
            </div>

            <div class="button-wrapper">
                <a href="{{ $verificationUrl }}" class="verify-button">
                    ✓ Verify My Booking
                </a>
            </div>

            <!-- Next Steps -->
            <div class="steps">
                <h3>📝 What Happens Next?</h3>
                <div class="step">
                    <div class="step-number">1</div>
                    <div class="step-text">
                        <strong>Click the verification button</strong> above to confirm your booking
                    </div>
                </div>
                <div class="step">
                    <div class="step-number">2</div>
                    <div class="step-text">
                        <strong>Your booking will be activated</strong> and moved to pending approval
                    </div>
                </div>
                <div class="step">
                    <div class="step-number">3</div>
                    <div class="step-text">
                        <strong>You'll receive confirmation</strong> once your booking is approved
                    </div>
                </div>
            </div>

            <div class="warning-box">
                <strong>⚠️ Important: Verification Required</strong>
                <p>
                    This booking will NOT be processed until you verify it. If you don't verify within 24 hours,
                    the booking request will be automatically cancelled. You must verify EVERY booking you make
                    to ensure security and prevent fraud.
                </p>
            </div>

            <div class="link-fallback">
                <p><strong>Button not working?</strong> Copy and paste this link into your browser:</p>
                <a href="{{ $verificationUrl }}">{{ $verificationUrl }}</a>
            </div>

            <div class="info-box">
                <strong>🔒 Why do we require booking verification?</strong>
                <p>
                    Booking verification is a security measure to:
                    <br>• Prevent unauthorized bookings on your account
                    <br>• Confirm you authorized this specific reservation
                    <br>• Protect against fraudulent activities
                    <br>• Ensure booking accuracy before processing payment
                </p>
            </div>

            <div class="info-box">
                <strong>⏰ This verification link expires in 24 hours</strong>
                <p>
                    If you didn't request this booking or if this was made by mistake, simply ignore this email
                    and the booking will be automatically cancelled after 24 hours.
                </p>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <div class="footer-logo">{{ $appName }}</div>

            <p>Your trusted platform for secure property bookings</p>

            <div class="divider"></div>

            <div class="footer-links">
                <a href="{{ url('/') }}">Home</a>
                <a href="{{ url('/properties') }}">Properties</a>
                <a href="{{ url('/') }}">My Bookings</a>
                <a href="{{ url('/') }}">Contact Support</a>
            </div>

            <div class="divider"></div>

            <p style="font-size: 12px; color: #6b7280;">
                © {{ date('Y') }} {{ $appName }}. All rights reserved.<br>
                This email was sent to {{ $user->email }}
            </p>

            <p style="font-size: 12px; margin-top: 15px;">
                Need help? <a href="{{ url('/') }}" style="color: #7c3aed; text-decoration: none;">Contact Support</a>
            </p>
        </div>
    </div>
</body>
</html>
