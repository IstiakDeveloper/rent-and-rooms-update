<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $subject }}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #f8f9fa; border-radius: 10px; padding: 30px; margin-bottom: 20px;">
        <h2 style="color: #2c3e50; margin-bottom: 20px;">Hello {{ $userName }},</h2>

        <div style="background-color: white; border-radius: 5px; padding: 20px; margin: 20px 0;">
            {!! nl2br(e($messageContent)) !!}
        </div>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
            <p style="color: #7f8c8d; font-size: 14px; margin: 5px 0;">Best regards,</p>
            <p style="color: #2c3e50; font-weight: bold; margin: 5px 0;">Rent and Rooms Team</p>
        </div>
    </div>

    <div style="text-align: center; color: #7f8c8d; font-size: 12px; margin-top: 20px;">
        <p>Rent and Rooms</p>
        <p>60 Sceptre Street, Newcastle, NE4 6PR</p>
        <p>Phone: 03301339494 | Email: info@rentandrooms.co.uk</p>
    </div>
</body>
</html>
