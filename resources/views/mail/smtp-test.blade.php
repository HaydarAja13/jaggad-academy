<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Test Email SMTP - JAGGAD ACADEMY</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            background-color: #f7f3f4;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            color: #171316;
            padding: 32px 16px;
        }
        .wrapper { max-width: 560px; margin: 0 auto; }
        .card {
            background: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            border: 1px solid #ded4d7;
        }
        .header {
            background: #660810;
            color: #ffffff;
            padding: 28px;
            text-align: center;
        }
        .header h1 { font-size: 22px; letter-spacing: 1px; }
        .body { padding: 28px; }
        .body p { font-size: 16px; line-height: 1.7; color: #67555c; margin-bottom: 16px; }
        .detail {
            background: #f7f3f4;
            border-radius: 10px;
            padding: 16px 18px;
            font-size: 1rem;
            line-height: 2;
            color: #171316;
        }
        .detail strong { display: inline-block; min-width: 130px; }
        .badge {
            display: inline-block;
            background: #e6f6ec;
            color: #15803d;
            font-weight: bold;
            border-radius: 999px;
            padding: 6px 16px;
            font-size: 1rem;
            margin-bottom: 16px;
        }
        .footer {
            text-align: center;
            font-size: 1rem;
            color: #a08e93;
            padding: 20px;
        }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="card">
            <div class="header">
                <h1>JAGGAD ACADEMY</h1>
            </div>
            <div class="body">
                <span class="badge">✓ SMTP Terhubung</span>
                <p>
                    Email percobaan ini terkirim dengan baik. Konfigurasi SMTP pada panel admin
                    sudah benar — struk pembelian, notifikasi pembayaran, dan link akses materi
                    akan dikirim lewat server ini.
                </p>
                <div class="detail">
                    <div><strong>SMTP Host</strong> {{ $smtpHost }}</div>
                    <div><strong>SMTP Port</strong> {{ $smtpPort }}</div>
                    <div><strong>Pengirim</strong> {{ $fromAddress }}</div>
                    <div><strong>Waktu kirim</strong> {{ now()->format('d M Y H:i:s') }} WIB</div>
                </div>
            </div>
        </div>
        <div class="footer">Email otomatis dari sistem JAGGAD ACADEMY — abaikan jika Anda tidak memintanya.</div>
    </div>
</body>
</html>
