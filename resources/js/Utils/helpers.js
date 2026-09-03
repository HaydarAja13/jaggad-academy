export const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(amount);
};

export const formatPrice = formatCurrency;


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
