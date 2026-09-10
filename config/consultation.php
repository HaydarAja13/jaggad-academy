<?php

return [
    'public' => [
        'title' => 'Pilih Paket yang Sesuai dengan Kebutuhanmu',
        'subtitle' => 'Sesi tatap muka yang terarah, dari percakapan awal hingga pendampingan yang lebih mendalam.',
        'scheduleLabel' => 'Selasa–Sabtu · 19.00–23.00 WIB',
        'ctaLabel' => 'Ajukan Jadwal',
        'packages' => [
            [
                'slug' => 'quick-talk',
                'name' => 'Quick Talk',
                'icon' => 'MessageCircleMore',
                'durationLabel' => '30 Menit',
                'priceLabel' => 'Rp 200.000',
                'popular' => false,
                'description' => 'Cocok untuk konsultasi awal atau masalah ringan.',
                'benefits' => ['Identifikasi masalah', 'Perspektif baru', '1–2 langkah tindakan'],
                'options' => [
                    ['key' => '30-minutes', 'label' => '30 Menit', 'durationMinutes' => 30, 'totalPrice' => 200000, 'depositAmount' => 100000],
                ],
            ],
            [
                'slug' => 'deep-talk',
                'name' => 'Deep Talk',
                'icon' => 'UserRound',
                'durationLabel' => '60 Menit',
                'priceLabel' => 'Rp 400.000',
                'popular' => true,
                'description' => 'Pilihan terbaik untuk konsultasi utama.',
                'benefits' => ['Eksplorasi akar masalah', 'Reframing mindset', 'Coaching', 'Action plan'],
                'options' => [
                    ['key' => '60-minutes', 'label' => '60 Menit', 'durationMinutes' => 60, 'totalPrice' => 400000, 'depositAmount' => 200000],
                ],
            ],
            [
                'slug' => 'personal-transformation',
                'name' => 'Personal Transformation',
                'icon' => 'UsersRound',
                'durationLabel' => '90–120 Menit',
                'priceLabel' => 'Rp 750.000',
                'popular' => false,
                'description' => 'Untuk kamu yang siap berproses lebih dalam.',
                'benefits' => ['Deep assessment', 'Coaching intensif', 'NLP / reframing (jika relevan)', 'Action plan personal', 'Follow-up singkat'],
                'options' => [
                    ['key' => '90-minutes', 'label' => '90 Menit', 'durationMinutes' => 90, 'totalPrice' => 750000, 'depositAmount' => 375000],
                    ['key' => '120-minutes', 'label' => '120 Menit', 'durationMinutes' => 120, 'totalPrice' => 750000, 'depositAmount' => 375000],
                ],
            ],
            [
                'slug' => 'custom-session',
                'name' => 'Custom Session',
                'icon' => 'Clock3',
                'durationLabel' => '2 Jam',
                'priceLabel' => 'Rp 750.000 – Rp 1.000.000',
                'popular' => false,
                'description' => 'Cocok untuk kasus kompleks atau kebutuhan khusus.',
                'benefits' => ['Pembahasan lebih luas', 'Solusi lebih mendalam', 'Strategi jangka panjang'],
                'options' => [
                    ['key' => 'standard', 'label' => 'Standard · Rp 750.000', 'durationMinutes' => 120, 'totalPrice' => 750000, 'depositAmount' => 375000],
                    ['key' => 'extended', 'label' => 'Extended · Rp 1.000.000', 'durationMinutes' => 120, 'totalPrice' => 1000000, 'depositAmount' => 500000],
                ],
            ],
        ],
    ],
    'settings' => [
        'timezone' => 'Asia/Jakarta',
        'workingDays' => [2, 3, 4, 5, 6],
        'workingDaysLabel' => 'Selasa–Sabtu',
        'opensAt' => '19:00',
        'closesAt' => '23:00',
        'minimumLeadHours' => 24,
        'depositExpiryHours' => 24,
        'rescheduleCutoffHours' => 24,
        'maximumCustomerReschedules' => 1,
        'mentors' => [],
    ],
];
