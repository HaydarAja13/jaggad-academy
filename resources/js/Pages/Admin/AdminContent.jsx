import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Head, Link, router } from '@inertiajs/react';
import { 
    Save, Eye, EyeOff, Layout, Type, Image as ImageIcon, MessageSquare, Phone, MapPin, Globe, 
    Loader2, Monitor, Smartphone, PanelLeftClose, PanelLeftOpen, Target, Shield, BookOpen, 
    UserCheck, Zap, ArrowRight, Trash2, Plus, X, Users, Award, CheckCircle, Video, Mic, 
    Star, Heart, Rocket, Trophy, Lightbulb, TrendingUp, Construction, ShoppingCart,
    ShieldCheck, Clock, AlertTriangle, AlertCircle, Info, HelpCircle, CheckCircle2, ChevronDown,
    ArrowUpDown, ChevronUp, Play, MousePointerClick, Images
} from 'lucide-react';
import { useContent } from '../../Contexts/ContentContext';
import AdminLayout from '../../Layouts/AdminLayout';
import toast from 'react-hot-toast';
import { getStorageUrl } from '../../Utils/helpers';
import { normalizeSalesContent } from '../../Utils/salesContent';
import './Admin.css';

// Import guest components for preview
import Welcome from '../Guest/Welcome';
import About from '../Guest/About';
import Contact from '../Guest/Contact';
import ProductSales from '../Guest/ProductSales';
import UserDashboard from '../User/UserDashboard';

const availableIcons = {
    Users, Target, Eye, BookOpen, Award, Zap, Shield, CheckCircle,
    Video, Mic, MessageSquare, Globe, Star, Heart, Rocket, Trophy, Lightbulb, TrendingUp,
    ShieldCheck, Clock, AlertTriangle, AlertCircle, Info, HelpCircle
};
const isChecked = value => value === true || value === 1 || value === '1' || value === 'true';

const BLOCK_TYPES = [
    { type: 'image',   label: 'Gambar Tunggal',    icon: ImageIcon,          color: '#3b82f6' },
    { type: 'slider',  label: 'Galeri Gambar', icon: Images, color: '#8b5cf6' },
    { type: 'youtube', label: 'Link YouTube',       icon: Play,            color: '#ef4444' },
    { type: 'button',  label: 'Tombol Beli (→ Konfirmasi)', icon: MousePointerClick, color: '#10b981' },
];

// All categories from the database are used as learning formats (no hardcoded slugs)
const joinFields = (...values) => values.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
const DASHBOARD_FIELDS = [
    ['Sambutan & Aksi', [
        ['welcomeTitle', 'Judul sambutan'],
        ['welcomeDescription', 'Penjelasan dashboard', 'textarea'],
        ['continueLabel', 'Teks tombol lanjut belajar'],
        ['exploreLabel', 'Teks tombol jelajahi program'],
        ['profileLabel', 'Teks tombol profil'],
    ]],
    ['Ringkasan Akun', [
        ['summaryTitle', 'Judul ringkasan'],
        ['ownedLabel', 'Label produk aktif'],
        ['transactionLabel', 'Label transaksi terbaru'],
        ['pendingLabel', 'Label pembayaran tertunda'],
    ]],
    ['Koleksi Belajar', [
        ['libraryTitle', 'Judul koleksi'],
        ['libraryDescription', 'Penjelasan koleksi', 'textarea'],
        ['emptyLibraryTitle', 'Judul saat koleksi kosong'],
        ['emptyLibraryDescription', 'Penjelasan saat koleksi kosong', 'textarea'],
        ['openMaterialLabel', 'Teks tombol buka materi'],
    ]],
    ['Transaksi', [
        ['transactionsTitle', 'Judul transaksi'],
        ['transactionsDescription', 'Penjelasan transaksi', 'textarea'],
        ['emptyTransactionTitle', 'Judul saat transaksi kosong'],
        ['emptyTransactionDescription', 'Penjelasan saat transaksi kosong', 'textarea'],
        ['detailLabel', 'Teks tombol detail'],
        ['repayLabel', 'Teks tombol bayar ulang'],
        ['changePaymentLabel', 'Teks tombol ubah metode'],
        ['reviewLabel', 'Label bukti sedang ditinjau'],
    ]],
];

function getYoutubeEmbedId(url) {
    if (!url) return null;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([^&\n?#]+)/);
    return match ? match[1] : null;
}

export default function AdminContent({ dbCategories = [], dbFeaturedProducts = [], dbAllProducts = [] }) {
    const { content, updateContent } = useContent();
    const [selectedPreviewProductId, setSelectedPreviewProductId] = useState(dbAllProducts[0]?.id || dbFeaturedProducts[0]?.id || 1);
    const [activeTab, setActiveTab] = useState('home');
    const [activeCheckoutStep, setActiveCheckoutStep] = useState(0);
    const [isSaving, setIsSaving] = useState(false);
    const [hideSidebar, setHideSidebar] = useState(false);
    const [previewMode, setPreviewMode] = useState('desktop');
    const [previewDocument, setPreviewDocument] = useState(null);
    const previewRef = useRef(null);

    const clearPreviewHighlight = () => previewRef.current?.contentDocument
        ?.querySelectorAll('.cms-preview-highlight')
        .forEach(element => element.classList.remove('cms-preview-highlight'));

    const highlightPreviewText = ({ target }) => {
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
        document.head.querySelectorAll('link[rel="stylesheet"], style')
            .forEach(node => preview.head.appendChild(node.cloneNode(true)));
        preview.documentElement.lang = 'id';
        preview.body.className = 'guest-theme';
        preview.body.style.margin = '0';
        preview.addEventListener('click', event => {
            if (event.target.closest('a')) event.preventDefault();
        }, true);
        setPreviewDocument(preview);
    };

    // File Upload States
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);
    const [faviconFile, setFaviconFile] = useState(null);
    const [faviconPreview, setFaviconPreview] = useState(null);
    const [heroCardFiles, setHeroCardFiles] = useState([null, null, null]);
    const [heroCardPreviews, setHeroCardPreviews] = useState([null, null, null]);
    const [whyJaggadImageFile, setWhyJaggadImageFile] = useState(null);
    const [whyJaggadImagePreview, setWhyJaggadImagePreview] = useState(null);
    const [aboutHeroImageFile, setAboutHeroImageFile] = useState(null);
    const [aboutHeroImagePreview, setAboutHeroImagePreview] = useState(null);
    const [learningFormats, setLearningFormats] = useState(() => [...dbCategories]);
    const [learningFormatImages, setLearningFormatImages] = useState(() => Array(4).fill(null));
    const featuredPreviewProductIds = (content.home.featuredProductIds || []).length
        ? content.home.featuredProductIds
        : dbAllProducts.slice(0, 6).map(product => product.id);

    const initialSalesProduct = dbAllProducts.find(product => product.id == selectedPreviewProductId) || dbFeaturedProducts[0] || {};
    const [salesDraft, setSalesDraft] = useState(() => normalizeSalesContent(initialSalesProduct));
    const [salesDirty, setSalesDirty] = useState(false);
    const [salesHeroFile, setSalesHeroFile] = useState(null);
    const [salesHeroPreview, setSalesHeroPreview] = useState(null);
    const [showBlockPicker, setShowBlockPicker] = useState(false);

    const changeSalesDraft = updater => {
        setSalesDraft(previous => typeof updater === 'function' ? updater(previous) : updater);
        setSalesDirty(true);
    };
    const updateSalesSection = (section, field, value) => changeSalesDraft(previous => ({
        ...previous,
        [section]: { ...previous[section], [field]: value },
    }));
    const landingBlocks = salesDraft.blocks;
    const setLandingBlocks = updater => changeSalesDraft(previous => ({
        ...previous,
        blocks: typeof updater === 'function' ? updater(previous.blocks) : updater,
    }));
    const landingFaq = salesDraft.faq.items;
    const setLandingFaq = updater => changeSalesDraft(previous => ({
        ...previous,
        faq: { ...previous.faq, items: typeof updater === 'function' ? updater(previous.faq.items) : updater },
    }));
    const countdownHours = salesDraft.urgency.countdownHours;
    const setCountdownHours = value => updateSalesSection('urgency', 'countdownHours', value);
    const landingQuotaText = salesDraft.urgency.quotaText;
    const setLandingQuotaText = value => updateSalesSection('urgency', 'quotaText', value);

    useEffect(() => {
        const product = dbAllProducts.find(p => p.id == selectedPreviewProductId) || dbFeaturedProducts[0];
        const next = normalizeSalesContent(product || {});
        next.blocks = next.blocks.map(block => block.type === 'slider' ? { ...block, previews: [...(block.images || [])] } : block);
        if (next.faq.items.length === 0) next.faq.items = [{ q: '', a: '' }];
        setSalesDraft(next);
        setSalesDirty(false);
        setSalesHeroFile(null);
        setSalesHeroPreview(null);
    }, [selectedPreviewProductId, dbAllProducts, dbFeaturedProducts]);

    useEffect(() => {
        const warnBeforeLeaving = event => {
            if (!salesDirty) return;
            event.preventDefault();
            event.returnValue = '';
        };
        window.addEventListener('beforeunload', warnBeforeLeaving);
        return () => window.removeEventListener('beforeunload', warnBeforeLeaving);
    }, [salesDirty]);

    const handleFileChange = (e, type) => {
        const file = e.target.files[0];
        if (!file) return;

        if (type === 'logo') {
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
        } else {
            setFaviconFile(file);
            setFaviconPreview(URL.createObjectURL(file));
        }
    };

    const handleSave = () => {
        setIsSaving(true);
        router.post(route('admin.content.store'), { 
            home: content.home, 
            about: content.about, 
            contact: content.contact,
            dashboard: content.dashboard,
            social: content.social,
            branding: content.branding,
            checkout: content.checkout,
            logoFile: logoFile,
            faviconFile: faviconFile,
            heroCardImages: heroCardFiles,
            whyJaggadImageFile,
            aboutHeroImageFile,
            learningFormats: learningFormats.map(({ id, name, description }) => ({ id, name, description })),
            learningFormatImages,
        }, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setIsSaving(false);
                toast.success('Konten berhasil disimpan ke database!');
            },
            onError: () => {
                setIsSaving(false);
                toast.error('Gagal menyimpan perubahan.');
            }
        });
    };

    // ── Landing Block Handlers ──
    const addBlock = (type) => {
        let newBlock = { type };
        if (type === 'image') newBlock = { type, url: '', preview: '' };
        if (type === 'slider') newBlock = { type, images: [], previews: [] };
        if (type === 'youtube') newBlock = { type, url: '' };
        if (type === 'button') newBlock = { type, label: 'Beli Sekarang 🚀' };
        if (type === 'faq') newBlock = { type, items: [{ q: '', a: '' }] };
        setLandingBlocks(prev => [...prev, newBlock]);
        setShowBlockPicker(false);
    };

    const removeBlock = (idx) => {
        setLandingBlocks(prev => prev.filter((_, i) => i !== idx));
    };

    const moveBlock = (idx, dir) => {
        setLandingBlocks(prev => {
            const arr = [...prev];
            const targetIdx = idx + dir;
            if (targetIdx < 0 || targetIdx >= arr.length) return arr;
            [arr[idx], arr[targetIdx]] = [arr[targetIdx], arr[idx]];
            return arr;
        });
    };

    const updateBlock = (idx, patch) => {
        setLandingBlocks(prev => prev.map((b, i) => i === idx ? { ...b, ...patch } : b));
    };

    const handleBlockImageFile = (file, blockIdx) => {
        if (!file || !file.type.startsWith('image/')) return toast.error('File harus berupa gambar.');
        if (file.size > 10 * 1024 * 1024) return toast.error('Ukuran gambar maksimal 10 MB.');
        const preview = URL.createObjectURL(file);
        updateBlock(blockIdx, { preview, url: '', file });
    };

    const handleSalesHeroImage = file => {
        if (!file || !file.type.startsWith('image/')) return toast.error('File hero harus berupa gambar.');
        if (file.size > 5 * 1024 * 1024) return toast.error('Ukuran gambar hero maksimal 5 MB.');
        setSalesHeroFile(file);
        setSalesHeroPreview(URL.createObjectURL(file));
        setSalesDirty(true);
    };

    const handleSliderImageFiles = (files, blockIdx) => {
        const fileArr = Array.from(files).filter(f => f.type.startsWith('image/'));
        if (fileArr.length === 0) return toast.error('Pilih file gambar');
        const oversized = fileArr.find(f => f.size > 10 * 1024 * 1024);
        if (oversized) return toast.error('Ukuran maks 10MB per gambar');

        const newPreviews = fileArr.map(f => URL.createObjectURL(f));
        
        setLandingBlocks(prev => prev.map((b, i) => {
            if (i !== blockIdx) return b;
            return {
                ...b,
                previews: [...(b.previews || []), ...newPreviews],
                images: [...(b.images || []), ...newPreviews.map(()=>'')],
                files: [...(b.files || Array((b.images || []).length).fill(null)), ...fileArr]
            };
        }));
    };

    const removeSliderImage = (blockIdx, imgIdx) => {
        setLandingBlocks(prev => prev.map((b, i) => {
            if (i !== blockIdx) return b;
            return {
                ...b,
                images: b.images.filter((_, idx) => idx !== imgIdx),
                previews: b.previews.filter((_, idx) => idx !== imgIdx),
                files: (b.files || []).filter((_, idx) => idx !== imgIdx),
            };
        }));
    };

    const saveSalesContent = () => {
        const product = dbAllProducts.find(p => p.id == selectedPreviewProductId);
        if (!product) return toast.error('Pilih produk dulu');

        const cleanBlocks = salesDraft.blocks.map(block => {
            const { preview, previews, file, files, ...rest } = block;
            return rest;
        });
        const payload = {
            ...salesDraft,
            hero: { ...salesDraft.hero, benefits: salesDraft.hero.benefits.filter(Boolean) },
            blocks: cleanBlocks,
            faq: { ...salesDraft.faq, items: salesDraft.faq.items.filter(item => item.q) },
        };

        const formData = new FormData();
        formData.append('salesContent', JSON.stringify(payload));
        if (salesHeroFile) formData.append('salesHeroImage', salesHeroFile);

        salesDraft.blocks.forEach((block, blockIdx) => {
            if (block.type === 'image' && block.file) {
                formData.append(`salesBlockImages[${blockIdx}]`, block.file);
            } else if (block.type === 'slider' && block.files) {
                block.files.forEach((f, imgIdx) => {
                    if (f) formData.append(`salesBlockImages[${blockIdx}_${imgIdx}]`, f);
                });
            }
        });

        setIsSaving(true);
        router.post(route('admin.products.landing', product.slug), formData, {
            preserveScroll: true,
            onSuccess: () => {
                setSalesDirty(false);
                toast.success('Halaman penjualan berhasil disimpan.');
                setIsSaving(false);
            },
            onError: (err) => {
                toast.error(Object.values(err)[0] || 'Gagal menyimpan. Periksa kembali isian Anda.');
                setIsSaving(false);
            },
            onFinish: () => {
                setIsSaving(false);
            }
        });
    };

    const handleProductSelection = event => {
        if (salesDirty && !window.confirm('Perubahan halaman penjualan belum disimpan. Ganti produk dan buang perubahan?')) {
            event.target.value = selectedPreviewProductId;
            return;
        }
        setSelectedPreviewProductId(event.target.value);
    };

    const handleInputChange = (tab, field, value) => {
        updateContent(tab, field, value);
    };

    const handleJoinedHomeField = (primaryField, secondaryField, value) => {
        handleInputChange('home', primaryField, value);
        handleInputChange('home', secondaryField, '');
    };

    const updateLearningFormat = (index, field, value) => {
        setLearningFormats(formats => formats.map((format, itemIndex) => (
            itemIndex === index ? { ...format, [field]: value } : format
        )));
    };

    const handleLearningFormatImage = (file, index) => {
        if (!file) return;
        if (!file.type.startsWith('image/')) return toast.error('File format pembelajaran harus berupa gambar.');
        if (file.size > 5 * 1024 * 1024) return toast.error('Ukuran gambar maksimal 5 MB.');

        setLearningFormatImages(files => files.map((item, itemIndex) => itemIndex === index ? file : item));
        updateLearningFormat(index, 'image', URL.createObjectURL(file));
    };

    const updateHeroItem = (field, index, key, value) => {
        const items = [...(content.home[field] || [])];
        items[index] = { ...items[index], [key]: value };
        handleInputChange('home', field, items);
    };

    const updateHomeFaq = (index, key, value) => {
        const faqs = [...(content.home.faqs || [])];
        faqs[index] = { ...faqs[index], [key]: value };
        handleInputChange('home', 'faqs', faqs);
    };

    const updateConsultation = (field, value) => handleInputChange('home', 'consultation', {
        ...content.home.consultation,
        [field]: value,
    });

    const updateConsultationPackage = (index, field, value) => {
        const packages = [...(content.home.consultation?.packages || [])];
        packages[index] = { ...packages[index], [field]: value };
        updateConsultation('packages', packages);
    };

    const updateConsultationBenefit = (packageIndex, benefitIndex, value) => {
        const item = content.home.consultation.packages[packageIndex];
        const benefits = [...item.benefits];
        benefits[benefitIndex] = value;
        updateConsultationPackage(packageIndex, 'benefits', benefits);
    };

    const updateConsultationOption = (packageIndex, optionIndex, field, value) => {
        const item = content.home.consultation.packages[packageIndex];
        const options = [...item.options];
        options[optionIndex] = { ...options[optionIndex], [field]: value };
        updateConsultationPackage(packageIndex, 'options', options);
    };

    const updateAchievement = (index, key, value) => {
        const achievements = [...(content.about.achievements || [])];
        achievements[index] = { ...achievements[index], [key]: value };
        handleInputChange('about', 'achievements', achievements);
    };

    const toggleFeaturedProduct = (productId) => {
        const ids = (content.home.featuredProductIds || []).map(Number);
        if (ids.includes(productId)) {
            return handleInputChange('home', 'featuredProductIds', ids.filter(id => id !== productId));
        }
        if (ids.length >= 6) return toast.error('Maksimal 6 produk unggulan.');
        handleInputChange('home', 'featuredProductIds', [...ids, productId]);
    };

    const moveFeaturedProduct = (productId, direction) => {
        const ids = [...(content.home.featuredProductIds || [])].map(Number);
        const index = ids.indexOf(productId);
        const target = index + direction;
        if (index < 0 || target < 0 || target >= ids.length) return;
        [ids[index], ids[target]] = [ids[target], ids[index]];
        handleInputChange('home', 'featuredProductIds', ids);
    };

    const handleHeroCardImage = (file, index) => {
        if (!file) return;
        if (!file.type.startsWith('image/')) return toast.error('File hero harus berupa gambar.');
        if (file.size > 5 * 1024 * 1024) return toast.error('Ukuran gambar hero maksimal 5 MB.');

        setHeroCardFiles(files => files.map((item, i) => i === index ? file : item));
        setHeroCardPreviews(previews => previews.map((item, i) => i === index ? URL.createObjectURL(file) : item));
    };

    const handleWhyJaggadImage = (file) => {
        if (!file) return;
        if (!file.type.startsWith('image/')) return toast.error('File harus berupa gambar.');
        if (file.size > 5 * 1024 * 1024) return toast.error('Ukuran gambar maksimal 5 MB.');

        setWhyJaggadImageFile(file);
        setWhyJaggadImagePreview(URL.createObjectURL(file));
    };

    const renderPreview = () => {
        switch (activeTab) {
            case 'home': return <Welcome previewMode={true} products={dbAllProducts} categories={learningFormats} heroCardPreviews={heroCardPreviews} whyJaggadImagePreview={whyJaggadImagePreview} />;
            case 'about': return <About previewMode={true} heroImagePreview={aboutHeroImagePreview} />;
            case 'contact': return <Contact previewMode={true} />;
            case 'dashboard': return (
                <UserDashboard
                    previewMode={true}
                    auth={{ user: { name: 'Nama Pelajar' } }}
                    purchasedProducts={dbAllProducts.slice(0, 3)}
                />
            );
            case 'checkout': {
                const selectedProduct = dbAllProducts?.find(p => p.id == selectedPreviewProductId) 
                    || dbFeaturedProducts?.find(p => p.id == selectedPreviewProductId) 
                    || dbFeaturedProducts[0] 
                    || { id: 1, title: 'Produk Demo', price: 500000, description: 'Deskripsi produk demo untuk preview CMS.' };
                
                return (
                    <ProductSales 
                        previewMode={true} 
                        activeStep={activeCheckoutStep} 
                        product={{ 
                            ...selectedProduct, 
                            sales_content: salesDraft,
                        }}
                    />
                );
            }
            default: return null;
        }
    };

    return (
        <AdminLayout>
            <Head title="CMS Konten - JAGGAD ACADEMY" />

            <div className="admin-cms-layout">
                <aside className={`cms-sidebar ${hideSidebar ? 'collapsed' : ''}`}>
                    <div className="cms-sidebar-header">
                        <h2>CMS Konten</h2>
                        <p>Kelola konten halaman publik tanpa mengubah kode</p>
                    </div>

                    <div className="cms-tabs">
                        <button className={`cms-tab-btn ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>
                            <Layout size={18} /> <span>Halaman Utama</span>
                        </button>
                        <button className={`cms-tab-btn ${activeTab === 'about' ? 'active' : ''}`} onClick={() => setActiveTab('about')}>
                            <Type size={18} /> <span>Tentang Kami</span>
                        </button>
                        <button className={`cms-tab-btn ${activeTab === 'contact' ? 'active' : ''}`} onClick={() => setActiveTab('contact')}>
                            <Phone size={18} /> <span>Kontak</span>
                        </button>
                        <button className={`cms-tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
                            <BookOpen size={18} /> <span>Dashboard Customer</span>
                        </button>
                        <button className={`cms-tab-btn ${activeTab === 'checkout' ? 'active' : ''}`} onClick={() => setActiveTab('checkout')}>
                            <ShoppingCart size={18} /> <span>Halaman Penjualan</span>
                        </button>
                        <button className={`cms-tab-btn ${activeTab === 'branding' ? 'active' : ''}`} onClick={() => setActiveTab('branding')}>
                            <Target size={18} /> <span>Branding & Logo</span>
                        </button>
                    </div>

                    <div
                        className="cms-editor-fields"
                        onFocusCapture={highlightPreviewText}
                        onInputCapture={highlightPreviewText}
                        onBlurCapture={clearPreviewHighlight}
                    >
                        {activeTab === 'home' && (
                            <>
                                <div className="cms-form-group">
                                    <h4 className="cms-section-label">Hero Section</h4>
                                    <label>Badge Teks</label>
                                    <input data-preview-id="preview-home-hero-badge" value={content.home.heroBadge} onChange={(e) => handleInputChange('home', 'heroBadge', e.target.value)} />
                                    
                                    <label>Judul Baris 1</label>
                                    <input data-preview-id="preview-home-hero-title-line-1" value={content.home.heroTitleLine1} onChange={(e) => handleInputChange('home', 'heroTitleLine1', e.target.value)} />
                                    
                                    <label>Judul Baris 2 (Gradien)</label>
                                    <input data-preview-id="preview-home-hero-title-line-2" value={content.home.heroTitleLine2} onChange={(e) => handleInputChange('home', 'heroTitleLine2', e.target.value)} />
                                    
                                    <label>Sub-judul</label>
                                    <textarea data-preview-id="preview-home-hero-subtitle" value={content.home.heroSubtitle} onChange={(e) => handleInputChange('home', 'heroSubtitle', e.target.value)} rows="3" />
                                    
                                    <label>Teks Tombol Utama</label>
                                    <input data-preview-id="preview-home-hero-cta" value={content.home.ctaPrimary} onChange={(e) => handleInputChange('home', 'ctaPrimary', e.target.value)} />
                                    
                                    <label>Teks Proof (Social Proof)</label>
                                    <input data-preview-id="preview-home-hero-proof" value={content.home.proofText} onChange={(e) => handleInputChange('home', 'proofText', e.target.value)} />
                                </div>

                                <div className="cms-form-group">
                                    <h4 className="cms-section-label">Statistik Hero</h4>
                                    {(content.home.heroStats || []).slice(0, 2).map((stat, index) => (
                                        <div className="cms-hero-stat-editor" key={index}>
                                            <div>
                                                <label>Nilai {index + 1}</label>
                                                <input data-preview-id={`preview-home-hero-stat-${index}-value`} value={stat.value || ''} onChange={(e) => updateHeroItem('heroStats', index, 'value', e.target.value)} placeholder="25+" />
                                            </div>
                                            <div>
                                                <label>Label {index + 1}</label>
                                                <input data-preview-id={`preview-home-hero-stat-${index}-label`} value={stat.label || ''} onChange={(e) => updateHeroItem('heroStats', index, 'label', e.target.value)} placeholder="Mentor Expert" />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="cms-form-group">
                                    <h4 className="cms-section-label">Tiga Kartu Hero</h4>
                                    <p className="upload-hint">Gunakan gambar vertikal atau rasio 4:5. JPG, PNG, atau WebP maksimal 5 MB.</p>

                                    {(content.home.heroCards || []).slice(0, 3).map((card, index) => {
                                        const preview = heroCardPreviews[index] || getStorageUrl(card.image);
                                        return (
                                            <div className="cms-hero-card-editor" key={index}>
                                                <strong>Kartu {index + 1}{index === 1 ? ' · Utama' : ''}</strong>
                                                <label className="image-upload-zone small cms-hero-card-upload" htmlFor={`hero-card-${index}`}>
                                                    <input
                                                        id={`hero-card-${index}`}
                                                        data-preview-id={`preview-home-hero-card-${index}-image`}
                                                        type="file"
                                                        hidden
                                                        accept="image/png,image/jpeg,image/webp"
                                                        onChange={(e) => handleHeroCardImage(e.target.files[0], index)}
                                                    />
                                                    {preview ? (
                                                        <div className="image-preview-wrap">
                                                            <img src={preview} className="image-preview" alt={`Preview kartu hero ${index + 1}`} />
                                                            <span>Klik untuk mengganti</span>
                                                        </div>
                                                    ) : (
                                                        <div className="upload-placeholder">
                                                            <ImageIcon size={22} />
                                                            <span>Upload gambar</span>
                                                        </div>
                                                    )}
                                                </label>

                                                <label>Judul</label>
                                                <input data-preview-id={`preview-home-hero-card-${index}-title`} value={card.title || ''} onChange={(e) => updateHeroItem('heroCards', index, 'title', e.target.value)} />
                                                <label>Subjudul</label>
                                                <input data-preview-id={`preview-home-hero-card-${index}-subtitle`} value={card.subtitle || ''} onChange={(e) => updateHeroItem('heroCards', index, 'subtitle', e.target.value)} />
                                                <label>Tautan</label>
                                                <input data-preview-id={`preview-home-hero-card-${index}`} value={card.url || ''} onChange={(e) => updateHeroItem('heroCards', index, 'url', e.target.value)} placeholder="/products" />
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="cms-form-group">
                                    <h4 className="cms-section-label">Bukti Sosial & Statistik</h4>
                                    <p className="upload-hint">Data ini juga dipakai pada bagian “JAGGAD dalam Angka” di halaman Tentang Kami.</p>

                                    <label>Judul Section</label>
                                    <input data-preview-id="preview-home-stats-title" value={content.home.statsTitle || ''} onChange={(e) => handleInputChange('home', 'statsTitle', e.target.value)} />
                                    <label>Deskripsi Section</label>
                                    <textarea data-preview-id="preview-home-stats-subtitle" value={content.home.statsSubtitle || ''} onChange={(e) => handleInputChange('home', 'statsSubtitle', e.target.value)} rows="3" />
                                    <label>Teks Tombol CTA</label>
                                    <input data-preview-id="preview-home-stats-cta" value={content.home.statsCtaLabel || ''} onChange={(e) => handleInputChange('home', 'statsCtaLabel', e.target.value)} />
                                    <label>Label Statistik Pelajar</label>
                                    <input data-preview-id="preview-home-achievement-0-label" value={content.home.statsUsersLabel || ''} onChange={(e) => handleInputChange('home', 'statsUsersLabel', e.target.value)} />
                                    <label>Label Statistik Penjualan</label>
                                    <input data-preview-id="preview-home-achievement-1-label" value={content.home.statsSalesLabel || ''} onChange={(e) => handleInputChange('home', 'statsSalesLabel', e.target.value)} />
                                    <label>Label Statistik Produk</label>
                                    <input data-preview-id="preview-home-achievement-2-label" value={content.home.statsProductsLabel || ''} onChange={(e) => handleInputChange('home', 'statsProductsLabel', e.target.value)} />

                                    <div className="cms-stats-editor">
                                        {(content.about.achievements || []).slice(0, 4).map((stat, index) => (
                                            <div className="cms-stat-row" key={index}>
                                                <strong>{index === 0 ? 'Statistik Utama' : `Statistik Pendukung ${index}`}</strong>
                                                <div className="cms-stat-row__fields">
                                                    <div>
                                                        <label>Nilai</label>
                                                        <input data-preview-id={`preview-home-achievement-${index}-value`} value={stat.value || ''} onChange={(e) => updateAchievement(index, 'value', e.target.value)} />
                                                    </div>
                                                    <div>
                                                        <label>Label</label>
                                                        <input data-preview-id={`preview-home-achievement-${index}-label`} value={stat.label || ''} onChange={(e) => updateAchievement(index, 'label', e.target.value)} />
                                                    </div>
                                                    <div>
                                                        <label>Ikon</label>
                                                        <select data-preview-id={`preview-home-achievement-${index}-label`} value={stat.icon || 'Award'} onChange={(e) => updateAchievement(index, 'icon', e.target.value)}>
                                                            {Object.keys(availableIcons).map(icon => <option value={icon} key={icon}>{icon}</option>)}
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="cms-form-group">
                                    <h4 className="cms-section-label">Judul Section Homepage</h4>
                                    <label>Judul Format Pembelajaran</label>
                                    <input data-preview-id="preview-home-format-title" value={joinFields(content.home.catTitlePrefix, content.home.catTitleAccent)} onChange={(e) => handleJoinedHomeField('catTitlePrefix', 'catTitleAccent', e.target.value)} />
                                    <label>Deskripsi Format Pembelajaran</label>
                                    <textarea data-preview-id="preview-home-format-subtitle" value={content.home.catSubtitle || ''} onChange={(e) => handleInputChange('home', 'catSubtitle', e.target.value)} rows="2" />
                                    <label>Teks Tombol Format Pembelajaran</label>
                                    <input data-preview-ids={learningFormats.map((_, index) => `preview-home-format-${index}-cta`).join(' ')} value={content.home.catCtaLabel || ''} onChange={(e) => handleInputChange('home', 'catCtaLabel', e.target.value)} />
                                    
                                    <label>Judul Produk Unggulan</label>
                                    <input data-preview-id="preview-home-featured-title" value={joinFields(content.home.featuredTitlePrefix, content.home.featuredTitleAccent)} onChange={(e) => handleJoinedHomeField('featuredTitlePrefix', 'featuredTitleAccent', e.target.value)} />
                                    <label>Teks Tombol Produk Unggulan</label>
                                    <input data-preview-id="preview-home-featured-cta" value={content.home.featuredCtaLabel || ''} onChange={(e) => handleInputChange('home', 'featuredCtaLabel', e.target.value)} />
                                </div>

                                <div className="cms-form-group">
                                    <h4 className="cms-section-label">Label Beranda</h4>
                                    <label>Label Jumlah Produk Format</label>
                                    <input data-preview-ids={learningFormats.map((_, index) => `preview-home-format-${index}-product-count-label`).join(' ')} value={content.home.catProductCountLabel || ''} onChange={(e) => handleInputChange('home', 'catProductCountLabel', e.target.value)} />
                                    <label>Awalan Deskripsi Format Default</label>
                                    <input data-preview-ids={learningFormats.map((_, index) => `preview-home-format-${index}-description-prefix`).join(' ')} value={content.home.catDescriptionPrefix || ''} onChange={(e) => handleInputChange('home', 'catDescriptionPrefix', e.target.value)} />
                                    <label>Akhiran Deskripsi Format Default</label>
                                    <input data-preview-ids={learningFormats.map((_, index) => `preview-home-format-${index}-description-suffix`).join(' ')} value={content.home.catDescriptionSuffix || ''} onChange={(e) => handleInputChange('home', 'catDescriptionSuffix', e.target.value)} />
                                    <label>Teks Kosong Format</label>
                                    <input data-preview-id="preview-home-format-empty" value={content.home.catEmptyText || ''} onChange={(e) => handleInputChange('home', 'catEmptyText', e.target.value)} />
                                    <label>Label Filter Semua Produk</label>
                                    <input data-preview-id="preview-home-featured-all-label" value={content.home.featuredAllLabel || ''} onChange={(e) => handleInputChange('home', 'featuredAllLabel', e.target.value)} />
                                    <label>Teks Kosong Produk Unggulan</label>
                                    <input data-preview-id="preview-home-featured-empty" value={content.home.featuredEmptyText || ''} onChange={(e) => handleInputChange('home', 'featuredEmptyText', e.target.value)} />
                                    <label>Overlay Kartu Produk</label>
                                    <input data-preview-ids={featuredPreviewProductIds.map(id => `preview-home-product-${id}-overlay-label`).join(' ')} value={content.home.productOverlayLabel || ''} onChange={(e) => handleInputChange('home', 'productOverlayLabel', e.target.value)} />
                                    <label>Label Produk Terjual</label>
                                    <input data-preview-ids={featuredPreviewProductIds.map(id => `preview-home-product-${id}-sold-label`).join(' ')} value={content.home.productSoldLabel || ''} onChange={(e) => handleInputChange('home', 'productSoldLabel', e.target.value)} />
                                    <label>Tombol Detail Produk</label>
                                    <input data-preview-ids={featuredPreviewProductIds.map(id => `preview-home-product-${id}-detail-label`).join(' ')} value={content.home.productDetailLabel || ''} onChange={(e) => handleInputChange('home', 'productDetailLabel', e.target.value)} />
                                </div>

                                <div className="cms-form-group">
                                    <h4 className="cms-section-label">Format Pembelajaran</h4>
                                    <p className="upload-hint">Atur gambar, nama, dan deskripsi empat pilihan format pembelajaran langsung dari sini.</p>
                                    <div className="cms-learning-formats">
                                        {learningFormats.map((format, index) => (
                                            <section className="cms-learning-format" key={format.id}>
                                                <strong>Format {index + 1} · {format.slug}</strong>
                                                <label className="image-upload-zone small cms-learning-format__image" htmlFor={`learning-format-${format.id}`}>
                                                    <input id={`learning-format-${format.id}`} data-preview-id={`preview-home-format-${index}-image`} type="file" hidden accept="image/png,image/jpeg,image/webp" onChange={(e) => handleLearningFormatImage(e.target.files[0], index)} />
                                                    {format.image ? (
                                                        <div className="image-preview-wrap">
                                                            <img src={getStorageUrl(format.image)} className="image-preview" alt={`Preview ${format.name}`} />
                                                            <span>Klik untuk mengganti gambar</span>
                                                        </div>
                                                    ) : (
                                                        <div className="upload-placeholder"><ImageIcon size={24} /><span>Unggah gambar</span></div>
                                                    )}
                                                </label>
                                                <label htmlFor={`learning-format-name-${format.id}`}>Nama Format</label>
                                                <input data-preview-id={`preview-home-format-${index}-name`} id={`learning-format-name-${format.id}`} value={format.name || ''} onChange={(e) => updateLearningFormat(index, 'name', e.target.value)} />
                                                <label htmlFor={`learning-format-description-${format.id}`}>Deskripsi</label>
                                                <textarea data-preview-id={`preview-home-format-${index}-description`} id={`learning-format-description-${format.id}`} value={format.description || ''} onChange={(e) => updateLearningFormat(index, 'description', e.target.value)} rows="3" />
                                                <small>{format.products_count || 0} produk memakai format ini.</small>
                                            </section>
                                        ))}
                                    </div>
                                </div>

                                <div className="cms-form-group">
                                    <h4 className="cms-section-label">Paket Konsultasi</h4>
                                    <p className="upload-hint">Harga dan DP di bawah menjadi sumber data resmi booking. DP wajib tepat 50% dari total.</p>
                                    <label>Judul section</label>
                                    <input data-preview-id="preview-home-consultation-title" value={content.home.consultation?.title || ''} onChange={event => updateConsultation('title', event.target.value)} />
                                    <label>Deskripsi section</label>
                                    <textarea data-preview-id="preview-home-consultation-subtitle" rows="3" value={content.home.consultation?.subtitle || ''} onChange={event => updateConsultation('subtitle', event.target.value)} />
                                    <label>Label jadwal</label>
                                    <input data-preview-id="preview-home-consultation-schedule" value={content.home.consultation?.scheduleLabel || ''} onChange={event => updateConsultation('scheduleLabel', event.target.value)} />
                                    <label>Teks tombol</label>
                                    <input value={content.home.consultation?.ctaLabel || ''} onChange={event => updateConsultation('ctaLabel', event.target.value)} />

                                    <div className="cms-consultation-packages">
                                        {(content.home.consultation?.packages || []).map((item, packageIndex) => (
                                            <section className="cms-consultation-package" key={item.slug}>
                                                <div className="cms-consultation-package__heading"><strong>Paket {packageIndex + 1} · {item.slug}</strong><label><input type="checkbox" checked={isChecked(item.popular)} onChange={event => updateConsultationPackage(packageIndex, 'popular', event.target.checked)} /> Populer</label></div>
                                                <label>Nama</label>
                                                <input data-preview-id={`preview-home-consultation-${packageIndex}-name`} value={item.name || ''} onChange={event => updateConsultationPackage(packageIndex, 'name', event.target.value)} />
                                                <label>Label durasi</label>
                                                <input data-preview-id={`preview-home-consultation-${packageIndex}-duration`} value={item.durationLabel || ''} onChange={event => updateConsultationPackage(packageIndex, 'durationLabel', event.target.value)} />
                                                <label>Label harga</label>
                                                <input data-preview-id={`preview-home-consultation-${packageIndex}-price`} value={item.priceLabel || ''} onChange={event => updateConsultationPackage(packageIndex, 'priceLabel', event.target.value)} />
                                                <label>Deskripsi</label>
                                                <textarea data-preview-id={`preview-home-consultation-${packageIndex}-description`} rows="2" value={item.description || ''} onChange={event => updateConsultationPackage(packageIndex, 'description', event.target.value)} />

                                                <strong className="cms-consultation-package__subheading">Manfaat</strong>
                                                {item.benefits.map((benefit, benefitIndex) => <input aria-label={`Manfaat ${benefitIndex + 1} ${item.name}`} key={benefitIndex} value={benefit} onChange={event => updateConsultationBenefit(packageIndex, benefitIndex, event.target.value)} />)}

                                                <strong className="cms-consultation-package__subheading">Pilihan harga</strong>
                                                {item.options.map((option, optionIndex) => (
                                                    <div className="cms-consultation-option" key={option.key}>
                                                        <label>Label<input value={option.label || ''} onChange={event => updateConsultationOption(packageIndex, optionIndex, 'label', event.target.value)} /></label>
                                                        <label>Durasi (menit)<input type="number" min="15" value={option.durationMinutes} onChange={event => updateConsultationOption(packageIndex, optionIndex, 'durationMinutes', Number(event.target.value))} /></label>
                                                        <label>Total<input type="number" min="1000" step="1000" value={option.totalPrice} onChange={event => updateConsultationOption(packageIndex, optionIndex, 'totalPrice', Number(event.target.value))} /></label>
                                                        <label>DP 50%<input type="number" min="500" step="500" value={option.depositAmount} onChange={event => updateConsultationOption(packageIndex, optionIndex, 'depositAmount', Number(event.target.value))} /></label>
                                                    </div>
                                                ))}
                                            </section>
                                        ))}
                                    </div>
                                </div>

                                <div className="cms-form-group">
                                    <h4 className="cms-section-label">Produk Unggulan</h4>
                                    <p className="upload-hint">Pilih maksimal 6 produk. Nomor menunjukkan urutan tampil.</p>
                                    <div className="cms-product-picker">
                                        {dbAllProducts.map(product => {
                                            const order = (content.home.featuredProductIds || []).map(Number).indexOf(Number(product.id));
                                            return (
                                                <div className={`cms-product-choice ${order >= 0 ? 'selected' : ''}`} key={product.id}>
                                                    <button type="button" data-preview-id="preview-home-featured-section" className="cms-product-choice__select" onClick={() => toggleFeaturedProduct(Number(product.id))}>
                                                        {order >= 0 && <span>{order + 1}</span>}
                                                        <strong>{product.name}</strong>
                                                        <small>{product.category?.name || 'Tanpa kategori'}</small>
                                                    </button>
                                                    {order >= 0 && (
                                                        <div className="cms-product-choice__order">
                                                            <button type="button" onClick={() => moveFeaturedProduct(Number(product.id), -1)} disabled={order === 0} aria-label={`Naikkan urutan ${product.name}`}><ChevronUp size={14} /></button>
                                                            <button type="button" onClick={() => moveFeaturedProduct(Number(product.id), 1)} disabled={order === (content.home.featuredProductIds || []).length - 1} aria-label={`Turunkan urutan ${product.name}`}><ChevronDown size={14} /></button>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="cms-form-group">
                                    <h4 className="cms-section-label">Mengapa JAGGAD</h4>
                                    <label>Judul Section</label>
                                    <input data-preview-id="preview-home-why-title" value={joinFields(content.home.whyJaggadTitleLine1, content.home.whyJaggadTitleLine2)} onChange={(e) => handleJoinedHomeField('whyJaggadTitleLine1', 'whyJaggadTitleLine2', e.target.value)} />
                                    <label>Deskripsi Section</label>
                                    <textarea data-preview-id="preview-home-why-subtitle" value={content.home.whyJaggadSubtitle} onChange={(e) => handleInputChange('home', 'whyJaggadSubtitle', e.target.value)} rows="3" />
                                    <label>Gambar Utama</label>
                                    <label className="image-upload-zone small" htmlFor="why-jaggad-image">
                                        <input id="why-jaggad-image" data-preview-id="preview-home-why-image" type="file" hidden accept="image/png,image/jpeg,image/webp" onChange={(e) => handleWhyJaggadImage(e.target.files[0])} />
                                        {whyJaggadImagePreview || content.home.whyJaggadImage ? (
                                            <div className="image-preview-wrap">
                                                <img src={whyJaggadImagePreview || getStorageUrl(content.home.whyJaggadImage)} className="image-preview" alt="Preview Mengapa JAGGAD" />
                                                <span className="image-change-overlay"><ImageIcon size={18} /> Ganti Gambar</span>
                                            </div>
                                        ) : (
                                            <div className="upload-placeholder"><ImageIcon size={24} /><span>Unggah gambar</span></div>
                                        )}
                                    </label>
                                    <p className="upload-hint">Gunakan gambar vertikal rasio 4:5. JPG, PNG, atau WebP maksimal 5 MB.</p>
                                </div>
                                
                                <div className="cms-form-group" style={{ padding: '15px', background: 'var(--color-bg-secondary)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                                    <div style={{ marginBottom: 15 }}>
                                        <h4 className="cms-section-label" style={{ marginBottom: 0, color: 'var(--color-accent)' }}>Fitur Unggulan (Cards)</h4>
                                    </div>
                                    
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                        {(content.home.features || []).slice(0, 4).map((feat, idx) => {
                                            const IconComp = availableIcons[feat.icon] || Zap;
                                            return (
                                                <div key={idx} style={{ padding: 15, background: 'var(--color-bg)', borderRadius: 12, border: '1px solid var(--color-border)' }}>
                                                    <div style={{ display: 'flex', marginBottom: 12, alignItems: 'center' }}>
                                                        <div className="cms-feature-heading">
                                                            <div className="cms-feature-icon">
                                                                <IconComp size={14} />
                                                            </div>
                                                            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)' }}>Fitur #{idx + 1}</span>
                                                        </div>
                                                    </div>
                                                    
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                                        <div>
                                                            <label style={{ fontSize: 16, marginBottom: 4, display: 'block', fontWeight: 600 }}>Judul Fitur</label>
                                                            <input 
                                                                data-preview-id={`preview-home-feature-${idx}-title`}
                                                                style={{ width: '100%', fontSize: 16, height: '36px', padding: '0 10px' }} 
                                                                value={feat.title} 
                                                                onChange={e => {
                                                                    const newFeatures = [...content.home.features];
                                                                    newFeatures[idx].title = e.target.value;
                                                                    handleInputChange('home', 'features', newFeatures);
                                                                }} 
                                                            />
                                                        </div>
                                                        <div>
                                                            <label style={{ fontSize: 16, marginBottom: 4, display: 'block', fontWeight: 600 }}>Deskripsi</label>
                                                            <textarea 
                                                                data-preview-id={`preview-home-feature-${idx}-description`}
                                                                style={{ width: '100%', fontSize: 16, minHeight: '60px', padding: '8px 10px', resize: 'vertical' }} 
                                                                value={feat.desc} 
                                                                onChange={e => {
                                                                    const newFeatures = [...content.home.features];
                                                                    newFeatures[idx].desc = e.target.value;
                                                                    handleInputChange('home', 'features', newFeatures);
                                                                }} 
                                                            />
                                                        </div>
                                                        <div>
                                                            <label style={{ fontSize: 16, marginBottom: 6, display: 'block', fontWeight: 600 }}>Ikon</label>
                                                            <div className="cms-icon-grid" style={{ 
                                                                gap: 4,
                                                                background: 'var(--color-bg-secondary)',
                                                                padding: 6,
                                                                borderRadius: 8,
                                                                border: '1px solid var(--color-border)'
                                                            }}>
                                                                {Object.entries(availableIcons).map(([name, IconItem]) => (
                                                                    <button 
                                                                        key={name}
                                                                        type="button"
                                                                        data-preview-id={`preview-home-feature-${idx}-icon`}
                                                                        onClick={() => {
                                                                            const newFeatures = [...content.home.features];
                                                                            newFeatures[idx].icon = name;
                                                                            handleInputChange('home', 'features', newFeatures);
                                                                        }}
                                                                        style={{
                                                                            padding: 5,
                                                                            background: feat.icon === name ? 'var(--color-accent)' : 'transparent',
                                                                            border: 'none',
                                                                            borderRadius: 4,
                                                                            cursor: 'pointer',
                                                                            color: feat.icon === name ? 'white' : 'var(--color-text-muted)',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                            transition: 'all 0.2s'
                                                                        }}
                                                                        title={name}
                                                                    >
                                                                        <IconItem size={12} />
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="cms-form-group">
                                    <h4 className="cms-section-label">FAQ Homepage</h4>
                                    <label htmlFor="home-faq-title">Judul FAQ</label>
                                    <input id="home-faq-title" data-preview-id="preview-home-faq-title" value={content.home.faqTitle || ''} onChange={(e) => handleInputChange('home', 'faqTitle', e.target.value)} maxLength={160} />
                                    <label htmlFor="home-faq-subtitle">Deskripsi FAQ</label>
                                    <textarea id="home-faq-subtitle" data-preview-id="preview-home-faq-subtitle" value={content.home.faqSubtitle || ''} onChange={(e) => handleInputChange('home', 'faqSubtitle', e.target.value)} rows="2" maxLength={500} />
                                    <label htmlFor="home-faq-contact">Teks Link Kontak FAQ</label>
                                    <input id="home-faq-contact" data-preview-id="preview-home-faq-contact" value={content.home.faqContactLabel || ''} onChange={(e) => handleInputChange('home', 'faqContactLabel', e.target.value)} maxLength={160} />

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
                                        {(content.home.faqs || []).map((faq, index) => (
                                            <div key={index} style={{ padding: 14, background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 12 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                                    <strong style={{ fontSize: 16, color: 'var(--color-text-muted)' }}>Pertanyaan {index + 1}</strong>
                                                    <button type="button" className="btn-icon" aria-label={`Hapus pertanyaan ${index + 1}`} style={{ border: 'none', color: '#ef4444', padding: 5 }} onClick={() => handleInputChange('home', 'faqs', content.home.faqs.filter((_, itemIndex) => itemIndex !== index))}>
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                                <label htmlFor={`home-faq-question-${index}`}>Pertanyaan</label>
                                                <input id={`home-faq-question-${index}`} data-preview-id={`preview-home-faq-${index}-question`} value={faq.q || ''} onChange={(e) => updateHomeFaq(index, 'q', e.target.value)} maxLength={180} />
                                                <label htmlFor={`home-faq-answer-${index}`}>Jawaban</label>
                                                <textarea id={`home-faq-answer-${index}`} data-preview-id={`preview-home-faq-${index}-answer`} value={faq.a || ''} onChange={(e) => updateHomeFaq(index, 'a', e.target.value)} rows="3" maxLength={1000} />
                                            </div>
                                        ))}
                                    </div>

                                    <button type="button" className="btn-cms-action" style={{ marginTop: 12 }} onClick={() => {
                                        const faqs = content.home.faqs || [];
                                        if (faqs.length >= 8) return toast.error('Maksimal 8 FAQ.');
                                        handleInputChange('home', 'faqs', [...faqs, { q: '', a: '' }]);
                                    }}>
                                        <Plus size={14} /> Tambah FAQ
                                    </button>
                                </div>

                                <div className="cms-form-group">
                                    <h4 className="cms-section-label">CTA Banner (Bottom)</h4>
                                    <label htmlFor="home-cta-title">Judul Banner</label>
                                    <input id="home-cta-title" data-preview-id="preview-home-cta-title" value={content.home.ctaBannerTitle} onChange={(e) => handleInputChange('home', 'ctaBannerTitle', e.target.value)} maxLength={160} />
                                    <label htmlFor="home-cta-description">Deskripsi</label>
                                    <textarea id="home-cta-description" data-preview-id="preview-home-cta-description" value={content.home.ctaBannerDesc} onChange={(e) => handleInputChange('home', 'ctaBannerDesc', e.target.value)} rows="2" maxLength={500} />
                                    <label htmlFor="home-cta-button">Teks Tombol</label>
                                    <input id="home-cta-button" data-preview-id="preview-home-cta-primary" value={content.home.ctaBannerBtn} onChange={(e) => handleInputChange('home', 'ctaBannerBtn', e.target.value)} maxLength={80} />
                                    <label htmlFor="home-cta-secondary">Teks Tombol Sekunder</label>
                                    <input id="home-cta-secondary" data-preview-id="preview-home-cta-secondary" value={content.home.ctaSecondary || ''} onChange={(e) => handleInputChange('home', 'ctaSecondary', e.target.value)} maxLength={80} />
                                    <label htmlFor="home-cta-formats">Judul Daftar Format</label>
                                    <input id="home-cta-formats" data-preview-id="preview-home-cta-formats-title" value={content.home.ctaFormatsTitle || ''} onChange={(e) => handleInputChange('home', 'ctaFormatsTitle', e.target.value)} maxLength={120} />
                                </div>

                                <div className="cms-form-group">
                                    <h4 className="cms-section-label">Navbar & Footer</h4>
                                    <label>Nav Beranda</label>
                                    <input data-preview-id="preview-home-nav-home" value={content.home.navHomeLabel || ''} onChange={(e) => handleInputChange('home', 'navHomeLabel', e.target.value)} />
                                    <label>Nav Produk</label>
                                    <input data-preview-id="preview-home-nav-products" value={content.home.navProductsLabel || ''} onChange={(e) => handleInputChange('home', 'navProductsLabel', e.target.value)} />
                                    <label>Nav Konsultasi</label>
                                    <input data-preview-id="preview-home-nav-consultation" value={content.home.navConsultationLabel || 'Konsultasi'} onChange={(e) => handleInputChange('home', 'navConsultationLabel', e.target.value)} />
                                    <label>Nav Tentang</label>
                                    <input data-preview-id="preview-home-nav-about" value={content.home.navAboutLabel || ''} onChange={(e) => handleInputChange('home', 'navAboutLabel', e.target.value)} />
                                    <label>Nav Kontak</label>
                                    <input data-preview-id="preview-home-nav-contact" value={content.home.navContactLabel || ''} onChange={(e) => handleInputChange('home', 'navContactLabel', e.target.value)} />
                                    <label>Tombol Login</label>
                                    <input data-preview-id="preview-home-nav-login" value={content.home.navLoginLabel || ''} onChange={(e) => handleInputChange('home', 'navLoginLabel', e.target.value)} />
                                    <label>Tombol Register</label>
                                    <input data-preview-id="preview-home-nav-register" value={content.home.navRegisterLabel || ''} onChange={(e) => handleInputChange('home', 'navRegisterLabel', e.target.value)} />
                                    <label>Judul Kolom Produk</label>
                                    <input data-preview-id="preview-home-footer-products-title" value={content.home.footerProductsTitle || ''} onChange={(e) => handleInputChange('home', 'footerProductsTitle', e.target.value)} />
                                    <label>Judul Kolom Perusahaan</label>
                                    <input data-preview-id="preview-home-footer-company-title" value={content.home.footerCompanyTitle || ''} onChange={(e) => handleInputChange('home', 'footerCompanyTitle', e.target.value)} />
                                    <label>Judul Kolom Kontak</label>
                                    <input data-preview-id="preview-home-footer-contact-title" value={content.home.footerContactTitle || ''} onChange={(e) => handleInputChange('home', 'footerContactTitle', e.target.value)} />
                                    <label>Tombol CTA Footer</label>
                                    <input data-preview-id="preview-home-footer-cta" value={content.home.footerCtaLabel || ''} onChange={(e) => handleInputChange('home', 'footerCtaLabel', e.target.value)} />
                                    <label>Footer Link Ebook</label>
                                    <input data-preview-id="preview-home-footer-product-ebook" value={content.home.footerProductEbookLabel || ''} onChange={(e) => handleInputChange('home', 'footerProductEbookLabel', e.target.value)} />
                                    <label>Footer Link Video</label>
                                    <input data-preview-id="preview-home-footer-product-video" value={content.home.footerProductVideoLabel || ''} onChange={(e) => handleInputChange('home', 'footerProductVideoLabel', e.target.value)} />
                                    <label>Footer Link Webinar</label>
                                    <input data-preview-id="preview-home-footer-product-webinar" value={content.home.footerProductWebinarLabel || ''} onChange={(e) => handleInputChange('home', 'footerProductWebinarLabel', e.target.value)} />
                                    <label>Footer Link Offline</label>
                                    <input data-preview-id="preview-home-footer-product-offline" value={content.home.footerProductOfflineLabel || ''} onChange={(e) => handleInputChange('home', 'footerProductOfflineLabel', e.target.value)} />
                                    <label>Footer Link Tentang</label>
                                    <input data-preview-id="preview-home-footer-about" value={content.home.footerAboutLabel || ''} onChange={(e) => handleInputChange('home', 'footerAboutLabel', e.target.value)} />
                                    <label>Footer Link Kontak</label>
                                    <input data-preview-id="preview-home-footer-contact" value={content.home.footerContactLabel || ''} onChange={(e) => handleInputChange('home', 'footerContactLabel', e.target.value)} />
                                    <label>Teks Copyright</label>
                                    <input data-preview-id="preview-home-footer-rights" value={content.home.footerRightsText || ''} onChange={(e) => handleInputChange('home', 'footerRightsText', e.target.value)} />
                                </div>
                            </>
                        )}

                        {activeTab === 'about' && (
                            <>
                                <div className="cms-form-group">
                                    <h4 className="cms-section-label">Hero About</h4>
                                    <label>Awalan Judul</label>
                                    <input data-preview-id="preview-about-hero-prefix" value={content.about.heroTitlePrefix || ''} onChange={(e) => handleInputChange('about', 'heroTitlePrefix', e.target.value)} />
                                    <label>Judul Fokus</label>
                                    <input data-preview-id="preview-about-hero-title" value={content.about.heroTitle} onChange={(e) => handleInputChange('about', 'heroTitle', e.target.value)} />
                                    <label>Deskripsi Hero</label>
                                    <textarea data-preview-id="preview-about-hero-desc" value={content.about.heroDesc} onChange={(e) => handleInputChange('about', 'heroDesc', e.target.value)} rows="3" />
                                    <label>Tombol Utama</label>
                                    <input data-preview-id="preview-about-hero-primary-cta" value={content.about.heroPrimaryCta || ''} onChange={(e) => handleInputChange('about', 'heroPrimaryCta', e.target.value)} />
                                    <label>Tombol Sekunder</label>
                                    <input data-preview-id="preview-about-hero-secondary-cta" value={content.about.heroSecondaryCta || ''} onChange={(e) => handleInputChange('about', 'heroSecondaryCta', e.target.value)} />
                                    <label>Gambar Hero</label>
                                    <input
                                        data-preview-id="preview-about-hero-image"
                                        type="file"
                                        accept="image/png,image/jpeg,image/webp"
                                        onChange={(event) => {
                                            const file = event.target.files[0];
                                            if (!file) return;
                                            setAboutHeroImageFile(file);
                                            setAboutHeroImagePreview(URL.createObjectURL(file));
                                        }}
                                    />
                                    <label>Caption Gambar</label>
                                    <input data-preview-id="preview-about-image-caption" value={content.about.imageCaption || ''} onChange={(e) => handleInputChange('about', 'imageCaption', e.target.value)} />
                                    <label>Penegasan Caption</label>
                                    <input data-preview-id="preview-about-image-caption" value={content.about.imageCaptionStrong || ''} onChange={(e) => handleInputChange('about', 'imageCaptionStrong', e.target.value)} />
                                </div>

                                <div className="cms-form-group">
                                    <h4 className="cms-section-label">Cerita Kami</h4>
                                    <label>Judul Section</label>
                                    <input data-preview-id="preview-about-story-title" value={content.about.storyTitle} onChange={(e) => handleInputChange('about', 'storyTitle', e.target.value)} />
                                    <label>Paragraf 1</label>
                                    <textarea data-preview-id="preview-about-story-p1" value={content.about.storyP1} onChange={(e) => handleInputChange('about', 'storyP1', e.target.value)} rows="4" />
                                    <label>Paragraf 2</label>
                                    <textarea data-preview-id="preview-about-story-p2" value={content.about.storyP2} onChange={(e) => handleInputChange('about', 'storyP2', e.target.value)} rows="4" />
                                </div>

                                <div className="cms-form-group">
                                    <h4 className="cms-section-label">Visi & Misi</h4>
                                    <label>Judul Visi</label>
                                    <input data-preview-id="preview-about-vision-title" value={content.about.visionTitle} onChange={(e) => handleInputChange('about', 'visionTitle', e.target.value)} />
                                    <label>Deskripsi Visi</label>
                                    <textarea data-preview-id="preview-about-vision-desc" value={content.about.visionDesc} onChange={(e) => handleInputChange('about', 'visionDesc', e.target.value)} rows="3" />
                                    <label>Judul Misi</label>
                                    <input data-preview-id="preview-about-mission-title" value={content.about.missionTitle || ''} onChange={(e) => handleInputChange('about', 'missionTitle', e.target.value)} />
                                </div>
                                    
                                <div className="cms-form-group" style={{ padding: '15px', background: 'var(--color-bg-secondary)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                                        <h4 className="cms-section-label" style={{ marginBottom: 0, color: 'var(--color-accent)' }}>Poin-poin Misi</h4>
                                        <button className="btn-cms-action" onClick={() => {
                                            const newMissions = [...(content.about.missions || []), 'Point Misi Baru'];
                                            handleInputChange('about', 'missions', newMissions);
                                        }}><Plus size={14} /> Tambah</button>
                                    </div>
                                    
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        {(content.about.missions || []).map((m, idx) => (
                                            <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                                <div style={{ color: 'var(--color-text-muted)', fontSize: '16px', width: '20px' }}>#{idx+1}</div>
                                                <input 
                                                    data-preview-id={`preview-about-mission-${idx}`}
                                                    style={{ flex: 1, width: '100%', height: '44px', fontSize: '16px', padding: '0 12px', color: 'var(--color-text-primary)', background: 'var(--color-bg)' }}
                                                    value={m} 
                                                    onChange={(e) => {
                                                        const newMissions = [...content.about.missions];
                                                        newMissions[idx] = e.target.value;
                                                        handleInputChange('about', 'missions', newMissions);
                                                    }} 
                                                />
                                                <button className="btn-icon" style={{ border: 'none', color: '#ef4444', padding: '5px' }} onClick={() => {
                                                    const newMissions = content.about.missions.filter((_, i) => i !== idx);
                                                    handleInputChange('about', 'missions', newMissions);
                                                }}><Trash2 size={14} /></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="cms-form-group" style={{ padding: '15px', background: 'var(--color-bg-secondary)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                                        <h4 className="cms-section-label" style={{ marginBottom: 0, color: 'var(--color-accent)' }}>Pencapaian (Achievements)</h4>
                                        <button className="btn-cms-action" onClick={() => {
                                            const newAch = [...(content.about.achievements || []), { label: 'Label', value: '0+', icon: 'Award' }];
                                            handleInputChange('about', 'achievements', newAch);
                                        }}><Plus size={14} /> Tambah</button>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
                                        {(content.about.achievements || []).map((ach, idx) => {
                                            const IconComp = availableIcons[ach.icon] || Trophy;
                                            return (
                                                <div key={idx} style={{ padding: 16, background: 'var(--color-accent)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)', color: 'white', position: 'relative', overflow: 'hidden' }}>
                                                    {/* Decorative background circle */}
                                                    <div style={{ position: 'absolute', right: -20, top: -20, width: 80, height: 80, background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}></div>
                                                    
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15, alignItems: 'center', position: 'relative', zIndex: 1 }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                            <div style={{ padding: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)' }}>
                                                                <IconComp size={16} />
                                                            </div>
                                                            <span style={{ fontSize: 16, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8 }}>Statistik #{idx + 1}</span>
                                                        </div>
                                                        <button style={{ color: 'rgba(255,255,255,0.6)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }} onClick={() => {
                                                            const newAch = content.about.achievements.filter((_, i) => i !== idx);
                                                            handleInputChange('about', 'achievements', newAch);
                                                        }}><X size={16} /></button>
                                                    </div>

                                                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 12, position: 'relative', zIndex: 1 }}>
                                                        <div>
                                                            <label style={{ fontSize: 16, marginBottom: 4, display: 'block', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Label</label>
                                                            <input 
                                                                data-preview-id={`preview-about-achievement-${idx}-label`}
                                                                style={{ width: '100%', fontSize: 16, height: '36px', padding: '0 10px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: 8 }} 
                                                                value={ach.label} 
                                                                onChange={e => {
                                                                    const newAch = [...content.about.achievements];
                                                                    newAch[idx].label = e.target.value;
                                                                    handleInputChange('about', 'achievements', newAch);
                                                                }} 
                                                            />
                                                        </div>
                                                        <div>
                                                            <label style={{ fontSize: 16, marginBottom: 4, display: 'block', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Nilai (Value)</label>
                                                            <input 
                                                                data-preview-id={`preview-about-achievement-${idx}-value`}
                                                                style={{ width: '100%', fontSize: 16, height: '36px', padding: '0 10px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: 8 }} 
                                                                value={ach.value} 
                                                                onChange={e => {
                                                                    const newAch = [...content.about.achievements];
                                                                    newAch[idx].value = e.target.value;
                                                                    handleInputChange('about', 'achievements', newAch);
                                                                }} 
                                                            />
                                                        </div>
                                                    </div>

                                                    <div style={{ marginTop: 15, position: 'relative', zIndex: 1 }}>
                                                        <label style={{ fontSize: 16, marginBottom: 8, display: 'block', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Ganti Ikon</label>
                                                        <div className="cms-icon-grid" style={{ 
                                                            gap: 6,
                                                            background: 'rgba(0,0,0,0.15)',
                                                            padding: 8,
                                                            borderRadius: 12,
                                                            border: '1px solid rgba(255,255,255,0.1)'
                                                        }}>
                                                            {Object.entries(availableIcons).map(([name, IconComp]) => (
                                                                <button 
                                                                    key={name}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const newAch = [...content.about.achievements];
                                                                        newAch[idx].icon = name;
                                                                        handleInputChange('about', 'achievements', newAch);
                                                                    }}
                                                                    style={{
                                                                        padding: 6,
                                                                        background: ach.icon === name ? 'white' : 'transparent',
                                                                        border: '1px solid',
                                                                        borderColor: ach.icon === name ? 'white' : 'transparent',
                                                                        borderRadius: 6,
                                                                        cursor: 'pointer',
                                                                        color: ach.icon === name ? 'var(--color-accent)' : 'rgba(255,255,255,0.4)',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        transition: 'all 0.2s'
                                                                    }}
                                                                    title={name}
                                                                >
                                                                    <IconComp size={14} />
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div className="cms-form-group">
                                    <h4 className="cms-section-label">Bukti & Ajakan</h4>
                                    <label>Judul Statistik</label>
                                    <input data-preview-id="preview-about-proof-title" value={content.about.proofTitle || ''} onChange={(e) => handleInputChange('about', 'proofTitle', e.target.value)} />
                                    <label>Deskripsi Statistik</label>
                                    <textarea data-preview-id="preview-about-proof-desc" value={content.about.proofDesc || ''} onChange={(e) => handleInputChange('about', 'proofDesc', e.target.value)} rows="3" />
                                    <label>Judul CTA</label>
                                    <input data-preview-id="preview-about-cta-title" value={content.about.ctaTitle || ''} onChange={(e) => handleInputChange('about', 'ctaTitle', e.target.value)} />
                                    <label>Deskripsi CTA</label>
                                    <textarea data-preview-id="preview-about-cta-desc" value={content.about.ctaDesc || ''} onChange={(e) => handleInputChange('about', 'ctaDesc', e.target.value)} rows="3" />
                                    <label>Tombol CTA Utama</label>
                                    <input data-preview-id="preview-about-cta-primary" value={content.about.ctaPrimary || ''} onChange={(e) => handleInputChange('about', 'ctaPrimary', e.target.value)} />
                                    <label>Tombol CTA Sekunder</label>
                                    <input data-preview-id="preview-about-cta-secondary" value={content.about.ctaSecondary || ''} onChange={(e) => handleInputChange('about', 'ctaSecondary', e.target.value)} />
                                </div>
                                <div className="cms-form-group" style={{ padding: '15px', background: 'var(--color-bg-secondary)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                                        <h4 className="cms-section-label" style={{ marginBottom: 0, color: 'var(--color-accent)' }}>Perjalanan Tahunan (Milestones)</h4>
                                        <button className="btn-cms-action" onClick={() => {
                                            const newMS = [...(content.about.milestones || []), { year: '2025', text: 'Pencapaian baru' }];
                                            handleInputChange('about', 'milestones', newMS);
                                        }}><Plus size={14} /> Tambah</button>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
                                        {(content.about.milestones || []).map((ms, idx) => (
                                            <div key={idx} style={{ padding: 12, background: 'var(--color-bg)', borderRadius: 8, border: '1px solid var(--color-border)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, alignItems: 'center' }}>
                                                    <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Milestone #{idx + 1}</span>
                                                    <button style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }} onClick={() => {
                                                        const newMS = content.about.milestones.filter((_, i) => i !== idx);
                                                        handleInputChange('about', 'milestones', newMS);
                                                    }}><Trash2 size={14} /></button>
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                                                    <div>
                                                        <label style={{ fontSize: 16, marginBottom: 6, display: 'block', fontWeight: 600 }}>Tahun</label>
                                                        <input data-preview-id={`preview-about-milestone-${idx}-year`} style={{ width: '120px', fontSize: 16, height: '40px', padding: '0 12px' }} value={ms.year} onChange={e => {
                                                            const newMS = [...content.about.milestones];
                                                            newMS[idx].year = e.target.value;
                                                            handleInputChange('about', 'milestones', newMS);
                                                        }} />
                                                    </div>
                                                    <div>
                                                        <label style={{ fontSize: 16, marginBottom: 6, display: 'block', fontWeight: 600 }}>Pencapaian</label>
                                                        <textarea data-preview-id={`preview-about-milestone-${idx}-text`} style={{ width: '100%', fontSize: 16, minHeight: '80px', padding: '10px 12px', resize: 'vertical' }} value={ms.text} onChange={e => {
                                                            const newMS = [...content.about.milestones];
                                                            newMS[idx].text = e.target.value;
                                                            handleInputChange('about', 'milestones', newMS);
                                                        }} />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        {activeTab === 'contact' && (
                            <>
                                <div className="cms-form-group">
                                    <h4 className="cms-section-label">Hero Contact</h4>
                                    <label>Judul Halaman Browser</label>
                                    <input value={content.contact.pageTitle || ''} onChange={(e) => handleInputChange('contact', 'pageTitle', e.target.value)} maxLength={80} />
                                    <label>Judul Utama</label>
                                    <textarea data-preview-id="preview-contact-title" value={content.contact.title || ''} onChange={(e) => handleInputChange('contact', 'title', e.target.value)} rows="3" maxLength={160} />
                                    <label>Sub-judul</label>
                                    <textarea data-preview-id="preview-contact-subtitle" value={content.contact.subtitle || ''} onChange={(e) => handleInputChange('contact', 'subtitle', e.target.value)} rows="3" maxLength={500} />
                                    <label>Teks Tombol WhatsApp</label>
                                    <input data-preview-id="preview-contact-whatsapp-cta" value={content.contact.whatsappCta || ''} onChange={(e) => handleInputChange('contact', 'whatsappCta', e.target.value)} maxLength={80} />
                                    <label>Catatan di Samping Tombol</label>
                                    <textarea data-preview-id="preview-contact-whatsapp-note" value={content.contact.whatsappNote || ''} onChange={(e) => handleInputChange('contact', 'whatsappNote', e.target.value)} rows="2" maxLength={240} />
                                </div>

                                <div className="cms-form-group">
                                    <h4 className="cms-section-label">Jalur Bantuan</h4>
                                    <label>Judul Panel Kontak</label>
                                    <input data-preview-id="preview-contact-direct-title" value={content.contact.directTitle || ''} onChange={(e) => handleInputChange('contact', 'directTitle', e.target.value)} maxLength={120} />
                                    <label>Judul Bagian Kebutuhan</label>
                                    <input data-preview-id="preview-contact-guide-title" value={content.contact.guideTitle || ''} onChange={(e) => handleInputChange('contact', 'guideTitle', e.target.value)} maxLength={140} />
                                    <label>Penjelasan Bagian Kebutuhan</label>
                                    <textarea data-preview-id="preview-contact-guide-subtitle" value={content.contact.guideSubtitle || ''} onChange={(e) => handleInputChange('contact', 'guideSubtitle', e.target.value)} rows="3" maxLength={400} />

                                    {(content.contact.topics || []).map((topic, index) => (
                                        <div className="cms-list-item" key={index}>
                                            <label>Topik {index + 1}</label>
                                            <input
                                                data-preview-id={`preview-contact-topic-${index}-title`}
                                                value={topic.title || ''}
                                                onChange={(e) => {
                                                    const topics = [...content.contact.topics];
                                                    topics[index] = { ...topics[index], title: e.target.value };
                                                    handleInputChange('contact', 'topics', topics);
                                                }}
                                                maxLength={100}
                                            />
                                            <label>Deskripsi Topik {index + 1}</label>
                                            <textarea
                                                data-preview-id={`preview-contact-topic-${index}-desc`}
                                                value={topic.desc || ''}
                                                onChange={(e) => {
                                                    const topics = [...content.contact.topics];
                                                    topics[index] = { ...topics[index], desc: e.target.value };
                                                    handleInputChange('contact', 'topics', topics);
                                                }}
                                                rows="3"
                                                maxLength={360}
                                            />
                                        </div>
                                    ))}
                                </div>

                                <div className="cms-form-group">
                                    <h4 className="cms-section-label">Form Pesan</h4>
                                    <label>Judul Form</label>
                                    <input data-preview-id="preview-contact-form-title" value={content.contact.formTitle || ''} onChange={(e) => handleInputChange('contact', 'formTitle', e.target.value)} maxLength={140} />
                                    <label>Penjelasan Form</label>
                                    <textarea data-preview-id="preview-contact-form-subtitle" value={content.contact.formSubtitle || ''} onChange={(e) => handleInputChange('contact', 'formSubtitle', e.target.value)} rows="3" maxLength={400} />
                                    <label>Label Nama</label>
                                    <input value={content.contact.formNameLabel || ''} onChange={(e) => handleInputChange('contact', 'formNameLabel', e.target.value)} maxLength={60} />
                                    <label>Placeholder Nama</label>
                                    <input value={content.contact.formNamePlaceholder || ''} onChange={(e) => handleInputChange('contact', 'formNamePlaceholder', e.target.value)} maxLength={100} />
                                    <label>Label Email</label>
                                    <input value={content.contact.formEmailLabel || ''} onChange={(e) => handleInputChange('contact', 'formEmailLabel', e.target.value)} maxLength={60} />
                                    <label>Placeholder Email</label>
                                    <input value={content.contact.formEmailPlaceholder || ''} onChange={(e) => handleInputChange('contact', 'formEmailPlaceholder', e.target.value)} maxLength={100} />
                                    <label>Label Topik</label>
                                    <input value={content.contact.formSubjectLabel || ''} onChange={(e) => handleInputChange('contact', 'formSubjectLabel', e.target.value)} maxLength={60} />
                                    <label>Placeholder Topik</label>
                                    <input value={content.contact.formSubjectPlaceholder || ''} onChange={(e) => handleInputChange('contact', 'formSubjectPlaceholder', e.target.value)} maxLength={100} />
                                    <label>Label Pesan</label>
                                    <input value={content.contact.formMessageLabel || ''} onChange={(e) => handleInputChange('contact', 'formMessageLabel', e.target.value)} maxLength={60} />
                                    <label>Placeholder Pesan</label>
                                    <textarea value={content.contact.formMessagePlaceholder || ''} onChange={(e) => handleInputChange('contact', 'formMessagePlaceholder', e.target.value)} rows="2" maxLength={200} />
                                    <label>Teks Tombol Kirim</label>
                                    <input value={content.contact.formSubmitLabel || ''} onChange={(e) => handleInputChange('contact', 'formSubmitLabel', e.target.value)} maxLength={80} />
                                    <label>Catatan Form</label>
                                    <textarea data-preview-id="preview-contact-form-note" value={content.contact.formNote || ''} onChange={(e) => handleInputChange('contact', 'formNote', e.target.value)} rows="2" maxLength={240} />
                                    <label>Salam Pembuka Email</label>
                                    <input value={content.contact.formEmailIntro || ''} onChange={(e) => handleInputChange('contact', 'formEmailIntro', e.target.value)} maxLength={120} />
                                    <label>Notifikasi Saat Email Dibuka</label>
                                    <input value={content.contact.formOpenEmailNotice || ''} onChange={(e) => handleInputChange('contact', 'formOpenEmailNotice', e.target.value)} maxLength={120} />
                                </div>

                                <div className="cms-form-group">
                                    <h4 className="cms-section-label">Informasi Kontak</h4>
                                    <label>Label Email</label>
                                    <input value={content.contact.emailLabel || ''} onChange={(e) => handleInputChange('contact', 'emailLabel', e.target.value)} maxLength={60} />
                                    <label>Alamat Email</label>
                                    <input value={content.contact.email || ''} onChange={(e) => handleInputChange('contact', 'email', e.target.value)} type="email" />
                                    <label>Label WhatsApp / Telepon</label>
                                    <input value={content.contact.phoneLabel || ''} onChange={(e) => handleInputChange('contact', 'phoneLabel', e.target.value)} maxLength={60} />
                                    <label>WhatsApp / Telepon</label>
                                    <input value={content.contact.phone || ''} onChange={(e) => handleInputChange('contact', 'phone', e.target.value)} />
                                    <label>Label Alamat</label>
                                    <input value={content.contact.addressLabel || ''} onChange={(e) => handleInputChange('contact', 'addressLabel', e.target.value)} maxLength={60} />
                                    <label>Alamat Kantor</label>
                                    <textarea value={content.contact.address || ''} onChange={(e) => handleInputChange('contact', 'address', e.target.value)} rows="3" />
                                    <label>Google Maps URL (Untuk Button & Footer)</label>
                                    <input value={content.contact.mapsUrl || ''} onChange={(e) => handleInputChange('contact', 'mapsUrl', e.target.value)} placeholder="https://maps.app.goo.gl/..." />
                                </div>

                                <div className="cms-form-group">
                                    <h4 className="cms-section-label">Media Sosial</h4>
                                    <label>Instagram URL</label>
                                    <input value={content.social.instagram} onChange={(e) => handleInputChange('social', 'instagram', e.target.value)} placeholder="https://instagram.com/..." />
                                    <label>YouTube URL</label>
                                    <input value={content.social.youtube} onChange={(e) => handleInputChange('social', 'youtube', e.target.value)} placeholder="https://youtube.com/..." />
                                    <label>Twitter / X URL</label>
                                    <input value={content.social.twitter} onChange={(e) => handleInputChange('social', 'twitter', e.target.value)} placeholder="https://twitter.com/..." />
                                </div>
                            </>
                        )}

                        {activeTab === 'dashboard' && (
                            <>
                                {DASHBOARD_FIELDS.map(([section, fields]) => (
                                    <div className="cms-form-group" key={section}>
                                        <h4 className="cms-section-label">{section}</h4>
                                        {fields.map(([field, label, type]) => (
                                            <div key={field}>
                                                <label>{label}</label>
                                                {type === 'textarea' ? (
                                                    <textarea
                                                        value={content.dashboard[field] || ''}
                                                        onChange={event => handleInputChange('dashboard', field, event.target.value)}
                                                        rows="3"
                                                        maxLength={500}
                                                    />
                                                ) : (
                                                    <input
                                                        value={content.dashboard[field] || ''}
                                                        onChange={event => handleInputChange('dashboard', field, event.target.value)}
                                                        maxLength={120}
                                                    />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </>
                        )}

                        {activeTab === 'checkout' && (
                            <div className="sales-cms-editor">
                                <div className="sales-cms-stepper" aria-label="Bagian halaman penjualan">
                                    {['Penawaran', 'Konfirmasi'].map((label, index) => (
                                        <button type="button" key={label} className={activeCheckoutStep === index ? 'active' : ''} onClick={() => setActiveCheckoutStep(index)}>{label}</button>
                                    ))}
                                </div>

                                <section className="sales-cms-product">
                                    <label htmlFor="sales-product">Produk yang diedit</label>
                                    <div className="sales-cms-select">
                                        <select id="sales-product" value={selectedPreviewProductId} onChange={handleProductSelection}>
                                            {dbAllProducts.length > 0 ? dbAllProducts.map(product => <option key={product.id} value={product.id}>{product.name}</option>) : <option value="1">Produk Demo</option>}
                                        </select>
                                        <ChevronDown size={17} aria-hidden="true" />
                                    </div>
                                    <p>Perubahan hanya berlaku pada halaman sales produk ini. Harga dan transaksi tetap mengikuti data Produk.</p>
                                    {dbAllProducts.find(product => product.id == selectedPreviewProductId)?.slug && <Link href={route('products.sales', dbAllProducts.find(product => product.id == selectedPreviewProductId).slug)} target="_blank">Buka halaman sales <ArrowRight size={15} /></Link>}
                                </section>

                                {activeCheckoutStep === 0 ? <>
                                    <section className="sales-cms-section">
                                        <header><h3>Hero penawaran</h3><p>Pesan utama yang pertama kali dilihat calon pembeli.</p></header>
                                        <label>Judul khusus halaman sales</label>
                                        <input data-preview-id="sales-title" value={salesDraft.hero.title} maxLength={255} onChange={event => updateSalesSection('hero', 'title', event.target.value)} />
                                        <label>Deskripsi penawaran</label>
                                        <textarea data-preview-id="sales-hero-description" rows="4" value={salesDraft.hero.description} maxLength={3000} onChange={event => updateSalesSection('hero', 'description', event.target.value)} />
                                        <label>Gambar hero khusus sales</label>
                                        <label className="sales-cms-image-upload">
                                            {(salesHeroPreview || salesDraft.hero.image || dbAllProducts.find(product => product.id == selectedPreviewProductId)?.image) ? <img src={salesHeroPreview || getStorageUrl(salesDraft.hero.image || dbAllProducts.find(product => product.id == selectedPreviewProductId)?.image)} alt="Preview hero halaman sales" /> : <ImageIcon size={28} />}
                                            <span>{salesHeroPreview || salesDraft.hero.image ? 'Ganti gambar khusus sales' : 'Gunakan gambar khusus sales'}</span>
                                            <small>JPG, PNG, atau WebP maksimal 5 MB.</small>
                                            <input data-preview-id="sales-hero-image" type="file" accept="image/jpeg,image/png,image/webp" onChange={event => handleSalesHeroImage(event.target.files?.[0])} />
                                        </label>
                                        {(salesHeroPreview || salesDraft.hero.image) && <button type="button" className="sales-cms-text-button" onClick={() => { setSalesHeroFile(null); setSalesHeroPreview(null); updateSalesSection('hero', 'image', ''); }}>Gunakan kembali gambar produk</button>}

                                        <div className="sales-cms-list-heading"><label>Manfaat utama</label><button type="button" onClick={() => updateSalesSection('hero', 'benefits', [...salesDraft.hero.benefits, ''])}><Plus size={15} /> Tambah</button></div>
                                        <div className="sales-cms-list">
                                            {salesDraft.hero.benefits.map((benefit, index) => <div key={index}><input data-preview-id="sales-hero-benefits" value={benefit} maxLength={300} onChange={event => { const benefits = [...salesDraft.hero.benefits]; benefits[index] = event.target.value; updateSalesSection('hero', 'benefits', benefits); }} /><button type="button" aria-label={'Hapus manfaat ' + (index + 1)} onClick={() => updateSalesSection('hero', 'benefits', salesDraft.hero.benefits.filter((_, itemIndex) => itemIndex !== index))}><Trash2 size={17} /></button></div>)}
                                        </div>
                                    </section>

                                    <section className="sales-cms-section">
                                        <header><h3>Kartu pembelian</h3><p>Copy di sekitar harga dan tombol beli.</p></header>
                                        <label>Label penawaran</label><input data-preview-id="sales-offer-label" value={salesDraft.offer.label} maxLength={120} onChange={event => updateSalesSection('offer', 'label', event.target.value)} />
                                        <label>Tombol pada header</label><input data-preview-id="sales-header-cta" value={salesDraft.offer.headerCta} maxLength={80} onChange={event => updateSalesSection('offer', 'headerCta', event.target.value)} />
                                        <label>Tombol utama</label><input data-preview-id="sales-offer-cta" value={salesDraft.offer.cta} maxLength={80} onChange={event => updateSalesSection('offer', 'cta', event.target.value)} />
                                        <label>Catatan keamanan</label><textarea data-preview-id="sales-offer-trust" rows="2" value={salesDraft.offer.trustNote} maxLength={300} onChange={event => updateSalesSection('offer', 'trustNote', event.target.value)} />
                                    </section>

                                    <section className="sales-cms-section sales-cms-grid">
                                        <div><header><h3>Bagian manfaat</h3></header><label>Judul</label><input data-preview-id="sales-outcomes-title" value={salesDraft.outcomes.title} maxLength={160} onChange={event => updateSalesSection('outcomes', 'title', event.target.value)} /><label>Deskripsi</label><textarea data-preview-id="sales-outcomes-description" rows="3" value={salesDraft.outcomes.description} maxLength={500} onChange={event => updateSalesSection('outcomes', 'description', event.target.value)} /></div>
                                        <div><header><h3>Bagian materi</h3></header><label>Judul</label><input data-preview-id="sales-materials-title" value={salesDraft.materials.title} maxLength={160} onChange={event => updateSalesSection('materials', 'title', event.target.value)} /><label>Deskripsi</label><textarea data-preview-id="sales-materials-description" rows="3" value={salesDraft.materials.description} maxLength={500} onChange={event => updateSalesSection('materials', 'description', event.target.value)} /></div>
                                    </section>

                                    <section className="sales-cms-section">
                                        <header><h3>Konten tambahan</h3><p>Susun media atau CTA di bawah detail materi.</p></header>
                                        <div className="sales-cms-blocks">
                                            {landingBlocks.length === 0 && <div className="sales-cms-empty"><ArrowUpDown size={24} /><p>Belum ada konten tambahan.</p></div>}
                                            {landingBlocks.map((block, index) => {
                                                const definition = BLOCK_TYPES.find(type => type.type === block.type) || BLOCK_TYPES[0];
                                                const Icon = definition.icon;
                                                return <article className="sales-cms-block" key={index}>
                                                    <header><span><Icon size={17} />{definition.label}</span><div><button type="button" disabled={index === 0} aria-label="Pindah ke atas" onClick={() => moveBlock(index, -1)}><ChevronUp size={17} /></button><button type="button" disabled={index === landingBlocks.length - 1} aria-label="Pindah ke bawah" onClick={() => moveBlock(index, 1)}><ChevronDown size={17} /></button><button type="button" aria-label="Hapus blok" onClick={() => removeBlock(index)}><Trash2 size={17} /></button></div></header>
                                                    <div className="sales-cms-block__body">
                                                        {block.type === 'image' && <><label className="sales-cms-image-upload compact">{(block.preview || block.url) ? <img src={block.preview || getStorageUrl(block.url)} alt="Preview blok" /> : <ImageIcon size={24} />}<span>Unggah gambar</span><input data-preview-id={`sales-block-${index}`} type="file" accept="image/jpeg,image/png,image/webp" onChange={event => handleBlockImageFile(event.target.files?.[0], index)} /></label><label>Atau URL gambar</label><input data-preview-id={`sales-block-${index}`} value={block.url || ''} onChange={event => updateBlock(index, { url: event.target.value, preview: '' })} placeholder="https://..." /></>}
                                                        {block.type === 'slider' && <><div className="sales-cms-gallery">{(block.previews || block.images || []).map((image, imageIndex) => <div key={imageIndex}><img src={getStorageUrl(image)} alt="" /><button type="button" aria-label={'Hapus gambar ' + (imageIndex + 1)} onClick={() => removeSliderImage(index, imageIndex)}><X size={14} /></button></div>)}</div><label className="sales-cms-add-media"><Plus size={17} /> Tambah gambar<input data-preview-id={`sales-block-${index}`} type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={event => handleSliderImageFiles(event.target.files, index)} /></label></>}
                                                        {block.type === 'youtube' && <><label>URL video YouTube</label><input data-preview-id={`sales-block-${index}`} value={block.url || ''} onChange={event => updateBlock(index, { url: event.target.value })} placeholder="https://youtube.com/watch?v=..." />{getYoutubeEmbedId(block.url) && <div className="sales-cms-video"><iframe src={'https://www.youtube.com/embed/' + getYoutubeEmbedId(block.url)} title="Preview video" allowFullScreen /></div>}</>}
                                                        {block.type === 'button' && <><label>Teks tombol</label><input data-preview-id={`sales-block-${index}`} value={block.label || ''} maxLength={120} onChange={event => updateBlock(index, { label: event.target.value })} /></>}
                                                    </div>
                                                </article>;
                                            })}
                                        </div>
                                        {showBlockPicker ? <div className="sales-cms-picker"><header><strong>Pilih jenis konten</strong><button type="button" aria-label="Tutup" onClick={() => setShowBlockPicker(false)}><X size={18} /></button></header>{BLOCK_TYPES.map(type => <button type="button" key={type.type} onClick={() => addBlock(type.type)}><type.icon size={18} /><span>{type.label}</span></button>)}</div> : <button type="button" className="sales-cms-add-block" onClick={() => setShowBlockPicker(true)}><Plus size={18} /> Tambah konten</button>}
                                    </section>

                                    <section className="sales-cms-section">
                                        <header><h3>FAQ</h3><p>Jawaban untuk keraguan sebelum membeli.</p></header>
                                        <label>Judul</label><input data-preview-id="sales-faq-title" value={salesDraft.faq.title} maxLength={160} onChange={event => updateSalesSection('faq', 'title', event.target.value)} />
                                        <label>Deskripsi</label><textarea data-preview-id="sales-faq-description" rows="2" value={salesDraft.faq.description} maxLength={500} onChange={event => updateSalesSection('faq', 'description', event.target.value)} />
                                        <div className="sales-cms-list-heading"><label>Pertanyaan dan jawaban</label><button type="button" onClick={() => setLandingFaq(items => [...items, { q: '', a: '' }])}><Plus size={15} /> Tambah</button></div>
                                        <div className="sales-cms-faq-list">{landingFaq.map((item, index) => <div key={index}><input data-preview-id="sales-faq-items" value={item.q || ''} maxLength={240} placeholder="Pertanyaan" onChange={event => { const items = [...landingFaq]; items[index] = { ...items[index], q: event.target.value }; setLandingFaq(items); }} /><textarea data-preview-id="sales-faq-items" rows="3" value={item.a || ''} maxLength={2000} placeholder="Jawaban" onChange={event => { const items = [...landingFaq]; items[index] = { ...items[index], a: event.target.value }; setLandingFaq(items); }} /><button type="button" onClick={() => setLandingFaq(landingFaq.filter((_, itemIndex) => itemIndex !== index))}><Trash2 size={17} /> Hapus FAQ</button></div>)}</div>
                                    </section>

                                    <section className="sales-cms-section sales-cms-grid">
                                        <div><header><h3>Urgensi</h3></header><label>Hitung mundur (jam)</label><input data-preview-id="sales-header-timer" type="number" min="0" max="8760" value={countdownHours} onChange={event => setCountdownHours(event.target.value)} /><label>Teks kuota</label><input data-preview-id="sales-offer-quota" value={landingQuotaText} maxLength={255} onChange={event => setLandingQuotaText(event.target.value)} /></div>
                                        <div><header><h3>Penutup</h3></header><label>Judul</label><input data-preview-id="sales-close-title" value={salesDraft.closing.title} maxLength={200} onChange={event => updateSalesSection('closing', 'title', event.target.value)} /><label>Deskripsi</label><textarea data-preview-id="sales-close-description" rows="3" value={salesDraft.closing.description} maxLength={600} onChange={event => updateSalesSection('closing', 'description', event.target.value)} /><label>Teks tombol</label><input data-preview-id="sales-close-cta" value={salesDraft.closing.cta} maxLength={80} onChange={event => updateSalesSection('closing', 'cta', event.target.value)} /></div>
                                    </section>
                                </> : <section className="sales-cms-section">
                                    <header><h3>Konfirmasi sebelum checkout</h3><p>Pastikan tahap keputusan terakhir singkat dan jelas.</p></header>
                                    <label>Judul halaman</label><input data-preview-id="sales-confirm-heading" value={salesDraft.confirmation.heading} maxLength={200} onChange={event => updateSalesSection('confirmation', 'heading', event.target.value)} />
                                    <label>Deskripsi</label><textarea data-preview-id="sales-confirm-description" rows="3" value={salesDraft.confirmation.description} maxLength={600} onChange={event => updateSalesSection('confirmation', 'description', event.target.value)} />
                                    <label>Teks kembali</label><input data-preview-id="sales-confirm-back" value={salesDraft.confirmation.backLabel} maxLength={80} onChange={event => updateSalesSection('confirmation', 'backLabel', event.target.value)} />
                                    <label>Judul ringkasan</label><input data-preview-id="sales-confirm-order-title" value={salesDraft.confirmation.orderTitle} maxLength={120} onChange={event => updateSalesSection('confirmation', 'orderTitle', event.target.value)} />
                                    <label>Tombol pembayaran</label><input data-preview-id="sales-confirm-cta" value={salesDraft.confirmation.payCta} maxLength={80} onChange={event => updateSalesSection('confirmation', 'payCta', event.target.value)} />
                                    <label>Tombol jika sudah memiliki produk</label><input data-preview-id="sales-confirm-cta" value={salesDraft.confirmation.ownedCta} maxLength={80} onChange={event => updateSalesSection('confirmation', 'ownedCta', event.target.value)} />
                                    <label>Catatan keamanan</label><textarea data-preview-id="sales-confirm-trust" rows="2" value={salesDraft.confirmation.trustNote} maxLength={300} onChange={event => updateSalesSection('confirmation', 'trustNote', event.target.value)} />
                                </section>}
                            </div>
                        )}

                        {activeTab === 'branding' && (
                            <>
                                <div className="cms-form-group">
                                    <h4 className="cms-section-label">Identitas Visual</h4>
                                    <label>Nama Website (Utama)</label>
                                    <input value={content.branding.siteName} onChange={(e) => handleInputChange('branding', 'siteName', e.target.value)} placeholder="Contoh: JAGGAD" />
                                    
                                    <label>Tagline / Sub Nama</label>
                                    <input value={content.branding.siteTagline} onChange={(e) => handleInputChange('branding', 'siteTagline', e.target.value)} placeholder="Contoh: Academy" />
                                    
                                    <div style={{ marginTop: '20px', padding: '15px', background: 'var(--color-bg-secondary)', borderRadius: '12px', border: '1px dotted var(--color-border)' }}>
                                        <h5 style={{ fontSize: '16px', marginBottom: '10px' }}>Unggah File Brand</h5>
                                        
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                            <div>
                                                <label>Logo Website</label>
                                                <div 
                                                    className="image-upload-zone small"
                                                    onClick={() => document.getElementById('logo-upload').click()}
                                                    onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('drag-over'); }}
                                                    onDragLeave={(e) => e.currentTarget.classList.remove('drag-over')}
                                                    onDrop={(e) => {
                                                        e.preventDefault();
                                                        e.currentTarget.classList.remove('drag-over');
                                                        handleFileChange({ target: { files: e.dataTransfer.files } }, 'logo');
                                                    }}
                                                >
                                                    <input type="file" id="logo-upload" hidden accept="image/*" onChange={(e) => handleFileChange(e, 'logo')} />
                                                    {logoPreview || (content.branding.logo && !logoFile) ? (
                                                        <div className="image-preview-wrap">
                                                            <img src={logoPreview || (content.branding.logo.startsWith('http') ? content.branding.logo : `/storage/${content.branding.logo}`)} className="image-preview" alt="Logo" />
                                                            <div style={{ fontSize: '16px', marginTop: '5px' }}>Klik/Drop untuk ganti</div>
                                                        </div>
                                                    ) : (
                                                        <div className="upload-placeholder">
                                                            <ImageIcon size={20} />
                                                            <span style={{ fontSize: '16px' }}>Logo</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div>
                                                <label>Favicon</label>
                                                <div 
                                                    className="image-upload-zone small"
                                                    onClick={() => document.getElementById('favicon-upload').click()}
                                                    onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('drag-over'); }}
                                                    onDragLeave={(e) => e.currentTarget.classList.remove('drag-over')}
                                                    onDrop={(e) => {
                                                        e.preventDefault();
                                                        e.currentTarget.classList.remove('drag-over');
                                                        handleFileChange({ target: { files: e.dataTransfer.files } }, 'favicon');
                                                    }}
                                                >
                                                    <input type="file" id="favicon-upload" hidden accept="image/*" onChange={(e) => handleFileChange(e, 'favicon')} />
                                                    {faviconPreview || (content.branding.favicon && !faviconFile) ? (
                                                        <div className="image-preview-wrap">
                                                            <img src={faviconPreview || (content.branding.favicon.startsWith('http') ? content.branding.favicon : `/storage/${content.branding.favicon}`)} style={{ width: '32px', height: '32px', objectFit: 'contain' }} alt="Fav" />
                                                            <div style={{ fontSize: '16px', marginTop: '5px' }}>Klik/Drop</div>
                                                        </div>
                                                    ) : (
                                                        <div className="upload-placeholder">
                                                            <Globe size={20} />
                                                            <span style={{ fontSize: '16px' }}>Icon</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ marginTop: '15px' }}>
                                            <label>URL Logo (Manual)</label>
                                            <input value={content.branding.logo} onChange={(e) => handleInputChange('branding', 'logo', e.target.value)} style={{ fontSize: '16px' }} />
                                            <label style={{ marginTop: '8px' }}>URL Favicon (Manual)</label>
                                            <input value={content.branding.favicon} onChange={(e) => handleInputChange('branding', 'favicon', e.target.value)} style={{ fontSize: '16px' }} />
                                        </div>
                                    </div>
                                </div>

                                <div className="cms-form-group">
                                    <h4 className="cms-section-label">Preview Branding</h4>
                                    <div style={{ padding: '20px', background: 'var(--color-bg)', borderRadius: '12px', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontSize: '16px', color: 'var(--color-text-muted)', width: '60px' }}>Navbar:</span>
                                            <div style={{ fontWeight: '800', fontSize: '18px', display: 'flex', gap: '4px' }}>
                                                <span style={{ color: 'var(--color-accent)' }}>{content.branding.siteName}</span>
                                                <span style={{ color: 'var(--color-text-primary)' }}>{content.branding.siteTagline}</span>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontSize: '16px', color: 'var(--color-text-muted)', width: '60px' }}>Browser:</span>
                                            <div style={{ padding: '4px 12px', background: 'var(--color-bg-secondary)', borderRadius: '6px', fontSize: '16px', border: '1px solid var(--color-border)' }}>
                                                {content.branding.siteName} {content.branding.siteTagline} | Home
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="cms-sidebar-footer">
                        {activeTab === 'checkout' && <span className={`sales-cms-save-state ${salesDirty ? 'is-dirty' : ''}`}>{salesDirty ? 'Ada perubahan belum disimpan' : 'Semua perubahan tersimpan'}</span>}
                        <button className="btn-admin-primary" onClick={activeTab === 'checkout' ? saveSalesContent : handleSave} disabled={isSaving || (activeTab === 'checkout' && !salesDirty)} style={{ width: '100%', justifyContent: 'center' }}>
                            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                            <span>{isSaving ? 'Menyimpan...' : activeTab === 'checkout' ? 'Simpan Halaman Penjualan' : 'Simpan Perubahan'}</span>
                        </button>
                    </div>
                </aside>

                <main className="cms-preview-area">
                    <div className={`cms-preview-wrapper ${previewMode === 'mobile' ? 'is-mobile' : ''}`}>
                        <header className="cms-preview-header">
                            <strong className="cms-preview-title">
                                Preview
                                <span className="cms-preview-size">{previewMode === 'mobile' ? '430 × 932 px' : 'Desktop · otomatis'}</span>
                            </strong>
                            <div className="cms-preview-controls">
                                <button className="cms-toggle-btn" onClick={() => setHideSidebar(!hideSidebar)} title={hideSidebar ? "Tampilkan editor" : "Sembunyikan editor"}>
                                    {hideSidebar ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
                                </button>
                                <button className={`cms-toggle-btn ${previewMode === 'desktop' ? 'active' : ''}`} onClick={() => setPreviewMode('desktop')}>
                                    <Monitor size={15} />
                                </button>
                                <button className={`cms-toggle-btn ${previewMode === 'mobile' ? 'active' : ''}`} onClick={() => setPreviewMode('mobile')}>
                                    <Smartphone size={15} />
                                </button>
                            </div>
                        </header>

                        <div className="cms-preview-frame">
                            <iframe
                                ref={previewRef}
                                className="cms-preview-content"
                                title="Preview halaman"
                                srcDoc="<!doctype html><html><head></head><body></body></html>"
                                onLoad={initializePreview}
                            />
                            {previewDocument && createPortal(renderPreview(), previewDocument.body)}
                        </div>
                    </div>
                </main>
            </div>
        </AdminLayout>
    );
}
