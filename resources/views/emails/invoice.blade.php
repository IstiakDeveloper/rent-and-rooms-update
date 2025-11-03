<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
        }
        .content {
            background: #f9f9f9;
            padding: 30px;
            border-radius: 0 0 10px 10px;
        }
        .button {
            display: inline-block;
            padding: 12px 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
        }
        .info-box {
            background: white;
            padding: 20px;
            border-left: 4px solid #667eea;
            margin: 20px 0;
            border-radius: 5px;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            color: #666;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Invoice from Rent and Rooms</h1>
        </div>
        <div class="content">
            <p>Dear {{ $userName }},</p>

            <p>Thank you for choosing Rent and Rooms. Please find your invoice attached to this email.</p>

            <div class="info-box">
                <h3 style="margin-top: 0;">Invoice Details</h3>
                <p><strong>Invoice Number:</strong> {{ $invoiceNumber }}</p>
                <p><strong>Booking Reference:</strong> #{{ $booking->id }}</p>
                <p><strong>Total Amount:</strong> £{{ $totalAmount }}</p>
                <p><strong>Due Date:</strong> {{ $dueDate }}</p>
            </div>

            <h3>Payment Information</h3>
            <p>Please make your payment to the following bank account:</p>
            <div class="info-box">
                <p><strong>Account Name:</strong> Netsoftuk Solution</p>
                <p><strong>Account Number:</strong> 17855008</p>
                <p><strong>Sort Code:</strong> 04-06-05</p>
            </div>

            <p>If you have any questions about this invoice, please don't hesitate to contact us.</p>

            <div style="text-align: center;">
                <a href="mailto:rentandrooms@gmail.com" class="button">Contact Us</a>
            </div>

            <p>Best regards,<br><strong>Rent and Rooms Team</strong></p>
        </div>
        <div class="footer">
            <p>Rent and Rooms | 60 Sceptre Street, Newcastle, NE4 6PR</p>
            <p>Phone: 03301339494 | Email: rentandrooms@gmail.com</p>
        </div>
    </div>
</body>
</html>
