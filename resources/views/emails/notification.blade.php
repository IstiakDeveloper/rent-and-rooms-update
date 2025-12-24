<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Notification from Rent and Rooms</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);
            padding: 30px 20px;
            text-align: center;
        }
        .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 28px;
            font-weight: bold;
        }
        .content {
            padding: 40px 30px;
        }
        .greeting {
            font-size: 18px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 20px;
        }
        .message {
            font-size: 16px;
            line-height: 1.8;
            color: #555;
            white-space: pre-wrap;
            word-wrap: break-word;
        }
        .footer {
            background-color: #f9fafb;
            padding: 20px 30px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
        }
        .footer p {
            margin: 5px 0;
            color: #6b7280;
            font-size: 14px;
        }
        .footer a {
            color: #2563eb;
            text-decoration: none;
        }
        .footer a:hover {
            text-decoration: underline;
        }
        .divider {
            height: 1px;
            background: linear-gradient(to right, transparent, #e5e7eb, transparent);
            margin: 30px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Rent and Rooms</h1>
        </div>
        <div class="content">
            <p class="greeting">Hello {{ $userName }},</p>
            <p class="message">{{ $content }}</p>
            <div class="divider"></div>
            <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
                If you have any questions or concerns, please don't hesitate to contact us.
            </p>
        </div>
        <div class="footer">
            <p><strong>Rent and Rooms</strong></p>
            <p>Your trusted platform for quality rental properties</p>
            <p>
                <a href="{{ config('app.url') }}">Visit our website</a> | 
                <a href="mailto:rentandrooms@gmail.com">Contact Support</a>
            </p>
            <p style="margin-top: 15px;">&copy; {{ date('Y') }} Rent and Rooms. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
