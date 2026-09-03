import { useEffect, useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, BookOpen, Check, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, LockKeyhole } from 'lucide-react';
import { formatCurrency, getCategoryLabel, getStorageUrl } from '../../Utils/helpers';
import { normalizeSalesContent, toArray } from '../../Utils/salesContent';
import { useCart } from '../../Contexts/CartContext';
import MainLayout from '../../Layouts/MainLayout';
import toast from 'react-hot-toast';
import './ProductSales.css';

const imageSource = value => {
    if (!value) return '';
    return value.startsWith('http') || value.startsWith('blob') ? value : `/storage/${value}`;
};

const youtubeId = url => url?.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([^&\n?#]+)/)?.[1] || null;

function SalesHeader({ product, onCheckout, actionLabel }) {
    const seconds = Number(product.countdownHours || 0) * 3600;
    const [timeLeft, setTimeLeft] = useState(seconds);

    useEffect(() => {
        if (!seconds) return undefined;
        const timer = window.setInterval(() => setTimeLeft(value => Math.max(0, value - 1)), 1000);
        return () => window.clearInterval(timer);
    }, [seconds]);

    const time = [Math.floor(timeLeft / 3600), Math.floor((timeLeft % 3600) / 60), timeLeft % 60]
        .map(value => String(value).padStart(2, '0')).join(':');

    return <header className="sales-header">
        <div className="sales-header__inner">
            <Link href={route('products.detail', product.slug || product.id)} className="sales-header__back" aria-label="Kembali ke detail produk"><ArrowLeft size={19} aria-hidden="true" /><span>JAGGAD</span></Link>
            <div className="sales-header__product"><strong>{product.title}</strong><span>{formatCurrency(product.price)}</span></div>
            <div className="sales-header__actions">
                {seconds > 0 && <div id="sales-header-timer" className="sales-header__timer" aria-label={`Penawaran berakhir dalam ${time}`}><span>Sisa waktu</span><strong>{time}</strong></div>}
                <button id="sales-header-cta" type="button" onClick={onCheckout}>{actionLabel} <ArrowRight size={18} aria-hidden="true" /></button>
            </div>
        </div>
    </header>;
}

function LandingSlider({ images, title, id }) {
    const [active, setActive] = useState(0);

    useEffect(() => {
        if (images.length < 2) return undefined;
        const timer = window.setInterval(() => setActive(index => (index + 1) % images.length), 5000);
        return () => window.clearInterval(timer);
    }, [images.length]);

    const move = direction => setActive(index => (index + direction + images.length) % images.length);

    return <div id={id} className="landing-slider" aria-roledescription="carousel" aria-label={`Galeri ${title}`}>
        <div className="landing-slider__track" style={{ transform: `translateX(-${active * 100}%)` }}>{images.map((image, index) => <img key={`${image}-${index}`} src={imageSource(image)} alt={`${title}, tampilan ${index + 1}`} />)}</div>
        {images.length > 1 && <>
            <button type="button" className="landing-slider__arrow landing-slider__arrow--prev" onClick={() => move(-1)} aria-label="Gambar sebelumnya"><ChevronLeft size={22} /></button>
            <button type="button" className="landing-slider__arrow landing-slider__arrow--next" onClick={() => move(1)} aria-label="Gambar berikutnya"><ChevronRight size={22} /></button>
            <div className="landing-slider__dots">{images.map((_, index) => <button type="button" key={index} className={index === active ? 'active' : ''} onClick={() => setActive(index)} aria-label={`Lihat gambar ${index + 1}`} aria-current={index === active} />)}</div>
        </>}
    </div>;
}

function LandingBlock({ block, index, title, onCheckout, openFaq, setOpenFaq, faqCopy }) {
    const blockId = `sales-block-${index}`;
    if (block.type === 'image' && block.url) return <img id={blockId} src={imageSource(block.url)} className="landing-block-image" alt={`Informasi tambahan ${title}`} />;
    if (block.type === 'slider' && block.images?.length) return <LandingSlider id={blockId} images={block.images} title={title} />;
    if (block.type === 'youtube' && youtubeId(block.url)) return <div id={blockId} className="landing-video"><iframe src={`https://www.youtube.com/embed/${youtubeId(block.url)}`} title={`Video ${title}`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /></div>;
    if (block.type === 'button') return <div id={blockId} className="landing-button"><button type="button" onClick={onCheckout}>{block.label || 'Beli sekarang'} <ArrowRight size={18} /></button></div>;
    if (block.type !== 'faq' || !block.items?.some(item => item.q)) return null;

    return <section id="sales-faq" className="landing-faq" aria-labelledby="sales-faq-title">
        <div><h2 id="sales-faq-title">{faqCopy.title}</h2><p id="sales-faq-description">{faqCopy.description}</p></div>
        <div id="sales-faq-items" className="landing-faq__list">{block.items.filter(item => item.q).map((item, itemIndex) => {
            const key = `${index}-${itemIndex}`;
            const expanded = openFaq === key;
            return <div className="landing-faq__item" key={key}><button type="button" onClick={() => setOpenFaq(expanded ? null : key)} aria-expanded={expanded}>{item.q}{expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</button>{expanded && <p>{item.a}</p>}</div>;
        })}</div>
    </section>;
}

function ProductStory({ product, onCheckout, openFaq, setOpenFaq }) {
    const previewBenefits = product.benefits.slice(0, 4);

    return <>
        <main className="sales-main">
            <section className="sales-hero" aria-labelledby="sales-title">
                <div className="sales-hero__copy">
                    <h1 id="sales-title">{product.title}</h1>
                    <p id="sales-hero-description" className="sales-hero__lead">{product.description}</p>
                    {previewBenefits.length > 0 && <ul id="sales-hero-benefits" className="sales-hero__benefits">{previewBenefits.map((benefit, index) => <li key={`${benefit}-${index}`}><Check size={19} aria-hidden="true" />{benefit}</li>)}</ul>}
                    <div className="sales-hero__facts"><span><BookOpen size={19} aria-hidden="true" /> {product.materials.length || '—'} bagian materi</span><span>Format {getCategoryLabel(product.category)}</span></div>
                </div>

                <aside className="sales-offer" aria-label="Ringkasan penawaran">
                    <div id="sales-hero-image" className="sales-offer__media">{product.thumbnail ? <img src={product.thumbnail} alt={product.title} /> : <BookOpen size={64} aria-hidden="true" />}{product.badge && <span>{product.badge}</span>}</div>
                    <div className="sales-offer__body">
                        <p id="sales-offer-label">{product.sales.offer.label}</p>
                        <div className="sales-offer__price"><strong>{formatCurrency(product.price)}</strong>{product.originalPrice > product.price && <del>{formatCurrency(product.originalPrice)}</del>}</div>
                        {product.originalPrice > product.price && <span className="sales-offer__saving">Hemat {formatCurrency(product.originalPrice - product.price)}</span>}
                        {product.quotaText && <p id="sales-offer-quota" className="sales-offer__note">{product.quotaText}</p>}
                        <button id="sales-offer-cta" type="button" onClick={onCheckout}>{product.sales.offer.cta} <ArrowRight size={19} /></button>
                        <small id="sales-offer-trust"><LockKeyhole size={16} aria-hidden="true" /> {product.sales.offer.trustNote}</small>
                    </div>
                </aside>
            </section>

            {(product.benefits.length > 0 || product.materials.length > 0) && <section className="sales-details">
                {product.benefits.length > 0 && <div className="sales-outcomes"><h2 id="sales-outcomes-title">{product.sales.outcomes.title}</h2><p id="sales-outcomes-description">{product.sales.outcomes.description}</p><ul>{product.benefits.map((benefit, index) => <li key={`${benefit}-${index}`}><Check size={18} aria-hidden="true" /><span>{benefit}</span></li>)}</ul></div>}
                {product.materials.length > 0 && <div className="sales-materials"><h2 id="sales-materials-title">{product.sales.materials.title}</h2><p id="sales-materials-description">{product.sales.materials.description}</p><ol>{product.materials.map((material, index) => <li key={`${material.title || material}-${index}`}><span>{String(index + 1).padStart(2, '0')}</span><strong>{material.title || material}</strong><em>{material.pages ? `${material.pages} halaman` : material.videos ? `${material.videos} video` : material.duration || ''}</em></li>)}</ol></div>}
            </section>}

            {product.blocks.length > 0 && <div className="sales-managed-content">{product.blocks.map((block, index) => <LandingBlock key={index} block={block} index={index} title={product.title} onCheckout={onCheckout} openFaq={openFaq} setOpenFaq={setOpenFaq} faqCopy={product.sales.faq} />)}</div>}
        </main>

        <section className="sales-close" aria-labelledby="sales-close-title"><div><h2 id="sales-close-title">{product.sales.closing.title}</h2><p id="sales-close-description">{product.sales.closing.description}</p></div><button id="sales-close-cta" type="button" onClick={onCheckout}>{product.sales.closing.cta} · {formatCurrency(product.price)} <ArrowRight size={19} /></button></section>
    </>;
}

function PurchaseConfirmation({ product, purchased, onBack, onContinue }) {
    const copy = product.sales.confirmation;
    return <main className="sales-confirm">
        <div className="sales-confirm__intro"><button id="sales-confirm-back" type="button" onClick={onBack}><ArrowLeft size={18} /> {copy.backLabel}</button><h1 id="sales-confirm-heading">{copy.heading}</h1><p id="sales-confirm-description">{copy.description}</p></div>
        <div className="sales-confirm__layout">
            <section className="sales-confirm__product" aria-labelledby="confirm-product-title">
                <div className="sales-confirm__media">{product.thumbnail ? <img src={product.thumbnail} alt={product.title} /> : <BookOpen size={56} />}</div>
                <div><span>{getCategoryLabel(product.category)}</span><h2 id="confirm-product-title">{product.title}</h2><p>{product.description}</p></div>
                {product.benefits.length > 0 && <ul>{product.benefits.map((benefit, index) => <li key={`${benefit}-${index}`}><Check size={18} />{benefit}</li>)}</ul>}
            </section>
            <aside className="sales-confirm__order" aria-label="Ringkasan pesanan">
                <h2 id="sales-confirm-order-title">{copy.orderTitle}</h2>
                <div><span>Harga produk</span><span>{formatCurrency(product.originalPrice > product.price ? product.originalPrice : product.price)}</span></div>
                {product.originalPrice > product.price && <div className="sales-confirm__discount"><span>Potongan harga</span><span>−{formatCurrency(product.originalPrice - product.price)}</span></div>}
                <div className="sales-confirm__total"><span>Total</span><strong>{formatCurrency(product.price)}</strong></div>
                <button id="sales-confirm-cta" type="button" onClick={onContinue}>{purchased ? copy.ownedCta : copy.payCta} <ArrowRight size={19} /></button>
                <p id="sales-confirm-trust"><LockKeyhole size={16} /> {copy.trustNote}</p>
            </aside>
        </div>
    </main>;
}

export default function ProductSales({ product: dbProduct, previewMode = false, activeStep = 0 }) {
    const { auth } = usePage().props;
    const { addToCart } = useCart();
    const [internalStep, setInternalStep] = useState(0);
    const [openFaq, setOpenFaq] = useState(null);
    const step = previewMode ? activeStep : internalStep;

    if (!dbProduct) return <MainLayout><div className="sales-not-found"><h1>Produk tidak ditemukan</h1><Link href={route('products')}>Kembali ke katalog</Link></div></MainLayout>;

    const sales = normalizeSalesContent(dbProduct);
    const blocks = [...sales.blocks];
    if (sales.faq.items.some(item => item.q)) blocks.push({ type: 'faq', items: sales.faq.items });

    const product = {
        id: dbProduct.id,
        slug: dbProduct.slug,
        title: sales.hero.title,
        category: dbProduct.category?.slug || dbProduct.category || 'ebook',
        price: Number(dbProduct.price || 0),
        originalPrice: Number(dbProduct.normal_price || dbProduct.originalPrice || 0),
        thumbnail: getStorageUrl(sales.hero.image || dbProduct.image || dbProduct.thumbnail),
        description: sales.hero.description,
        badge: dbProduct.badge,
        benefits: sales.hero.benefits,
        materials: toArray(dbProduct.materials),
        blocks,
        countdownHours: sales.urgency.countdownHours,
        quotaText: sales.urgency.quotaText,
        sales,
    };
    const purchased = auth?.purchased_products?.includes(product.id);

    const showConfirmation = () => {
        setInternalStep(1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const continuePurchase = () => {
        if (purchased) return router.get(route('dashboard.learning', product.slug || product.id));
        addToCart({
            ...product,
            title: dbProduct.name || dbProduct.title,
            thumbnail: getStorageUrl(dbProduct.image || dbProduct.thumbnail),
            benefits: toArray(dbProduct.benefits),
        });
        if (!auth?.user) {
            toast.error('Masuk terlebih dahulu agar pembelian tersimpan di akun Anda.');
            return router.get(route('checkout'));
        }
        router.get(route('checkout'));
    };

    const body = <div className={`product-sales ${previewMode ? 'is-preview' : ''}`}>
        <div hidden dangerouslySetInnerHTML={{ __html: '<!-- THESIS: A calm consultation desk makes the product, contents, price, and next action obvious without a template-like sales funnel. OWN-WORLD: cool white fields, editorial ink, one deep-maroon purchase mass, Chillax headings, Synonym body copy, warm dividers, and pill actions. STORY: understand the ebook, inspect its concrete contents, confirm the price, then continue to payment. FIRST VIEWPORT: a large product promise sits beside one image-led purchase panel with the price and CTA always visible. FORM: established JAGGAD public world, persuade. FINISH: build-only verification requested by the user. -->' }} />
        <SalesHeader product={product} onCheckout={step === 0 ? showConfirmation : continuePurchase} actionLabel={step === 0 ? sales.offer.headerCta : sales.confirmation.payCta} />
        {step === 0 ? <ProductStory product={product} onCheckout={showConfirmation} openFaq={openFaq} setOpenFaq={setOpenFaq} /> : <PurchaseConfirmation product={product} purchased={purchased} onBack={() => setInternalStep(0)} onContinue={continuePurchase} />}
    </div>;

    if (previewMode) return body;
    return <MainLayout hideNavbar><Head title={`${product.title} - JAGGAD ACADEMY`} />{body}</MainLayout>;
}
