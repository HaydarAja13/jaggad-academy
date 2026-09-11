import { useEffect } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, BookOpen, CalendarDays, Check, MapPin, ShoppingCart } from 'lucide-react';
import { products } from '../../Data/products';
import ProductCard from '../../Components/ProductCard';
import { formatCurrency, getCategoryLabel, getStorageUrl } from '../../Utils/helpers';
import { useCart } from '../../Contexts/CartContext';
import MainLayout from '../../Layouts/MainLayout';
import toast from 'react-hot-toast';
import { useMetaPixel } from '../../Utils/useMetaPixel';
import './ProductDetail.css';

const asList = value => {
    if (Array.isArray(value)) return value;
    try { return value ? JSON.parse(value) : []; } catch { return []; }
};

export default function ProductDetail({ product: dbProduct, similarProducts = [], id }) {
    const { auth } = usePage().props;
    const { addToCart, isInCart } = useCart();
    const { trackViewContent } = useMetaPixel();
    const product = dbProduct || products.find(item => item.slug === id || item.id === Number(id));

    useEffect(() => {
        if (product) trackViewContent(product);
    }, [product?.id]);

    if (!product) return <MainLayout><div className="not-found-page"><div className="container"><h1>Produk tidak ditemukan</h1><p>Produk yang Anda cari mungkin sudah dipindahkan.</p><Link href={route('products')} className="pd-button pd-button--primary">Kembali ke katalog</Link></div></div></MainLayout>;

    const categorySlug = product.category?.slug || product.category || 'ebook';
    const title = product.name || product.title;
    const description = product.description || product.longDescription || product.short_description;
    const image = getStorageUrl(product.image || product.thumbnail);
    const price = Number(product.price || 0);
    const originalPrice = Number(product.normal_price || product.originalPrice || 0);
    const discount = product.discount || (originalPrice > price ? Math.round((originalPrice - price) / originalPrice * 100) : 0);
    const benefits = asList(product.benefits);
    const materials = asList(product.materials);
    const pageCount = materials.reduce((total, item) => total + Number(item.pages || 0), 0);
    const inCart = isInCart(product.id);
    const isPurchased = auth?.purchased_products?.includes(product.id);
    const formatDate = date => new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const buy = () => router.get(route('products.sales', product.slug || product.id));
    const add = () => {
        if (!auth.user) {
            toast.error('Masuk terlebih dahulu untuk menambahkan produk ke keranjang.');
            return router.get(route('login'));
        }
        addToCart(product);
        toast.success('Produk ditambahkan ke keranjang.');
    };
    const action = isPurchased ? <button className="pd-button pd-button--primary" onClick={() => router.get(route('dashboard.learning', product.slug || product.id))}>Buka materi <ArrowRight size={18} /></button> : <><button className="pd-button pd-button--primary" onClick={buy}>Beli sekarang <ArrowRight size={18} /></button><button className="pd-cart" onClick={add} disabled={inCart}><ShoppingCart size={18} />{inCart ? 'Sudah di keranjang' : 'Tambah ke keranjang'}</button></>;

    return <MainLayout>
        <Head title={`${title} - JAGGAD ACADEMY`} />
        <main className="product-detail">
            <div className="container product-detail__inner">
                <Link href={route('products')} className="pd-back"><ArrowLeft size={18} /> Kembali ke katalog</Link>
                <section className="pd-overview" aria-labelledby="product-title">
                    <div className="pd-media" aria-label={`Visual ${title}`}>
                        {image ? <img src={image} alt={title} /> : <BookOpen aria-hidden="true" />}
                        {product.badge && <span>{product.badge}</span>}
                    </div>
                    <aside className="pd-summary">
                        <p className="pd-category">{getCategoryLabel(categorySlug)}</p>
                        <h1 id="product-title">{title}</h1>
                        <p className="pd-intro">{product.short_description || description}</p>
                        <div className="pd-facts" aria-label="Ringkasan produk"><span><BookOpen size={18} /> {materials.length || '—'} bagian{pageCount ? ` · ${pageCount} halaman` : ''}</span><span><Check size={18} /> Materi digital</span></div>
                        <div className="pd-price"><span>Harga</span>{originalPrice > price ? <><del>{formatCurrency(originalPrice)}</del><div><strong>{formatCurrency(price)}</strong><b>Hemat {discount}%</b></div></> : <strong>{formatCurrency(price)}</strong>}</div>
                        <div className="pd-actions">{action}</div>
                        <p className="pd-purchase__note">Detail pembayaran ditampilkan sebelum checkout.</p>
                    </aside>
                </section>
                {product.start_at && <section className="pd-schedule" aria-label="Jadwal produk"><CalendarDays size={22} aria-hidden="true" /><div><strong>{formatDate(product.start_at)}{product.end_at && ` – ${formatDate(product.end_at)}`}</strong><span>Jadwal pelaksanaan</span></div>{product.location && <div><MapPin size={20} aria-hidden="true" /><strong>{product.location}</strong></div>}</section>}
                <div className="pd-content"><section className="pd-reading" aria-labelledby="description-title"><h2 id="description-title">Tentang produk ini</h2><p>{description}</p></section>{benefits.length > 0 && <section className="pd-benefits" aria-labelledby="benefit-title"><h2 id="benefit-title">Yang akan Anda dapatkan</h2><ul>{benefits.map((benefit, index) => <li key={`${benefit}-${index}`}><Check size={18} aria-hidden="true" />{benefit}</li>)}</ul></section>}</div>
                {materials.length > 0 && <section className="pd-materials" aria-labelledby="materials-title"><div className="pd-section-heading"><h2 id="materials-title">Isi materi</h2><p>Susunan materi yang akan Anda pelajari.</p></div><ol>{materials.map((material, index) => <li key={`${material.title}-${index}`}><span>{String(index + 1).padStart(2, '0')}</span><strong>{material.title}</strong><em>{material.pages ? `${material.pages} halaman` : material.videos ? `${material.videos} video` : material.duration || ''}</em></li>)}</ol></section>}
            </div>
            {similarProducts.length > 0 && <section className="pd-related"><div className="container pd-related__layout"><div className="pd-section-heading"><h2>Produk terkait</h2><p>Materi lain dalam kategori yang sama.</p><Link href={route('products')} className="pd-related__link">Lihat semua produk <ArrowRight size={18} /></Link></div><div className="pd-related__grid">{similarProducts.map(item => <ProductCard key={item.id} product={item} className="product-card--related" />)}</div></div></section>}
            {!isPurchased && <div className="pd-mobile-buy"><span>{formatCurrency(price)}</span><button onClick={buy}>Beli sekarang <ArrowRight size={17} /></button></div>}
        </main>
    </MainLayout>;
}
