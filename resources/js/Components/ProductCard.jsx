import { Link, usePage } from '@inertiajs/react';
import { ArrowRight, Star, BookOpen, Video, Mic, MapPin, CheckCircle2 } from 'lucide-react';
import { formatCurrency, getCategoryLabel, getStorageUrl } from '../Utils/helpers';
import { useContent } from '../Contexts/ContentContext';
import './ProductCard.css';

const categoryIcons = {
    ebook: BookOpen,
    video: Video,
    webinar: Mic,
    offline: MapPin,
};

export default function ProductCard({ product, className = '', previewIdPrefix }) {
    const { content } = useContent();
    const { auth } = usePage().props;
    const home = content?.home || {};

    // Determine properties securely (compatible with DB fields & Mock data)
    const categorySlug = product.category?.slug || product.category || 'ebook';
    const CatIcon = categoryIcons[categorySlug] || BookOpen;
    const categoryLabel = product.category?.name || getCategoryLabel(categorySlug);
    const title = product.name || product.title;
    const desc = product.short_description || product.description;
    const image = getStorageUrl(product.image || product.thumbnail);
    const price = product.price;
    const originalPrice = product.normal_price || product.originalPrice;
    
    // Auto-calculate discount if DB doesn't have it natively
    const discount = product.discount || (originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0);

    const isPurchased = auth?.purchased_products?.some(id => Number(id) === Number(product.id));
    const detailUrl = isPurchased
        ? route('dashboard.learning', product.slug || product.id)
        : route('products.detail', product.slug || product.id);

    return (
        <Link
            href={detailUrl}
            className={`product-card ${className}`} 
            aria-label={isPurchased ? `Buka materi ${title}` : `Lihat detail ${title}`}
        >
            <div className="product-card__image-wrap" data-category={categoryLabel}>
                {image && (
                    <img
                        src={image}
                        alt=""
                        className="product-card__image"
                        loading="lazy"
                        onError={event => { event.currentTarget.style.display = 'none'; }}
                    />
                )}
                {product.badge && (
                    <span className="product-card__badge">
                        {product.badge}
                    </span>
                )}
                {isPurchased ? (
                    <span className="product-card__owned"><CheckCircle2 size={17} aria-hidden="true" /> Sudah dimiliki</span>
                ) : discount > 0 && (
                    <span className="product-card__discount">-{discount}%</span>
                )}
                <div className="product-card__overlay">
                    <span id={previewIdPrefix ? `${previewIdPrefix}-overlay-label` : undefined} className="overlay-text">{isPurchased ? 'Buka materi' : home.productOverlayLabel} →</span>
                </div>
            </div>

            <div className="product-card__body">
                <div className="product-card__category">
                    <CatIcon size={14} aria-hidden="true" />
                    <span>{categoryLabel}</span>
                </div>

                <h3 className="product-card__title">{title}</h3>
                
                <div className="product-card__meta">
                    <div className="meta-rating">
                        {product.rating && (
                            <>
                                <Star size={14} fill="var(--color-warning)" stroke="var(--color-warning)" aria-hidden="true" />
                                <span>{product.rating}</span>
                                <span className="meta-sep" aria-hidden="true">•</span>
                            </>
                        )}
                        <span id={previewIdPrefix ? `${previewIdPrefix}-sold-label` : undefined}>{product.sold_count || 0} {home.productSoldLabel}</span>
                    </div>
                </div>

                <p className="product-card__desc">{desc}</p>

                <div className="product-card__footer">
                    {isPurchased ? <strong className="product-card__access"><CheckCircle2 size={18} aria-hidden="true" /> Akses aktif</strong> : (
                        <div className="product-card__price">
                            {originalPrice > price && <del className="price-original">{formatCurrency(originalPrice)}</del>}
                            <strong className="price-current">{formatCurrency(price)}</strong>
                        </div>
                    )}


                    <span id={previewIdPrefix ? `${previewIdPrefix}-detail-label` : undefined} className="product-card__btn-detail">
                        {isPurchased ? 'Buka materi' : home.productDetailLabel} <ArrowRight size={16} aria-hidden="true" />
                    </span>
                </div>
            </div>
        </Link>
    );
}
