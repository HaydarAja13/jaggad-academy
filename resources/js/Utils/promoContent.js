const parse = value => {
    let parsed = value;
    for (let attempt = 0; attempt < 2 && typeof parsed === 'string'; attempt += 1) {
        try { parsed = JSON.parse(parsed); } catch { return {}; }
    }
    return parsed && typeof parsed === 'object' ? parsed : {};
};

export const PROMO_DEFAULTS = {
    hero: {
        badge: 'Penawaran pilihan JAGGAD',
        title: 'Pilih program yang tepat untuk langkah berikutnya',
        subtitle: 'Bandingkan program, manfaat, dan harga dalam satu halaman yang jelas.',
        mediaType: 'image',
        image: '',
        imageAlt: '',
        videoUrl: '',
        guarantee: 'Detail akses dan pembelian mengikuti informasi setiap program.',
    },
    urgency: {
        countdownHours: 12,
        quotaText: 'Penawaran tersedia dalam waktu terbatas.',
        ctaNote: 'Periksa detail program sebelum melanjutkan.',
    },
    proofItems: [
        'Akses materi dari dashboard Anda',
        'Belajar fleksibel sesuai ritme sendiri',
        'Pilihan program untuk kebutuhan yang berbeda',
    ],
    offers: {
        title: 'Pilih penawaran yang paling relevan',
        description: 'Harga dan manfaat ditampilkan langsung dari katalog JAGGAD.',
    },
    trust: {
        title: 'Keputusan yang jelas sebelum membeli',
        description: 'Periksa isi program, harga, dan bentuk aksesnya tanpa harus menebak apa yang akan Anda dapatkan.',
        items: [
            { title: 'Detail yang transparan', description: 'Harga dan manfaat mengikuti data produk yang aktif.' },
            { title: 'Akses terhubung', description: 'Produk yang dibeli tersedia melalui dashboard pelanggan.' },
            { title: 'Bantuan saat dibutuhkan', description: 'Tim JAGGAD dapat membantu Anda memilih melalui halaman kontak.' },
        ],
    },
    cta: { primary: 'Lihat penawaran' },
    closing: {
        title: 'Sudah menemukan program yang cocok?',
        description: 'Pilih penawaran di atas dan periksa kembali detail produknya sebelum melanjutkan.',
        primary: 'Pilih promo',
        secondary: 'Konsultasi dulu',
        asideTitle: 'Masih membandingkan pilihan?',
        asideDescription: 'Hubungi tim JAGGAD untuk mendapat arahan berdasarkan tujuan belajar Anda.',
    },
    selectedProductIds: [],
};

const fixedStrings = (value, fallback) => Array.from({ length: fallback.length }, (_, index) => (
    typeof value?.[index] === 'string' ? value[index] : fallback[index]
));

const fixedTrustItems = value => PROMO_DEFAULTS.trust.items.map((fallback, index) => ({
    title: value?.[index]?.title ?? fallback.title,
    description: value?.[index]?.description ?? fallback.description,
}));

export function normalizePromoContent(value = {}) {
    const saved = parse(value);
    const hero = saved.hero || {};
    const urgency = saved.urgency || {};
    const legacyProof = Array.isArray(saved.benefits) ? saved.benefits : null;
    const image = hero.image ?? saved.heroImage ?? '';
    const videoUrl = hero.videoUrl ?? saved.videoUrl ?? '';

    return {
        hero: {
            badge: hero.badge ?? saved.heroBadge ?? PROMO_DEFAULTS.hero.badge,
            title: hero.title ?? saved.title ?? saved.heroTitle ?? PROMO_DEFAULTS.hero.title,
            subtitle: hero.subtitle ?? saved.subtitle ?? saved.heroSubtitle ?? PROMO_DEFAULTS.hero.subtitle,
            mediaType: hero.mediaType ?? saved.mediaType ?? (videoUrl ? 'youtube' : 'image'),
            image,
            imageAlt: hero.imageAlt ?? saved.heroImageAlt ?? '',
            videoUrl,
            guarantee: hero.guarantee ?? saved.guaranteeText ?? PROMO_DEFAULTS.hero.guarantee,
        },
        urgency: {
            countdownHours: urgency.countdownHours ?? saved.countdownHours ?? PROMO_DEFAULTS.urgency.countdownHours,
            quotaText: urgency.quotaText ?? saved.quotaText ?? PROMO_DEFAULTS.urgency.quotaText,
            ctaNote: urgency.ctaNote ?? saved.ctaSubtitle ?? PROMO_DEFAULTS.urgency.ctaNote,
        },
        proofItems: fixedStrings(saved.proofItems ?? legacyProof, PROMO_DEFAULTS.proofItems),
        offers: {
            title: saved.offers?.title ?? PROMO_DEFAULTS.offers.title,
            description: saved.offers?.description ?? PROMO_DEFAULTS.offers.description,
        },
        trust: {
            title: saved.trust?.title ?? PROMO_DEFAULTS.trust.title,
            description: saved.trust?.description ?? PROMO_DEFAULTS.trust.description,
            items: fixedTrustItems(saved.trust?.items),
        },
        cta: {
            primary: saved.cta?.primary ?? saved.ctaTitle ?? PROMO_DEFAULTS.cta.primary,
        },
        closing: {
            title: saved.closing?.title ?? PROMO_DEFAULTS.closing.title,
            description: saved.closing?.description ?? PROMO_DEFAULTS.closing.description,
            primary: saved.closing?.primary ?? PROMO_DEFAULTS.closing.primary,
            secondary: saved.closing?.secondary ?? PROMO_DEFAULTS.closing.secondary,
            asideTitle: saved.closing?.asideTitle ?? PROMO_DEFAULTS.closing.asideTitle,
            asideDescription: saved.closing?.asideDescription ?? PROMO_DEFAULTS.closing.asideDescription,
        },
        selectedProductIds: [...new Set((saved.selectedProductIds || []).map(Number).filter(Number.isFinite))],
    };
}

export function getYoutubeId(value = '') {
    try {
        const url = new URL(value);
        const host = url.hostname.replace(/^www\./, '');
        let id = '';

        if (host === 'youtu.be') id = url.pathname.split('/').filter(Boolean)[0] || '';
        if (['youtube.com', 'm.youtube.com'].includes(host)) {
            id = url.pathname === '/watch'
                ? url.searchParams.get('v') || ''
                : url.pathname.match(/^\/(?:embed|shorts|v)\/([^/]+)/)?.[1] || '';
        }

        return /^[\w-]{6,}$/.test(id) ? id : '';
    } catch {
        return '';
    }
}
