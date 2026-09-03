import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowRight, Check, X } from 'lucide-react';
import { packages, packageComparison } from '../../Data/packages';
import { formatCurrency } from '../../Utils/helpers';
import { useCart } from '../../Contexts/CartContext';
import MainLayout from '../../Layouts/MainLayout';
import toast from 'react-hot-toast';
import './PackageLanding.css';

export default function PackageLanding({ slug }) {
    const { addToCart } = useCart();
    const { auth } = usePage().props;
    const pkg = packages.find(p => p.slug === slug);

    const handleBuy = () => {
        if (!auth.user) {
            toast.error('Harap login terlebih dahulu untuk membeli paket.');
            return router.get(route('login'));
        }
        addToCart({ id: `pkg-${pkg.id}`, package_slug: pkg.slug, title: pkg.title, price: pkg.price, type: 'package' });
        router.get(route('checkout'));
    };

    return (
        <MainLayout>
            <Head title={`${pkg.title} - JAGGAD ACADEMY`} />
            <div className="pkg-landing">
                {/* Hero */}
                <section className="pkg-hero section-dark">
                    <div className="pkg-hero__glow" />
                    <div className="container pkg-hero__content">
                        {pkg.badge && <span className="pkg-landing-badge">{pkg.badge}</span>}
                        <h1 className="pkg-hero__title">{pkg.title}</h1>
                        <p className="pkg-hero__subtitle">{pkg.subtitle}</p>
                        <div className="pkg-hero__price">
                            <span className="hero-price-current">{formatCurrency(pkg.price)}</span>
                            <span className="hero-price-original">{formatCurrency(pkg.originalPrice)}</span>
                            <span className="hero-save">Hemat {formatCurrency(pkg.originalPrice - pkg.price)}</span>
                        </div>
                        <button className="btn-hero-primary" onClick={handleBuy}>
                            Dapatkan Paket Ini <ArrowRight size={18} />
                        </button>
                    </div>
                </section>

                <div className="container pkg-landing__main">
                    {/* Included Products */}
                    <section className="pkg-section">
                        <h2 className="pkg-section-title">Produk yang Termasuk</h2>
                        <div className="pkg-included-grid">
                            {pkg.productNames.map((name, i) => (
                                <div key={i} className="pkg-included-item">
                                    <div className="included-check"><Check size={16} /></div>
                                    <span>{name}</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Benefits */}
                    <section className="pkg-section section-dark" style={{ padding: 'var(--space-12) var(--space-6)', margin: 'var(--space-6) calc(-1 * var(--space-6))', borderRadius: 'var(--radius-xl)' }}>
                        <h2 className="pkg-section-title">Apa yang Anda Dapatkan</h2>
                        <div className="benefits-grid">
                            {pkg.benefits.map((b, i) => (
                                <div key={i} className="pkg-benefit-item">
                                    <div className="benefit-icon">🎯</div>
                                    <span>{b}</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Comparison Table */}
                    <section className="pkg-section">
                        <h2 className="pkg-section-title">Perbandingan Paket</h2>
                        <div className="comparison-table-wrap">
                            <table className="comparison-table">
                                <thead>
                                    <tr>
                                        <th>Fitur</th>
                                        <th className={pkg.slug === 'starter-pack' ? 'active-col' : ''}>Starter</th>
                                        <th className={pkg.slug === 'growth-pack' ? 'active-col' : ''}>Growth</th>
                                        <th className={pkg.slug === 'ultimate-pack' ? 'active-col' : ''}>Ultimate</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {packageComparison.map((row, i) => (
                                        <tr key={i}>
                                            <td>{row.feature}</td>
                                            <td className={pkg.slug === 'starter-pack' ? 'active-col' : ''}>
                                                {row.starter ? <Check size={16} className="check-yes" /> : <X size={16} className="check-no" />}
                                            </td>
                                            <td className={pkg.slug === 'growth-pack' ? 'active-col' : ''}>
                                                {row.growth ? <Check size={16} className="check-yes" /> : <X size={16} className="check-no" />}
                                            </td>
                                            <td className={pkg.slug === 'ultimate-pack' ? 'active-col' : ''}>
                                                {row.ultimate ? <Check size={16} className="check-yes" /> : <X size={16} className="check-no" />}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* Other Packages */}
                    <section className="pkg-section section-dark" style={{ padding: 'var(--space-12) var(--space-6)', margin: 'var(--space-6) calc(-1 * var(--space-6))', borderRadius: 'var(--radius-xl)' }}>
                        <h2 className="pkg-section-title">Paket Lainnya</h2>
                        <div className="other-packages">
                            {packages.filter(p => p.slug !== pkg.slug).map(p => (
                                <Link key={p.id} href={route('packages.landing', p.slug)} className="other-pkg-card">
                                    <h3>{p.title}</h3>
                                    <p>{formatCurrency(p.price)}</p>
                                    <span>Lihat Detail <ArrowRight size={13} /></span>
                                </Link>
                            ))}
                        </div>
                    </section>

                    {/* CTA */}
                    <section className="pkg-cta">
                        <h2>Siap Memulai?</h2>
                        <p>Bergabunglah dengan ribuan pelajar yang telah berhasil bersama JAGGAD ACADEMY</p>
                        <div className="pkg-cta__price">
                            <span>{formatCurrency(pkg.price)}</span>
                            <del>{formatCurrency(pkg.originalPrice)}</del>
                        </div>
                        <button className="btn-hero-primary" onClick={handleBuy}>
                            Beli {pkg.title} Sekarang <ArrowRight size={18} />
                        </button>
                    </section>
                </div>
            </div>
        </MainLayout>
    );
}
