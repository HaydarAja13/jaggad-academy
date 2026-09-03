import { useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { Search, SearchX, SlidersHorizontal } from 'lucide-react';
import ProductCard from '../../Components/ProductCard';
import MainLayout from '../../Layouts/MainLayout';
import './Products.css';

const sortOptions = [
    { value: 'default', label: 'Paling Relevan' },
    { value: 'newest', label: 'Terbaru' },
    { value: 'popular', label: 'Terpopuler' },
    { value: 'price-asc', label: 'Harga Terendah' },
    { value: 'price-desc', label: 'Harga Tertinggi' },
];

export default function Products({ products = [], categories: categoryData = [] }) {
    const { props } = usePage();
    const [activeCategory, setActiveCategory] = useState(props.category || 'all');
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState('default');

    const categories = [
        { id: 'all', label: 'Semua', count: products.length },
        ...categoryData.map(category => ({
            id: category.slug,
            label: category.name,
            count: products.filter(product => product.category?.slug === category.slug).length,
        })),
    ];
    const query = search.trim().toLowerCase();
    const filtered = products
        .filter(product => activeCategory === 'all' || product.category?.slug === activeCategory)
        .filter(product => !query || [product.name, product.short_description].some(value => value?.toLowerCase().includes(query)))
        .sort((a, b) => {
            if (sort === 'newest') return new Date(b.created_at || 0) - new Date(a.created_at || 0);
            if (sort === 'popular') return Number(b.sold_count || 0) - Number(a.sold_count || 0);
            if (sort === 'price-asc') return Number(a.price) - Number(b.price);
            if (sort === 'price-desc') return Number(b.price) - Number(a.price);
            return 0;
        });
    const hasActiveFilters = Boolean(activeCategory !== 'all' || query || sort !== 'default');

    const resetFilters = () => {
        setSearch('');
        setActiveCategory('all');
        setSort('default');
    };

    return (
        <MainLayout>
            <Head title="Katalog Produk - JAGGAD ACADEMY" />
            <div className="products-page">
                <header className="products-hero">
                    <div className="container products-hero__inner">
                        <h1>Semua <span>Produk</span></h1>
                        <p>Temukan produk digital yang sesuai dengan kebutuhan dan tujuan belajar Anda.</p>
                    </div>
                </header>

                <main className="container products-main">
                    <section className="products-toolbar" aria-label="Pencarian dan filter produk">
                        <label className="products-search">
                            <Search size={19} aria-hidden="true" />
                            <span className="products-visually-hidden">Cari produk</span>
                            <input
                                type="search"
                                placeholder="Cari produk..."
                                value={search}
                                onChange={event => setSearch(event.target.value)}
                            />
                        </label>

                        <div className="products-categories" role="group" aria-label="Filter kategori produk">
                            {categories.map(category => (
                                <button
                                    type="button"
                                    key={category.id}
                                    className={activeCategory === category.id ? 'active' : ''}
                                    onClick={() => setActiveCategory(category.id)}
                                    aria-pressed={activeCategory === category.id}
                                >
                                    {category.label} <span>{category.count}</span>
                                </button>
                            ))}
                        </div>

                        <label className="products-sort">
                            <SlidersHorizontal size={18} aria-hidden="true" />
                            <span className="products-visually-hidden">Urutkan produk</span>
                            <select value={sort} onChange={event => setSort(event.target.value)}>
                                {sortOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                            </select>
                        </label>
                    </section>

                    <div className="products-results">
                        <p aria-live="polite"><strong>{filtered.length}</strong> produk ditemukan</p>
                        {hasActiveFilters && <button type="button" onClick={resetFilters}>Reset filter</button>}
                    </div>

                    {filtered.length > 0 ? (
                        <section className="products-catalog" aria-label="Daftar produk">
                            <div className="products-grid">
                                {filtered.map(product => (
                                    <ProductCard key={product.id} product={product} className="product-card--catalog" />
                                ))}
                            </div>
                        </section>
                    ) : (
                        <section className="products-empty" aria-live="polite">
                            <SearchX size={38} aria-hidden="true" />
                            <h2>Produk belum ditemukan</h2>
                            <p>Coba kata kunci lain atau tampilkan kembali seluruh kategori.</p>
                            <button type="button" onClick={resetFilters}>Tampilkan semua produk</button>
                        </section>
                    )}
                </main>
            </div>
        </MainLayout>
    );
}
