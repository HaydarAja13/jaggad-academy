import { useEffect, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { 
    ArrowRight, BookOpen, Video, Mic, MapPin, Users, Star, Zap, Shield, Award,
    Target, Eye, CheckCircle, MessageSquare, Globe, Heart, Rocket, Trophy, Lightbulb, TrendingUp,
    ShoppingBag
} from 'lucide-react';
import ProductCard from '../../Components/ProductCard';
import promoActivities from '../../Data/promoActivities.json';
import MainLayout from '../../Layouts/MainLayout';
import { activityDelay, buildActivities, pickNextActivityIndex } from '../../Utils/activityRotation';
import { getStorageUrl } from '../../Utils/helpers';
import { useContent } from '../../Contexts/ContentContext';
import './Welcome.css';

const MAX_PRODUCT_NAME_LENGTH = 72;

function PurchaseActivityToast({ products }) {
    const activities = buildActivities(promoActivities, products);
    const [index, setIndex] = useState(() => pickNextActivityIndex(activities.length, -1));
    const [visible, setVisible] = useState(activities.length > 0);

    useEffect(() => {
        if (activities.length === 0) return undefined;
        let switchTimer;
        let revealTimer;

        const clearTimers = () => {
            window.clearTimeout(switchTimer);
            window.clearTimeout(revealTimer);
        };
        const schedule = () => {
            clearTimers();
            if (document.hidden) return;
            switchTimer = window.setTimeout(() => {
                setVisible(false);
                revealTimer = window.setTimeout(() => {
                    setIndex(current => pickNextActivityIndex(activities.length, current));
                    setVisible(true);
                    schedule();
                }, 220);
            }, activityDelay());
        };
        const handleVisibility = () => {
            if (document.hidden) return clearTimers();
            setVisible(true);
            schedule();
        };

        schedule();
        document.addEventListener('visibilitychange', handleVisibility);
        return () => {
            clearTimers();
            document.removeEventListener('visibilitychange', handleVisibility);
        };
    }, [activities.length]);

    if (index < 0) return null;
    const activity = activities[index];
    const customer = activity.customer.trim();
    const product = activity.product.trim();

    return (
        <aside
            className={`home-activity ${visible ? 'is-visible' : ''}`}
            aria-live="polite"
            aria-atomic="true"
            aria-hidden={!visible}
            aria-label={`${customer} telah membeli ${product}`}
        >
            <div className="home-activity__mark" aria-hidden="true"><span>{customer.charAt(0).toUpperCase()}</span><ShoppingBag size={16} /></div>
            <div className="home-activity__copy">
                <div className="home-activity__customer"><strong>{customer}</strong></div>
                <p>Telah membeli</p>
                <strong className="home-activity__product" title={product}>{product.slice(0, MAX_PRODUCT_NAME_LENGTH)}</strong>
            </div>
        </aside>
    );
}



export default function Welcome({ products = [], toastProducts = [], categories = [], dbStats = {}, previewMode = false, heroCardPreviews = [], whyJaggadImagePreview = null }) {
    const { content } = useContent();
    const home = content?.home || {};
    const about = content?.about || {};
    const brandName = [content.branding?.siteName, content.branding?.siteTagline].filter(Boolean).join(' ') || 'JAGGAD Academy';
    const whyJaggadImage = whyJaggadImagePreview || getStorageUrl(home.whyJaggadImage);
    
    const iconMap = {
        Users, Target, Eye, BookOpen, Award, Zap, Shield, CheckCircle,
        Video, Mic, MessageSquare, Globe, Star, Heart, Rocket, Trophy, Lightbulb, TrendingUp
    };

    // Get features from context or use defaults
    const homeFeatures = (home.features || []).slice(0, 4).map(f => ({
        icon: iconMap[f.icon] || Zap,
        title: f.title,
        desc: f.desc
    }));
    const homeFaqs = (home.faqs || [])
        .filter(faq => faq.q?.trim() && faq.a?.trim())
        .slice(0, 8);

    // Sync home stats with "JAGGAD dalam Angka" from About Page
    const stats = (about.achievements || []).map(stat => ({
        icon: iconMap[stat.icon] || Award,
        value: stat.value,
        label: stat.label
    }));

    // Fallback if no achievements defined yet
    if (stats.length === 0) {
        stats.push(
            { icon: Users, value: `${(dbStats.users || 0) + 1000}+`, label: home.statsUsersLabel },
            { icon: Award, value: `${dbStats.sales || 0}`, label: home.statsSalesLabel },
            { icon: BookOpen, value: `${dbStats.products || 0}+`, label: home.statsProductsLabel }
        );
    }

    const [primaryStat, ...supportingStats] = stats.slice(0, 4);
    const PrimaryStatIcon = primaryStat?.icon || Award;
    
    const learningFormats = [
        { slug: 'ebook', icon: BookOpen },
        { slug: 'video', icon: Video },
        { slug: 'webinar', icon: Mic },
        { slug: 'offline', icon: MapPin },
    ].map(format => {
        const category = categories.find(item => item.slug === format.slug);
        return category ? { ...category, Icon: format.icon } : null;
    }).filter(Boolean);

    const selectedProductIds = (home.featuredProductIds || []).map(Number);
    const selectedProducts = selectedProductIds
        .map(id => products.find(product => Number(product.id) === id))
        .filter(Boolean);
    const featuredProducts = (selectedProducts.length ? selectedProducts : products).slice(0, 6);
    const featuredCategories = [...new Map(featuredProducts.map(product => {
        const slug = product.category?.slug || product.category;
        const category = categories.find(item => item.slug === slug);
        return [slug, { slug, name: product.category?.name || category?.name || slug }];
    }).filter(([slug]) => slug)).values()];
    const [activeFeaturedCategory, setActiveFeaturedCategory] = useState('all');
    const visibleFeaturedProducts = activeFeaturedCategory === 'all'
        ? featuredProducts
        : featuredProducts.filter(product => (product.category?.slug || product.category) === activeFeaturedCategory);

    const PageContent = (
        <div className="home">
            <Head title={`${content.branding?.siteName || "JAGGAD"} ${content.branding?.siteTagline || "ACADEMY"} - ${home.heroBadge}`} />
            
            {/* Hero */}
            <section className="hero section-dark">
                <div className="hero__grid" aria-hidden="true" />
                <div className="container hero__content">
                    {(home.heroStats || []).slice(0, 2).map((stat, index) => (
                        <div className={`hero__floating-stat hero__floating-stat--${index + 1}`} key={`${stat.value}-${stat.label}`}>
                            <span id={`preview-home-hero-stat-${index}-value`}>{stat.value}</span>
                            <small id={`preview-home-hero-stat-${index}-label`}>{stat.label}</small>
                        </div>
                    ))}

                    <div className="hero__intro">
                        <div className="hero__badge">
                            <div className="proof-avatars" aria-hidden="true">
                                {(home.heroCards || []).slice(0, 3).map((card, index) => (
                                    <div className="proof-avatar" key={index}>
                                        {heroCardPreviews[index] || card.image ? <img src={heroCardPreviews[index] || getStorageUrl(card.image)} alt="" /> : content.branding?.siteName?.[0]}
                                    </div>
                                ))}
                            </div>
                            <span id="preview-home-hero-badge">{home.heroBadge}</span>
                        </div>
                        <h1 className="hero__title">
                            <span id="preview-home-hero-title-line-1" className="hero__title-line-1">{home.heroTitleLine1}</span><br />
                            <span id="preview-home-hero-title-line-2">{home.heroTitleLine2}</span>
                        </h1>
                        <p id="preview-home-hero-subtitle" className="hero__subtitle">
                            {home.heroSubtitle}
                        </p>
                        <div className="hero__actions">
                            <Link id="preview-home-hero-cta" href={route('products')} className="btn-hero-primary">
                                {home.ctaPrimary} <ArrowRight size={18} />
                            </Link>
                        </div>
                        <p id="preview-home-hero-proof" className="hero__proof-note">{home.proofText}</p>
                    </div>

                    <div className="hero__cards" aria-label={`Program unggulan ${brandName}`}>
                        {(home.heroCards || []).slice(0, 3).map((card, index) => {
                            const Card = card.url ? Link : 'article';
                            const image = heroCardPreviews[index] || getStorageUrl(card.image);
                            return (
                                <Card id={`preview-home-hero-card-${index}`} href={card.url || undefined} className={`hero-card hero-card--${index + 1}`} key={index}>
                                    {image && <img id={`preview-home-hero-card-${index}-image`} src={image} alt={card.title || `Hero card ${index + 1}`} />}
                                    <div className="hero-card__shade" />
                                    <div className="hero-card__copy">
                                        <strong id={`preview-home-hero-card-${index}-title`}>{card.title}</strong>
                                        {card.subtitle && <span id={`preview-home-hero-card-${index}-subtitle`}>{card.subtitle}</span>}
                                    </div>
                                    {index === 1 && (
                                        <span className="hero-card__arrow" aria-hidden="true"><ArrowRight size={18} /></span>
                                    )}
                                </Card>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Stats */}
            <section className="stats-proof" aria-labelledby="preview-home-stats-title">
                <div className="container">
                    <div className="stats-proof__shell">
                        <header className="stats-proof__message">
                            <h2 id="preview-home-stats-title">{home.statsTitle}</h2>
                            <div className="stats-proof__intro">
                                <p id="preview-home-stats-subtitle">{home.statsSubtitle}</p>
                                <Link id="preview-home-stats-cta" href={route('products')} className="stats-proof__cta">
                                    {home.statsCtaLabel} <ArrowRight size={18} />
                                </Link>
                            </div>
                        </header>

                        <div className="stats-proof__metrics">
                            {primaryStat && (
                                <div className="stats-proof__primary">
                                    <div className="stats-proof__primary-label">
                                        <PrimaryStatIcon size={22} aria-hidden="true" />
                                        <span id="preview-home-achievement-0-label">{primaryStat.label}</span>
                                    </div>
                                    <strong id="preview-home-achievement-0-value">{primaryStat.value}</strong>
                                </div>
                            )}

                            <dl className="stats-proof__supporting">
                                {supportingStats.map(({ icon: Icon, value, label }, index) => (
                                    <div className="stats-proof__item" key={label}>
                                        <dt id={`preview-home-achievement-${index + 1}-label`}><Icon size={18} aria-hidden="true" /> {label}</dt>
                                        <dd id={`preview-home-achievement-${index + 1}-value`}>{value}</dd>
                                    </div>
                                ))}
                            </dl>
                        </div>
                    </div>
                </div>
            </section>

            {/* Product Categories */}
            <section className="format-showcase" aria-labelledby="preview-home-format-title">
                <div className="container">
                    <header className="format-showcase__heading">
                        <h2 id="preview-home-format-title">{home.catTitlePrefix} {home.catTitleAccent}</h2>
                        <p id="preview-home-format-subtitle">{home.catSubtitle}</p>
                    </header>

                    {learningFormats.length > 0 ? (
                        <ul className="format-board">
                            {learningFormats.map((category, index) => {
                                const Icon = category.Icon;
                                return (
                                    <li key={category.slug}>
                                        <Link className="format-panel" href={route('products', { category: category.slug })} aria-label={`${home.catCtaLabel || 'Jelajahi produk'} ${category.name}`}>
                                            <div id={`preview-home-format-${index}-image`} className="format-panel__media">
                                                {category.image ? <img src={getStorageUrl(category.image)} alt={`Format pembelajaran ${category.name}`} loading="lazy" /> : <Icon size={54} aria-hidden="true" />}
                                            </div>
                                            <div className="format-panel__content">
                                                <div className="format-panel__meta">
                                                    <Icon size={18} aria-hidden="true" />
                                                    <span>{category.products_count || 0} <span id={`preview-home-format-${index}-product-count-label`}>{home.catProductCountLabel}</span></span>
                                                </div>
                                                <h3 id={`preview-home-format-${index}-name`}>{category.name}</h3>
                                                <p id={`preview-home-format-${index}-description`} className="format-panel__description">
                                                    {category.description || <><span id={`preview-home-format-${index}-description-prefix`}>{home.catDescriptionPrefix}</span> {category.name} <span id={`preview-home-format-${index}-description-suffix`}>{home.catDescriptionSuffix}</span> {brandName}.</>}
                                                </p>
                                                <span id={`preview-home-format-${index}-cta`} className="format-panel__cta">
                                                    {home.catCtaLabel || 'Jelajahi Semua Produk'} <ArrowRight size={18} aria-hidden="true" />
                                                </span>
                                            </div>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    ) : <p id="preview-home-format-empty" className="format-board__empty">{home.catEmptyText}</p>}
                </div>
            </section>

            {/* Why JAGGAD */}
            <section className="why-showcase">
                <div className="container">
                    <header className="showcase-heading">
                        <h2 id="preview-home-why-title">{home.whyJaggadTitleLine1} {home.whyJaggadTitleLine2}</h2>
                        <p id="preview-home-why-subtitle">{home.whyJaggadSubtitle}</p>
                    </header>

                    <div className="why-showcase__grid">
                        <div id="preview-home-why-image" className="why-showcase__media">
                            {whyJaggadImage
                                ? <img src={whyJaggadImage} alt={`Pengalaman belajar bersama ${brandName}`} loading="lazy" />
                                : <BookOpen size={52} aria-hidden="true" />}
                        </div>

                        <div className="why-showcase__benefits why-showcase__benefits--left">
                            {homeFeatures.slice(0, 2).map(({ icon: Icon, title, desc }, index) => (
                                <article className={`why-benefit ${index === 0 ? 'why-benefit--accent' : ''}`} key={title}>
                                    <span id={`preview-home-feature-${index}-icon`} className="why-benefit__icon"><Icon size={18} /></span>
                                    <div><h3 id={`preview-home-feature-${index}-title`}>{title}</h3><p id={`preview-home-feature-${index}-description`}>{desc}</p></div>
                                </article>
                            ))}
                        </div>

                        <div className="why-showcase__benefits why-showcase__benefits--right">
                            {homeFeatures.slice(2, 4).map(({ icon: Icon, title, desc }, index) => (
                                <article className="why-benefit" key={title}>
                                    <span id={`preview-home-feature-${index + 2}-icon`} className="why-benefit__icon"><Icon size={18} /></span>
                                    <div><h3 id={`preview-home-feature-${index + 2}-title`}>{title}</h3><p id={`preview-home-feature-${index + 2}-description`}>{desc}</p></div>
                                </article>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Featured Products */}
            <section id="preview-home-featured-section" className="featured-showcase">
                <div className="container">
                    <header className="showcase-heading">
                        <h2 id="preview-home-featured-title">{home.featuredTitlePrefix} {home.featuredTitleAccent}</h2>
                    </header>

                    <div className="featured-showcase__filters" role="group" aria-label="Filter kategori produk unggulan">
                        <button id="preview-home-featured-all-label" type="button" className={activeFeaturedCategory === 'all' ? 'active' : ''} onClick={() => setActiveFeaturedCategory('all')} aria-pressed={activeFeaturedCategory === 'all'}>{home.featuredAllLabel}</button>
                        {featuredCategories.map(category => (
                            <button type="button" className={activeFeaturedCategory === category.slug ? 'active' : ''} onClick={() => setActiveFeaturedCategory(category.slug)} aria-pressed={activeFeaturedCategory === category.slug} key={category.slug}>{category.name}</button>
                        ))}
                    </div>

                    <div className="featured-showcase__grid">
                        {visibleFeaturedProducts.length > 0 ? visibleFeaturedProducts.map(product => (
                            <ProductCard key={product.id} product={product} className="product-card--showcase" previewIdPrefix={`preview-home-product-${product.id}`} />
                        )) : <p id="preview-home-featured-empty" className="featured-showcase__empty">{home.featuredEmptyText}</p>}
                    </div>

                    <Link id="preview-home-featured-cta" href={route('products')} className="featured-showcase__cta">
                        {home.featuredCtaLabel || 'Lihat Semua Produk'} <ArrowRight size={18} />
                    </Link>
                </div>
            </section>

            {homeFaqs.length > 0 && (
                <section className="home-faq" aria-labelledby="preview-home-faq-title">
                    <div className="container home-faq__layout">
                        <header className="home-faq__intro">
                            <h2 id="preview-home-faq-title">{home.faqTitle || 'Pertanyaan yang Sering Ditanyakan'}</h2>
                            {home.faqSubtitle && <p id="preview-home-faq-subtitle">{home.faqSubtitle}</p>}
                            <Link id="preview-home-faq-contact" href={route('contact')} className="home-faq__contact">
                                {home.faqContactLabel} <ArrowRight size={18} />
                            </Link>
                        </header>

                        <div className="home-faq__list">
                            {homeFaqs.map((faq, index) => (
                                <details className="home-faq__item" defaultOpen={index === 0} key={`${faq.q}-${index}`}>
                                    <summary>
                                        <span id={`preview-home-faq-${index}-question`}>{faq.q}</span>
                                        <i aria-hidden="true" />
                                    </summary>
                                    <div className="home-faq__answer"><p id={`preview-home-faq-${index}-answer`}>{faq.a}</p></div>
                                </details>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* CTA */}
            <section className="closing-cta">
                <div className="container">
                    <div className="closing-cta__frame">
                        <div className="closing-cta__copy">
                            <h2 id="preview-home-cta-title">{home.ctaBannerTitle || 'Siap Tingkatkan Skill Anda?'}</h2>
                            <p id="preview-home-cta-description">{home.ctaBannerDesc || 'Pilih program yang sesuai dengan tujuan Anda dan mulai belajar dengan ritme yang paling cocok.'}</p>
                            <div className="closing-cta__actions">
                                <Link id="preview-home-cta-primary" href={route('register')} className="closing-cta__primary">
                                    {home.ctaBannerBtn || 'Mulai Belajar Sekarang'} <ArrowRight size={18} />
                                </Link>
                                <Link id="preview-home-cta-secondary" href={route('contact')} className="closing-cta__secondary">{home.ctaSecondary}</Link>
                            </div>
                        </div>

                        {learningFormats.length > 0 && (
                            <div className="closing-cta__formats" aria-label="Format belajar tersedia">
                                <p id="preview-home-cta-formats-title">{home.ctaFormatsTitle}</p>
                                <ul>
                                    {learningFormats.slice(0, 4).map(({ slug, name, Icon }) => (
                                        <li key={slug}><Icon size={17} aria-hidden="true" /><span>{name}</span></li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );

    if (previewMode) return <MainLayout previewMode>{PageContent}</MainLayout>;

    return (
        <MainLayout>
            {PageContent}
            <PurchaseActivityToast products={toastProducts} />
        </MainLayout>
    );
}
