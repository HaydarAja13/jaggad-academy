import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Plus, CreditCard, Pencil, Trash2, X, ToggleLeft, ToggleRight, QrCode, Banknote, Eye, Shield, Landmark, Search, Settings } from 'lucide-react';
import AdminLayout from '../../Layouts/AdminLayout';
import toast from 'react-hot-toast';
import './Admin.css';

export default function AdminPayment({ dbBanks = [] }) {
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingBank, setEditingBank] = useState(null);
    const [selectedBank, setSelectedBank] = useState(null);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('Semua');
    const [form, setForm] = useState({ bank_name: '', account_holder: '', account_number: '' });
    const manualBanks = dbBanks.filter(method => method.type === 'bank_transfer');
    const gateway = dbBanks.find(method => method.type === 'midtrans');

    const activeBanks = manualBanks.filter(b => b.status == 1 || b.status === true).length;

    const showError = errors => toast.error(Object.values(errors || {})[0] || 'Permintaan tidak dapat diproses.');

    const toggleBank = (slug) => {
        router.patch(route('admin.payment.toggle', slug), {}, {
            preserveScroll: true,
            onSuccess: () => toast.success('Status metode pembayaran berhasil diubah'),
            onError: showError,
        });
    };

    const handleSave = () => {
        if (!form.bank_name || !form.account_number || !form.account_holder) return toast.error('Lengkapi data bank');

        if (editingBank) {
            router.put(route('admin.payment.update', editingBank.slug), form, {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Bank berhasil diperbarui');
                    setIsAddOpen(false);
                    setEditingBank(null);
                },
                onError: showError,
            });
        } else {
            router.post(route('admin.payment.store'), form, {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Rekening baru ditambahkan');
                    setIsAddOpen(false);
                },
                onError: showError,
            });
        }
    };

    const deleteBank = (slug) => {
        if (confirm('Hapus rekening ini?')) {
            router.delete(route('admin.payment.destroy', slug), {
                preserveScroll: true,
                onSuccess: () => toast.success('Rekening dihapus'),
                onError: showError,
            });
        }
    };

    const openEdit = (b) => {
        setEditingBank(b);
        setForm({ bank_name: b.bank_name, account_holder: b.account_name, account_number: b.account_number });
        setIsAddOpen(true);
    };

    const query = search.trim().toLowerCase();
    const filtered = manualBanks.filter(b => {
        const matchSearch = !query || [b.bank_name, b.account_name, b.account_number].some(value => value.toLowerCase().includes(query));
        const matchFilter = statusFilter === 'Semua'
            || (statusFilter === 'Aktif' && (b.status == 1 || b.status === true))
            || (statusFilter === 'Nonaktif' && !(b.status == 1 || b.status === true));
        return matchSearch && matchFilter;
    });

    const statusCounts = {
        Semua: manualBanks.length,
        Aktif: activeBanks,
        Nonaktif: manualBanks.length - activeBanks,
    };
    const hasFilters = query || statusFilter !== 'Semua';

    return (
        <AdminLayout>
            <Head title="Pengaturan Pembayaran - JAGGAD ACADEMY" />
            <main className="admin-page payment-page">
                <header className="payment-header">
                    <div>
                        <h1>Metode Pembayaran</h1>
                        <p>Kelola rekening bank manual dan payment gateway untuk transaksi pelanggan.</p>
                    </div>
                    <button type="button" className="products-primary" onClick={() => { setForm({ bank_name: '', account_holder: '', account_number: '' }); setEditingBank(null); setIsAddOpen(true); }}>
                        <Plus size={18} aria-hidden="true" />
                        Tambah rekening
                    </button>
                </header>

                <section className="products-summary" aria-label="Ringkasan metode pembayaran">
                    <div>
                        <strong>{manualBanks.length}</strong>
                        <span>Total rekening</span>
                    </div>
                    <div>
                        <strong>{activeBanks}</strong>
                        <span>Aktif digunakan</span>
                    </div>
                    <div>
                        <strong>{gateway?.status ? 'Aktif' : 'Nonaktif'}</strong>
                        <span>Status gateway</span>
                    </div>
                </section>

                <section className="payment-methods" aria-labelledby="payment-methods-title">
                    <div className="products-toolbar">
                        <div>
                            <h2 id="payment-methods-title">Transfer bank manual</h2>
                            <p>{filtered.length} dari {manualBanks.length} rekening ditampilkan</p>
                        </div>
                        <div className="products-filters">
                            <label className="products-search">
                                <span className="sr-only">Cari rekening</span>
                                <Search size={18} aria-hidden="true" />
                                <input
                                    type="search"
                                    placeholder="Cari nama bank, pemilik, atau nomor rekening"
                                    value={search}
                                    onChange={event => setSearch(event.target.value)}
                                />
                            </label>
                            <label className="products-select">
                                <span className="sr-only">Filter status</span>
                                <select value={statusFilter} onChange={event => setStatusFilter(event.target.value)}>
                                    <option value="Semua">Semua status</option>
                                    <option value="Aktif">Aktif</option>
                                    <option value="Nonaktif">Nonaktif</option>
                                </select>
                            </label>
                        </div>
                    </div>
                    <div className="admin-table-wrap">
                        <table className="admin-table products-table payment-table">
                            <thead>
                                <tr>
                                    <th>Rekening</th>
                                    <th>No. Rekening</th>
                                    <th>Status</th>
                                    <th>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(b => {
                                    const isActive = b.status == 1 || b.status === true;
                                    return (
                                        <tr key={b.id}>
                                            <td data-label="Rekening">
                                                <div className="payment-bank-cell">
                                                    <div className="payment-bank-icon" aria-hidden="true"><Landmark size={20} /></div>
                                                    <div>
                                                        <strong>{b.bank_name}</strong>
                                                        <span>{b.account_name}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td data-label="No. Rekening"><span className="trx-id">{b.account_number}</span></td>
                                            <td data-label="Status">
                                                <button className={`payment-status-toggle${isActive ? ' active' : ''}`} onClick={() => toggleBank(b.slug)} aria-label={`${isActive ? 'Nonaktifkan' : 'Aktifkan'} ${b.bank_name}`}>
                                                    {isActive ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                                                </button>
                                            </td>
                                            <td data-label="Aksi">
                                                <div className="product-actions">
                                                    <button type="button" className="product-edit" onClick={() => setSelectedBank(b)} title="Lihat detail">
                                                        <Eye size={16} aria-hidden="true" />
                                                        Detail
                                                    </button>
                                                    <button type="button" className="product-edit" onClick={() => openEdit(b)}>
                                                        <Pencil size={16} aria-hidden="true" />
                                                        Edit
                                                    </button>
                                                    <button type="button" className="product-delete" onClick={() => deleteBank(b.slug)} aria-label={`Hapus ${b.bank_name}`}>
                                                        <Trash2 size={17} aria-hidden="true" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filtered.length === 0 && (
                                    <tr>
                                        <td colSpan="4">
                                            <div className="products-empty">
                                                <Banknote size={28} aria-hidden="true" />
                                                <h3>{hasFilters ? 'Rekening tidak ditemukan' : 'Belum ada rekening'}</h3>
                                                <p>{hasFilters ? 'Coba ubah kata kunci atau filter status.' : 'Tambahkan rekening bank untuk menerima pembayaran manual.'}</p>
                                                {hasFilters ? (
                                                    <button type="button" onClick={() => { setSearch(''); setStatusFilter('Semua'); }}>Reset filter</button>
                                                ) : (
                                                    <button type="button" onClick={() => { setForm({ bank_name: '', account_holder: '', account_number: '' }); setEditingBank(null); setIsAddOpen(true); }}>Tambah rekening</button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="products-list-footer">
                        Menampilkan {filtered.length} rekening
                    </div>
                </section>

                <section className="payment-gateway-section" aria-labelledby="payment-gateway-title">
                    <div className="payment-gateway-header">
                        <div className="payment-gateway-heading">
                            <span className="payment-admin-icon payment-admin-icon--gateway"><QrCode size={20} /></span>
                            <div>
                                <h2 id="payment-gateway-title">Midtrans Payment Gateway</h2>
                                <p>QRIS, Virtual Account, dan kartu kredit secara otomatis.</p>
                            </div>
                        </div>
                        {gateway && (
                            <button className={`status-badge ${gateway.status ? 'success' : 'warning'}`} onClick={() => toggleBank(gateway.slug)}>
                                {gateway.status ? 'Aktif' : 'Maintenance'}
                            </button>
                        )}
                    </div>
                    <div className="payment-gateway-body">
                        <div className="payment-gateway-note">
                            <Shield size={20} aria-hidden="true" />
                            <p>
                                {gateway?.status
                                    ? 'Midtrans aktif dan pembayaran diverifikasi otomatis.'
                                    : 'Midtrans tetap tersimpan, tetapi tidak dapat dipilih pelanggan sampai credential lengkap dan status diaktifkan.'}
                            </p>
                        </div>
                        <button className="btn-gateway-settings" onClick={() => router.get(route('admin.settings.index'))}>
                            <Settings size={18} aria-hidden="true" />
                            Kelola API Key & Credentials
                        </button>
                    </div>
                </section>

                {isAddOpen && (
                    <div className="modal-overlay" onClick={() => setIsAddOpen(false)}>
                        <div className="modal" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3 className="modal-title">{editingBank ? 'Edit Rekening' : 'Tambah Rekening'}</h3>
                                <button className="btn-icon" onClick={() => setIsAddOpen(false)}><X size={20} /></button>
                            </div>
                            <div className="modal-form">
                                <div className="form-group">
                                    <label>Nama Bank</label>
                                    <input value={form.bank_name} onChange={e => setForm({ ...form, bank_name: e.target.value })} placeholder="BCA, Mandiri, BRI, dll" />
                                </div>
                                <div className="form-group">
                                    <label>Nama Pemilik Rekening</label>
                                    <input value={form.account_holder} onChange={e => setForm({ ...form, account_holder: e.target.value })} placeholder="Masukkan nama sesuai buku tabungan" />
                                </div>
                                <div className="form-group">
                                    <label>Nomor Rekening</label>
                                    <input value={form.account_number} onChange={e => setForm({ ...form, account_number: e.target.value })} placeholder="000 - 0000 - 000" />
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button className="btn-modal-cancel" onClick={() => setIsAddOpen(false)}>Batal</button>
                                <button className="btn-modal-save" onClick={handleSave}>Simpan Rekening</button>
                            </div>
                        </div>
                    </div>
                )}

                {selectedBank && (
                    <div className="modal-overlay" onClick={() => setSelectedBank(null)}>
                        <div className="modal modal-detail" onClick={e => e.stopPropagation()}>
                            <div className="modal-detail-header">
                                <div className={`modal-detail-status-icon ${(selectedBank.status == 1 || selectedBank.status === true) ? 'success' : 'error'}`}>
                                    <Landmark size={24} aria-hidden="true" />
                                </div>
                                <div>
                                    <h2 className="modal-detail-id">{selectedBank.bank_name}</h2>
                                    <div className="modal-detail-date">METODE PEMBAYARAN</div>
                                    <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 4 }}>
                                        <span className={`status-badge ${(selectedBank.status == 1 || selectedBank.status === true) ? 'success' : 'error'}`} style={{ fontSize: 'var(--text-xs)' }}>
                                            {(selectedBank.status == 1 || selectedBank.status === true) ? 'Aktif' : 'Nonaktif'}
                                        </span>
                                    </div>
                                </div>
                                <button className="btn-icon modal-detail-close" onClick={() => setSelectedBank(null)} aria-label="Tutup detail"><X size={22} aria-hidden="true" /></button>
                            </div>

                            <div className="modal-detail-body">
                                <div className="detail-section-block">
                                    <div className="detail-section-label"><CreditCard size={14} /> Informasi Rekening</div>
                                    <div className="detail-grid">
                                        <div style={{ gridColumn: '1 / -1' }}><span>Nama Pemilik</span><strong>{selectedBank.account_name}</strong></div>
                                        <div><span>Nomor Rekening</span><strong className="trx-id" style={{ fontSize: 'var(--text-base)' }}>{selectedBank.account_number}</strong></div>
                                        <div><span>Status</span><strong>{(selectedBank.status == 1 || selectedBank.status === true) ? 'Bisa Digunakan' : 'Sedang Ditangguhkan'}</strong></div>
                                    </div>
                                </div>

                                <div className="detail-section-block">
                                    <div className="detail-section-label"><Shield size={14} /> Panduan Keamanan</div>
                                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                                        Gunakan rekening ini sebagai tujuan transfer manual pelanggan. Pastikan nama pemilik rekening sesuai dengan yang terdaftar untuk memudahkan verifikasi bukti pembayaran oleh tim Admin.
                                    </p>
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button className="btn-modal-cancel" style={{ flex: 1 }} onClick={() => setSelectedBank(null)}>Tutup</button>
                                <button className="btn-modal-save" style={{ flex: 1 }} onClick={() => {
                                    openEdit(selectedBank);
                                    setSelectedBank(null);
                                }}>
                                    Ubah Data
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </AdminLayout>
    );
}
