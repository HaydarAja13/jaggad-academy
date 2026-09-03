import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Head, router } from '@inertiajs/react';
import { ArrowDown, ArrowUp, Copy, ExternalLink, Image as ImageIcon, Loader2, Monitor, PanelLeftClose, PanelLeftOpen, Save, Smartphone, Trash2, Video } from 'lucide-react';
import toast from 'react-hot-toast';
import AdminLayout from '../../Layouts/AdminLayout';
import { formatCurrency, getStorageUrl } from '../../Utils/helpers';
import { normalizePromoContent } from '../../Utils/promoContent';
import Ads from '../Guest/Ads';
import './Admin.css';

export default function AdminAds({ dbAds, products = [] }) {
    const initialContent = useMemo(() => normalizePromoContent(dbAds), [dbAds]);
    const [promo, setPromo] = useState(initialContent);
    const [heroImageFile, setHeroImageFile] = useState(null);
    const [heroImagePreview, setHeroImagePreview] = useState('');
    const [isDirty, setIsDirty] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [hideSidebar, setHideSidebar] = useState(false);
    const [previewMode, setPreviewMode] = useState('desktop');
    const [previewDocument, setPreviewDocument] = useState(null);
    const previewRef = useRef(null);

    const selectedProducts = promo.selectedProductIds
        .map(id => products.find(product => product.id === Number(id)))
        .filter(Boolean);
    const unselectedProducts = products.filter(product => !promo.selectedProductIds.includes(Number(product.id)));
    const previewContent = {
        ...promo,
        hero: { ...promo.hero, image: heroImagePreview || promo.hero.image },
    };

    useEffect(() => () => {
        if (heroImagePreview) URL.revokeObjectURL(heroImagePreview);
    }, [heroImagePreview]);

    useEffect(() => {
        const warnBeforeLeaving = event => {
            if (!isDirty) return;
            event.preventDefault();
            event.returnValue = '';
        };
        window.addEventListener('beforeunload', warnBeforeLeaving);
        return () => window.removeEventListener('beforeunload', warnBeforeLeaving);
    }, [isDirty]);

    const clearPreviewHighlight = () => previewRef.current?.contentDocument
        ?.querySelectorAll('.cms-preview-highlight')
        .forEach(element => element.classList.remove('cms-preview-highlight'));

    const highlightPreview = ({ target }) => {
        const ids = (target.dataset.previewIds || target.dataset.previewId || '').split(' ').filter(Boolean);
        requestAnimationFrame(() => {
            const preview = previewRef.current?.contentDocument;
            clearPreviewHighlight();
            if (!preview || ids.length === 0) return;
            const matches = ids.map(id => preview.getElementById(id)).filter(Boolean);
            matches.forEach(element => element.classList.add('cms-preview-highlight'));
            matches[0]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
    };

    const initializePreview = () => {
        const preview = previewRef.current?.contentDocument;
        if (!preview) return;
        const viewport = preview.createElement('meta');
        viewport.name = 'viewport';
        viewport.content = 'width=device-width, initial-scale=1';
        preview.head.appendChild(viewport);
        document.head.querySelectorAll('link[rel="stylesheet"], style').forEach(node => preview.head.appendChild(node.cloneNode(true)));
        preview.documentElement.lang = 'id';
        preview.body.className = 'guest-theme';
        preview.body.style.margin = '0';
        preview.addEventListener('click', event => {
            if (event.target.closest('a, button')) event.preventDefault();
        }, true);
        setPreviewDocument(preview);
    };

    const updateSection = (section, field, value) => {
        setPromo(current => ({ ...current, [section]: { ...current[section], [field]: value } }));
        setIsDirty(true);
    };

    const updateProof = (index, value) => {
        setPromo(current => ({ ...current, proofItems: current.proofItems.map((item, itemIndex) => itemIndex === index ? value : item) }));
        setIsDirty(true);
    };

    const updateTrustItem = (index, field, value) => {
        setPromo(current => ({
            ...current,
            trust: {
                ...current.trust,
                items: current.trust.items.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item),
            },
        }));
        setIsDirty(true);
    };

    const addProduct = productId => {
        const id = Number(productId);
        if (!id || promo.selectedProductIds.includes(id)) return;
        setPromo(current => ({ ...current, selectedProductIds: [...current.selectedProductIds, id] }));
        setIsDirty(true);
    };

    const removeProduct = productId => {
        setPromo(current => ({ ...current, selectedProductIds: current.selectedProductIds.filter(id => id !== productId) }));
        setIsDirty(true);
    };

    const moveProduct = (index, direction) => {
        const nextIndex = index + direction;
        if (nextIndex < 0 || nextIndex >= promo.selectedProductIds.length) return;
        setPromo(current => {
            const ids = [...current.selectedProductIds];
            [ids[index], ids[nextIndex]] = [ids[nextIndex], ids[index]];
            return { ...current, selectedProductIds: ids };
        });
        setIsDirty(true);
    };

    const handleHeroImage = file => {
        if (!file) return;
        if (!file.type.startsWith('image/')) return toast.error('File hero harus berupa gambar.');
        if (file.size > 5 * 1024 * 1024) return toast.error('Ukuran gambar maksimal 5 MB.');
        setHeroImageFile(file);
        setHeroImagePreview(URL.createObjectURL(file));
        updateSection('hero', 'mediaType', 'image');
    };

    const handleSave = () => {
        setIsSaving(true);
        router.post(route('admin.ads.store'), { ...promo, heroImageFile }, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setIsDirty(false);
                setHeroImageFile(null);
                toast.success('Halaman promo berhasil dipublikasikan.');
            },
            onError: errors => toast.error(Object.values(errors)[0] || 'Gagal menyimpan halaman promo.'),
            onFinish: () => setIsSaving(false),
        });
    };

    const copyPromoUrl = async () => {
        try {
            await navigator.clipboard.writeText(route('ads'));
            toast.success('URL promo disalin.');
        } catch {
            toast.error('URL tidak dapat disalin. Salin langsung dari address bar.');
        }
    };

    const cardPreviewIds = selectedProducts.map(product => `preview-ads-product-${product.id}`).join(' ') || 'preview-ads-offers';
    const ctaPreviewIds = selectedProducts.map(product => `preview-ads-product-${product.id}-cta`).join(' ') || 'preview-ads-closing-primary';
    const notePreviewIds = selectedProducts.map(product => `preview-ads-product-${product.id}-note`).join(' ');

    return (
        <AdminLayout>
            <Head title="Promo Builder - JAGGAD ACADEMY" />
            <div className="admin-cms-layout">
                <aside className={`cms-sidebar ${hideSidebar ? 'collapsed' : ''}`}>
                    <div className="cms-sidebar-header promo-cms-header">
                        <div>
                            <h2>Promo Builder</h2>
                            <p>CMS khusus halaman <strong>/promo</strong></p>
                        </div>
                        <div className="promo-cms-header__actions">
                            <button type="button" onClick={copyPromoUrl} aria-label="Salin URL promo" title="Salin URL promo"><Copy size={17} /></button>
                            <a href={route('ads')} target="_blank" rel="noreferrer" aria-label="Buka halaman promo" title="Buka halaman promo"><ExternalLink size={17} /></a>
                        </div>
                    </div>

                    <div className="cms-editor-fields promo-cms-editor" onFocusCapture={highlightPreview} onInputCapture={highlightPreview} onBlurCapture={clearPreviewHighlight}>
                        <section className="cms-form-group">
                            <h3 className="cms-section-label">Hero</h3>
                            <label htmlFor="promo-badge">Badge penawaran</label>
                            <input id="promo-badge" data-preview-id="preview-ads-hero-badge" value={promo.hero.badge} maxLength={80} onChange={event => updateSection('hero', 'badge', event.target.value)} />
                            <label htmlFor="promo-title">Judul utama</label>
                            <textarea id="promo-title" data-preview-id="preview-ads-hero-title" rows={3} value={promo.hero.title} maxLength={200} onChange={event => updateSection('hero', 'title', event.target.value)} />
                            <label htmlFor="promo-subtitle">Deskripsi</label>
                            <textarea id="promo-subtitle" data-preview-id="preview-ads-hero-subtitle" rows={3} value={promo.hero.subtitle} maxLength={500} onChange={event => updateSection('hero', 'subtitle', event.target.value)} />
                        </section>

                        <section className="cms-form-group">
                            <h3 className="cms-section-label">Media utama</h3>
                            <div className="promo-cms-media-toggle" role="group" aria-label="Jenis media hero">
                                <button type="button" data-preview-id="preview-ads-media" className={promo.hero.mediaType === 'image' ? 'active' : ''} onClick={() => updateSection('hero', 'mediaType', 'image')}><ImageIcon size={17} /> Gambar</button>
                                <button type="button" data-preview-id="preview-ads-media" className={promo.hero.mediaType === 'youtube' ? 'active' : ''} onClick={() => updateSection('hero', 'mediaType', 'youtube')}><Video size={17} /> YouTube</button>
                            </div>
                            {promo.hero.mediaType === 'image' ? (
                                <>
                                    <label className="promo-cms-image-upload" data-preview-id="preview-ads-media">
                                        {(heroImagePreview || promo.hero.image) ? <img src={heroImagePreview || getStorageUrl(promo.hero.image)} alt="Preview hero promo" /> : <><ImageIcon size={26} /><span>Pilih gambar hero</span></>}
                                        <input type="file" accept="image/png,image/jpeg,image/webp" onChange={event => handleHeroImage(event.target.files?.[0])} />
                                    </label>
                                    <small className="promo-cms-help">PNG, JPG, atau WebP. Maksimal 5 MB; rasio 16:9 disarankan.</small>
                                    <label htmlFor="promo-image-alt">Teks alternatif gambar</label>
                                    <input id="promo-image-alt" data-preview-id="preview-ads-media" value={promo.hero.imageAlt} maxLength={200} onChange={event => updateSection('hero', 'imageAlt', event.target.value)} placeholder="Kosongkan jika gambar hanya dekoratif" />
                                </>
                            ) : (
                                <>
                                    <label htmlFor="promo-video">URL YouTube</label>
                                    <input id="promo-video" data-preview-id="preview-ads-media" type="url" value={promo.hero.videoUrl} maxLength={2048} onChange={event => updateSection('hero', 'videoUrl', event.target.value)} placeholder="https://youtube.com/watch?v=..." />
                                    <small className="promo-cms-help">Gunakan tautan watch, youtu.be, Shorts, atau embed dari YouTube.</small>
                                </>
                            )}
                            <label htmlFor="promo-guarantee">Catatan di bawah media</label>
                            <textarea id="promo-guarantee" data-preview-id="preview-ads-guarantee" rows={2} value={promo.hero.guarantee} maxLength={240} onChange={event => updateSection('hero', 'guarantee', event.target.value)} />
                        </section>

                        <section className="cms-form-group">
                            <h3 className="cms-section-label">Urgensi</h3>
                            <label htmlFor="promo-countdown">Durasi countdown (jam)</label>
                            <input id="promo-countdown" data-preview-id="preview-ads-countdown" type="number" min={0} max={720} value={promo.urgency.countdownHours} onChange={event => updateSection('urgency', 'countdownHours', Number(event.target.value) || 0)} />
                            <small className="promo-cms-help">Timer dimulai saat halaman dibuka. Isi 0 untuk menyembunyikan.</small>
                            <label htmlFor="promo-quota">Teks periode atau kuota</label>
                            <input id="promo-quota" data-preview-id="preview-ads-quota" value={promo.urgency.quotaText} maxLength={200} onChange={event => updateSection('urgency', 'quotaText', event.target.value)} />
                            <label htmlFor="promo-note">Catatan di bawah tombol produk</label>
                            <input id="promo-note" data-preview-ids={notePreviewIds} value={promo.urgency.ctaNote} maxLength={200} onChange={event => updateSection('urgency', 'ctaNote', event.target.value)} />
                        </section>

                        <section className="cms-form-group">
                            <h3 className="cms-section-label">Ringkasan keunggulan</h3>
                            {promo.proofItems.map((item, index) => (
                                <div className="promo-cms-field-pair" key={index}>
                                    <label htmlFor={`promo-proof-${index}`}>Keunggulan {index + 1}</label>
                                    <input id={`promo-proof-${index}`} data-preview-id={`preview-ads-proof-${index}`} value={item} maxLength={200} onChange={event => updateProof(index, event.target.value)} />
                                </div>
                            ))}
                        </section>

                        <section className="cms-form-group">
                            <h3 className="cms-section-label">Penawaran produk</h3>
                            <label htmlFor="promo-offers-title">Judul section</label>
                            <input id="promo-offers-title" data-preview-id="preview-ads-offers-title" value={promo.offers.title} maxLength={160} onChange={event => updateSection('offers', 'title', event.target.value)} />
                            <label htmlFor="promo-offers-description">Deskripsi section</label>
                            <textarea id="promo-offers-description" data-preview-id="preview-ads-offers-description" rows={3} value={promo.offers.description} maxLength={500} onChange={event => updateSection('offers', 'description', event.target.value)} />
                            <label htmlFor="promo-add-product">Tambah produk</label>
                            <select id="promo-add-product" data-preview-id="preview-ads-offers" value="" onChange={event => { addProduct(event.target.value); event.target.value = ''; }}>
                                <option value="" disabled>Pilih dari katalog</option>
                                {unselectedProducts.map(product => <option key={product.id} value={product.id}>{product.name} — {formatCurrency(product.price)}</option>)}
                            </select>
                            <div className="promo-cms-products" data-preview-ids={cardPreviewIds}>
                                {selectedProducts.map((product, index) => (
                                    <div className="promo-cms-product" data-preview-id={`preview-ads-product-${product.id}`} key={product.id}>
                                        <div><strong>{product.name}</strong><span>{formatCurrency(product.price)}</span></div>
                                        <div className="promo-cms-product__actions">
                                            <button type="button" onClick={() => moveProduct(index, -1)} disabled={index === 0} aria-label={`Naikkan ${product.name}`}><ArrowUp size={16} /></button>
                                            <button type="button" onClick={() => moveProduct(index, 1)} disabled={index === selectedProducts.length - 1} aria-label={`Turunkan ${product.name}`}><ArrowDown size={16} /></button>
                                            <button type="button" className="danger" onClick={() => removeProduct(product.id)} aria-label={`Hapus ${product.name} dari promo`}><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                ))}
                                {selectedProducts.length === 0 && <p className="promo-cms-empty">Belum ada produk dipilih. Halaman publik akan menampilkan tombol menuju katalog.</p>}
                            </div>
                        </section>

                        <section className="cms-form-group">
                            <h3 className="cms-section-label">Kepercayaan</h3>
                            <label htmlFor="promo-trust-title">Judul section</label>
                            <input id="promo-trust-title" data-preview-id="preview-ads-trust-title" value={promo.trust.title} maxLength={160} onChange={event => updateSection('trust', 'title', event.target.value)} />
                            <label htmlFor="promo-trust-description">Deskripsi section</label>
                            <textarea id="promo-trust-description" data-preview-id="preview-ads-trust-description" rows={3} value={promo.trust.description} maxLength={500} onChange={event => updateSection('trust', 'description', event.target.value)} />
                            {promo.trust.items.map((item, index) => (
                                <div className="promo-cms-nested" key={index}>
                                    <strong>Poin {index + 1}</strong>
                                    <label htmlFor={`promo-trust-title-${index}`}>Judul</label>
                                    <input id={`promo-trust-title-${index}`} data-preview-id={`preview-ads-trust-${index}`} value={item.title} maxLength={120} onChange={event => updateTrustItem(index, 'title', event.target.value)} />
                                    <label htmlFor={`promo-trust-description-${index}`}>Penjelasan</label>
                                    <textarea id={`promo-trust-description-${index}`} data-preview-id={`preview-ads-trust-${index}`} rows={2} value={item.description} maxLength={360} onChange={event => updateTrustItem(index, 'description', event.target.value)} />
                                </div>
                            ))}
                        </section>

                        <section className="cms-form-group">
                            <h3 className="cms-section-label">CTA produk</h3>
                            <label htmlFor="promo-primary-cta">Teks tombol utama</label>
                            <input id="promo-primary-cta" data-preview-ids={ctaPreviewIds} value={promo.cta.primary} maxLength={80} onChange={event => updateSection('cta', 'primary', event.target.value)} />
                        </section>

                        <section className="cms-form-group">
                            <h3 className="cms-section-label">Penutup</h3>
                            <label htmlFor="promo-closing-title">Judul</label>
                            <input id="promo-closing-title" data-preview-id="preview-ads-closing-title" value={promo.closing.title} maxLength={200} onChange={event => updateSection('closing', 'title', event.target.value)} />
                            <label htmlFor="promo-closing-description">Deskripsi</label>
                            <textarea id="promo-closing-description" data-preview-id="preview-ads-closing-description" rows={3} value={promo.closing.description} maxLength={600} onChange={event => updateSection('closing', 'description', event.target.value)} />
                            <label htmlFor="promo-closing-primary">Tombol utama</label>
                            <input id="promo-closing-primary" data-preview-id="preview-ads-closing-primary" value={promo.closing.primary} maxLength={80} onChange={event => updateSection('closing', 'primary', event.target.value)} />
                            <label htmlFor="promo-closing-secondary">Tombol konsultasi</label>
                            <input id="promo-closing-secondary" data-preview-id="preview-ads-closing-secondary" value={promo.closing.secondary} maxLength={80} onChange={event => updateSection('closing', 'secondary', event.target.value)} />
                            <label htmlFor="promo-aside-title">Judul bantuan</label>
                            <input id="promo-aside-title" data-preview-id="preview-ads-closing-aside" value={promo.closing.asideTitle} maxLength={120} onChange={event => updateSection('closing', 'asideTitle', event.target.value)} />
                            <label htmlFor="promo-aside-description">Penjelasan bantuan</label>
                            <textarea id="promo-aside-description" data-preview-id="preview-ads-closing-aside" rows={3} value={promo.closing.asideDescription} maxLength={360} onChange={event => updateSection('closing', 'asideDescription', event.target.value)} />
                        </section>
                    </div>

                    <div className="cms-sidebar-footer promo-cms-footer">
                        <span className={`sales-cms-save-state ${isDirty ? 'is-dirty' : ''}`}>{isDirty ? 'Ada perubahan belum dipublikasikan' : 'Semua perubahan tersimpan'}</span>
                        <button className="btn-admin-primary" type="button" onClick={handleSave} disabled={isSaving || !isDirty}>
                            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                            <span>{isSaving ? 'Mempublikasikan…' : 'Publikasikan promo'}</span>
                        </button>
                    </div>
                </aside>

                <main className="cms-preview-area">
                    <div className={`cms-preview-wrapper ${previewMode === 'mobile' ? 'is-mobile' : ''}`}>
                        <header className="cms-preview-header">
                            <strong className="cms-preview-title">Preview <span className="cms-preview-size">{previewMode === 'mobile' ? '430 × 932 px' : 'Desktop · otomatis'}</span></strong>
                            <div className="cms-preview-controls">
                                <button className="cms-toggle-btn" type="button" onClick={() => setHideSidebar(value => !value)} title={hideSidebar ? 'Tampilkan editor' : 'Sembunyikan editor'} aria-label={hideSidebar ? 'Tampilkan editor' : 'Sembunyikan editor'}>{hideSidebar ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}</button>
                                <button className={`cms-toggle-btn ${previewMode === 'desktop' ? 'active' : ''}`} type="button" onClick={() => setPreviewMode('desktop')} title="Preview desktop" aria-label="Preview desktop"><Monitor size={16} /></button>
                                <button className={`cms-toggle-btn ${previewMode === 'mobile' ? 'active' : ''}`} type="button" onClick={() => setPreviewMode('mobile')} title="Preview mobile" aria-label="Preview mobile"><Smartphone size={16} /></button>
                            </div>
                        </header>
                        <div className="cms-preview-frame">
                            <iframe ref={previewRef} className="cms-preview-content" title="Preview halaman promo" srcDoc="<!doctype html><html><head></head><body></body></html>" onLoad={initializePreview} />
                            {previewDocument && createPortal(<Ads previewMode customData={previewContent} dbProducts={products} />, previewDocument.body)}
                        </div>
                    </div>
                </main>
            </div>
        </AdminLayout>
    );
}
