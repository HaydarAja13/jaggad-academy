import { Head, Link } from '@inertiajs/react';
import './Error.css';

const errors = {
    403: { title: 'Akses tidak diizinkan.', message: 'Halaman ini membutuhkan izin yang belum Anda miliki. Kembali ke area yang dapat Anda akses atau jelajahi produk kami.', type: 'forbidden' },
    404: { title: 'Halaman tidak ditemukan.', message: 'Tautan yang Anda buka mungkin sudah berubah, salah alamat, atau tidak lagi tersedia.', type: 'not-found' },
    500: { title: 'Ada gangguan di sisi kami.', message: 'Kami sedang menangani masalah ini. Silakan coba lagi beberapa saat lagi atau kembali ke beranda.', type: 'server' },
};

function Symbol({ type }) {
    if (type === 'forbidden') return <svg viewBox="0 0 24 24"><path d="M8 10V7a4 4 0 0 1 8 0v3"/><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M12 14v2"/></svg>;
    if (type === 'server') return <svg viewBox="0 0 24 24"><path d="M5 5h14v6H5zM5 13h14v6H5z"/><path d="M8 8h.01M8 16h.01M12 8h4M12 16h4"/></svg>;
    return <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6"/><path d="m16 16 4 4"/><path d="M9 11h4"/></svg>;
}

export default function Error({ status }) {
    const code = Number(status) in errors ? Number(status) : 500;
    const { title, message, type } = errors[code];

    return <><Head title={`${code} — JAGGAD Academy`} /><main className="error-page"><Link className="error-page__brand" href="/">JAGGAD <span>ACADEMY</span></Link><section className="error-page__main" aria-labelledby="error-title"><div className="error-page__copy"><p className="error-page__code">{code}</p><h1 id="error-title" className="error-page__title">{title}</h1><p className="error-page__message">{message}</p><div className="error-page__actions"><Link className="error-page__button" href="/">Kembali ke beranda <span aria-hidden="true">→</span></Link><Link className="error-page__button error-page__button--secondary" href="/products">Lihat produk</Link></div></div><div className="error-page__art" aria-hidden="true"><div className="error-page__symbol"><Symbol type={type} /></div></div></section><p className="error-page__foot">JAGGAD Academy · Belajar untuk berkembang.</p></main></>;
}
