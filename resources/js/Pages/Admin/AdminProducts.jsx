import { useEffect, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Package, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { formatPrice, getStorageUrl } from '../../Utils/helpers';
import AdminLayout from '../../Layouts/AdminLayout';
import toast from 'react-hot-toast';
import './Admin.css';

export default function AdminProducts({ dbProducts = [] }) {
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('all');
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const items = dbProducts.map(dbP => ({
        id: dbP.id,
        slug: dbP.slug,
        title: dbP.name,
        category: dbP.category?.name || 'Tidak Ada',
        price: dbP.price,
        sold: Number(dbP.sold_count || 0),
        thumbnail: getStorageUrl(dbP.image)
    }));

    const categories = [...new Set(items.map(product => product.category))].sort((a, b) => a.localeCompare(b));
    const query = search.trim().toLowerCase();
    const filtered = items.filter(product => (
        (category === 'all' || product.category === category)
        && [product.title, product.slug, product.category].some(value => value.toLowerCase().includes(query))
    ));
    const totalSold = items.reduce((total, product) => total + product.sold, 0);
    const hasFilters = Boolean(query) || category !== 'all';

    const openAdd = () => router.get(route('admin.products.create'));
    const openEdit = (p) => router.get(route('admin.products.edit', p.slug));

    useEffect(() => {
        if (!deleteConfirm) return undefined;

        const previousOverflow = document.body.style.overflow;
        const closeOnEscape = event => event.key === 'Escape' && setDeleteConfirm(null);
        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', closeOnEscape);

        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener('keydown', closeOnEscape);
        };
    }, [deleteConfirm]);

    const handleDelete = () => {
        router.delete(route('admin.products.destroy', deleteConfirm.slug), {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteConfirm(null);
                toast.success('Produk dihapus');
            },
            onError: () => toast.error('Gagal menghapus produk')
        });
    };

    return (
        <AdminLayout>
            <Head title="Manajemen Produk - JAGGAD ACADEMY" />
            <main className="admin-page products-page">
                <header className="products-header">
                    <div>
                        <p className="products-eyebrow">Katalog</p>
                        <h1>Produk</h1>
                        <p>Atur katalog, harga, dan ketersediaan produk dalam satu tempat.</p>
                    </div>
                    <button type="button" className="products-primary" onClick={openAdd}>
                        <Plus size={18} aria-hidden="true" />
                        Tambah produk
                    </button>
                </header>

                <section className="products-summary" aria-label="Ringkasan produk">
                    <div>
                        <strong>{items.length}</strong>
                        <span>Total produk</span>
                    </div>
                    <div>
                        <strong>{categories.length}</strong>
                        <span>Kategori aktif</span>
                    </div>
                    <div>
                        <strong>{totalSold.toLocaleString('id-ID')}</strong>
                        <span>Total terjual</span>
                    </div>
                </section>

                <section className="products-list" aria-labelledby="products-list-title">
                    <div className="products-toolbar">
                        <div>
                            <h2 id="products-list-title">Daftar produk</h2>
                            <p>{filtered.length} dari {items.length} produk ditampilkan</p>
                        </div>
                        <div className="products-filters">
                            <label className="products-search">
                                <span className="sr-only">Cari produk</span>
                                <Search size={18} aria-hidden="true" />
                                <input
                                    type="search"
                                    placeholder="Cari nama, slug, atau kategori"
                                    value={search}
                                    onChange={event => setSearch(event.target.value)}
                                />
                            </label>
                            <label className="products-select">
                                <span className="sr-only">Filter kategori</span>
                                <select value={category} onChange={event => setCategory(event.target.value)}>
                                    <option value="all">Semua kategori</option>
                                    {categories.map(item => <option key={item} value={item}>{item}</option>)}
                                </select>
                            </label>
                        </div>
                    </div>
                    <div className="admin-table-wrap">
                        <table className="admin-table products-table">
                            <thead>
                                <tr><th>Produk</th><th>Kategori</th><th>Harga</th><th>Terjual</th><th>Aksi</th></tr>
                            </thead>
                            <tbody>
                                {filtered.map(p => (
                                    <tr key={p.id}>
                                        <td data-label="Produk">
                                            <div className="product-cell">
                                                <div className="product-thumbnail">
                                                    {p.thumbnail
                                                        ? <img src={p.thumbnail} alt="" onError={event => { event.currentTarget.hidden = true; }} />
                                                        : <Package size={22} aria-hidden="true" />}
                                                </div>
                                                <div>
                                                    <strong>{p.title}</strong>
                                                    <span>{p.slug}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td data-label="Kategori"><span className="product-category">{p.category}</span></td>
                                        <td data-label="Harga"><strong className="product-price">{formatPrice(p.price)}</strong></td>
                                        <td data-label="Terjual"><span className="product-sold">{p.sold.toLocaleString('id-ID')}</span></td>
                                        <td data-label="Aksi">
                                            <div className="product-actions">
                                                <button type="button" className="product-edit" onClick={() => openEdit(p)}>
                                                    <Pencil size={16} aria-hidden="true" />
                                                    Edit
                                                </button>
                                                <button type="button" className="product-delete" onClick={() => setDeleteConfirm(p)} aria-label={`Hapus ${p.title}`}>
                                                    <Trash2 size={17} aria-hidden="true" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && (
                                    <tr>
                                        <td colSpan="5">
                                            <div className="products-empty">
                                                <Search size={28} aria-hidden="true" />
                                                <h3>Produk tidak ditemukan</h3>
                                                <p>Coba kata kunci atau kategori lain.</p>
                                                {hasFilters && (
                                                    <button type="button" onClick={() => { setSearch(''); setCategory('all'); }}>
                                                        Reset filter
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="products-list-footer">
                        Menampilkan {filtered.length} produk
                    </div>
                </section>

                {deleteConfirm && (
                    <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
                        <div className="modal products-delete-modal" role="dialog" aria-modal="true" aria-labelledby="delete-product-title" onClick={event => event.stopPropagation()}>
                            <div className="products-delete-icon"><Trash2 size={24} aria-hidden="true" /></div>
                            <h3 id="delete-product-title" className="modal-title">Hapus produk?</h3>
                            <p>
                                <strong>{deleteConfirm.title}</strong> akan dihapus permanen dan tindakan ini tidak dapat dibatalkan.
                            </p>
                            <div className="modal-actions">
                                <button className="btn-modal-cancel" onClick={() => setDeleteConfirm(null)}>Batal</button>
                                <button className="products-delete-confirm" onClick={handleDelete}>Hapus produk</button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </AdminLayout>
    );
}
