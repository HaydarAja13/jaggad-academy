import { useEffect, useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowRight, BookOpen, Building2, CheckCircle2, CircleX, Clock3,
    CreditCard, Eye, Package, ReceiptText, Upload, UserRound, X,
} from 'lucide-react';
import { useContent } from '../../Contexts/ContentContext';
import { formatCurrency, getStorageUrl } from '../../Utils/helpers';
import MainLayout from '../../Layouts/MainLayout';
import toast from 'react-hot-toast';
import './User.css';

const statusClass = status => status === 'Berhasil' ? 'success' : status === 'Pending' ? 'pending' : status === 'Bukti perlu diperbaiki' ? 'revision' : 'failed';

export default function UserDashboard({ auth, purchasedProducts = [], transactions = [], dbPaymentMethods = [], previewMode = false }) {
    const { midtrans = {} } = usePage().props;
    const { content } = useContent();
    const copy = content.dashboard;
    const user = auth?.user || { name: 'Pelajar JAGGAD' };
    const [selectedTrx, setSelectedTrx] = useState(null);
    const [changingPaymentTrx, setChangingPaymentTrx] = useState(null);
    const [reuploadingTrx, setReuploadingTrx] = useState(null);
    const [selectedMethod, setSelectedMethod] = useState(null);
    const [proofFile, setProofFile] = useState(null);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        const midtransEnabled = dbPaymentMethods.some(method => method.type === 'midtrans' && method.status);
        if (previewMode || !midtrans.client_key || !midtransEnabled) return undefined;
        const script = document.createElement('script');
        script.src = midtrans.is_production
            ? 'https://app.midtrans.com/snap/snap.js'
            : 'https://app.sandbox.midtrans.com/snap/snap.js';
        script.setAttribute('data-client-key', midtrans.client_key);
        script.async = true;
        document.body.appendChild(script);
        return () => script.remove();
    }, [dbPaymentMethods, midtrans.client_key, midtrans.is_production, previewMode]);

    useEffect(() => {
        const closeModal = event => {
            if (event.key === 'Escape') {
                setSelectedTrx(null);
                setChangingPaymentTrx(null);
                setReuploadingTrx(null);
            }
        };
        document.addEventListener('keydown', closeModal);
        return () => document.removeEventListener('keydown', closeModal);
    }, []);

    const handleRePay = token => {
        if (!window.snap) return toast.error('Midtrans belum siap, silakan tunggu atau muat ulang halaman.');
        window.snap.pay(token, {
            onSuccess: () => {
                router.reload();
                toast.success('Pembayaran berhasil.');
            },
            onPending: () => toast.success('Pembayaran sedang menunggu penyelesaian.'),
            onError: () => toast.error('Pembayaran gagal. Silakan coba kembali.'),
        });
    };

    const activeMethods = dbPaymentMethods.map(method => ({
        id: method.id,
        label: method.bank_name,
        accNo: method.account_number,
        accName: method.account_name,
        isManual: method.type === 'bank_transfer',
        icon: method.type === 'midtrans' ? CreditCard : Building2,
    }));

    const handleChangePayment = () => {
        if (!selectedMethod) return toast.error('Pilih metode pembayaran.');
        const paymentMethod = activeMethods.find(method => method.id === selectedMethod);
        if (paymentMethod.isManual && !proofFile) return toast.error('Unggah bukti pembayaran terlebih dahulu.');

        setProcessing(true);
        const payload = {
            phone: user.phone || '080000000000',
            payment_method_id: selectedMethod,
            cart: changingPaymentTrx.rawItems.map(item => ({ id: item.product_id })),
            active_trx: changingPaymentTrx.id,
            _method: 'post',
        };
        if (paymentMethod.isManual) payload.proof = proofFile;

        router.post(route('checkout.process'), payload, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: page => {
                const { snap_token: snapToken } = page.props.flash || {};
                if (snapToken && !paymentMethod.isManual) {
                    window.snap.pay(snapToken, {
                        onSuccess: () => {
                            router.reload();
                            toast.success('Pembayaran berhasil.');
                            setChangingPaymentTrx(null);
                        },
                        onPending: () => {
                            router.reload();
                            toast.success('Pembayaran sedang diproses.');
                            setChangingPaymentTrx(null);
                        },
                        onError: () => toast.error('Pembayaran gagal. Silakan coba kembali.'),
                        onClose: () => {
                            setProcessing(false);
                            toast('Pembayaran ditutup. Anda dapat melanjutkannya nanti.');
                        },
                    });
                } else {
                    setProcessing(false);
                    setChangingPaymentTrx(null);
                    toast.success('Metode pembayaran berhasil diubah.');
                }
            },
            onError: errors => {
                setProcessing(false);
                Object.values(errors).forEach(error => toast.error(error));
            },
        });
    };

    const handleProofReupload = () => {
        if (!proofFile) return toast.error('Pilih bukti transfer baru.');

        setProcessing(true);
        router.post(route('transactions.proof', reuploadingTrx.id), { proof: proofFile }, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setProcessing(false);
                setProofFile(null);
                setReuploadingTrx(null);
                setSelectedTrx(null);
                toast.success('Bukti baru dikirim dan menunggu verifikasi.');
            },
            onError: errors => {
                setProcessing(false);
                Object.values(errors).forEach(error => toast.error(error));
            },
        });
    };

    const myProducts = purchasedProducts.map(product => ({
        id: product.id,
        slug: product.slug,
        title: product.name,
        category: product.category?.name || 'Program JAGGAD',
        thumbnail: getStorageUrl(product.image),
    }));

    const myTransactions = transactions.map(transaction => ({
        id: transaction.transaction_code,
        date: new Date(transaction.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
        products: transaction.items?.map(item => item.product?.name).filter(Boolean).join(', ') || 'Produk JAGGAD',
        amount: transaction.total_amount,
        status: transaction.status === 'success' ? 'Berhasil' : transaction.payment?.status === 'rejected' ? 'Bukti perlu diperbaiki' : transaction.status === 'pending' ? 'Pending' : 'Gagal',
        paymentStatus: transaction.payment?.status,
        rejectionReason: transaction.payment?.rejection_reason,
        proof: getStorageUrl(transaction.payment?.proof_image),
        bank: transaction.payment_type?.toUpperCase() || transaction.payment?.payment_method?.bank_name || 'Pembayaran otomatis',
        snapToken: transaction.snap_token,
        payload: transaction.payment_payload ? JSON.parse(transaction.payment_payload) : null,
        rawItems: transaction.items || [],
    }));

    const nextProduct = myProducts[0];
    const pendingCount = myTransactions.filter(transaction => ['Pending', 'Bukti perlu diperbaiki'].includes(transaction.status)).length;

    const dashboard = (
        <div className={`user-dashboard${previewMode ? ' is-preview' : ''}`}>
            <div hidden dangerouslySetInnerHTML={{ __html: '<!-- THESIS: Learning command center; refuses a generic equal-card dashboard. OWN-WORLD: cool white fields, one deep-maroon focus panel, Chillax display, Synonym task copy, warm dividers, pill controls. STORY: owned learning, immediate next action, then real transaction states. FIRST VIEWPORT: welcome and next action dominate; compact account summary supports. FORM: grounded candidate 4, seed f38750b9, operate. FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance -->' }} />

            <section className="learner-hero" aria-labelledby="dashboard-title">
                <div className="container learner-hero__inner">
                    <div className="learner-hero__message">
                        <div className="learner-avatar" aria-hidden="true">{user.name?.trim()?.[0]?.toUpperCase() || 'J'}</div>
                        <h1 id="preview-dashboard-welcome-title">
                            <span>{copy.welcomeTitle},</span> {user.name}.
                        </h1>
                        <p id="preview-dashboard-welcome-description">{copy.welcomeDescription}</p>
                        <div className="learner-hero__actions">
                            <Link href={nextProduct ? route('dashboard.learning', nextProduct.slug || nextProduct.id) : route('products')} className="learner-button learner-button--light">
                                {nextProduct ? copy.continueLabel : copy.exploreLabel}<ArrowRight size={18} aria-hidden="true" />
                            </Link>
                            <Link href={route('profile.edit')} className="learner-button learner-button--quiet">
                                <UserRound size={18} aria-hidden="true" /> {copy.profileLabel}
                            </Link>
                        </div>
                    </div>

                    <aside className="learner-summary" aria-labelledby="account-summary-title">
                        <h2 id="account-summary-title">{copy.summaryTitle}</h2>
                        <dl>
                            <div><dt>{copy.ownedLabel}</dt><dd>{myProducts.length}</dd></div>
                            <div><dt>{copy.transactionLabel}</dt><dd>{myTransactions.length}</dd></div>
                            <div><dt>{copy.pendingLabel}</dt><dd>{pendingCount}</dd></div>
                        </dl>
                    </aside>
                </div>
            </section>

            <main className="container learner-main">
                <section className="learner-section" aria-labelledby="library-title">
                    <header className="learner-section__header">
                        <div>
                            <h2 id="preview-dashboard-library-title">{copy.libraryTitle}</h2>
                            <p id="preview-dashboard-library-description">{copy.libraryDescription}</p>
                        </div>
                        <Link href={route('products')} className="learner-text-link">{copy.exploreLabel}<ArrowRight size={17} aria-hidden="true" /></Link>
                    </header>

                    {myProducts.length ? (
                        <div className="learner-library">
                            {myProducts.map(product => (
                                <article className="learner-product" key={product.id}>
                                    <Link href={route('dashboard.learning', product.slug || product.id)} className="learner-product__media" tabIndex={-1} aria-hidden="true"><img src={product.thumbnail} alt="" /></Link>
                                    <div className="learner-product__content">
                                        <p>{product.category}</p>
                                        <h3>{product.title}</h3>
                                        <Link href={route('dashboard.learning', product.slug || product.id)}>{copy.openMaterialLabel}<ArrowRight size={17} aria-hidden="true" /></Link>
                                    </div>
                                </article>
                            ))}
                        </div>
                    ) : (
                        <div className="learner-empty">
                            <BookOpen size={32} aria-hidden="true" />
                            <div>
                                <h3 id="preview-dashboard-empty-library-title">{copy.emptyLibraryTitle}</h3>
                                <p id="preview-dashboard-empty-library-description">{copy.emptyLibraryDescription}</p>
                            </div>
                            <Link href={route('products')} className="learner-button learner-button--maroon">{copy.exploreLabel}<ArrowRight size={18} aria-hidden="true" /></Link>
                        </div>
                    )}
                </section>

                <section className="learner-section learner-transactions" aria-labelledby="transactions-title">
                    <header className="learner-section__header">
                        <div>
                            <h2 id="preview-dashboard-transactions-title">{copy.transactionsTitle}</h2>
                            <p id="preview-dashboard-transactions-description">{copy.transactionsDescription}</p>
                        </div>
                    </header>

                    {myTransactions.length ? (
                        <div className="learner-transaction-list">
                            {myTransactions.map(transaction => (
                                <article className="learner-transaction" key={transaction.id}>
                                    <div className="learner-transaction__identity"><strong>{transaction.id}</strong><span>{transaction.date}</span></div>
                                    <p className="learner-transaction__products">{transaction.products}</p>
                                    <strong className="learner-transaction__amount">{formatCurrency(transaction.amount)}</strong>
                                    <span className={`learner-status ${statusClass(transaction.status)}`}>{transaction.status}</span>
                                    <div className="learner-transaction__actions">
                                        <button type="button" onClick={() => setSelectedTrx(transaction)}><Eye size={17} aria-hidden="true" /> {copy.detailLabel}</button>
                                        {transaction.status === 'Pending' && !transaction.proof && transaction.snapToken && <button type="button" className="is-prominent" onClick={() => handleRePay(transaction.snapToken)}>{copy.repayLabel}</button>}
                                        {transaction.status === 'Pending' && !transaction.proof && <button type="button" onClick={() => setChangingPaymentTrx(transaction)}>{copy.changePaymentLabel}</button>}
                                        {transaction.status === 'Pending' && transaction.proof && <span className="learner-review-note">{copy.reviewLabel}</span>}
                                        {transaction.status === 'Bukti perlu diperbaiki' && <button type="button" className="is-prominent" onClick={() => { setProofFile(null); setReuploadingTrx(transaction); }}>Unggah ulang bukti</button>}
                                    </div>
                                </article>
                            ))}
                        </div>
                    ) : (
                        <div className="learner-empty learner-empty--compact">
                            <ReceiptText size={30} aria-hidden="true" />
                            <div><h3 id="preview-dashboard-empty-transaction-title">{copy.emptyTransactionTitle}</h3><p id="preview-dashboard-empty-transaction-description">{copy.emptyTransactionDescription}</p></div>
                        </div>
                    )}
                </section>
            </main>

            {selectedTrx && (
                <div className="learner-modal-backdrop" onMouseDown={() => setSelectedTrx(null)}>
                    <section className="learner-modal" role="dialog" aria-modal="true" aria-labelledby="transaction-detail-title" onMouseDown={event => event.stopPropagation()}>
                        <header className="learner-modal__header">
                            <div className={`learner-modal__status ${statusClass(selectedTrx.status)}`} aria-hidden="true">{selectedTrx.status === 'Berhasil' ? <CheckCircle2 /> : selectedTrx.status === 'Pending' ? <Clock3 /> : <CircleX />}</div>
                            <div><h2 id="transaction-detail-title">{selectedTrx.id}</h2><p>{selectedTrx.date} · {selectedTrx.status}</p></div>
                            <button type="button" className="learner-modal__close" aria-label="Tutup detail transaksi" onClick={() => setSelectedTrx(null)}><X /></button>
                        </header>
                        <div className="learner-modal__body">
                            <div className="learner-detail-block">
                                <h3><Package size={17} aria-hidden="true" /> Item pembelian</h3>
                                <div><span>{selectedTrx.products}</span><strong>{formatCurrency(selectedTrx.amount)}</strong></div>
                            </div>
                            <div className="learner-detail-block">
                                <h3><CreditCard size={17} aria-hidden="true" /> Informasi pembayaran</h3>
                                <dl className="learner-payment-detail">
                                    <div><dt>Metode</dt><dd>{selectedTrx.bank}</dd></div>
                                    <div><dt>Total bayar</dt><dd>{formatCurrency(selectedTrx.amount)}</dd></div>
                                    {selectedTrx.payload?.transaction_id && <div><dt>ID Midtrans</dt><dd>{selectedTrx.payload.transaction_id}</dd></div>}
                                    {selectedTrx.payload?.transaction_status && <div><dt>Status gateway</dt><dd>{selectedTrx.payload.transaction_status.toUpperCase()}</dd></div>}
                                    {selectedTrx.payload?.va_numbers?.[0] && <div className="is-wide"><dt>Virtual account {selectedTrx.payload.va_numbers[0].bank?.toUpperCase()}</dt><dd>{selectedTrx.payload.va_numbers[0].va_number}</dd></div>}
                                </dl>
                                {!selectedTrx.payload && selectedTrx.proof && <figure className="learner-proof"><figcaption>Bukti pembayaran manual</figcaption><img src={selectedTrx.proof} alt="Bukti pembayaran manual" /></figure>}
                                {selectedTrx.rejectionReason && <div className="learner-rejection"><strong>Bukti belum dapat divalidasi</strong><p>{selectedTrx.rejectionReason}</p></div>}
                            </div>
                        </div>
                        <footer className="learner-modal__footer learner-modal__footer--split"><button type="button" onClick={() => setSelectedTrx(null)}>Tutup</button>{selectedTrx.status === 'Bukti perlu diperbaiki' && <button type="button" className="is-primary" onClick={() => { setProofFile(null); setReuploadingTrx(selectedTrx); }}>Unggah bukti baru</button>}</footer>
                    </section>
                </div>
            )}

            {reuploadingTrx && (
                <div className="learner-modal-backdrop" onMouseDown={() => setReuploadingTrx(null)}>
                    <section className="learner-modal learner-modal--payment" role="dialog" aria-modal="true" aria-labelledby="reupload-proof-title" onMouseDown={event => event.stopPropagation()}>
                        <header className="learner-modal__header">
                            <div><h2 id="reupload-proof-title">Unggah bukti transfer baru</h2><p>Transaksi {reuploadingTrx.id} tetap tersimpan.</p></div>
                            <button type="button" className="learner-modal__close" aria-label="Tutup unggah bukti" onClick={() => setReuploadingTrx(null)}><X /></button>
                        </header>
                        <div className="learner-modal__body">
                            <div className="learner-rejection"><strong>Perbaiki sesuai catatan admin</strong><p>{reuploadingTrx.rejectionReason}</p></div>
                            <label className={`learner-upload${proofFile ? ' has-file' : ''}`}>
                                <Upload size={26} aria-hidden="true" /><strong>{proofFile ? proofFile.name : 'Pilih bukti transfer baru'}</strong><span>{proofFile ? 'Klik untuk mengganti file' : 'JPG atau PNG, maksimal 5 MB'}</span>
                                <input type="file" accept="image/jpeg,image/png" onChange={event => setProofFile(event.target.files?.[0] || null)} />
                            </label>
                        </div>
                        <footer className="learner-modal__footer learner-modal__footer--split">
                            <button type="button" onClick={() => setReuploadingTrx(null)}>Batal</button>
                            <button type="button" className="is-primary" onClick={handleProofReupload} disabled={processing}>{processing ? 'Mengirim…' : 'Kirim bukti baru'}</button>
                        </footer>
                    </section>
                </div>
            )}

            {changingPaymentTrx && (
                <div className="learner-modal-backdrop" onMouseDown={() => setChangingPaymentTrx(null)}>
                    <section className="learner-modal learner-modal--payment" role="dialog" aria-modal="true" aria-labelledby="change-payment-title" onMouseDown={event => event.stopPropagation()}>
                        <header className="learner-modal__header">
                            <div><h2 id="change-payment-title">Ubah metode pembayaran</h2><p>Pilih metode baru untuk transaksi {changingPaymentTrx.id}.</p></div>
                            <button type="button" className="learner-modal__close" aria-label="Tutup pilihan pembayaran" onClick={() => setChangingPaymentTrx(null)}><X /></button>
                        </header>
                        <div className="learner-modal__body">
                            <fieldset className="learner-payment-methods">
                                <legend>Metode pembayaran tersedia</legend>
                                {activeMethods.map(method => {
                                    const Icon = method.icon;
                                    return (
                                        <label className={selectedMethod === method.id ? 'is-selected' : ''} key={method.id}>
                                            <input type="radio" name="payment-method" value={method.id} checked={selectedMethod === method.id} onChange={() => setSelectedMethod(method.id)} />
                                            <Icon size={20} aria-hidden="true" /><span>{method.label}</span>
                                            {selectedMethod === method.id && method.isManual && <small>Rekening {method.accNo} · a.n. {method.accName}</small>}
                                        </label>
                                    );
                                })}
                            </fieldset>
                            {selectedMethod && activeMethods.find(method => method.id === selectedMethod)?.isManual && (
                                <label className={`learner-upload${proofFile ? ' has-file' : ''}`}>
                                    <Upload size={26} aria-hidden="true" /><strong>{proofFile ? proofFile.name : 'Pilih bukti transfer'}</strong><span>{proofFile ? 'Klik untuk mengganti file' : 'JPG atau PNG, maksimal 5 MB'}</span>
                                    <input type="file" accept="image/jpeg,image/png" onChange={event => setProofFile(event.target.files?.[0] || null)} />
                                </label>
                            )}
                        </div>
                        <footer className="learner-modal__footer learner-modal__footer--split">
                            <button type="button" onClick={() => setChangingPaymentTrx(null)}>Batal</button>
                            <button type="button" className="is-primary" onClick={handleChangePayment} disabled={processing}>{processing ? 'Memproses…' : 'Simpan perubahan'}</button>
                        </footer>
                    </section>
                </div>
            )}
        </div>
    );

    if (previewMode) return dashboard;

    return <MainLayout><Head title="Dashboard - JAGGAD ACADEMY" />{dashboard}</MainLayout>;
}
