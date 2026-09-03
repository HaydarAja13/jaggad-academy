import { useState, useRef } from 'react';
import { Head, router } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2, Link as LinkIcon, Pencil, Plus, Save, Trash2, Upload, X } from 'lucide-react';
import AdminLayout from '../../Layouts/AdminLayout';
import toast from 'react-hot-toast';
import { getStorageUrl } from '../../Utils/helpers';
import './Admin.css';



export default function AdminProductForm({ dbCategories = [], product }) {
    const isEdit = Boolean(product);

    const toLocalISO = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const offset = date.getTimezoneOffset();
        const localDate = new Date(date.getTime() - (offset * 60 * 1000));
        return localDate.toISOString().slice(0, 16);
    };

    const formatNumberWithDots = (val) => {
        if (val === undefined || val === null || val === '') return '';
        const clean = val.toString().replace(/\D/g, '');
        if (!clean) return '';
        return clean.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    };

    const parseNumberFromDots = (val) => {
        if (!val) return '';
        return val.toString().replace(/\D/g, '');
    };

    const [form, setForm] = useState({
        _method: isEdit ? 'PUT' : 'POST',
        title: product?.name || '', 
        category: product?.category_id || (dbCategories[0]?.id || ''), 
        price: product?.price ? Math.round(parseFloat(product.price)) : '', 
        originalPrice: product?.normal_price ? Math.round(parseFloat(product.normal_price)) : '',
        description: product?.short_description || '', 
        longDescription: product?.description || '', 
        badge: product?.badge || '',
        startAt: toLocalISO(product?.start_at),
        endAt: toLocalISO(product?.end_at),
        location: product?.location || '',
        imageUrl: getStorageUrl(product?.image), 
        imageFile: null, 
        imagePreview: getStorageUrl(product?.image),
        benefits: product?.benefits ? (Array.isArray(product.benefits) ? product.benefits : JSON.parse(product.benefits)) : [],
        materials: product?.materials ? (Array.isArray(product.materials) ? product.materials : JSON.parse(product.materials)) : []
    });

    const [dragOver, setDragOver] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [newBenefit, setNewBenefit] = useState('');
    const [editingBenefitIndex, setEditingBenefitIndex] = useState(null);
    const [newMaterialTitle, setNewMaterialTitle] = useState('');
    const [newMaterialMeta, setNewMaterialMeta] = useState('');
    const [newMaterialLink, setNewMaterialLink] = useState('');
    const [editingMaterialIndex, setEditingMaterialIndex] = useState(null);

    const fileInputRef = useRef(null);
    const discountPercent = Number(form.originalPrice) > Number(form.price) && Number(form.price) > 0
        ? Math.round(((Number(form.originalPrice) - Number(form.price)) / Number(form.originalPrice)) * 100)
        : 0;

    const handleImageFile = (file) => {
        if (!file) return;
        if (!file.type.startsWith('image/')) return toast.error('File harus berupa gambar');
        if (file.size > 2 * 1024 * 1024) return toast.error('Ukuran file maksimal 2MB');
        const preview = URL.createObjectURL(file);
        setForm(prev => ({ ...prev, imageFile: file, imagePreview: preview }));
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        handleImageFile(e.dataTransfer.files[0]);
    };

    const saveBenefit = () => {
        const benefit = newBenefit.trim();
        if (!benefit) return;
        setForm(prev => ({
            ...prev,
            benefits: editingBenefitIndex === null
                ? [...prev.benefits, benefit]
                : prev.benefits.map((item, index) => index === editingBenefitIndex ? benefit : item)
        }));
        setNewBenefit('');
        setEditingBenefitIndex(null);
    };

    const saveMaterial = () => {
        if (!newMaterialTitle.trim()) return;
        const title = newMaterialTitle.trim();
        const duration = newMaterialMeta.trim() || '';
        const link = newMaterialLink.trim();
        const material = { title, duration, link };
        setForm(prev => ({
            ...prev,
            materials: editingMaterialIndex === null
                ? [...prev.materials, material]
                : prev.materials.map((item, index) => index === editingMaterialIndex ? material : item)
        }));
        setNewMaterialTitle('');
        setNewMaterialMeta('');
        setNewMaterialLink('');
        setEditingMaterialIndex(null);
    };

    const editBenefit = (index) => {
        setNewBenefit(form.benefits[index]);
        setEditingBenefitIndex(index);
    };

    const editMaterial = (index) => {
        const material = form.materials[index];
        setNewMaterialTitle(material.title || '');
        setNewMaterialMeta(material.duration || '');
        setNewMaterialLink(material.link || '');
        setEditingMaterialIndex(index);
    };

    const cancelBenefitEdit = () => {
        setNewBenefit('');
        setEditingBenefitIndex(null);
    };

    const cancelMaterialEdit = () => {
        setNewMaterialTitle('');
        setNewMaterialMeta('');
        setNewMaterialLink('');
        setEditingMaterialIndex(null);
    };


    const handleSave = () => {
        if (!form.title || !form.price) return toast.error('Lengkapi data wajib produk (Judul & Harga)');
        if (form.startAt && form.endAt && new Date(form.endAt) < new Date(form.startAt)) {
            return toast.error('Waktu selesai tidak boleh mendahului waktu mulai');
        }

        const fd = new FormData();
        fd.append('_method', isEdit ? 'PUT' : 'POST');
        fd.append('title', form.title);
        fd.append('category', form.category || '');
        fd.append('price', form.price);
        fd.append('originalPrice', form.originalPrice || '');
        fd.append('description', form.description || '');
        fd.append('longDescription', form.longDescription || '');
        fd.append('badge', form.badge || '');
        fd.append('startAt', form.startAt || '');
        fd.append('endAt', form.endAt || '');
        fd.append('location', form.location || '');
        fd.append('imageUrl', form.imageUrl || '');
        if (form.imageFile) fd.append('imageFile', form.imageFile);
        form.benefits.forEach((b, i) => fd.append(`benefits[${i}]`, b));
        form.materials.forEach((m, i) => {
            fd.append(`materials[${i}][title]`, m.title || '');
            fd.append(`materials[${i}][duration]`, m.duration || '');
            fd.append(`materials[${i}][link]`, m.link || '');
        });


        router.post(
            isEdit ? route('admin.products.update', product.slug) : route('admin.products.store'),
            fd,
            {
                preserveScroll: true,
                onStart: () => setProcessing(true),
                onSuccess: () => toast.success(isEdit ? 'Produk berhasil diperbarui' : 'Produk baru berhasil ditambahkan'),
                onError: (e) => toast.error(Object.values(e)[0] || 'Gagal menyimpan produk'),
                onFinish: () => setProcessing(false)
            }
        );
    };


    return (
        <AdminLayout>
            <Head title={`${isEdit ? 'Edit' : 'Tambah'} Produk - JAGGAD ACADEMY`} />
            <main className="admin-page product-form-page">
                <header className="product-form-header">
                    <button type="button" className="product-form-back" onClick={() => router.get(route('admin.products.index'))}>
                        <ArrowLeft size={18} aria-hidden="true" /> Kembali ke produk
                    </button>
                    <p className="product-form-eyebrow">Katalog produk</p>
                    <h1>{isEdit ? 'Edit produk' : 'Tambah produk'}</h1>
                    <p>{isEdit ? 'Perbarui informasi produk yang sudah tersedia.' : 'Lengkapi informasi utama agar produk siap ditampilkan dan dijual.'}</p>
                </header>

                    <div className="product-form-shell">
                        <h2 className="product-form-step-title"><span>01</span><span>Visual produk<small>Cover utama yang tampil di katalog.</small></span></h2>
                        <div
                            className={`image-upload-zone product-cover-upload ${dragOver ? 'drag-over' : ''}`}
                            role="button"
                            tabIndex="0"
                            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            onKeyDown={event => ['Enter', ' '].includes(event.key) && fileInputRef.current?.click()}
                        >
                            {form.imagePreview ? (
                                <div className="image-preview-wrap">
                                    <img src={form.imagePreview} alt="Preview cover produk" className="image-preview" />
                                    <button type="button" className="image-remove-btn" onClick={e => { e.stopPropagation(); setForm(prev => ({ ...prev, imageFile: null, imagePreview: '', imageUrl: '' })); }} aria-label="Hapus cover">
                                        <X size={16} aria-hidden="true" />
                                    </button>
                                </div>
                            ) : (
                                <div className="upload-placeholder">
                                    <Upload size={28} aria-hidden="true" />
                                    <strong>Unggah cover produk</strong>
                                    <p>Tarik gambar ke sini atau <span>klik untuk memilih</span>.</p>
                                    <p className="upload-hint">PNG, JPG, WebP · Maks. 2 MB · Rasio 16:9</p>
                                </div>
                            )}
                            <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={e => handleImageFile(e.target.files[0])} />
                        </div>

                        {!form.imagePreview && (
                            <div className="form-group product-cover-url">
                                <label htmlFor="product-image-url">Atau gunakan URL gambar</label>
                                <div>
                                    <LinkIcon size={18} aria-hidden="true" />
                                    <input
                                        id="product-image-url"
                                        type="url"
                                        value={form.imageUrl}
                                        onChange={e => setForm({ ...form, imageUrl: e.target.value, imagePreview: e.target.value })}
                                        placeholder="https://contoh.com/gambar.jpg"
                                    />
                                </div>
                            </div>
                        )}

                        <hr className="product-form-divider" />

                        <h2 className="product-form-step-title"><span>02</span><span>Informasi dasar<small>Identitas, harga, dan detail pelaksanaan produk.</small></span></h2>
                        <div className="modal-form product-info-form">
                            <div className="form-group">
                                <label>Judul Produk *</label>
                                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Masukkan nama produk" />
                            </div>

                            <div className="product-form-grid product-form-grid--two">
                                <div className="form-group">
                                    <label>Kategori</label>
                                    <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                                        {dbCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Badge Label (Opsional)</label>
                                    <input value={form.badge} onChange={e => setForm({ ...form, badge: e.target.value })} placeholder="Contoh: Bestseller, Baru" />
                                </div>
                            </div>

                            <div className="product-form-grid product-form-grid--three">
                                <div className="form-group">
                                    <label>Waktu Mulai (Opsional)</label>
                                    <div className="date-input-wrapper">
                                        <input type="datetime-local" className="form-input date-picker-custom" value={form.startAt} onChange={e => setForm({ ...form, startAt: e.target.value })} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Waktu Selesai (Opsional)</label>
                                    <div className="date-input-wrapper">
                                        <input type="datetime-local" className="form-input date-picker-custom" min={form.startAt} value={form.endAt} onChange={e => setForm({ ...form, endAt: e.target.value })} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Lokasi (Opsional)</label>
                                    <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Contoh: Jakarta Selatan atau Via Zoom" />
                                </div>
                            </div>

                            <div className="product-form-grid product-form-grid--two">
                                <div className="form-group">
                                    <label>Harga Jual *</label>
                                    <div className="product-money-input">
                                        <span>Rp</span>
                                        <input type="text" inputMode="numeric" value={formatNumberWithDots(form.price)} onChange={e => setForm({ ...form, price: parseNumberFromDots(e.target.value) })} placeholder="0" />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <div className="product-form-label-row">
                                        <label>Harga Normal (Membentuk diskon coret)</label>
                                        {discountPercent > 0 && <strong>Hemat {discountPercent}%</strong>}
                                    </div>
                                    <div className="product-money-input">
                                        <span>Rp</span>
                                        <input type="text" inputMode="numeric" value={formatNumberWithDots(form.originalPrice)} onChange={e => setForm({ ...form, originalPrice: parseNumberFromDots(e.target.value) })} placeholder="0" />
                                    </div>
                                </div>
                            </div>

                            <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
                                <label>Deskripsi Singkat (Tampil di Katalog/Card)</label>
                                <textarea rows="2" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Ringkasan produk..." />
                            </div>

                            <div className="form-group">
                                <label>Deskripsi Lengkap (Tampil di Halaman Penjualan)</label>
                                <textarea rows="5" value={form.longDescription} onChange={e => setForm({ ...form, longDescription: e.target.value })} placeholder="Penjelasan detail tentang produk yang meyakinkan pembeli..." />
                            </div>
                        </div>

                        <hr className="product-form-divider" />

                        <h2 className="product-form-step-title"><span>03</span><span>Benefit dan materi<small>Susun nilai yang didapat pembeli dan isi pembelajarannya.</small></span></h2>

                        <div className="product-builder-list">
                            {/* Benefits */}
                            <div className="form-group product-builder-block">
                                <div className="product-builder-heading"><div><label>Benefit produk</label><p>Tambahkan satu manfaat yang jelas pada setiap baris.</p></div><span>{form.benefits.length} item</span></div>
                                <div className="product-builder-input">
                                    <input value={newBenefit} onChange={e => setNewBenefit(e.target.value)} placeholder="Contoh: Akses grup alumni premium" onKeyDown={e => e.key === 'Enter' && saveBenefit()} />
                                    {editingBenefitIndex !== null && <button type="button" className="product-builder-cancel" onClick={cancelBenefitEdit}><X size={17} aria-hidden="true" />Batal</button>}
                                    <button type="button" className="product-builder-add" onClick={saveBenefit}>{editingBenefitIndex === null ? <Plus size={17} aria-hidden="true" /> : <Save size={17} aria-hidden="true" />}{editingBenefitIndex === null ? 'Tambah' : 'Simpan'}</button>
                                </div>
                                {form.benefits.length > 0 && (
                                    <div className="product-added-list">
                                        {form.benefits.map((b, i) => (
                                            <div key={i} className="form-added-item">
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                    <CheckCircle2 size={14} style={{ color: 'var(--color-accent)' }} />
                                                    <span style={{ fontWeight: 500 }}>{b}</span>
                                                </div>
                                                <div className="product-item-actions">
                                                    <button type="button" className="btn-edit" onClick={() => editBenefit(i)} aria-label={`Edit benefit ${i + 1}`} title="Edit benefit">
                                                        <Pencil size={16} aria-hidden="true" />
                                                    </button>
                                                    <button type="button" className="btn-remove" onClick={() => { setForm(prev => ({ ...prev, benefits: prev.benefits.filter((_, idx) => idx !== i) })); cancelBenefitEdit(); }} aria-label={`Hapus benefit ${i + 1}`} title="Hapus benefit">
                                                        <Trash2 size={16} aria-hidden="true" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Materi */}
                            <div className="form-group product-builder-block">
                                <div className="product-builder-heading"><div><label>Materi pembelajaran</label><p>Link dan durasi dapat dikosongkan bila belum tersedia.</p></div><span>{form.materials.length} item</span></div>
                                <div className="product-material-topline">
                                    <input value={newMaterialTitle} onChange={e => setNewMaterialTitle(e.target.value)} placeholder="Judul materi" onKeyDown={e => e.key === 'Enter' && saveMaterial()} />
                                    <input value={newMaterialMeta} onChange={e => setNewMaterialMeta(e.target.value)} placeholder="Durasi, mis. 45 menit" onKeyDown={e => e.key === 'Enter' && saveMaterial()} />
                                </div>
                                <div className="product-material-bottomline">
                                    <div className="product-link-input">
                                        <LinkIcon size={17} aria-hidden="true" />
                                        <input value={newMaterialLink} onChange={e => setNewMaterialLink(e.target.value)} placeholder="Link materi (opsional)" onKeyDown={e => e.key === 'Enter' && saveMaterial()} />
                                    </div>
                                    {editingMaterialIndex !== null && <button type="button" className="product-builder-cancel" onClick={cancelMaterialEdit}><X size={17} aria-hidden="true" />Batal</button>}
                                    <button type="button" className="product-builder-add" onClick={saveMaterial}>{editingMaterialIndex === null ? <Plus size={17} aria-hidden="true" /> : <Save size={17} aria-hidden="true" />}{editingMaterialIndex === null ? 'Tambah' : 'Simpan'}</button>
                                </div>
                                {form.materials.length > 0 && (
                                    <div className="product-added-list">
                                        {form.materials.map((m, i) => (
                                            <div key={i} className="form-added-item">
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                    <span className="item-index">{String(i + 1).padStart(2, '0')}</span>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                            <span style={{ fontWeight: 600 }}>{m.title}</span>
                                                            {m.duration && (
                                                                <span style={{ color: 'var(--color-accent)', fontSize: '16px', padding: '1px 6px', background: 'var(--color-accent-dim)', borderRadius: 4, fontWeight: 700 }}>{m.duration}</span>
                                                            )}
                                                        </div>
                                                        {m.link && (
                                                            <span style={{ fontSize: '16px', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                                <LinkIcon size={10} /> {m.link}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="product-item-actions">
                                                    <button type="button" className="btn-edit" onClick={() => editMaterial(i)} aria-label={`Edit materi ${i + 1}`} title="Edit materi">
                                                        <Pencil size={16} aria-hidden="true" />
                                                    </button>
                                                    <button type="button" className="btn-remove" onClick={() => { setForm(prev => ({ ...prev, materials: prev.materials.filter((_, idx) => idx !== i) })); cancelMaterialEdit(); }} aria-label={`Hapus materi ${i + 1}`} title="Hapus materi">
                                                        <Trash2 size={16} aria-hidden="true" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="product-form-actions">
                            <button disabled={processing} className="btn-modal-cancel" onClick={() => router.get(route('admin.products.index'))}>Batal</button>
                            <button disabled={processing} className="product-save-button" onClick={handleSave}>
                                <Save size={18} aria-hidden="true" />
                                {processing ? 'Menyimpan...' : (isEdit ? 'Simpan Perubahan' : 'Buat Produk Baru')}
                            </button>
                        </div>
                    </div>
            </main>
        </AdminLayout>
    );
}
