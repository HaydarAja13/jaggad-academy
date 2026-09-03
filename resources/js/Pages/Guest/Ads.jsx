import { Head, Link, router } from '@inertiajs/react';
import { ArrowRight, CheckCircle2, Clock, Play, ShieldCheck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import MainLayout from '../../Layouts/MainLayout';
import { formatCurrency, getStorageUrl } from '../../Utils/helpers';
import { getYoutubeId, normalizePromoContent } from '../../Utils/promoContent';
import './Ads.css';

function useCountdown(hours, previewMode) {
    const totalMs = useMemo(() => Math.max(0, Number(hours) || 0) * 3600 * 1000, [hours]);
    const [remaining, setRemaining] = useState(totalMs);

    useEffect(() => {
        setRemaining(totalMs);
        if (!totalMs || previewMode) return undefined;

        const end = Date.now() + totalMs;
        const interval = window.setInterval(() => {
            const next = Math.max(0, end - Date.now());
            setRemaining(next);
            if (!next) window.clearInterval(interval);
        }, 1000);

        return () => window.clearInterval(interval);
    }, [previewMode, totalMs]);

    const pad = value => String(value).padStart(2, '0');
    return {
        h: pad(Math.floor(remaining / 3600000)),
        m: pad(Math.floor((remaining % 3600000) / 60000)),
        s: pad(Math.floor((remaining % 60000) / 1000)),
        isActive: totalMs > 0 && remaining > 0,
    };
}

const parseList = value => {
    if (Array.isArray(value)) return value;
    try { return JSON.parse(value || '[]'); } catch { return []; }
};

export default function Ads({ previewMode = false, customData = null, dbAds, dbProducts = [] }) {
    const promo = normalizePromoContent(previewMode ? customData : dbAds);
    const selectedProducts = promo.selectedProductIds
        .map(id => dbProducts.find(product => product.id === Number(id)))
        .filter(Boolean);
    const hasProducts = selectedProducts.length > 0;
    const firstProductImage = selectedProducts.find(product => product.image || product.thumbnail);
    const heroImage = getStorageUrl(promo.hero.image || firstProductImage?.image || firstProductImage?.thumbnail);
    const youtubeId = getYoutubeId(promo.hero.videoUrl);
    const showVideo = promo.hero.mediaType === 'youtube' && youtubeId;
    const proofItems = promo.proofItems.filter(Boolean);
    const trustItems = promo.trust.items.filter(item => item.title || item.description);
    const { h, m, s, isActive } = useCountdown(promo.urgency.countdownHours, previewMode);

    const handleBuy = (event, product) => {
        if (previewMode) {
            event.preventDefault();
            toast.success(`Simulasi: membuka “${product.name || product.title}”`);
            return;
        }
        router.get(route('products.sales', product.slug || product.id));
    };

    const content = (
        <div className="promo-page">
            <Head title="Promo Spesial - JAGGAD ACADEMY" />

            <section className="promo-hero" aria-labelledby="preview-ads-hero-title">
                <div className="container promo-hero__layout">
                    <div className="promo-hero__copy">
                        <div className="promo-hero__status">
                            {promo.hero.badge && <span id="preview-ads-hero-badge" className="promo-status-pill">{promo.hero.badge}</span>}
                            {isActive && (
                                <span id="preview-ads-countdown" className="promo-countdown" aria-live={previewMode ? 'off' : 'polite'} aria-label={`Sisa waktu ${h} jam ${m} menit ${s} detik`}>
                                    <Clock size={16} aria-hidden="true" />
                                    <strong>{h}:{m}:{s}</strong>
                                    <span>tersisa</span>
                                </span>
                            )}
                        </div>

                        <h1 id="preview-ads-hero-title">{promo.hero.title}</h1>
                        {promo.hero.subtitle && <p id="preview-ads-hero-subtitle" className="promo-hero__lead">{promo.hero.subtitle}</p>}
                        {promo.urgency.quotaText && <p id="preview-ads-quota" className="promo-hero__quota">{promo.urgency.quotaText}</p>}

                        <div className="promo-hero__actions">
                            {hasProducts ? (
                                <a href="#preview-ads-offers" className="promo-button promo-button--primary">
                                    {promo.cta.primary}<ArrowRight size={18} aria-hidden="true" />
                                </a>
                            ) : (
                                <Link href={route('products')} className="promo-button promo-button--primary">
                                    Lihat katalog<ArrowRight size={18} aria-hidden="true" />
                                </Link>
                            )}
                            <Link href={route('contact')} className="promo-button promo-button--quiet">Tanya tim JAGGAD</Link>
                        </div>
                    </div>

                    <div className="promo-hero__visual">
                        <div id="preview-ads-media" className="promo-media">
                            {showVideo ? (
                                <iframe
                                    src={`https://www.youtube.com/embed/${youtubeId}`}
                                    title="Video promo JAGGAD"
                                    allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            ) : heroImage ? (
                                <img src={heroImage} alt={promo.hero.imageAlt || ''} />
                            ) : (
                                <div className="promo-media__fallback">
                                    <span>JAGGAD Academy</span>
                                    <strong>{promo.hero.title}</strong>
                                </div>
                            )}
                        </div>
                        {promo.hero.guarantee && (
                            <p id="preview-ads-guarantee" className="promo-hero__guarantee">
                                <ShieldCheck size={18} aria-hidden="true" />{promo.hero.guarantee}
                            </p>
                        )}
                    </div>
                </div>
            </section>

            {proofItems.length > 0 && (
                <section className="promo-proof" aria-label="Ringkasan keunggulan promo">
                    <div className="container promo-proof__grid">
                        {proofItems.map((item, index) => (
                            <div id={`preview-ads-proof-${index}`} className="promo-proof__item" key={index}>
                                <CheckCircle2 size={19} aria-hidden="true" /><span>{item}</span>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            <section id="preview-ads-offers" className="promo-offers" aria-labelledby="preview-ads-offers-title">
                <div className="container">
                    <header className="promo-section-heading">
                        <h2 id="preview-ads-offers-title">{promo.offers.title}</h2>
                        {promo.offers.description && <p id="preview-ads-offers-description">{promo.offers.description}</p>}
                    </header>

                    {!hasProducts ? (
                        <div className="promo-empty">
                            <div>
                                <h3>Belum ada produk dalam promo ini</h3>
                                <p>Jelajahi katalog untuk melihat program JAGGAD yang sedang tersedia.</p>
                            </div>
                            <Link href={route('products')} className="promo-button promo-button--primary">Buka katalog<ArrowRight size={18} /></Link>
                        </div>
                    ) : (
                        <div className="promo-offers__grid">
                            {selectedProducts.map(product => {
                                const benefits = parseList(product.benefits).filter(Boolean).slice(0, 5);
                                const normalPrice = Number(product.normal_price || product.originalPrice || 0);
                                const price = Number(product.price || 0);
                                const discount = normalPrice > price ? Math.round(((normalPrice - price) / normalPrice) * 100) : 0;
                                const image = getStorageUrl(product.image || product.thumbnail);
                                const productName = product.name || product.title;

                                return (
                                    <article id={`preview-ads-product-${product.id}`} className="promo-card" key={product.id} aria-labelledby={`preview-ads-product-${product.id}-name`}>
                                        <div className="promo-card__media">
                                            {image ? <img src={image} alt={productName} loading="lazy" onError={event => { event.currentTarget.hidden = true; }} /> : <div className="promo-card__media-fallback"><Play size={26} aria-hidden="true" /></div>}
                                            {discount > 0 && <span className="promo-card__discount">Hemat {discount}%</span>}
                                        </div>
                                        <div className="promo-card__body">
                                            <span className="promo-card__category">{product.category?.name || 'Program JAGGAD'}</span>
                                            <h3 id={`preview-ads-product-${product.id}-name`}>{productName}</h3>
                                            {(product.short_description || product.description) && <p className="promo-card__description">{product.short_description || product.description}</p>}

                                            {benefits.length > 0 && (
                                                <ul className="promo-card__benefits" aria-label={`Manfaat ${productName}`}>
                                                    {benefits.map((item, index) => <li key={index}><CheckCircle2 size={17} aria-hidden="true" /><span>{item}</span></li>)}
                                                </ul>
                                            )}

                                            <div className="promo-card__purchase">
                                                <div className="promo-card__price-block">
                                                    {normalPrice > price && <span className="promo-card__old-price">{formatCurrency(normalPrice)}</span>}
                                                    <strong>{formatCurrency(price)}</strong>
                                                    {discount > 0 && <span>Hemat {formatCurrency(normalPrice - price)}</span>}
                                                </div>
                                                <button id={`preview-ads-product-${product.id}-cta`} type="button" onClick={event => handleBuy(event, product)} className="promo-button promo-button--primary">
                                                    {promo.cta.primary}<ArrowRight size={18} aria-hidden="true" />
                                                </button>
                                            </div>
                                            {promo.urgency.ctaNote && <p id={`preview-ads-product-${product.id}-note`} className="promo-card__note">{promo.urgency.ctaNote}</p>}
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>

            {(promo.trust.title || promo.trust.description || trustItems.length > 0) && (
                <section className="promo-trust" aria-labelledby="preview-ads-trust-title">
                    <div className="container promo-trust__layout">
                        <div className="promo-trust__intro">
                            {promo.trust.title && <h2 id="preview-ads-trust-title">{promo.trust.title}</h2>}
                            {promo.trust.description && <p id="preview-ads-trust-description">{promo.trust.description}</p>}
                        </div>
                        <div className="promo-trust__list">
                            {trustItems.map((item, index) => (
                                <div id={`preview-ads-trust-${index}`} className="promo-trust__item" key={index}>
                                    <span aria-hidden="true">{index + 1}</span>
                                    <div>{item.title && <h3>{item.title}</h3>}{item.description && <p>{item.description}</p>}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            <section className="promo-closing" aria-labelledby="preview-ads-closing-title">
                <div className="container">
                    <div className="promo-closing__frame">
                        <div className="promo-closing__copy">
                            <h2 id="preview-ads-closing-title">{promo.closing.title}</h2>
                            {promo.closing.description && <p id="preview-ads-closing-description">{promo.closing.description}</p>}
                            <div className="promo-closing__actions">
                                {hasProducts ? (
                                    <a id="preview-ads-closing-primary" href="#preview-ads-offers" className="promo-closing__primary">{promo.closing.primary}<ArrowRight size={18} /></a>
                                ) : (
                                    <Link id="preview-ads-closing-primary" href={route('products')} className="promo-closing__primary">{promo.closing.primary}<ArrowRight size={18} /></Link>
                                )}
                                {promo.closing.secondary && <Link id="preview-ads-closing-secondary" href={route('contact')} className="promo-closing__secondary">{promo.closing.secondary}</Link>}
                            </div>
                        </div>
                        {(promo.closing.asideTitle || promo.closing.asideDescription) && (
                            <div id="preview-ads-closing-aside" className="promo-closing__aside">
                                {promo.closing.asideTitle && <h3>{promo.closing.asideTitle}</h3>}
                                {promo.closing.asideDescription && <p>{promo.closing.asideDescription}</p>}
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );

    return previewMode ? content : <MainLayout>{content}</MainLayout>;
}
