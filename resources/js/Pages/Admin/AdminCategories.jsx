import { useEffect, useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import { FolderMinus, Image as ImageIcon, Pencil, Plus, Search, Trash2, Upload, X } from 'lucide-react';
import { getStorageUrl } from '../../Utils/helpers';
import AdminLayout from '../../Layouts/AdminLayout';
import toast from 'react-hot-toast';
import './Admin.css';

export default function AdminCategories({ dbCategories = [] }) {
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const { data: form, setData: setForm, post, processing, reset, errors } = useForm({
        _method: 'POST',
        id: '',
        label: '',
        description: '',
        imageFile: null,
        imagePreview: ''
    });

    const items = dbCategories.map(category => ({
        dbId: category.id,
        id: category.slug,
        label: category.name,
        count: Number(category.products_count || 0),
        image: category.image,
        description: category.description || ''
    }));
    const query = search.trim().toLowerCase();
    const filtered = items.filter(category => [category.label, category.id].some(value => value.toLowerCase().includes(query)));
    const totalProducts = items.reduce((total, category) => total + category.count, 0);

    useEffect(() => {
        if (!isModalOpen && !deleteConfirm) return undefined;

        const previousOverflow = document.body.style.overflow;
        const closeOnEscape = event => {
            if (event.key !== 'Escape') return;
            setIsModalOpen(false);
            setDeleteConfirm(null);
        };
        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', closeOnEscape);

        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener('keydown', closeOnEscape);
        };
    }, [isModalOpen, deleteConfirm]);

    const closeEditor = () => {
        setIsModalOpen(false);
        setEditingItem(null);
        reset();
    };

    const openAdd = () => {
        reset();
        setEditingItem(null);
        setForm({ _method: 'POST', id: '', label: '', description: '', imageFile: null, imagePreview: '' });
        setIsModalOpen(true);
    };

    const openEdit = item => {
        setEditingItem(item);
        setForm({
            _method: 'PUT',
            id: item.id,
            label: item.label,
            description: item.description,
            imageFile: null,
            imagePreview: getStorageUrl(item.image)
        });
        setIsModalOpen(true);
    };

    const handleImage = event => {
        const file = event.target.files[0];
        if (file) setForm(previous => ({ ...previous, imageFile: file, imagePreview: URL.createObjectURL(file) }));
    };

    const handleSave = event => {
        event.preventDefault();
        if (!form.id || !form.label) return toast.error('Lengkapi ID dan nama kategori');

        post(editingItem ? route('admin.categories.update', editingItem.id) : route('admin.categories.store'), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(editingItem ? 'Kategori diperbarui' : 'Kategori baru ditambahkan');
                closeEditor();
            },
            onError: error => toast.error(Object.values(error)[0] || 'Kategori gagal disimpan')
        });
    };

    const handleDelete = () => {
        router.delete(route('admin.categories.destroy', deleteConfirm.id), {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteConfirm(null);
                toast.success('Kategori dihapus');
            },
            onError: error => toast.error(error.message || 'Kategori gagal dihapus')
        });
    };

    return (
        <AdminLayout>
            <Head title="Kategori Produk - JAGGAD ACADEMY" />
            <main className="admin-page products-page categories-page">
                <header className="products-header categories-header">
                    <div>
                        <h1>Kategori produk</h1>
                        <p>Kelompokkan produk agar katalog lebih mudah dikelola dan ditemukan.</p>
                    </div>
                    <button type="button" className="products-primary" onClick={openAdd}>
                        <Plus size={18} aria-hidden="true" />
                        Tambah kategori
                    </button>
                </header>

                <section className="products-summary categories-summary" aria-label="Ringkasan kategori">
                    <div><strong>{items.length}</strong><span>Total kategori</span></div>
                    <div><strong>{totalProducts.toLocaleString('id-ID')}</strong><span>Produk terhubung</span></div>
                    <div><strong>{filtered.length}</strong><span>Kategori ditampilkan</span></div>
                </section>

                <section className="products-list" aria-labelledby="categories-list-title">
                    <div className="products-toolbar categories-toolbar">
                        <div>
                            <h2 id="categories-list-title">Daftar kategori</h2>
                            <p>Kelola nama, gambar, dan pengelompokan katalog.</p>
                        </div>
                        <label className="products-search categories-search">
                            <span className="sr-only">Cari kategori</span>
                            <Search size={18} aria-hidden="true" />
                            <input
                                type="search"
                                placeholder="Cari nama atau slug"
                                value={search}
                                onChange={event => setSearch(event.target.value)}
                            />
                        </label>
                    </div>

                    <div className="admin-table-wrap">
                        <table className="admin-table products-table categories-table">
                            <thead>
                                <tr><th>Kategori</th><th>Slug</th><th>Jumlah produk</th><th>Aksi</th></tr>
                            </thead>
                            <tbody>
                                {filtered.map(category => (
                                    <tr key={category.id}>
                                        <td data-label="Kategori">
                                            <div className="category-cell">
                                                <div className="category-thumbnail">
                                                    {category.image
                                                        ? <img src={getStorageUrl(category.image)} alt="" onError={event => { event.currentTarget.hidden = true; }} />
                                                        : <ImageIcon size={21} aria-hidden="true" />}
                                                </div>
                                                <div>
                                                    <strong>{category.label}</strong>
                                                    <span>{category.description || 'Belum ada deskripsi'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td data-label="Slug"><span className="category-slug">{category.id}</span></td>
                                        <td data-label="Jumlah produk"><strong className="category-count">{category.count.toLocaleString('id-ID')}</strong></td>
                                        <td data-label="Aksi">
                                            <div className="product-actions">
                                                <button type="button" className="product-edit" onClick={() => openEdit(category)}>
                                                    <Pencil size={16} aria-hidden="true" /> Edit
                                                </button>
                                                <button type="button" className="product-delete" onClick={() => setDeleteConfirm(category)} aria-label={`Hapus ${category.label}`}>
                                                    <Trash2 size={17} aria-hidden="true" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && (
                                    <tr>
                                        <td colSpan="4">
                                            <div className="products-empty">
                                                <FolderMinus size={30} aria-hidden="true" />
                                                <h3>Kategori tidak ditemukan</h3>
                                                <p>Coba kata kunci lain atau tambahkan kategori baru.</p>
                                                {query && <button type="button" onClick={() => setSearch('')}>Reset pencarian</button>}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="products-list-footer">Menampilkan {filtered.length} dari {items.length} kategori</div>
                </section>

                {isModalOpen && (
                    <div className="modal-overlay" onClick={closeEditor}>
                        <div className="modal categories-modal" role="dialog" aria-modal="true" aria-labelledby="category-form-title" onClick={event => event.stopPropagation()}>
                            <div className="categories-modal-header">
                                <div>
                                    <h2 id="category-form-title">{editingItem ? 'Edit kategori' : 'Tambah kategori'}</h2>
                                    <p>{editingItem ? 'Perbarui informasi kategori yang dipilih.' : 'Buat kelompok baru untuk katalog produk.'}</p>
                                </div>
                                <button type="button" className="categories-close" onClick={closeEditor} aria-label="Tutup form">
                                    <X size={20} aria-hidden="true" />
                                </button>
                            </div>

                            <form className="categories-form" onSubmit={handleSave}>
                                <div className="categories-form-grid">
                                    <div className="form-group">
                                        <label htmlFor="category-id">ID kategori (slug)</label>
                                        <input
                                            id="category-id"
                                            value={form.id}
                                            onChange={event => setForm('id', event.target.value.toLowerCase().replace(/\s+/g, '-'))}
                                            placeholder="contoh: ebook-ads"
                                            disabled={Boolean(editingItem)}
                                            aria-invalid={Boolean(errors.id)}
                                        />
                                        <small>Digunakan pada URL dan tidak dapat diubah setelah dibuat.</small>
                                        {errors.id && <span className="categories-error">{errors.id}</span>}
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="category-label">Nama tampilan</label>
                                        <input
                                            id="category-label"
                                            value={form.label}
                                            onChange={event => setForm('label', event.target.value)}
                                            placeholder="Masukkan nama kategori"
                                            aria-invalid={Boolean(errors.label)}
                                        />
                                        {errors.label && <span className="categories-error">{errors.label}</span>}
                                    </div>
                                </div>

                                <div className="form-group">
                                    <div className="categories-label-row">
                                        <label htmlFor="category-description">Deskripsi</label>
                                        <span>{form.description.length}/1000</span>
                                    </div>
                                    <textarea
                                        id="category-description"
                                        value={form.description}
                                        onChange={event => setForm('description', event.target.value)}
                                        rows="4"
                                        maxLength="1000"
                                        placeholder="Jelaskan isi atau tujuan kategori ini"
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="cat-image-file">Gambar kategori</label>
                                    <label className="categories-upload" htmlFor="cat-image-file">
                                        {form.imagePreview ? (
                                            <div className="categories-image-preview">
                                                <img src={form.imagePreview} alt="Pratinjau gambar kategori" />
                                                <button type="button" onClick={event => { event.preventDefault(); setForm(previous => ({ ...previous, imageFile: null, imagePreview: '' })); }} aria-label="Hapus gambar">
                                                    <X size={16} aria-hidden="true" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div>
                                                <Upload size={24} aria-hidden="true" />
                                                <strong>Pilih gambar kategori</strong>
                                                <span>PNG, JPG, atau WebP</span>
                                            </div>
                                        )}
                                    </label>
                                    <input id="cat-image-file" className="sr-only" type="file" accept="image/*" onChange={handleImage} />
                                </div>

                                <div className="modal-actions categories-modal-actions">
                                    <button type="button" className="btn-modal-cancel" onClick={closeEditor}>Batal</button>
                                    <button type="submit" className="btn-modal-save" disabled={processing}>
                                        {processing ? 'Menyimpan...' : editingItem ? 'Simpan perubahan' : 'Tambah kategori'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {deleteConfirm && (
                    <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
                        <div className="modal products-delete-modal" role="dialog" aria-modal="true" aria-labelledby="delete-category-title" onClick={event => event.stopPropagation()}>
                            <div className="products-delete-icon"><Trash2 size={24} aria-hidden="true" /></div>
                            <h3 id="delete-category-title" className="modal-title">Hapus kategori?</h3>
                            <p><strong>{deleteConfirm.label}</strong> akan dihapus permanen. Pastikan kategori ini tidak lagi digunakan produk.</p>
                            <div className="modal-actions">
                                <button type="button" className="btn-modal-cancel" onClick={() => setDeleteConfirm(null)}>Batal</button>
                                <button type="button" className="products-delete-confirm" onClick={handleDelete}>Hapus kategori</button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </AdminLayout>
    );
}
