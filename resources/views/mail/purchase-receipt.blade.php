<!DOCTYPE html>
<html lang="id">
<head>
    @php
        $siteContent = \App\Models\SiteContent::where('key', 'site_content')->first();
        $content = $siteContent ? json_decode($siteContent->value, true) : [];
        $branding = $content['branding'] ?? [];
        $contact = $content['contact'] ?? [];
        $siteName = $branding['siteName'] ?? 'JAGGAD ACADEMY';
        $siteTagline = $branding['siteTagline'] ?? 'Platform Digital Learning #1 Indonesia';
        $contactEmail = $contact['email'] ?? 'halo@jaggad.id';
    @endphp
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Struk Pembelian - {{ $siteName }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            background-color: #ffffff; 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            color: #660810; /* Deep red text */
            padding: 32px 16px;
        }
        .wrapper {
            max-width: 620px;
            margin: 0 auto;
        }
        /* Header */
        .header {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 16px 16px 0 0;
            padding: 32px;
            text-align: center;
        }
        .brand {
            font-size: 24px;
            font-weight: 900;
            color: #660810;
            letter-spacing: 1.5px;
        }
        .header-subtitle {
            color: #64748b;
            font-size: 16px;
            margin-top: 6px;
        }
        .success-badge {
            display: inline-block;
            margin-top: 20px;
            padding: 8px 20px;
            background: rgba(102, 8, 16, 0.05);
            border: 1px solid rgba(102, 8, 16, 0.15);
            border-radius: 100px;
            color: #660810;
            font-size: 16px;
            font-weight: 600;
            text-align: center;
        }
        /* Body */
        .body {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-top: none;
            padding: 32px;
        }
        .greeting {
            font-size: 18px;
            font-weight: 700;
            color: #660810;
            margin-bottom: 8px;
        }
        .greeting-sub {
            font-size: 16px;
            color: #374151;
            line-height: 1.6;
            margin-bottom: 28px;
        }
        /* Info Box */
        .info-box {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 24px;
            display: flex;
            flex-wrap: wrap;
            gap: 16px;
        }
        .info-item {
            flex: 1;
            min-width: 140px;
        }
        .info-label {
            font-size: 16px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            margin-bottom: 4px;
        }
        .info-value {
            font-size: 16px;
            font-weight: 600;
            color: #660810;
        }
        /* Section Title */
        .section-title {
            font-size: 16px;
            font-weight: 700;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            margin-bottom: 12px;
        }
        /* Products Table */
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 24px;
            table-layout: fixed;
        }
        thead th {
            background: #ffffff;
            color: #660810;
            font-size: 16px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            padding: 10px 14px;
            text-align: left;
            font-weight: 700;
            border-bottom: 1px solid #e2e8f0;
        }
        thead th:first-child { width: 70%; }
        thead th:last-child { width: 30%; text-align: right; }
        tbody td {
            padding: 12px 14px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 16px;
            color: #7a1d25;
            vertical-align: middle;
            word-break: break-word;
        }
        tbody td:last-child {
            text-align: right;
            font-weight: 600;
            color: #660810;
            white-space: nowrap;
            width: 30%;
        }
        .product-name {
            color: #660810;
            font-weight: 600;
            line-height: 1.4;
        }
        .product-category {
            font-size: 16px;
            color: #64748b;
            margin-top: 3px;
        }
        /* Total Row */
        .total-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 16px 20px;
            margin-bottom: 28px;
        }
        .total-label {
            font-size: 16px;
            font-weight: 700;
            color: #660810;
        }
        .total-amount {
            font-size: 20px;
            font-weight: 800;
            color: #660810;
        }
        /* CTA Button */
        .cta {
            text-align: center;
            margin-bottom: 28px;
        }
        .cta a {
            display: inline-block;
            padding: 14px 36px;
            background: #660810;
            color: white;
            text-decoration: none;
            border-radius: 100px;
            font-weight: 700;
            font-size: 16px;
            letter-spacing: 0.3px;
            text-align: center;
        }
        /* Footer */
        .footer {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-top: none;
            border-radius: 0 0 16px 16px;
            padding: 24px 32px;
            text-align: center;
        }
        .footer p {
            font-size: 16px;
            color: #914d53;
            line-height: 1.7;
        }
        .footer a { color: #660810; text-decoration: none; }

        @media (max-width: 480px) {
            .body, .header, .footer { padding: 24px 16px; }
            .info-box { flex-direction: column; gap: 12px; }
        }
    </style>
</head>
<body>
<div class="wrapper">
    <!-- HEADER -->
    <div class="header" style="border-bottom: none;">
        <div class="brand">{{ $siteName }}</div>
        <div class="header-subtitle">{{ $siteTagline }}</div>
        <div class="success-badge">✓ &nbsp;Pembayaran Berhasil</div>
    </div>

    <!-- BODY -->
    <div class="body">
        <p class="greeting">Halo, {{ $transaction->user->name }}! 🎉</p>
        <p class="greeting-sub">
            Terima kasih telah berbelanja di {{ $siteName }}. Pembayaran Anda telah kami terima dan produk berikut sudah aktif di akun Anda. Selamat belajar!
        </p>

        <!-- Order Info -->
        <p class="section-title">Detail Transaksi</p>
        <div class="info-box">
            <div class="info-item">
                <div class="info-label">No. Transaksi</div>
                <div class="info-value">{{ $transaction->transaction_code }}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Tanggal Bayar</div>
                <div class="info-value">
                    {{ $transaction->paid_at 
                        ? \Carbon\Carbon::parse($transaction->paid_at)->locale('id')->isoFormat('D MMMM YYYY, HH:mm') 
                        : now()->locale('id')->isoFormat('D MMMM YYYY, HH:mm') }}
                </div>
            </div>
            <div class="info-item">
                <div class="info-label">Metode Pembayaran</div>
                <div class="info-value">
                    @if($transaction->payment && $transaction->payment->paymentMethod)
                        {{ strtoupper($transaction->payment->paymentMethod->bank_name) }}
                    @else
                        {{ strtoupper(str_replace('_', ' ', $transaction->payment_type ?? 'Midtrans')) }}
                    @endif
                </div>
            </div>
        </div>

        <!-- Products -->
        <p class="section-title">Produk yang Dibeli</p>
        <table>
            <thead>
                <tr>
                    <th>Produk</th>
                    <th style="text-align:right;">Harga</th>
                </tr>
            </thead>
            <tbody>
                @foreach($transaction->items as $item)
                <tr>
                    <td>
                        <div class="product-name">{{ $item->product->name ?? 'Produk' }}</div>
                        @if($item->product?->category)
                            <div class="product-category">{{ $item->product->category->name }}</div>
                        @endif
                    </td>
                    <td>Rp {{ number_format($item->price, 0, ',', '.') }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>

        <!-- Total -->
        <div class="total-row">
            <span class="total-label">Total Pembayaran</span>
            <span class="total-amount">Rp {{ number_format($transaction->total_amount, 0, ',', '.') }}</span>
        </div>

        <!-- CTA -->
        <div class="cta">
            <a href="{{ url('/dashboard') }}">Akses Materi Saya →</a>
        </div>
    </div>

    <!-- FOOTER -->
    <div class="footer">
        <p>
            Email ini dikirim otomatis oleh sistem {{ $siteName }}.<br />
            Jika ada pertanyaan, hubungi kami di <a href="mailto:{{ $contactEmail }}">{{ $contactEmail }}</a>.<br /><br />
            &copy; {{ date('Y') }} {{ $siteName }} · Semua Hak Dilindungi
        </p>
    </div>
</div>
</body>
</html>
