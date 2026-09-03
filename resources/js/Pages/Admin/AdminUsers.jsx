import { useEffect, useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import { Ban, Calendar, Eye, LoaderCircle, Lock, Mail, Pencil, Phone, Plus, Search, Shield, ShoppingBag, Trash2, UserRound, X } from 'lucide-react';
import { formatCurrency } from '../../Utils/helpers';
import AdminLayout from '../../Layouts/AdminLayout';
import toast from 'react-hot-toast';
import './Admin.css';

export default function AdminUsers({ dbUsers = [] }) {
    const [search, setSearch] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [pendingAction, setPendingAction] = useState(null);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        name: '',
        email: '',
        password: '',
        phone: '',
        role: 'customer',
        status: 'Aktif'
    });

    const users = dbUsers.map(user => ({
        id: user.id,
        slug: user.slug,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        joined: new Date(user.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
        purchases: Number(user.purchase_count || 0),
        totalSpent: Number(user.total_spent || 0),
        role: user.role || 'customer',
        status: ['aktif', 'active'].includes(String(user.status || 'Aktif').toLowerCase()) ? 'Aktif' : 'Nonaktif'
    }));
    const query = search.trim().toLowerCase();
    const filtered = users.filter(user => [user.name, user.email, user.phone].some(value => value.toLowerCase().includes(query)));
    const activeUsers = users.filter(user => user.status === 'Aktif').length;
    const adminUsers = users.filter(user => user.role === 'admin').length;

    useEffect(() => {
        if (!isFormModalOpen && !selectedUser && !deleteConfirm) return undefined;

        const previousOverflow = document.body.style.overflow;
        const previousFocus = document.activeElement;
        const dialog = document.querySelector('.modal[role="dialog"]');
        const focusableSelector = 'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';
        const focusableElements = () => [...dialog.querySelectorAll(focusableSelector)];
        const handleDialogKeys = event => {
            if (event.key === 'Escape') {
                setIsFormModalOpen(false);
                setSelectedUser(null);
                setDeleteConfirm(null);
                return;
            }
            if (event.key !== 'Tab') return;

            const elements = focusableElements();
            const first = elements[0];
            const last = elements[elements.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };
        document.body.style.overflow = 'hidden';
        dialog.querySelector(focusableSelector)?.focus();
        document.addEventListener('keydown', handleDialogKeys);

        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener('keydown', handleDialogKeys);
            if (previousFocus?.isConnected) previousFocus.focus();
        };
    }, [isFormModalOpen, selectedUser, deleteConfirm]);

    const closeFormModal = () => {
        setIsFormModalOpen(false);
        setEditingUser(null);
        reset();
        clearErrors();
    };

    const openAddModal = () => {
        reset();
        clearErrors();
        setEditingUser(null);
        setIsFormModalOpen(true);
    };

    const openEditModal = user => {
        setEditingUser(user);
        setData({ name: user.name, email: user.email, password: '', phone: user.phone, role: user.role, status: user.status });
        clearErrors();
        setIsFormModalOpen(true);
    };

    const handleSubmit = event => {
        event.preventDefault();
        const request = editingUser ? put : post;
        const target = editingUser ? route('admin.users.update', editingUser.slug) : route('admin.users.store');

        request(target, {
            preserveScroll: true,
            onSuccess: () => {
                closeFormModal();
                toast.success(editingUser ? 'Pengguna berhasil diperbarui' : 'Pengguna berhasil ditambahkan');
            },
            onError: error => toast.error(Object.values(error)[0] || 'Pengguna gagal disimpan')
        });
    };

    const handleToggleStatus = slug => {
        const actionKey = `status:${slug}`;
        setPendingAction(actionKey);
        router.patch(route('admin.users.toggle', slug), {}, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Status pengguna diperbarui');
                setSelectedUser(current => current?.slug === slug
                    ? { ...current, status: current.status === 'Aktif' ? 'Nonaktif' : 'Aktif' }
                    : current);
            },
            onError: () => toast.error('Status pengguna gagal diperbarui'),
            onFinish: () => setPendingAction(null)
        });
    };

    const handleDelete = () => {
        setPendingAction(`delete:${deleteConfirm.slug}`);
        router.delete(route('admin.users.destroy', deleteConfirm.slug), {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteConfirm(null);
                toast.success('Pengguna berhasil dihapus');
            },
            onError: error => toast.error(error.message || 'Pengguna gagal dihapus'),
            onFinish: () => setPendingAction(null)
        });
    };

    return (
        <AdminLayout>
            <Head title="Manajemen Pengguna - JAGGAD ACADEMY" />
            <main className="admin-page products-page users-page">
                <header className="products-header">
                    <div>
                        <h1>Pengguna</h1>
                        <p>Kelola akses akun dan pantau aktivitas pelanggan dalam satu tempat.</p>
                    </div>
                    <button type="button" className="products-primary" onClick={openAddModal}>
                        <Plus size={18} aria-hidden="true" />
                        Tambah pengguna
                    </button>
                </header>

                <section className="products-summary" aria-label="Ringkasan pengguna">
                    <div><strong>{users.length}</strong><span>Total pengguna</span></div>
                    <div><strong>{activeUsers}</strong><span>Akun aktif</span></div>
                    <div><strong>{adminUsers}</strong><span>Administrator</span></div>
                </section>

                <section className="products-list" aria-labelledby="users-list-title">
                    <div className="products-toolbar">
                        <div>
                            <h2 id="users-list-title">Daftar pengguna</h2>
                            <p>{filtered.length} dari {users.length} pengguna ditampilkan</p>
                        </div>
                        <label className="products-search users-search">
                            <span className="sr-only">Cari pengguna</span>
                            <Search size={18} aria-hidden="true" />
                            <input
                                type="search"
                                placeholder="Cari pengguna"
                                value={search}
                                onChange={event => setSearch(event.target.value)}
                            />
                        </label>
                    </div>

                    <div className="admin-table-wrap">
                        <table className="admin-table products-table users-table">
                            <thead>
                                <tr><th>Pengguna</th><th>Peran</th><th>Bergabung</th><th>Aktivitas</th><th>Status</th><th>Aksi</th></tr>
                            </thead>
                            <tbody>
                                {filtered.map(user => (
                                    <tr key={user.id}>
                                        <td data-label="Pengguna">
                                            <div className="user-cell">
                                                <div className="user-avatar" aria-hidden="true">{user.name.charAt(0).toUpperCase()}</div>
                                                <div>
                                                    <strong>{user.name}</strong>
                                                    <span>{user.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td data-label="Peran"><span className={`user-role ${user.role === 'admin' ? 'admin' : ''}`}>{user.role === 'admin' ? 'Administrator' : 'Pelanggan'}</span></td>
                                        <td data-label="Bergabung"><time className="user-joined">{user.joined}</time></td>
                                        <td data-label="Aktivitas">
                                            <div className="user-purchases">
                                                <strong>{user.purchases.toLocaleString('id-ID')} produk</strong>
                                                <span>{formatCurrency(user.totalSpent)}</span>
                                            </div>
                                        </td>
                                        <td data-label="Status"><span className={`status-badge ${user.status === 'Aktif' ? 'success' : 'error'}`}>{user.status}</span></td>
                                        <td data-label="Aksi">
                                            <div className="user-actions">
                                                <button type="button" className="user-action" onClick={() => setSelectedUser(user)} aria-label={`Lihat detail ${user.name}`} title="Lihat detail">
                                                    <Eye size={17} aria-hidden="true" />
                                                </button>
                                                <button type="button" className="user-action user-action-edit" onClick={() => openEditModal(user)} aria-label={`Edit ${user.name}`} title="Edit pengguna">
                                                    <Pencil size={16} aria-hidden="true" />
                                                </button>
                                                <button type="button" className="user-action user-action-status" onClick={() => handleToggleStatus(user.slug)} disabled={Boolean(pendingAction)} aria-label={pendingAction === `status:${user.slug}` ? `Memproses status ${user.name}` : `${user.status === 'Aktif' ? 'Nonaktifkan' : 'Aktifkan'} ${user.name}`} title={user.status === 'Aktif' ? 'Nonaktifkan akun' : 'Aktifkan akun'}>
                                                    {pendingAction === `status:${user.slug}` ? <LoaderCircle className="users-spinner" size={17} aria-hidden="true" /> : <Ban size={17} aria-hidden="true" />}
                                                </button>
                                                <button type="button" className="user-action user-action-delete" onClick={() => setDeleteConfirm(user)} disabled={Boolean(pendingAction)} aria-label={`Hapus ${user.name}`} title="Hapus pengguna">
                                                    <Trash2 size={17} aria-hidden="true" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && (
                                    <tr>
                                        <td colSpan="6">
                                            <div className="products-empty">
                                                <UserRound size={30} aria-hidden="true" />
                                                <h3>Pengguna tidak ditemukan</h3>
                                                <p>Coba kata kunci lain atau tambahkan pengguna baru.</p>
                                                {query && <button type="button" onClick={() => setSearch('')}>Reset pencarian</button>}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="products-list-footer">Menampilkan {filtered.length} pengguna</div>
                </section>

                {isFormModalOpen && (
                    <div className="modal-overlay" onClick={closeFormModal}>
                        <div className="modal categories-modal users-form-modal" role="dialog" aria-modal="true" aria-labelledby="user-form-title" onClick={event => event.stopPropagation()}>
                            <div className="categories-modal-header">
                                <div>
                                    <h2 id="user-form-title">{editingUser ? 'Edit pengguna' : 'Tambah pengguna'}</h2>
                                    <p>{editingUser ? 'Perbarui profil, akses, atau status akun.' : 'Buat akun baru untuk pelanggan atau administrator.'}</p>
                                </div>
                                <button type="button" className="categories-close" onClick={closeFormModal} aria-label="Tutup form">
                                    <X size={20} aria-hidden="true" />
                                </button>
                            </div>

                            <form className="categories-form users-form" onSubmit={handleSubmit}>
                                <div className="categories-form-grid">
                                    <div className="form-group">
                                        <label htmlFor="user-name">Nama lengkap</label>
                                        <input id="user-name" value={data.name} onChange={event => setData('name', event.target.value)} placeholder="Masukkan nama lengkap" required aria-invalid={Boolean(errors.name)} />
                                        {errors.name && <span className="categories-error">{errors.name}</span>}
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="user-email">Email</label>
                                        <input id="user-email" type="email" value={data.email} onChange={event => setData('email', event.target.value)} placeholder="nama@email.com" required aria-invalid={Boolean(errors.email)} />
                                        {errors.email && <span className="categories-error">{errors.email}</span>}
                                    </div>
                                </div>

                                <div className="categories-form-grid">
                                    <div className="form-group">
                                        <label htmlFor="user-password">Password {editingUser && <span className="users-optional">Opsional</span>}</label>
                                        <div className="users-password-field">
                                            <input id="user-password" type="password" value={data.password} onChange={event => setData('password', event.target.value)} placeholder={editingUser ? 'Isi untuk mengganti password' : 'Minimal 8 karakter'} required={!editingUser} aria-invalid={Boolean(errors.password)} />
                                            <Lock size={17} aria-hidden="true" />
                                        </div>
                                        {errors.password && <span className="categories-error">{errors.password}</span>}
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="user-phone">No. WhatsApp / HP</label>
                                        <input id="user-phone" type="tel" value={data.phone} onChange={event => setData('phone', event.target.value)} placeholder="0812xxxxxxxx" aria-invalid={Boolean(errors.phone)} />
                                        {errors.phone && <span className="categories-error">{errors.phone}</span>}
                                    </div>
                                </div>

                                <div className="categories-form-grid">
                                    <div className="form-group">
                                        <label htmlFor="user-role">Peran</label>
                                        <select id="user-role" value={data.role} onChange={event => setData('role', event.target.value)}>
                                            <option value="customer">Pelanggan</option>
                                            <option value="admin">Administrator</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="user-status">Status akun</label>
                                        <select id="user-status" value={data.status} onChange={event => setData('status', event.target.value)}>
                                            <option value="Aktif">Aktif</option>
                                            <option value="Nonaktif">Nonaktif</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="modal-actions categories-modal-actions">
                                    <button type="button" className="btn-modal-cancel" onClick={closeFormModal}>Batal</button>
                                    <button type="submit" className="btn-modal-save" disabled={processing}>
                                        {processing ? 'Menyimpan...' : editingUser ? 'Simpan perubahan' : 'Tambah pengguna'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {selectedUser && (
                    <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
                        <div className="modal users-detail-modal" role="dialog" aria-modal="true" aria-labelledby="user-detail-title" onClick={event => event.stopPropagation()}>
                            <div className="users-detail-header">
                                <div className="user-avatar users-detail-avatar" aria-hidden="true">{selectedUser.name.charAt(0).toUpperCase()}</div>
                                <div>
                                    <h2 id="user-detail-title">{selectedUser.name}</h2>
                                    <p>Pengguna #{selectedUser.id.toString().padStart(4, '0')}</p>
                                    <div className="users-detail-badges">
                                        <span className={`status-badge ${selectedUser.status === 'Aktif' ? 'success' : 'error'}`}>{selectedUser.status}</span>
                                        <span className={`user-role ${selectedUser.role === 'admin' ? 'admin' : ''}`}>{selectedUser.role === 'admin' ? 'Administrator' : 'Pelanggan'}</span>
                                    </div>
                                </div>
                                <button type="button" className="categories-close" onClick={() => setSelectedUser(null)} aria-label="Tutup detail">
                                    <X size={20} aria-hidden="true" />
                                </button>
                            </div>

                            <div className="users-detail-body">
                                <section aria-labelledby="user-contact-title">
                                    <h3 id="user-contact-title"><Mail size={18} aria-hidden="true" /> Informasi kontak</h3>
                                    <dl className="users-detail-list">
                                        <div><dt><Mail size={17} aria-hidden="true" /> Email</dt><dd>{selectedUser.email}</dd></div>
                                        <div><dt><Phone size={17} aria-hidden="true" /> No. telepon</dt><dd>{selectedUser.phone || 'Belum diisi'}</dd></div>
                                        <div><dt><Calendar size={17} aria-hidden="true" /> Bergabung</dt><dd>{selectedUser.joined}</dd></div>
                                    </dl>
                                </section>
                                <section aria-labelledby="user-activity-title">
                                    <h3 id="user-activity-title"><ShoppingBag size={18} aria-hidden="true" /> Aktivitas pembelian</h3>
                                    <div className="users-detail-metrics">
                                        <div><strong>{selectedUser.purchases.toLocaleString('id-ID')}</strong><span>Produk dibeli</span></div>
                                        <div><strong>{formatCurrency(selectedUser.totalSpent)}</strong><span>Total belanja</span></div>
                                    </div>
                                </section>
                            </div>

                            <div className="users-detail-actions">
                                <button type="button" className="btn-modal-cancel" onClick={() => { setSelectedUser(null); openEditModal(selectedUser); }}>
                                    <Pencil size={16} aria-hidden="true" /> Edit pengguna
                                </button>
                                <button type="button" className={`users-toggle-button ${selectedUser.status !== 'Aktif' ? 'activate' : ''}`} onClick={() => handleToggleStatus(selectedUser.slug)} disabled={Boolean(pendingAction)}>
                                    {pendingAction === `status:${selectedUser.slug}` ? <LoaderCircle className="users-spinner" size={17} aria-hidden="true" /> : <Shield size={17} aria-hidden="true" />}
                                    {pendingAction === `status:${selectedUser.slug}` ? 'Memproses...' : selectedUser.status === 'Aktif' ? 'Nonaktifkan akun' : 'Aktifkan akun'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {deleteConfirm && (
                    <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
                        <div className="modal products-delete-modal" role="dialog" aria-modal="true" aria-labelledby="delete-user-title" onClick={event => event.stopPropagation()}>
                            <div className="products-delete-icon"><Trash2 size={24} aria-hidden="true" /></div>
                            <h3 id="delete-user-title" className="modal-title">Hapus pengguna?</h3>
                            <p><strong>{deleteConfirm.name}</strong> akan dihapus permanen beserta akses akunnya. Tindakan ini tidak dapat dibatalkan.</p>
                            <div className="modal-actions">
                                <button type="button" className="btn-modal-cancel" onClick={() => setDeleteConfirm(null)}>Batal</button>
                                <button type="button" className="products-delete-confirm" onClick={handleDelete} disabled={pendingAction === `delete:${deleteConfirm.slug}`}>
                                    {pendingAction === `delete:${deleteConfirm.slug}` ? 'Menghapus...' : 'Hapus pengguna'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </AdminLayout>
    );
}
