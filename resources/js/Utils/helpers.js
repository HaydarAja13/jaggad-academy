export const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(amount);
};

export const formatPrice = formatCurrency;

export const isFreePrice = (amount) => Number(amount || 0) === 0;

export const isFreeProduct = (product) => isFreePrice(product?.price);

// Produk donasi (pay-what-you-want): nominal bebas diisi pembeli saat checkout.
export const isDonationProduct = (product) => product?.pricing_type === 'donation';

// Label harga untuk ditampilkan di katalog/landing.
export const productPriceLabel = (product) => (isDonationProduct(product) ? 'Dukung Kami' : formatPriceOrFree(product?.price));

export const formatPriceOrFree = (amount) => (isFreePrice(amount) ? 'FREE' : formatCurrency(amount));


export const getCategoryLabel = (categoryId) => {
    const categories = {
        ebook: 'Ebook',
        video: 'Video Kelas',
        webinar: 'Webinar',
        offline: 'Kelas Offline',
    };
    return categories[categoryId] || categoryId;
};
 
export const getStorageUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('blob:') || path.startsWith('data:') || path.startsWith('/storage/')) return path;
    return `/storage/${path}`;
};

// Jaring pengaman: bila server mengirim kunci terjemahan mentah
// (mis. "validation.url" — terjadi bila bahasa server belum punya file
// lang/id), tampilkan pesan Indonesia yang bisa dibaca.
const RAW_KEY_MESSAGES = {
    'validation.url': 'Format URL tidak valid.',
    'validation.required': 'Kolom ini wajib diisi.',
    'validation.email': 'Format email tidak valid.',
    'validation.numeric': 'Harus berupa angka.',
    'validation.min': 'Isian terlalu pendek.',
    'validation.max': 'Isian terlalu panjang.',
    'validation.unique': 'Data sudah digunakan.',
    'validation.exists': 'Data tidak ditemukan.',
    'validation.image': 'File harus berupa gambar.',
    'validation.mimes': 'Tipe file tidak diizinkan.',
    'validation.confirmed': 'Konfirmasi tidak cocok.',
    'auth.failed': 'Email atau password salah.',
    'auth.throttle': 'Terlalu banyak percobaan. Coba lagi beberapa saat.',
    'auth.password': 'Password salah.',
};

export const friendlyError = (message) => {
    if (typeof message !== 'string' || !message) return message;
    if (Object.prototype.hasOwnProperty.call(RAW_KEY_MESSAGES, message)) return RAW_KEY_MESSAGES[message];
    if (/^(validation|auth|passwords)\.[\w.*]+$/.test(message)) return 'Data tidak valid. Periksa kembali isian Anda.';
    return message;
};
