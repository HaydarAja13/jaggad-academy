import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft, ArrowRight, BookOpen, CalendarDays, Check, CheckCircle2,
    ExternalLink, FileText, FolderOpen, MapPin, MonitorPlay, Palette, PlayCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import MainLayout from '../../Layouts/MainLayout';
import { products } from '../../Data/products';
import { getCategoryLabel, getStorageUrl } from '../../Utils/helpers';
import { classifyMaterialLink } from '../../Utils/materialLinks';
import './UserLearning.css';

export default function UserLearning({ id, product: dbProduct, completedMaterials = [] }) {
    const rawProduct = dbProduct || products.find(product => product.id === Number(id));

    if (!rawProduct) {
        toast.error('Produk tidak ditemukan');
        router.visit(route('dashboard'));
        return null;
    }

    const parseList = data => {
        if (Array.isArray(data)) return data;
        if (!data) return [];
        try { return JSON.parse(data); } catch { return []; }
    };
    const product = {
        ...rawProduct,
        title: rawProduct.name || rawProduct.title,
        description: rawProduct.short_description || rawProduct.description,
        longDescription: rawProduct.description || rawProduct.longDescription,
        thumbnail: getStorageUrl(rawProduct.image || rawProduct.thumbnail),
        category: rawProduct.category?.slug || rawProduct.category || 'ebook',
        benefits: parseList(rawProduct.benefits),
        materials: parseList(rawProduct.materials),
    };
    const materials = product.materials;
    const completed = new Set(completedMaterials.map(Number));
    const progress = materials.length ? Math.round((completed.size / materials.length) * 100) : 0;
    const firstMaterial = materials.find(material => material.link);
    const formatDate = value => new Date(value).toLocaleDateString('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
    const materialIcon = material => {
        const kind = classifyMaterialLink(material.link);

        if (kind === 'video') return <PlayCircle size={22} />;
        if (kind === 'drive') return <FolderOpen size={22} />;
        if (kind === 'meeting') return <MonitorPlay size={22} />;
        if (kind === 'design') return <Palette size={22} />;

        return <FileText size={22} />;
    };

    return (
        <MainLayout>
            <Head title={`Belajar: ${product.title} - JAGGAD ACADEMY`} />
            <div className="learning-page">
                <div hidden dangerouslySetInnerHTML={{ __html: '<!-- THESIS: Product learning desk; the purchased material is the first action, not another sales page. OWN-WORLD: cool white fields, one deep-maroon access panel, Chillax headings, Synonym reading copy, warm dividers, pill controls. STORY: confirm access, identify the product, open a material, then review supporting detail. FIRST VIEWPORT: a 16:9 product image and compact access panel share the hero; the first-material action stays visible. FORM: established customer-dashboard world, operate. FINISH: build-only verification requested by the user. -->' }} />

                <section className="learning-hero" aria-labelledby="learning-title">
                    <div className="container learning-hero__inner">
                        <Link href={route('dashboard')} className="learning-back">
                            <ArrowLeft size={18} aria-hidden="true" /> Kembali ke dashboard
                        </Link>

                        <div className="learning-hero__grid">
                            <figure className="learning-cover">
                                <img src={product.thumbnail} alt={`Sampul ${product.title}`} />
                            </figure>

                            <div className="learning-intro">
                                <div className="learning-access"><CheckCircle2 size={20} aria-hidden="true" /> Akses produk aktif</div>
                                <h1 id="learning-title">{product.title}</h1>
                                <p>{product.description || 'Materi pembelajaran Anda siap diakses kapan saja.'}</p>

                                <dl className="learning-facts">
                                    <div><dt>Format</dt><dd>{getCategoryLabel(product.category)}</dd></div>
                                    <div><dt>Progres</dt><dd>{progress}% selesai</dd></div>
                                </dl>

                                {firstMaterial ? (
                                    <a className="learning-primary-action" href={firstMaterial.link} target="_blank" rel="noreferrer">
                                        Buka materi pertama <ArrowRight size={18} aria-hidden="true" />
                                    </a>
                                ) : (
                                    <a className="learning-primary-action" href="#learning-materials">
                                        Lihat daftar materi <ArrowRight size={18} aria-hidden="true" />
                                    </a>
                                )}
                                <span className="learning-access-note">Tautan materi akan terbuka di tab baru.</span>
                            </div>
                        </div>
                    </div>
                </section>

                <main className="container learning-main">
                    <section className="learning-materials" id="learning-materials" aria-labelledby="materials-title">
                        <header className="learning-section-heading">
                            <div>
                                <h2 id="materials-title">Materi pembelajaran</h2>
                                <p>Pilih bagian yang ingin Anda pelajari. Materi dapat dibuka kembali kapan saja dari halaman ini.</p>
                            </div>
                            {materials.length > 0 && <span>{materials.length} bagian</span>}
                        </header>

                        {materials.length > 0 ? (
                            <ol className="learning-material-list">
                                {materials.map((material, index) => (
                                    <li key={`${material.title}-${index}`}>
                                        {material.link ? (
                                            <div className={`learning-material-row${completed.has(index) ? ' is-complete' : ''}`}>
                                                <a href={material.link} target="_blank" rel="noreferrer" className="learning-material-link">
                                                <span className="learning-material-number">{String(index + 1).padStart(2, '0')}</span>
                                                <span className="learning-material-icon" aria-hidden="true">
                                                    {materialIcon(material)}
                                                </span>
                                                <span className="learning-material-copy">
                                                    <strong>{material.title}</strong>
                                                    <span>{material.duration || 'Siap diakses'}</span>
                                                </span>
                                                <span className="learning-material-action">Buka <ExternalLink size={18} aria-hidden="true" /></span>
                                                </a>
                                                <button type="button" className="learning-complete-button" onClick={() => router.post(route('dashboard.learning.complete', [product.slug, index]), { completed: !completed.has(index) }, { preserveScroll: true })}>
                                                    <CheckCircle2 size={18} aria-hidden="true" /> {completed.has(index) ? 'Selesai' : 'Tandai selesai'}
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="learning-material-row is-disabled">
                                                <span className="learning-material-number">{String(index + 1).padStart(2, '0')}</span>
                                                <span className="learning-material-icon" aria-hidden="true"><FileText size={22} /></span>
                                                <span className="learning-material-copy">
                                                    <strong>{material.title}</strong>
                                                    <span>{material.duration || 'Tautan belum tersedia'}</span>
                                                </span>
                                                <span className="learning-material-action">Segera tersedia</span>
                                            </div>
                                        )}
                                    </li>
                                ))}
                            </ol>
                        ) : (
                            <div className="learning-empty">
                                <BookOpen size={30} aria-hidden="true" />
                                <div><h3>Materi sedang disiapkan</h3><p>Tautan pembelajaran akan tampil di sini setelah tersedia.</p></div>
                            </div>
                        )}
                    </section>

                    <aside className="learning-details" aria-label="Informasi produk">
                        <section>
                            <h2>Tentang materi ini</h2>
                            <p>{product.longDescription || product.description || 'Informasi materi belum tersedia.'}</p>
                        </section>

                        {product.benefits.length > 0 && (
                            <section>
                                <h2>Yang Anda dapatkan</h2>
                                <ul>{product.benefits.map((benefit, index) => <li key={index}><Check size={19} aria-hidden="true" /> <span>{benefit}</span></li>)}</ul>
                            </section>
                        )}

                        {product.start_at && (
                            <section className="learning-schedule">
                                <h2>Jadwal pelaksanaan</h2>
                                <div><CalendarDays size={20} aria-hidden="true" /><span>{formatDate(product.start_at)}{product.end_at && ` – ${formatDate(product.end_at)}`}</span></div>
                                {product.location && <div><MapPin size={20} aria-hidden="true" /><span>{product.location}</span></div>}
                            </section>
                        )}
                    </aside>
                </main>
            </div>
        </MainLayout>
    );
}
