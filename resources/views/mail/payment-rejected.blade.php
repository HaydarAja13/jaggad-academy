<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Bukti transfer perlu diperbaiki</title>
</head>
<body style="margin:0;padding:32px 16px;background:#f5f4f6;color:#171316;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
    <div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #ded4d7;border-radius:16px;overflow:hidden;">
        <div style="padding:28px 32px;background:#660810;color:#ffffff;">
            <div style="font-size:20px;font-weight:800;letter-spacing:.04em;">JAGGAD ACADEMY</div>
            <div style="margin-top:8px;font-size:16px;color:#f2dadd;">Bukti transfer perlu diperbaiki</div>
        </div>
        <div style="padding:32px;">
            <p style="margin:0 0 12px;font-size:18px;font-weight:700;">Halo, {{ $transaction->user->name }}.</p>
            <p style="margin:0 0 24px;font-size:16px;line-height:1.65;color:#67555c;">Bukti transfer untuk transaksi <strong>{{ $transaction->transaction_code }}</strong> belum dapat kami validasi. Pesanan tetap tersimpan.</p>
            <div style="padding:18px;border:1px solid #ded4d7;border-radius:12px;background:#fbf8f9;">
                <div style="margin-bottom:6px;font-size:16px;font-weight:700;color:#660810;">Alasan penolakan</div>
                <div style="font-size:16px;line-height:1.6;color:#3e3337;">{{ $transaction->payment->rejection_reason }}</div>
            </div>
            <p style="margin:24px 0;font-size:16px;line-height:1.65;color:#67555c;">Silakan buka dashboard, pilih transaksi ini, lalu unggah bukti transfer yang benar.</p>
            <a href="{{ url('/dashboard') }}" style="display:inline-block;padding:14px 24px;border-radius:999px;background:#660810;color:#ffffff;font-size:16px;font-weight:700;text-align:center;text-decoration:none;">Unggah bukti baru</a>
        </div>
    </div>
</body>
</html>
