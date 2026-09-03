const parse = value => {
    let parsed = value;
    for (let attempt = 0; attempt < 2 && typeof parsed === 'string'; attempt += 1) {
        try { parsed = JSON.parse(parsed); } catch { return null; }
    }
    return parsed;
};

export const toArray = value => {
    const parsed = parse(value);
    return Array.isArray(parsed) ? parsed : [];
};

export function normalizeSalesContent(product = {}) {
    const saved = parse(product.sales_content) || {};
    const hero = saved.hero || {};
    const legacyFaq = toArray(product.landing_faq);

    return {
        hero: {
            title: hero.title ?? product.name ?? product.title ?? '',
            description: hero.description ?? product.short_description ?? product.description ?? '',
            benefits: Array.isArray(hero.benefits) ? hero.benefits : toArray(product.benefits),
            image: hero.image ?? '',
        },
        offer: {
            label: saved.offer?.label ?? 'Miliki materi lengkapnya',
            headerCta: saved.offer?.headerCta ?? 'Beli sekarang',
            cta: saved.offer?.cta ?? 'Lanjutkan pembelian',
            trustNote: saved.offer?.trustNote ?? 'Detail pesanan diperiksa sebelum pembayaran.',
        },
        outcomes: {
            title: saved.outcomes?.title ?? 'Yang Anda bawa pulang',
            description: saved.outcomes?.description ?? 'Materi praktis yang sudah termasuk dalam pembelian.',
        },
        materials: {
            title: saved.materials?.title ?? 'Isi materi',
            description: saved.materials?.description ?? 'Susunan pembelajaran yang akan Anda akses.',
        },
        blocks: Array.isArray(saved.blocks) ? saved.blocks : toArray(product.landing_blocks).filter(block => block.type !== 'faq'),
        faq: {
            title: saved.faq?.title ?? 'Pertanyaan sebelum membeli',
            description: saved.faq?.description ?? 'Jawaban singkat untuk membantu Anda mengambil keputusan.',
            items: Array.isArray(saved.faq?.items) ? saved.faq.items : legacyFaq,
        },
        urgency: {
            countdownHours: saved.urgency?.countdownHours ?? product.countdown_hours ?? '',
            quotaText: saved.urgency?.quotaText ?? product.landing_quota_text ?? '',
        },
        closing: {
            title: saved.closing?.title ?? 'Siap mulai dari strategi yang lebih terarah?',
            description: saved.closing?.description ?? 'Periksa ringkasan produk dan total pembayaran sebelum melanjutkan.',
            cta: saved.closing?.cta ?? 'Beli sekarang',
        },
        confirmation: {
            heading: saved.confirmation?.heading ?? 'Periksa pesanan Anda',
            description: saved.confirmation?.description ?? 'Pastikan produk dan totalnya sudah sesuai. Metode pembayaran dipilih pada langkah berikutnya.',
            backLabel: saved.confirmation?.backLabel ?? 'Kembali ke penawaran',
            orderTitle: saved.confirmation?.orderTitle ?? 'Ringkasan pesanan',
            payCta: saved.confirmation?.payCta ?? 'Lanjut ke pembayaran',
            ownedCta: saved.confirmation?.ownedCta ?? 'Buka materi',
            trustNote: saved.confirmation?.trustNote ?? 'Data pesanan terhubung ke dashboard pelanggan dan admin.',
        },
    };
}
