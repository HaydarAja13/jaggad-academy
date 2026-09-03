import { createContext, useContext, useState, useEffect } from 'react';

const defaultContent = {
    home: {
        heroBadge: 'Platform Digital Learning #1 Indonesia',
        heroTitleLine1: 'Kuasai Skill Digital,',
        heroTitleLine2: 'Akselerasi Karir Anda',
        heroSubtitle: 'Pelajari keterampilan digital terbaru dari para mentor berpengalaman. Ebook, Video Kelas, Webinar, dan Kelas Offline tersedia untuk membantu perjalanan sukses Anda.',
        ctaPrimary: 'Jelajahi Produk',
        proofText: 'Bergabung dengan 5.200+ pelajar yang telah meningkatkan skill mereka',
        statsTitle: 'Belajar dengan Bukti, Bukan Sekadar Janji',
        statsSubtitle: 'Lihat perjalanan JAGGAD dalam membantu pelajar mengembangkan skill praktis untuk karir dan bisnis.',
        statsCtaLabel: 'Jelajahi Semua Produk',
        statsUsersLabel: 'Pelajar Aktif',
        statsSalesLabel: 'Alumni Sukses',
        statsProductsLabel: 'Program Tersedia',
        heroStats: [
            { value: '25+', label: 'Mentor Expert' },
            { value: '50+', label: 'Produk Belajar' },
        ],
        heroCards: [
            {
                image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=900&q=85',
                title: 'Belajar dari praktisi',
                subtitle: 'Pengalaman industri nyata',
                url: '/products',
            },
            {
                image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&q=85',
                title: 'Kelas yang relevan',
                subtitle: 'Belajar fleksibel bersama JAGGAD',
                url: '/products',
            },
            {
                image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=900&q=85',
                title: 'Skill siap dipakai',
                subtitle: 'Untuk karir dan bisnis Anda',
                url: '/products',
            },
        ],
        catTitlePrefix: 'Berbagai Format',
        catTitleAccent: 'Pembelajaran',
        catSubtitle: 'Pilih pengalaman belajar yang paling sesuai dengan ritme dan tujuan Anda.',
        catCtaLabel: 'Jelajahi Semua Produk',
        catBreadcrumbLabel: 'Format Pembelajaran',
        catBreadcrumbDetail: 'Detail Format',
        catProductCountLabel: 'produk tersedia',
        catAvailabilityLabel: 'pilihan belajar tersedia',
        catDescriptionPrefix: 'Pelajari',
        catDescriptionSuffix: 'bersama',
        catEmptyText: 'Belum ada format pembelajaran tersedia.',
        featuredTitlePrefix: 'Pilihan',
        featuredTitleAccent: 'Terbaik',
        featuredCtaLabel: 'Lihat Semua Produk',
        featuredAllLabel: 'Semua',
        featuredEmptyText: 'Belum ada produk pada kategori ini.',
        featuredProductIds: [],
        productOverlayLabel: 'Lihat Detail',
        productSoldLabel: 'Terjual',
        productDetailLabel: 'Lihat Detailnya',
        whyJaggadTitleLine1: 'Platform Pembelajaran',
        whyJaggadTitleLine2: 'Terpercaya',
        whyJaggadSubtitle: 'Ribuan pelajar telah mempercayakan pengembangan skill mereka kepada JAGGAD ACADEMY.',
        whyJaggadImage: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=900&q=85',
        faqTitle: 'Masih Ada yang Ingin Ditanyakan?',
        faqSubtitle: 'Temukan jawaban singkat sebelum memilih pengalaman belajar yang paling sesuai untuk Anda.',
        faqContactLabel: 'Masih butuh jawaban? Bicara dengan tim',
        faqs: [
            { q: 'Format pembelajaran apa saja yang tersedia?', a: 'JAGGAD Academy menyediakan ebook digital, video kelas, webinar live, dan kelas offline. Ketersediaan setiap format dapat dilihat pada katalog produk.' },
            { q: 'Bagaimana cara mengakses materi setelah membeli?', a: 'Setelah pembayaran berhasil diverifikasi, produk yang Anda beli dapat diakses melalui dashboard akun Anda.' },
            { q: 'Apakah semua program dapat dipelajari secara mandiri?', a: 'Ritme belajar mengikuti format program. Ebook dan video kelas dapat dipelajari lebih fleksibel, sedangkan webinar dan kelas offline mengikuti jadwal yang tertera pada halaman produk.' },
            { q: 'Metode pembayaran apa yang dapat digunakan?', a: 'Pilihan pembayaran yang tersedia akan ditampilkan saat checkout, termasuk metode pembayaran otomatis maupun manual yang sedang aktif.' },
            { q: 'Bagaimana jika saya masih bingung memilih program?', a: 'Hubungi tim JAGGAD Academy melalui halaman kontak atau WhatsApp. Kami akan membantu Anda menemukan program yang sesuai dengan tujuan belajar Anda.' },
        ],
        ctaBannerTitle: 'Siap Tingkatkan Skill Anda?',
        ctaBannerDesc: 'Pilih program yang sesuai dengan tujuan Anda dan mulai belajar dengan ritme yang paling cocok.',
        ctaBannerBtn: 'Mulai Belajar Sekarang',
        ctaSecondary: 'Konsultasi Dulu',
        ctaFormatsTitle: 'Mulai dari format yang cocok untukmu',
        footerCtaLabel: 'Mulai Belajar Sekarang',
        footerProductsTitle: 'Produk',
        footerCompanyTitle: 'Perusahaan',
        footerContactTitle: 'Kontak',
        footerProductEbookLabel: 'Ebook Digital',
        footerProductVideoLabel: 'Video Kelas',
        footerProductWebinarLabel: 'Webinar Live',
        footerProductOfflineLabel: 'Kelas Offline',
        footerAboutLabel: 'Tentang Kami',
        footerContactLabel: 'Kontak',
        footerRightsText: 'All rights reserved.',
        navHomeLabel: 'Beranda',
        navProductsLabel: 'Produk',
        navAboutLabel: 'Tentang Kami',
        navContactLabel: 'Kontak',
        navLoginLabel: 'Masuk',
        navRegisterLabel: 'Daftar',
        features: [
            { icon: 'Zap', title: 'Akses Instan', desc: 'Nikmati produk digital Anda segera setelah pembayaran berhasil, tanpa menunggu.' },
            { icon: 'Shield', title: 'Akses Seumur Hidup', desc: 'Satu kali beli, akses selamanya. Termasuk semua update konten di masa mendatang.' },
            { icon: 'Award', title: 'Dijamin Berkualitas', desc: 'Semua materi dikurasi oleh para expert dengan pengalaman industri yang terbukti.' },
            { icon: 'BookOpen', title: 'Belajar Fleksibel', desc: 'Pilih format dan waktu belajar yang paling sesuai dengan kebutuhan Anda.' },
        ]
    },
    about: {
        heroTitlePrefix: 'Belajar bukan sekadar tahu.',
        heroTitle: 'Mencerdaskan Generasi Digital',
        heroDesc: 'JAGGAD ACADEMY adalah platform edukasi digital yang berfokus pada pengembangan skill praktis bagi mahasiswa, profesional, dan entrepreneur di Indonesia.',
        heroPrimaryCta: 'Temukan Program Belajar',
        heroSecondaryCta: 'Kenal Lebih Dekat',
        heroImage: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&q=85',
        imageCaption: 'Dari pengetahuan menjadi kemampuan',
        imageCaptionStrong: 'Skill yang siap dipakai di dunia nyata.',
        storyTitle: 'Cerita di Balik JAGGAD',
        storyP1: 'Berawal dari keresahan akan tingginya kesenjangan antara kurikulum akademis dengan kebutuhan industri digital yang sangat cepat berubah.',
        storyP2: 'JAGGAD ACADEMY lahir untuk menjadi jembatan bagi mereka yang ingin belajar langsung dari praktisi, menggunakan materi yang up-to-date dan metode yang fleksibel.',
        visionTitle: 'Visi',
        visionDesc: 'Menjadi platform pembelajaran digital terdepan di Indonesia yang melahirkan generasi profesional kompeten dan siap bersaing di era global.',
        missionTitle: 'Misi',
        missions: [
            'Menyediakan konten pembelajaran berkualitas tinggi yang praktis dan langsung dapat diterapkan',
            'Membangun ekosistem pelajar yang saling mendukung dan mendorong pertumbuhan',
            'Berkolaborasi dengan para profesional terbaik sebagai mentor',
            'Terus berinovasi dalam metode pembelajaran digital'
        ],
        achievements: [
            { label: 'Alumni Sukses', value: '10.000+', icon: 'Users' },
            { label: 'Produk Digital', value: '50+', icon: 'BookOpen' },
            { label: 'Tingkat Kepuasan', value: '98%', icon: 'Target' },
            { label: 'Mentor Expert', value: '25+', icon: 'Award' }
        ],
        milestones: [
            { year: '2021', text: 'JAGGAD ACADEMY berdiri dengan 3 produk pertama' },
            { year: '2022', text: 'Meraih 1.000 pelajar aktif pertama' },
            { year: '2023', text: 'Ekspansi ke kelas offline dan webinar live' },
            { year: '2024', text: '5.200+ pelajar aktif, 50+ produk tersedia' }
        ],
        proofTitle: 'Perjalanan yang tumbuh bersama pelajar',
        proofDesc: 'Setiap angka mewakili langkah belajar, produk yang disusun, dan kolaborasi yang terus berkembang di ekosistem JAGGAD Academy.',
        ctaTitle: 'Mulai dari skill yang paling Anda butuhkan.',
        ctaDesc: 'Jelajahi pilihan ebook, video kelas, webinar, dan kelas offline yang dapat disesuaikan dengan tujuan belajar Anda.',
        ctaPrimary: 'Jelajahi Produk',
        ctaSecondary: 'Konsultasi dengan Tim'
    },
    contact: {
        pageTitle: 'Hubungi Kami',
        title: 'Ada Pertanyaan? Kami Siap Membantu',
        subtitle: 'Tim kami siap menjawab pertanyaan Anda seputar produk, metode pembelajaran, atau kerjasama strategis lainnya.',
        whatsappCta: 'Konsultasi lewat WhatsApp',
        whatsappNote: 'Mulai dari pertanyaan sederhana. Kami bantu arahkan langkah berikutnya.',
        directTitle: 'Hubungi tim secara langsung',
        guideTitle: 'Mulai dari kebutuhan Anda.',
        guideSubtitle: 'Pilih topik yang paling dekat dengan kebutuhan Anda agar percakapan lebih cepat dan relevan.',
        topics: [
            { title: 'Memilih program belajar', desc: 'Ceritakan tujuan dan cara belajar yang Anda sukai. Tim kami membantu mengarahkan ke pilihan yang tersedia.' },
            { title: 'Pembelian dan akses', desc: 'Tanyakan proses checkout, status pembayaran, atau cara mengakses produk yang sudah dibeli.' },
            { title: 'Kolaborasi dan kemitraan', desc: 'Diskusikan peluang kelas, webinar, program perusahaan, atau bentuk kolaborasi lainnya.' },
        ],
        formTitle: 'Lebih nyaman menulis pesan?',
        formSubtitle: 'Tinggalkan konteks yang cukup agar tim kami dapat memahami kebutuhan Anda sejak awal.',
        formNameLabel: 'Nama lengkap',
        formNamePlaceholder: 'Nama Anda',
        formEmailLabel: 'Email',
        formEmailPlaceholder: 'nama@email.com',
        formSubjectLabel: 'Topik',
        formSubjectPlaceholder: 'Pilih topik pesan',
        formMessageLabel: 'Pesan',
        formMessagePlaceholder: 'Ceritakan kebutuhan atau pertanyaan Anda...',
        formSubmitLabel: 'Buka email untuk mengirim',
        formNote: 'Tombol ini membuka aplikasi email Anda dengan pesan yang sudah disiapkan.',
        formEmailIntro: 'Halo tim JAGGAD Academy,',
        formOpenEmailNotice: 'Membuka aplikasi email Anda.',
        phoneLabel: 'Telepon / WhatsApp',
        emailLabel: 'Email',
        addressLabel: 'Alamat',
        email: 'halo@jaggad.id',
        phone: '+62 812 3456 7890',
        address: 'Gedung JAGGAD Digital Hub, Lt. 5, Jl. Sudirman No. 123, Jakarta Selatan',
        mapsUrl: ''
    },
    dashboard: {
        welcomeTitle: 'Selamat datang kembali',
        welcomeDescription: 'Lanjutkan program yang sudah Anda miliki atau temukan materi berikutnya untuk mendukung tujuan belajar Anda.',
        continueLabel: 'Lanjutkan belajar',
        exploreLabel: 'Jelajahi program',
        profileLabel: 'Kelola profil',
        summaryTitle: 'Ringkasan akun',
        ownedLabel: 'Produk aktif',
        transactionLabel: 'Transaksi terbaru',
        pendingLabel: 'Menunggu pembayaran',
        libraryTitle: 'Koleksi belajar Anda',
        libraryDescription: 'Semua program yang sudah aktif tersimpan di sini dan siap dibuka kembali kapan saja.',
        emptyLibraryTitle: 'Mulai perjalanan belajar Anda',
        emptyLibraryDescription: 'Pilih program yang paling dekat dengan kebutuhan Anda. Setelah pembayaran terverifikasi, akses akan muncul di halaman ini.',
        openMaterialLabel: 'Buka materi',
        transactionsTitle: 'Transaksi terbaru',
        transactionsDescription: 'Pantau status pembayaran dan lihat kembali rincian pembelian Anda.',
        emptyTransactionTitle: 'Belum ada transaksi',
        emptyTransactionDescription: 'Riwayat pembayaran akan tampil di sini setelah Anda melakukan pembelian.',
        detailLabel: 'Lihat detail',
        repayLabel: 'Bayar sekarang',
        changePaymentLabel: 'Ubah metode',
        reviewLabel: 'Sedang ditinjau',
    },
    ads: {
        heroBadge: 'Penawaran Terbatas',
        heroTitle: 'Bongkar Rahasia Bisnis Beromset Ratusan Juta',
        heroSubtitle: 'Pelajari strategi digital yang telah terbukti langsung dari praktisinya. Kuasai pasar sekarang juga!',
        videoUrl: '',
        selectedProductIds: [1],
        ctaTitle: 'Ambil Promo Sekarang',
        ctaSubtitle: 'Amankan seat Anda sebelum promo berakhir!',
        guaranteeText: 'Garansi 100% • Akses seumur hidup • Dukungan tim',
        countdownHours: 12,
        quotaText: 'Kuota terbatas untuk 50 pendaftar pertama',
    },
    social: {
        instagram: 'https://instagram.com/jaggad',
        youtube: 'https://youtube.com/@jaggad',
        twitter: 'https://twitter.com/jaggad'
    },
    branding: {
        siteName: 'JAGGAD',
        siteTagline: 'Academy',
        favicon: '',
        logo: '',
    },
    checkout: {
        introTitle: 'Apakah Anda Siap Mengubah Karir Anda?',
        introSubtitle: 'Setiap pelajar sukses dimulai dari satu langkah yang berani. Hari ini, Anda sudah di sini — itu adalah langkah terbaik.',
        introQuote: '"Investasi terbaik adalah investasi pada ilmu pengetahuan. Dan ilmu yang tepat bisa mengubah hidup Anda selamanya."',
        introStats: [
            { icon: 'ShieldCheck', value: 'Akses Selamanya', label: 'Lifetime Access' },
            { icon: 'Clock', value: '24/7', label: 'Dukungan Teknis' },
        ],
        problemSectionTitle: 'Apakah Anda merasakan ini?',
        problemIcon: 'Zap',
        problems: [
            'Merasa tertinggal di era digital yang bergerak cepat',
            'Skill yang belum relevan dengan kebutuhan industri',
            'Bingung mulai dari mana untuk meningkatkan penghasilan',
            'Belajar sendiri tapi tidak tahu mana yang benar'
        ],
        explanationTitle: 'Mengapa Ini Penting untuk Anda?',
        explanationHeading: 'Perjalanan Belajar yang Telah Terbukti',
        journeySteps: [
            { num: '01', title: 'Dapatkan Fondasi yang Kuat', desc: 'Mulai dari dasar yang tepat agar setiap langkah selanjutnya menjadi lebih mudah dan efektif.' },
            { num: '02', title: 'Praktik Langsung dengan Studi Kasus Nyata', desc: 'Bukan hanya teori — setiap materi dilengkapi contoh nyata dari praktisi industri berpengalaman.' },
            { num: '03', title: 'Bangun Portfolio yang Mengesankan', desc: 'Terapkan ilmu untuk menciptakan karya nyata yang bisa ditunjukkan kepada klien atau perusahaan.' },
            { num: '04', title: 'Raih Hasil yang Terukur', desc: 'Ikuti jalur yang telah membantu ribuan peserta mendapatkan pekerjaan baru atau meningkatkan penghasilan.' },
        ],
        preCheckoutHeading: 'Anda Selangkah Lagi! 🎉',
        preCheckoutUrgency: '🔥 Penawaran terbatas! Harga ini hanya berlaku hari ini.',
        preCheckoutIncludes: [
            'Akses seumur hidup ke semua materi',
            'Sertifikat penyelesaian resmi',
            'Garansi uang kembali 7 hari',
            'Update materi gratis selamanya',
            'Akses komunitas eksklusif peserta'
        ],
        faqs: [
            { q: 'Apakah saya mendapat akses seumur hidup?', a: 'Ya! Setelah membeli, akses produk ini tidak akan pernah kedaluwarsa.' },
            { q: 'Apakah ada garansi uang kembali?', a: 'Kami memberikan garansi uang kembali 7 hari penuh jika Anda tidak puas.' },
            { q: 'Apakah ada sertifikat?', a: 'Ya, tersedia sertifikat penyelesaian yang dapat Anda tambahkan ke LinkedIn.' },
            { q: 'Bagaimana cara mengakses setelah membeli?', a: 'Setelah pembayaran berhasil, produk langsung dapat diakses di dashboard Anda.' },
        ]
    }
};

const ContentContext = createContext();

export function ContentProvider({ children, initialData }) {
    const mergeData = (base, source) => {
        if (!source) return base;
        const merged = { ...base };
        Object.keys(source).forEach(key => {
            if (merged[key] && typeof merged[key] === 'object' && !Array.isArray(merged[key])) {
                merged[key] = { ...merged[key], ...source[key] };
            } else {
                merged[key] = source[key];
            }
        });
        return merged;
    };

    const normalizeContent = (value) => {
        const features = [...(value.home?.features || [])];
        while (features.length < 4) features.push(defaultContent.home.features[features.length]);
        const contact = {
            ...value.contact,
            mapsUrl: value.contact?.mapsUrl?.includes('-example') ? '' : value.contact?.mapsUrl,
        };

        return {
            ...value,
            home: { ...value.home, features: features.slice(0, 4) },
            contact,
        };
    };

    const [content, setContent] = useState(() => {
        let source = initialData;
        if (!source) {
            const saved = localStorage.getItem('jaggad_content');
            if (saved) {
                try {
                    source = JSON.parse(saved);
                } catch (e) {
                    source = null;
                }
            }
        }
        return normalizeContent(mergeData(defaultContent, source));
    });

    useEffect(() => {
        if (initialData) {
            setContent(prev => normalizeContent(mergeData(prev, initialData)));
        }
    }, [initialData]);

    useEffect(() => {
        localStorage.setItem('jaggad_content', JSON.stringify(content));
    }, [content]);

    const updateContent = (page, key, value) => {
        setContent(prev => ({
            ...prev,
            [page]: { ...prev[page], [key]: value }
        }));
    };

    return (
        <ContentContext.Provider value={{ content, updateContent }}>
            {children}
        </ContentContext.Provider>
    );
}

export const useContent = () => useContext(ContentContext);
