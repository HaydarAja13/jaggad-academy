<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class InitialDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 0. Default Users
        if (!app()->environment('production')) {
            \App\Models\User::create([
                'name' => 'Admin JAGGAD',
                'email' => 'admin@jaggad.id',
                'password' => \Illuminate\Support\Facades\Hash::make('password'),
                'role' => 'admin',
                'status' => 'active',
                'email_verified_at' => now(),
            ]);

            \App\Models\User::create([
                'name' => 'Trial User',
                'email' => 'user@gmail.com',
                'password' => \Illuminate\Support\Facades\Hash::make('password'),
                'role' => 'customer',
                'status' => 'active',
                'email_verified_at' => now(),
            ]);
        }

        // 1. Payment Methods
        \App\Models\PaymentMethod::create([
            'type' => \App\Models\PaymentMethod::TYPE_BANK_TRANSFER,
            'bank_name' => 'Bank Central Asia (BCA)',
            'account_number' => '1234567890',
            'account_name' => 'JAGGAD ACADEMY',
            'status' => false,
        ]);

        \App\Models\PaymentMethod::create([
            'type' => \App\Models\PaymentMethod::TYPE_BANK_TRANSFER,
            'bank_name' => 'Bank Mandiri',
            'account_number' => '0987654321',
            'account_name' => 'JAGGAD ACADEMY',
            'status' => false,
        ]);

        \App\Models\PaymentMethod::create([
            'type' => \App\Models\PaymentMethod::TYPE_MIDTRANS,
            'bank_name' => 'Midtrans (Otomatis: QRIS, VA, Kartu)',
            'account_number' => '-',
            'account_name' => 'JAGGAD ACADEMY',
            'status' => false,
        ]);

        // 2. Categories
        $catEbook = \App\Models\Category::create(['name' => 'Ebook', 'slug' => 'ebook', 'description' => 'Buku digital lengkap & informatif', 'image' => 'https://images.unsplash.com/photo-1544716278-e513176f20b5?auto=format&fit=crop&q=80&w=400']);
        $catVideo = \App\Models\Category::create(['name' => 'Video Kelas', 'slug' => 'video', 'description' => 'Pembelajaran visual step-by-step', 'image' => 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=400']);
        $catWebinar = \App\Models\Category::create(['name' => 'Webinar', 'slug' => 'webinar', 'description' => 'Sesi interaktif dengan pakar', 'image' => 'https://images.unsplash.com/photo-1591115765373-5207764f72e7?auto=format&fit=crop&q=80&w=400']);
        $catOffline = \App\Models\Category::create(['name' => 'Kelas Offline', 'slug' => 'offline', 'description' => 'Pengalaman belajar langsung', 'image' => 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=400']);

        // 3. Products
        \App\Models\Product::create([
            'name' => 'Ebook: Strategi Bisnis Digital 2024',
            'slug' => 'ebook-strategi-bisnis-digital-2024',
            'category_id' => $catEbook->id,
            'price' => 149000,
            'normal_price' => 299000,
            'sold_count' => 0,
            'image' => 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&q=80',
            'badge' => 'Bestseller',
            'featured' => true,
            'short_description' => 'Panduan komprehensif membangun dan mengembangkan bisnis digital di era modern. Berisi strategi terbukti dari para expert.',
            'description' => 'Ebook ini dirancang untuk para entrepreneur dan pebisnis yang ingin memaksimalkan potensi bisnis digital mereka. Dengan lebih dari 200 halaman konten berkualitas, Anda akan mendapatkan panduan lengkap mulai dari membangun fondasi bisnis hingga strategi scaling yang efektif.',
            'benefits' => json_encode(['Strategi pemasaran digital yang terbukti', 'Framework bisnis yang mudah diterapkan', 'Tools dan resource eksklusif', 'Template bisnis siap pakai', 'Akses lifetime ke update terbaru']),
            'materials' => json_encode([
                ['title' => 'Bab 1: Mindset Entrepreneur Digital', 'pages' => 25],
                ['title' => 'Bab 2: Riset Pasar & Target Audience', 'pages' => 30],
                ['title' => 'Bab 3: Membangun Brand yang Kuat', 'pages' => 35],
                ['title' => 'Bab 4: Strategi Konten Marketing', 'pages' => 40],
                ['title' => 'Bab 5: Monetisasi & Scaling', 'pages' => 45],
                ['title' => 'Bab 6: Tools & Automation', 'pages' => 30],
            ]),
        ]);

        \App\Models\Product::create([
            'name' => 'Video Kelas: Instagram Marketing Mastery',
            'slug' => 'video-kelas-instagram-marketing-mastery',
            'category_id' => $catVideo->id,
            'price' => 299000,
            'normal_price' => 599000,
            'sold_count' => 0,
            'image' => 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=400&q=80',
            'badge' => 'Terpopuler',
            'featured' => true,
            'short_description' => 'Kuasai Instagram Marketing dari nol hingga mahir dengan 50+ video pembelajaran berkualitas HD.',
            'description' => 'Kelas video komprehensif yang akan membawa Anda dari pemula menjadi expert dalam Instagram Marketing. Dipandu oleh instruktur berpengalaman dengan track record yang terbukti.',
            'benefits' => json_encode(['Akses seumur hidup ke semua materi', '50+ video HD dengan total 30 jam', 'Community eksklusif member', 'Sertifikat kelulusan', 'Q&A session dengan instruktur']),
            'materials' => json_encode([
                ['title' => 'Modul 1: Dasar Instagram Algorithm', 'videos' => 8],
                ['title' => 'Modul 2: Content Strategy', 'videos' => 10],
                ['title' => 'Modul 3: Instagram Ads', 'videos' => 12],
                ['title' => 'Modul 4: Influencer Marketing', 'videos' => 8],
                ['title' => 'Modul 5: Analytics & Reporting', 'videos' => 6],
                ['title' => 'Modul 6: Case Studies', 'videos' => 8],
            ]),
        ]);

        \App\Models\Product::create([
            'name' => 'Webinar: Financial Planning untuk Freelancer',
            'slug' => 'webinar-financial-planning-untuk-freelancer',
            'category_id' => $catWebinar->id,
            'price' => 99000,
            'normal_price' => 199000,
            'sold_count' => 0,
            'image' => 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&q=80',
            'badge' => 'Live',
            'featured' => true,
            'short_description' => 'Pelajari cara mengelola keuangan secara cerdas sebagai freelancer bersama pakar finansial.',
            'description' => 'Webinar interaktif 3 jam bersama certified financial planner yang akan membantu Anda mengatur keuangan freelance secara optimal.',
            'benefits' => json_encode(['Sesi live 3 jam interaktif', 'Recording tersedia setelah webinar', 'Template tracking keuangan', 'Q&A session langsung', 'Certificate of attendance']),
            'materials' => json_encode([
                ['title' => 'Sesi 1: Dasar Financial Planning', 'duration' => '60 menit'],
                ['title' => 'Sesi 2: Investasi untuk Freelancer', 'duration' => '60 menit'],
                ['title' => 'Sesi 3: Tax Planning & Compliance', 'duration' => '60 menit'],
            ]),
        ]);

        \App\Models\Product::create([
            'name' => 'Kelas Offline: Digital Marketing Bootcamp',
            'slug' => 'kelas-offline-digital-marketing-bootcamp',
            'category_id' => $catOffline->id,
            'price' => 1500000,
            'normal_price' => 2500000,
            'sold_count' => 0,
            'image' => 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=400&q=80',
            'badge' => 'Premium',
            'featured' => true,
            'short_description' => 'Bootcamp intensif 3 hari di Jakarta untuk menguasai digital marketing secara menyeluruh.',
            'description' => 'Program bootcamp offline terbaik yang dirancang untuk memberikan pengalaman belajar langsung dengan mentor berpengalaman dan networking dengan sesama peserta.',
            'benefits' => json_encode(['3 hari intensif di Jakarta', 'Makan siang & coffee break included', 'Materi cetak eksklusif', 'Networking dengan 50+ peserta', 'Sertifikat internasional']),
            'materials' => json_encode([
                ['title' => 'Hari 1: Digital Marketing Fundamentals', 'duration' => '8 jam'],
                ['title' => 'Hari 2: Hands-on Workshop', 'duration' => '8 jam'],
                ['title' => 'Hari 3: Campaign Project & Presentasi', 'duration' => '8 jam'],
            ]),
        ]);

        \App\Models\Product::create([
            'name' => 'Ebook: SEO Mastery Guide',
            'slug' => 'ebook-seo-mastery-guide',
            'category_id' => $catEbook->id,
            'price' => 129000,
            'normal_price' => 249000,
            'sold_count' => 0,
            'image' => 'https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?w=400&q=80',
            'badge' => 'New',
            'short_description' => 'Panduan SEO lengkap dari teknik on-page hingga off-page yang terbukti meningkatkan ranking Google.',
            'description' => 'Ebook premium yang membahas semua aspek SEO modern, dari technical SEO hingga content strategy yang efektif.',
            'benefits' => json_encode(['Lebih dari 150 halaman konten', 'Teknik SEO terbaru 2024', 'Checklist SEO siap pakai', 'Tools recommendation', 'Lifetime access']),
            'materials' => json_encode([
                ['title' => 'Bab 1: SEO Fundamentals', 'pages' => 20],
                ['title' => 'Bab 2: Keyword Research', 'pages' => 25],
                ['title' => 'Bab 3: On-Page Optimization', 'pages' => 35],
                ['title' => 'Bab 4: Link Building', 'pages' => 30],
                ['title' => 'Bab 5: Technical SEO', 'pages' => 25],
            ]),
        ]);

        \App\Models\Product::create([
            'name' => 'Video Kelas: Copywriting yang Menjual',
            'slug' => 'video-kelas-copywriting-yang-menjual',
            'category_id' => $catVideo->id,
            'price' => 249000,
            'normal_price' => 449000,
            'sold_count' => 0,
            'image' => 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400&q=80',
            'badge' => null,
            'short_description' => 'Kuasai seni menulis copy yang persuasif dan meningkatkan konversi bisnis Anda.',
            'description' => 'Kelas video yang mengajarkan teknik copywriting profesional untuk membuat tulisan yang bisa menjual produk dan jasa secara efektif.',
            'benefits' => json_encode(['30+ video HD berkualitas', 'Template copywriting siap pakai', 'Panduan formula AIDA & PAS', 'Review copy oleh instruktur', 'Akses komunitas eksklusif']),
            'materials' => json_encode([
                ['title' => 'Modul 1: Psychology of Persuasion', 'videos' => 6],
                ['title' => 'Modul 2: Headline yang Menarik', 'videos' => 8],
                ['title' => 'Modul 3: Storytelling dalam Copy', 'videos' => 6],
                ['title' => 'Modul 4: Landing Page Copy', 'videos' => 8],
                ['title' => 'Modul 5: Email Marketing Copy', 'videos' => 6],
            ]),
        ]);

        // 4. Default Site Configuration
        $defaultSiteContent = [
            'home' => [
                'heroBadge' => 'Platform Digital Learning #1 Indonesia',
                'heroTitleLine1' => 'Kuasai Skill Digital,',
                'heroTitleLine2' => 'Akselerasi Karir Anda',
                'heroSubtitle' => 'Pelajari keterampilan digital terbaru dari para mentor berpengalaman. Ebook, Video Kelas, Webinar, dan Kelas Offline tersedia untuk membantu perjalanan sukses Anda.',
                'ctaPrimary' => 'Jelajahi Produk',
                'ctaSecondary' => 'Lihat Paket Bundling'
            ],
            'about' => [
                'heroTitle' => 'Mencerdaskan Generasi Digital',
                'heroDesc' => 'JAGGAD ACADEMY adalah platform edukasi digital yang berfokus pada pengembangan skill praktis bagi mahasiswa, profesional, dan entrepreneur di Indonesia.',
                'storyTitle' => 'Cerita di Balik JAGGAD',
                'storyP1' => 'Berawal dari keresahan akan tingginya kesenjangan antara kurikulum akademis dengan kebutuhan industri digital yang sangat cepat berubah.',
                'storyP2' => 'JAGGAD ACADEMY lahir untuk menjadi jembatan bagi mereka yang ingin belajar langsung dari praktisi, menggunakan materi yang up-to-date dan metode yang fleksibel.'
            ],
            'contact' => [
                'pageTitle' => 'Hubungi Kami',
                'title' => 'Ada Pertanyaan? Kami Siap Membantu',
                'subtitle' => 'Tim kami siap menjawab pertanyaan Anda seputar produk, metode pembelajaran, atau kerjasama strategis lainnya.',
                'whatsappCta' => 'Konsultasi lewat WhatsApp',
                'whatsappNote' => 'Mulai dari pertanyaan sederhana. Kami bantu arahkan langkah berikutnya.',
                'directTitle' => 'Hubungi tim secara langsung',
                'guideTitle' => 'Mulai dari kebutuhan Anda.',
                'guideSubtitle' => 'Pilih topik yang paling dekat dengan kebutuhan Anda agar percakapan lebih cepat dan relevan.',
                'topics' => [
                    ['title' => 'Memilih program belajar', 'desc' => 'Ceritakan tujuan dan cara belajar yang Anda sukai. Tim kami membantu mengarahkan ke pilihan yang tersedia.'],
                    ['title' => 'Pembelian dan akses', 'desc' => 'Tanyakan proses checkout, status pembayaran, atau cara mengakses produk yang sudah dibeli.'],
                    ['title' => 'Kolaborasi dan kemitraan', 'desc' => 'Diskusikan peluang kelas, webinar, program perusahaan, atau bentuk kolaborasi lainnya.'],
                ],
                'formTitle' => 'Lebih nyaman menulis pesan?',
                'formSubtitle' => 'Tinggalkan konteks yang cukup agar tim kami dapat memahami kebutuhan Anda sejak awal.',
                'formNameLabel' => 'Nama lengkap',
                'formNamePlaceholder' => 'Nama Anda',
                'formEmailLabel' => 'Email',
                'formEmailPlaceholder' => 'nama@email.com',
                'formSubjectLabel' => 'Topik',
                'formSubjectPlaceholder' => 'Pilih topik pesan',
                'formMessageLabel' => 'Pesan',
                'formMessagePlaceholder' => 'Ceritakan kebutuhan atau pertanyaan Anda...',
                'formSubmitLabel' => 'Buka email untuk mengirim',
                'formNote' => 'Tombol ini membuka aplikasi email Anda dengan pesan yang sudah disiapkan.',
                'formEmailIntro' => 'Halo tim JAGGAD Academy,',
                'formOpenEmailNotice' => 'Membuka aplikasi email Anda.',
                'phoneLabel' => 'Telepon / WhatsApp',
                'emailLabel' => 'Email',
                'addressLabel' => 'Alamat',
                'email' => 'halo@jaggad.id',
                'phone' => '+62 812 3456 7890',
                'address' => 'Gedung JAGGAD Digital Hub, Lt. 5, Jl. Sudirman No. 123, Jakarta Selatan',
                'mapsUrl' => '',
            ],
            'dashboard' => [
                'welcomeTitle' => 'Selamat datang kembali',
                'welcomeDescription' => 'Lanjutkan program yang sudah Anda miliki atau temukan materi berikutnya untuk mendukung tujuan belajar Anda.',
                'continueLabel' => 'Lanjutkan belajar',
                'exploreLabel' => 'Jelajahi program',
                'profileLabel' => 'Kelola profil',
                'summaryTitle' => 'Ringkasan akun',
                'ownedLabel' => 'Produk aktif',
                'transactionLabel' => 'Transaksi terbaru',
                'pendingLabel' => 'Menunggu pembayaran',
                'libraryTitle' => 'Koleksi belajar Anda',
                'libraryDescription' => 'Semua program yang sudah aktif tersimpan di sini dan siap dibuka kembali kapan saja.',
                'emptyLibraryTitle' => 'Mulai perjalanan belajar Anda',
                'emptyLibraryDescription' => 'Pilih program yang paling dekat dengan kebutuhan Anda. Setelah pembayaran terverifikasi, akses akan muncul di halaman ini.',
                'openMaterialLabel' => 'Buka materi',
                'transactionsTitle' => 'Transaksi terbaru',
                'transactionsDescription' => 'Pantau status pembayaran dan lihat kembali rincian pembelian Anda.',
                'emptyTransactionTitle' => 'Belum ada transaksi',
                'emptyTransactionDescription' => 'Riwayat pembayaran akan tampil di sini setelah Anda melakukan pembelian.',
                'detailLabel' => 'Lihat detail',
                'repayLabel' => 'Bayar sekarang',
                'changePaymentLabel' => 'Ubah metode',
                'reviewLabel' => 'Sedang ditinjau',
            ],
        ];

        \App\Models\SiteContent::updateOrCreate(
            ['key' => 'site_content'],
            ['value' => json_encode($defaultSiteContent)]
        );

        $defaultAdsPromo = [
            'hero' => [
                'badge' => 'Penawaran pilihan JAGGAD',
                'title' => 'Pilih program yang tepat untuk langkah berikutnya',
                'subtitle' => 'Bandingkan program, manfaat, dan harga dalam satu halaman yang jelas.',
                'mediaType' => 'image',
                'image' => '',
                'imageAlt' => '',
                'videoUrl' => '',
                'guarantee' => 'Detail akses dan pembelian mengikuti informasi setiap program.',
            ],
            'urgency' => [
                'countdownHours' => 12,
                'quotaText' => 'Penawaran tersedia dalam waktu terbatas.',
                'ctaNote' => 'Periksa detail program sebelum melanjutkan.',
            ],
            'proofItems' => [
                'Akses materi dari dashboard Anda',
                'Belajar fleksibel sesuai ritme sendiri',
                'Pilihan program untuk kebutuhan yang berbeda',
            ],
            'offers' => [
                'title' => 'Pilih penawaran yang paling relevan',
                'description' => 'Harga dan manfaat ditampilkan langsung dari katalog JAGGAD.',
            ],
            'trust' => [
                'title' => 'Keputusan yang jelas sebelum membeli',
                'description' => 'Periksa isi program, harga, dan bentuk aksesnya tanpa harus menebak apa yang akan Anda dapatkan.',
                'items' => [
                    ['title' => 'Detail yang transparan', 'description' => 'Harga dan manfaat mengikuti data produk yang aktif.'],
                    ['title' => 'Akses terhubung', 'description' => 'Produk yang dibeli tersedia melalui dashboard pelanggan.'],
                    ['title' => 'Bantuan saat dibutuhkan', 'description' => 'Tim JAGGAD dapat membantu Anda memilih melalui halaman kontak.'],
                ],
            ],
            'cta' => ['primary' => 'Lihat penawaran'],
            'closing' => [
                'title' => 'Sudah menemukan program yang cocok?',
                'description' => 'Pilih penawaran di atas dan periksa kembali detail produknya sebelum melanjutkan.',
                'primary' => 'Pilih promo',
                'secondary' => 'Konsultasi dulu',
                'asideTitle' => 'Masih membandingkan pilihan?',
                'asideDescription' => 'Hubungi tim JAGGAD untuk mendapat arahan berdasarkan tujuan belajar Anda.',
            ],
            'selectedProductIds' => [],
        ];

        \App\Models\SiteContent::updateOrCreate(
            ['key' => 'ads_promo'],
            ['value' => json_encode($defaultAdsPromo)]
        );

        // 5. Default Credentials (Blank for user to fill)
        $defaultSettings = [
            'google_client_id' => '',
            'google_client_secret' => '',
            'google_redirect_url' => url('/auth/google/callback'),
            'midtrans_server_key' => '',
            'midtrans_client_key' => '',
            'midtrans_is_production' => false,
            'meta_pixel_id' => '',
            'meta_access_token' => '',
        ];

        \App\Models\SiteContent::updateOrCreate(
            ['key' => 'site_settings'],
            ['value' => json_encode($defaultSettings)]
        );
    }
}
