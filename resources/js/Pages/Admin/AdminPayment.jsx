import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Plus, CreditCard, Pencil, Trash2, X, ToggleLeft, ToggleRight, QrCode, Banknote, Eye, Shield, Landmark } from 'lucide-react';
import AdminLayout from '../../Layouts/AdminLayout';
import toast from 'react-hot-toast';
import './Admin.css';

export default function AdminPayment({ dbBanks = [] }) {
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingBank, setEditingBank] = useState(null);
    const [selectedBank, setSelectedBank] = useState(null);
    const [form, setForm] = useState({ bank_name: '', account_holder: '', account_number: '' });
    const manualBanks = dbBanks.filter(method => method.type === 'bank_transfer');
    const gateway = dbBanks.find(method => method.type === 'midtrans');

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

    return (
        <AdminLayout>
            <Head title="Pengaturan Pembayaran - JAGGAD ACADEMY" />
            <div className="admin-page">
                <div className="admin-page-header">
                    <h1>Pengaturan Pembayaran</h1>
                    <p className="admin-page-subtitle">Kelola metode pembayaran dan rekening bank untuk transaksi pelanggan</p>
                </div>

                <div className="payment-admin-grid">
                    {/* Manual Transfer */}
                    <div className="admin-table-card payment-admin-card">
                        <div className="admin-table-header">
                            <div className="payment-admin-heading">
                                <span className="payment-admin-icon"><Banknote size={20} /></span>
                                <div>
                                    <h3>Transfer bank manual</h3>
                                    <p>Pelanggan mengirim bukti untuk diverifikasi admin.</p>
                                </div>
                            </div>
                            <button className="btn-icon edit" aria-label="Tambah rekening" onClick={() => { setForm({ bank_name: '', account_holder: '', account_number: '' }); setEditingBank(null); setIsAddOpen(true); }}><Plus size={18} /></button>
                        </div>
                        <div className="admin-table-wrap">
                            <table className="admin-table">
                                <thead>
                                    <tr><th>Bank</th><th>No. Rekening</th><th>Status</th><th>Aksi</th></tr>
                                </thead>
                                <tbody>
                                    {manualBanks.map(b => {
                                        const isActive = b.status == 1 || b.status === true;
                                        return (
                                        <tr key={b.id}>
                                            <td>
                                                <div className="payment-bank-name">{b.bank_name}</div>
                                                <div className="payment-bank-holder">{b.account_name}</div>
                                            </td>
                                            <td className="trx-id">{b.account_number}</td>
                                            <td>
                                                <button className={`payment-status-toggle${isActive ? ' active' : ''}`} onClick={() => toggleBank(b.slug)} aria-label={`${isActive ? 'Nonaktifkan' : 'Aktifkan'} ${b.bank_name}`}>
                                                    {isActive ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                                                </button>
                                            </td>
                                            <td>
                                                <div className="actions-col">
                                                    <button className="btn-icon" onClick={() => setSelectedBank(b)} title="Lihat Detail"><Eye size={15} /></button>
                                                    <button className="btn-icon edit" onClick={() => openEdit(b)}><Pencil size={15} /></button>
                                                    <button className="btn-icon delete" onClick={() => deleteBank(b.slug)}><Trash2 size={14} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    )})}
                                    {manualBanks.length === 0 && <tr><td colSpan="4"><div className="payment-admin-empty"><Banknote size={24} /><span>Belum ada rekening transfer.</span></div></td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Automatic Gateway */}
                    <div className="admin-table-card payment-admin-card payment-gateway-card">
                        <div className="admin-table-header">
                            <div className="payment-admin-heading">
                                <span className="payment-admin-icon payment-admin-icon--gateway"><QrCode size={20} /></span>
                                <div>
                                    <h3>Midtrans Payment Gateway</h3>
                                    <p>QRIS, Virtual Account, dan kartu.</p>
                                </div>
                            </div>
                            {gateway && <button className={`status-badge ${gateway.status ? 'success' : 'warning'}`} onClick={() => toggleBank(gateway.slug)}>{gateway.status ? 'Aktif' : 'Maintenance'}</button>}
                        </div>
                        <div className="payment-gateway-body">
                            <div className="payment-gateway-note">
                                <Shield size={20} aria-hidden="true" />
                                <p>
                                    {gateway?.status ? 'Midtrans aktif dan pembayaran diverifikasi otomatis.' : 'Midtrans tetap tersimpan, tetapi tidak dapat dipilih pelanggan sampai credential lengkap dan status diaktifkan.'}
                                </p>
                            </div>
                            <button className="btn-auth w-full" onClick={() => router.get(route('admin.settings.index'))}>
                                Kelola API Key & Credentials
                            </button>
                        </div>
                    </div>
                </div>

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

                {/* Bank Detail Modal */}
                {selectedBank && (
                    <div className="modal-overlay" onClick={() => setSelectedBank(null)}>
                        <div className="modal modal-detail" onClick={e => e.stopPropagation()}>
                            <div className="modal-detail-header" style={{ borderColor: 'var(--color-border)' }}>
                                <div style={{ 
                                    width: 56, 
                                    height: 56, 
                                    borderRadius: 'var(--radius-md)', 
                                    background: 'var(--color-accent-dim)', 
                                    color: 'var(--color-accent-light)',
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    flexShrink: 0
                                }}>
                                    <Landmark size={28} />
                                </div>
                                <div style={{ marginLeft: 'var(--space-4)' }}>
                                    <p className="modal-detail-id">METODE PEMBAYARAN</p>
                                    <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--color-text-primary)' }}>{selectedBank.bank_name}</h3>
                                    <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 4 }}>
                                        <span className={`status-badge ${(selectedBank.status == 1 || selectedBank.status === true) ? 'success' : 'error'}`} style={{ fontSize: 'var(--text-xs)' }}>
                                            {(selectedBank.status == 1 || selectedBank.status === true) ? 'Aktif' : 'Nonaktif'}
                                        </span>
                                    </div>
                                </div>
                                <button className="btn-icon" onClick={() => setSelectedBank(null)} style={{ marginLeft: 'auto' }}><X size={20} /></button>
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
            </div>
        </AdminLayout>
    );
}
