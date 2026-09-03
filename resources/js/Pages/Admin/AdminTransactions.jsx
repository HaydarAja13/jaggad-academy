import { useEffect, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Search, Eye, CheckCircle, XCircle, Clock, Download, User, Package, CreditCard, ChevronLeft, ChevronRight, Mail } from 'lucide-react';
import { formatPrice, getStorageUrl } from '../../Utils/helpers';
import AdminLayout from '../../Layouts/AdminLayout';
import toast from 'react-hot-toast';
import './Admin.css';

const statusOptions = [
    { value: 'Semua', label: 'Semua', icon: CreditCard, tone: 'total' },
    { value: 'Berhasil', label: 'Terverifikasi', icon: CheckCircle, tone: 'success' },
    { value: 'Pending', label: 'Menunggu', icon: Clock, tone: 'pending' },
    { value: 'Perlu perbaikan', label: 'Perlu perbaikan', icon: XCircle, tone: 'revision' },
    { value: 'Gagal', label: 'Gagal / batal', icon: XCircle, tone: 'failed' },
];

const statusTone = status => status === 'Berhasil' ? 'success' : status === 'Pending' ? 'warning' : status === 'Perlu perbaikan' ? 'revision' : 'error';

export default function AdminTransactions({ dbTransactions = {} }) {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('Semua');
    const [selectedTrx, setSelectedTrx] = useState(null);
    const [showRejectForm, setShowRejectForm] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [processingAction, setProcessingAction] = useState(false);

    const rawTransactions = dbTransactions.data || [];
    
    const transactions = rawTransactions.map(dbT => ({
        id: dbT.transaction_code,
        dbId: dbT.id,
        customer: dbT.user?.name || 'Pelanggan dihapus',
        email: dbT.user?.email || '',
        products: dbT.items?.map(i => i.product?.name).filter(Boolean) || [],
        amount: dbT.total_amount || 0,
        status: dbT.status === 'success' ? 'Berhasil' : dbT.payment?.status === 'rejected' ? 'Perlu perbaikan' : (dbT.status === 'failed' ? 'Gagal' : 'Pending'),
        rawStatus: dbT.status,
        date: new Date(dbT.created_at).toLocaleDateString('id-ID'),
        payment: dbT.payment_type ? dbT.payment_type.toUpperCase() : (dbT.payment?.payment_method?.bank_name || 'Gateway Pembayaran'),
        proof: getStorageUrl(dbT.payment?.proof_image),
        paymentStatus: dbT.payment?.status,
        rejectionReason: dbT.payment?.rejection_reason,
        payload: dbT.payment_payload ? JSON.parse(dbT.payment_payload) : null,
    }));

    const getProductSummary = products => products.length ? products.join(', ') : 'Produk tidak tersedia';
    const shouldRenderProductList = products => products.length >= 2;

    const filtered = transactions.filter(t => {
        const query = search.trim().toLowerCase();
        const matchSearch = !query || [t.customer, t.email, t.id, getProductSummary(t.products)].some(value => value.toLowerCase().includes(query));
        const matchFilter = statusFilter === 'Semua' || t.status === statusFilter;
        return matchSearch && matchFilter;
    });

    const closeDetail = () => {
        setSelectedTrx(null);
        setShowRejectForm(false);
        setRejectionReason('');
    };

    const handleConfirm = (code) => {
        if (processingAction) return;
        setProcessingAction(true);
        router.patch(route('admin.transactions.approve', code), {}, {
            preserveScroll: true,
            onSuccess: page => {
                toast.success('Pembayaran dikonfirmasi dan akses produk diaktifkan.');
                if (page.props.flash?.email_warning) toast.error(page.props.flash.email_warning);
                closeDetail();
            },
            onError: errors => Object.values(errors).forEach(error => toast.error(error)),
            onFinish: () => setProcessingAction(false),
        });
    };

    const handleReject = (code) => {
        if (rejectionReason.trim().length < 5) return toast.error('Tuliskan alasan penolakan minimal 5 karakter.');
        if (processingAction) return;

        setProcessingAction(true);
        router.patch(route('admin.transactions.reject', code), { reason: rejectionReason.trim() }, {
            preserveScroll: true,
            onSuccess: page => {
                toast.success('Bukti ditolak dan pelanggan dapat mengunggah ulang.');
                if (page.props.flash?.email_warning) toast.error(page.props.flash.email_warning);
                closeDetail();
            },
            onError: errors => Object.values(errors).forEach(error => toast.error(error)),
            onFinish: () => setProcessingAction(false),
        });
    };

    const handleResendEmail = code => {
        if (processingAction) return;
        setProcessingAction(true);
        router.post(route('admin.transactions.resend-email', code), {}, {
            preserveScroll: true,
            onSuccess: () => toast.success('Email akses berhasil dikirim ulang.'),
            onError: errors => Object.values(errors).forEach(error => toast.error(error)),
            onFinish: () => setProcessingAction(false),
        });
    };

    const countBerhasil = transactions.filter(t => t.status === 'Berhasil').length;
    const countPending = transactions.filter(t => t.status === 'Pending').length;
    const countRevision = transactions.filter(t => t.status === 'Perlu perbaikan').length;
    const countGagal = transactions.filter(t => t.status === 'Gagal').length;
    const statusCounts = { Semua: transactions.length, Berhasil: countBerhasil, Pending: countPending, 'Perlu perbaikan': countRevision, Gagal: countGagal };
    const hasFilters = search.trim() || statusFilter !== 'Semua';
    const paginationLinks = dbTransactions.links || [];
    const previousPage = paginationLinks[0];
    const nextPage = paginationLinks[paginationLinks.length - 1];

    useEffect(() => {
        if (!selectedTrx) return undefined;
        const closeOnEscape = event => event.key === 'Escape' && closeDetail();
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', closeOnEscape);
        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener('keydown', closeOnEscape);
        };
    }, [selectedTrx]);

    return (
        <AdminLayout>
            <Head title="Riwayat Transaksi - JAGGAD ACADEMY" />
            <div className="admin-page transactions-page">
                <header className="transactions-header">
                    <div>
                        <h1>Transaksi</h1>
                        <p>Pantau pembayaran pelanggan dan tangani transaksi yang membutuhkan verifikasi.</p>
                    </div>
                    <a href={route('admin.transactions.export')} className="transactions-export"><Download size={20} aria-hidden="true" /> Ekspor CSV</a>
                </header>

                <section className="transactions-summary" aria-label="Ringkasan transaksi pada halaman ini">
                    <div className="transactions-summary__intro">
                        <strong>{dbTransactions.total || 0}</strong>
                        <span>Total transaksi</span>
                        <small>Menampilkan {dbTransactions.from || 0}–{dbTransactions.to || 0} pada halaman ini</small>
                    </div>
                    <div className="transactions-status-tabs">
                        {statusOptions.map(({ value, label, icon: Icon, tone }) => (
                            <button type="button" key={value} className={`${tone} ${statusFilter === value ? 'active' : ''}`} aria-pressed={statusFilter === value} onClick={() => setStatusFilter(value)}>
                                <Icon size={20} aria-hidden="true" />
                                <span>{label}</span>
                                <strong>{statusCounts[value]}</strong>
                            </button>
                        ))}
                    </div>
                </section>

                <section className="transactions-list" aria-labelledby="transactions-list-title">
                    <div className="transactions-toolbar">
                        <div>
                            <h2 id="transactions-list-title">Daftar transaksi</h2>
                            <p>{filtered.length} hasil pada halaman ini</p>
                        </div>
                        <div className="transactions-filters">
                            <label className="transactions-search">
                                <span className="sr-only">Cari transaksi</span>
                                <Search size={20} aria-hidden="true" />
                                <input type="search" placeholder="Cari ID, pelanggan, email, atau produk" value={search} onChange={event => setSearch(event.target.value)} />
                            </label>
                            <label className="transactions-select">
                                <span className="sr-only">Filter status</span>
                                <select value={statusFilter} onChange={event => setStatusFilter(event.target.value)}>
                                    {statusOptions.map(option => <option value={option.value} key={option.value}>{option.label}</option>)}
                                </select>
                            </label>
                        </div>
                    </div>
                    <div className="admin-table-wrap">
                        <table className="admin-table transactions-table">
                            <thead>
                                <tr><th>Transaksi</th><th>Pelanggan</th><th>Produk</th><th>Total</th><th>Status</th><th><span className="sr-only">Aksi</span></th></tr>
                            </thead>
                            <tbody>
                                {filtered.length > 0 ? filtered.map(t => (
                                    <tr key={t.id}>
                                        <td data-label="Transaksi">
                                            <strong className="transactions-code">{t.id}</strong>
                                            <time>{t.date}</time>
                                        </td>
                                        <td data-label="Pelanggan"><strong>{t.customer}</strong><span>{t.email || 'Email tidak tersedia'}</span></td>
                                        <td data-label="Produk" className="transactions-product" title={getProductSummary(t.products)}>
                                            {shouldRenderProductList(t.products) ? (
                                                <ol className="transactions-product-list">
                                                    {t.products.map((product, index) => <li key={`${t.id}-${product}-${index}`}>{product}</li>)}
                                                </ol>
                                            ) : (
                                                getProductSummary(t.products)
                                            )}
                                        </td>
                                        <td data-label="Total" className="transactions-amount">{formatPrice(t.amount)}</td>
                                        <td data-label="Status">
                                            <span className={`status-badge ${statusTone(t.status)}`}>
                                                {t.status}
                                            </span>
                                        </td>
                                        <td data-label="Aksi">
                                            <div className="actions-col">
                                                <button className="btn-show" onClick={() => { setSelectedTrx(t); setShowRejectForm(false); setRejectionReason(''); }} aria-label={`Lihat detail transaksi ${t.id}`}>Detail <Eye size={18} aria-hidden="true" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="6">
                                            <div className="transactions-empty">
                                                <Search size={28} aria-hidden="true" />
                                                <h3>{hasFilters ? 'Transaksi tidak ditemukan' : 'Belum ada transaksi'}</h3>
                                                <p>{hasFilters ? 'Coba ubah kata kunci atau filter status.' : 'Transaksi pelanggan akan muncul di sini setelah checkout.'}</p>
                                                {hasFilters && <button type="button" onClick={() => { setSearch(''); setStatusFilter('Semua'); }}>Reset filter</button>}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {dbTransactions.last_page > 1 && (
                        <nav className="transactions-pagination" aria-label="Navigasi halaman transaksi">
                            {previousPage?.url ? <Link href={previousPage.url} preserveScroll><ChevronLeft size={20} aria-hidden="true" /> Sebelumnya</Link> : <span className="disabled"><ChevronLeft size={20} aria-hidden="true" /> Sebelumnya</span>}
                            <span>Halaman <strong>{dbTransactions.current_page}</strong> dari {dbTransactions.last_page}</span>
                            {nextPage?.url ? <Link href={nextPage.url} preserveScroll>Berikutnya <ChevronRight size={20} aria-hidden="true" /></Link> : <span className="disabled">Berikutnya <ChevronRight size={20} aria-hidden="true" /></span>}
                        </nav>
                    )}
                </section>

                {/* Transaction Detail Modal */}
                {selectedTrx && (
                    <div className="modal-overlay" onClick={closeDetail}>
                        <div className="modal modal-detail transaction-detail" role="dialog" aria-modal="true" aria-labelledby="transaction-detail-title" onClick={e => e.stopPropagation()}>
                            <div className="modal-detail-header">
                                <div className={`modal-detail-status-icon ${statusTone(selectedTrx.status)}`}>
                                    {selectedTrx.status === 'Berhasil' ? <CheckCircle size={24} aria-hidden="true" /> : selectedTrx.status === 'Pending' ? <Clock size={24} aria-hidden="true" /> : <XCircle size={24} aria-hidden="true" />}
                                </div>
                                <div>
                                    <h2 id="transaction-detail-title" className="modal-detail-id">{selectedTrx.id}</h2>
                                    <div className="modal-detail-date">{selectedTrx.date} • {selectedTrx.status}</div>
                                </div>
                                <button className="btn-icon modal-detail-close" autoFocus onClick={closeDetail} aria-label="Tutup detail transaksi"><XCircle size={22} aria-hidden="true" /></button>
                            </div>

                            <div className="modal-detail-body">
                                <div className="detail-section-block">
                                    <div className="detail-section-label"><User size={18} aria-hidden="true" /> Informasi pelanggan</div>
                                    <div className="detail-grid">
                                        <div><span>Nama Lengkap</span><strong>{selectedTrx.customer}</strong></div>
                                        <div><span>Email</span><strong>{selectedTrx.email || 'Email tidak tersedia'}</strong></div>
                                    </div>
                                </div>

                                <div className="detail-section-block">
                                    <div className="detail-section-label"><Package size={18} aria-hidden="true" /> Item pembelian</div>
                                    <div className="transaction-detail-product">
                                        {shouldRenderProductList(selectedTrx.products) ? (
                                            <ol className="transactions-product-list transaction-product-list--detail">
                                                {selectedTrx.products.map((product, index) => <li key={`${selectedTrx.id}-${product}-${index}`}>{product}</li>)}
                                            </ol>
                                        ) : (
                                            <strong>{getProductSummary(selectedTrx.products)}</strong>
                                        )}
                                        <strong>{formatPrice(selectedTrx.amount)}</strong>
                                    </div>
                                </div>

                                <div className="detail-section-block">
                                    <div className="detail-section-label"><CreditCard size={18} aria-hidden="true" /> Pembayaran</div>
                                    <div className="detail-grid">
                                        <div><span>Metode</span><strong>{selectedTrx.payment}</strong></div>
                                        <div><span>Jumlah Bayar</span><strong>{formatPrice(selectedTrx.amount)}</strong></div>
                                    </div>

                                    {selectedTrx.payload ? (
                                        <div className="transaction-gateway-info">
                                            <span>Informasi Midtrans</span>
                                            <div className="detail-grid">
                                                <div><span>Tipe Pembayaran</span><strong>{selectedTrx.payload.payment_type?.toUpperCase() || '-'}</strong></div>
                                                <div><span>ID Midtrans</span><strong>{selectedTrx.payload.transaction_id || '-'}</strong></div>
                                                <div><span>Status</span><strong className="transaction-gateway-status">{selectedTrx.payload.transaction_status?.toUpperCase() || '-'}</strong></div>
                                                <div><span>Waktu Bayar</span><strong>{selectedTrx.payload.settlement_time || selectedTrx.payload.transaction_time || '-'}</strong></div>
                                            </div>
                                            {selectedTrx.payload.va_numbers && (
                                                <div className="transaction-va-info">
                                                    <span>Bank VA</span>
                                                    <strong>{selectedTrx.payload.va_numbers[0]?.bank?.toUpperCase()}: {selectedTrx.payload.va_numbers[0]?.va_number}</strong>
                                                </div>
                                            )}
                                        </div>
                                    ) : selectedTrx.proof ? (
                                        <div className="transaction-proof">
                                            <span>Bukti pembayaran manual</span>
                                            <div className="transaction-proof__frame">
                                                <img src={selectedTrx.proof} alt={`Bukti pembayaran ${selectedTrx.id}`} />
                                            </div>
                                            <a href={selectedTrx.proof} target="_blank" rel="noreferrer">Lihat gambar penuh</a>
                                            {selectedTrx.rejectionReason && <div className="transaction-rejection-note"><strong>Alasan penolakan</strong><p>{selectedTrx.rejectionReason}</p></div>}
                                        </div>
                                    ) : (
                                        <div className="transaction-proof-empty">
                                            Menunggu pembayaran otomatis melalui Midtrans.
                                        </div>
                                    )}
                                </div>

                                {showRejectForm && <div className="transaction-reject-form"><label htmlFor="rejection-reason">Alasan bukti tidak valid</label><textarea id="rejection-reason" autoFocus maxLength="500" value={rejectionReason} onChange={event => setRejectionReason(event.target.value)} placeholder="Contoh: nominal pada bukti tidak sesuai dengan total transaksi." /><span>{rejectionReason.length}/500 karakter</span></div>}
                            </div>

                            {selectedTrx.status === 'Pending' && (
                                <div className="modal-actions transaction-detail-actions">
                                    {showRejectForm ? <><button className="btn-modal-cancel" disabled={processingAction} onClick={() => { setShowRejectForm(false); setRejectionReason(''); }}>Batal</button><button className="btn-modal-save transaction-reject" disabled={processingAction} onClick={() => handleReject(selectedTrx.id)}>{processingAction ? 'Mengirim…' : 'Kirim penolakan'}</button></> : <><button className="btn-modal-cancel transaction-reject" disabled={processingAction} onClick={() => setShowRejectForm(true)}>Tolak bukti</button><button className="btn-modal-save transaction-approve" disabled={processingAction} onClick={() => handleConfirm(selectedTrx.id)}>{processingAction ? 'Memverifikasi…' : 'Konfirmasi pembayaran'}</button></>}
                                </div>
                            )}
                            {selectedTrx.status === 'Berhasil' && <div className="modal-actions transaction-detail-actions"><button className="btn-modal-save transaction-resend" disabled={processingAction} onClick={() => handleResendEmail(selectedTrx.id)}><Mail size={18} aria-hidden="true" /> {processingAction ? 'Mengirim…' : 'Kirim ulang email akses'}</button></div>}
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
