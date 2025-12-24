<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email - {{ $appName }}</title>
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
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
            font-size: 16px;
            position: relative;
            z-index: 1;
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
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
            animation: bounce 2s ease-in-out infinite;
        }

        @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
        }

        .icon svg {
            width: 40px;
            height: 40px;
            fill: white;
        }

        h1 {
            color: #1a1a1a;
            font-size: 28px;
            font-weight: 800;
            margin-bottom: 20px;
            text-align: center;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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

        .button-wrapper {
            text-align: center;
            margin: 40px 0;
        }

        .verify-button {
            display: inline-block;
            padding: 18px 50px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 50px;
            font-weight: 700;
            font-size: 16px;
            box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
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
            box-shadow: 0 15px 40px rgba(102, 126, 234, 0.5);
        }

        .info-box {
            background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
            border-left: 4px solid #667eea;
            padding: 20px;
            border-radius: 10px;
            margin: 30px 0;
        }

        .info-box p {
            color: #555;
            font-size: 14px;
            margin: 0;
            line-height: 1.6;
        }

        .info-box strong {
            color: #333;
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
            color: #667eea;
            text-decoration: none;
            font-size: 12px;
        }

        .features {
            display: flex;
            gap: 20px;
            margin: 30px 0;
            flex-wrap: wrap;
        }

        .feature {
            flex: 1;
            min-width: 150px;
            text-align: center;
            padding: 20px;
            background: linear-gradient(135deg, #f8f9ff 0%, #f0f2ff 100%);
            border-radius: 12px;
        }

        .feature-icon {
            font-size: 30px;
            margin-bottom: 10px;
        }

        .feature-text {
            font-size: 13px;
            color: #555;
            font-weight: 600;
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

        .social-links {
            margin: 25px 0;
        }

        .social-links a {
            display: inline-block;
            width: 40px;
            height: 40px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 50%;
            margin: 0 8px;
            line-height: 40px;
            color: #ffffff;
            text-decoration: none;
            transition: all 0.3s ease;
        }

        .social-links a:hover {
            background: #667eea;
            transform: translateY(-3px);
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
            color: #667eea;
        }

        .divider {
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
            margin: 25px 0;
        }

        @media only screen and (max-width: 600px) {
            .email-container {
                border-radius: 0;
            }

            .content {
                padding: 30px 20px;
            }

            h1 {
                font-size: 24px;
            }

            .verify-button {
                padding: 15px 35px;
                font-size: 15px;
            }

            .features {
                flex-direction: column;
            }

            .feature {
                min-width: 100%;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header -->
        <div class="header">
            <div class="logo">🏠 {{ $appName }}</div>
            <div class="header-subtitle">Your Trusted Property Platform</div>
        </div>

        <!-- Content -->
        <div class="content">
            <div class="icon-wrapper">
                <div class="icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                    </svg>
                </div>
            </div>

            <h1>Verify Your Email Address</h1>

            <p class="greeting">Hello {{ $user->name }},</p>

            <p class="message">
                Welcome to <strong>{{ $appName }}</strong>! We're thrilled to have you join our community.
                To get started with booking amazing properties and accessing all our features, please verify your email address.
            </p>

            <div class="button-wrapper">
                <a href="{{ $verificationUrl }}" class="verify-button">
                    ✓ Verify Email Address
                </a>
            </div>

            <div class="info-box">
                <strong>🔒 Why verify your email?</strong>
                <p>
                    Email verification helps us ensure your account security and allows us to send you important notifications
                    about your bookings and account activity.
                </p>
            </div>

            <!-- Features -->
            <div class="features">
                <div class="feature">
                    <div class="feature-icon">🏡</div>
                    <div class="feature-text">Browse Properties</div>
                </div>
                <div class="feature">
                    <div class="feature-icon">💳</div>
                    <div class="feature-text">Secure Payments</div>
                </div>
                <div class="feature">
                    <div class="feature-icon">⚡</div>
                    <div class="feature-text">Instant Booking</div>
                </div>
            </div>

            <div class="link-fallback">
                <p><strong>Button not working?</strong> Copy and paste this link into your browser:</p>
                <a href="{{ $verificationUrl }}">{{ $verificationUrl }}</a>
            </div>

            <div class="info-box">
                <strong>⏰ This link will expire in 60 minutes</strong>
                <p>
                    If you didn't create an account with {{ $appName }}, no further action is required.
                    You can safely ignore this email.
                </p>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <div class="footer-logo">{{ $appName }}</div>

            <p>Your trusted platform for property rentals across the UK</p>

            <div class="divider"></div>

            <div class="footer-links">
                <a href="{{ url('/') }}">Home</a>
                <a href="{{ url('/properties') }}">Properties</a>
                <a href="{{ url('/') }}">About Us</a>
                <a href="{{ url('/') }}">Contact</a>
            </div>

            <div class="divider"></div>

            <p style="font-size: 12px; color: #6b7280;">
                © {{ date('Y') }} {{ $appName }}. All rights reserved.<br>
                This email was sent to {{ $user->email }}
            </p>

            <p style="font-size: 12px; margin-top: 15px;">
                Need help? <a href="{{ url('/') }}" style="color: #667eea; text-decoration: none;">Contact Support</a>
            </p>
        </div>
    </div>
</body>
</html>
