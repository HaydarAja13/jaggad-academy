import { useEffect, useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Building2, Check, CheckCircle2, Copy, CreditCard, Lock, ReceiptText, ShieldCheck, ShoppingBag, Trash2, Upload, UserRound } from 'lucide-react';
import { useCart } from '../../Contexts/CartContext';
import { formatCurrency, getStorageUrl } from '../../Utils/helpers';
import MainLayout from '../../Layouts/MainLayout';
import toast from 'react-hot-toast';
import { useMetaPixel } from '../../Utils/useMetaPixel';
import './Checkout.css';

export default function Checkout({ auth, dbPaymentMethods = [] }) {
    const { midtrans } = usePage().props;
    const { cartItems, getTotal, clearCart, removeFromCart } = useCart();
    const { trackInitiateCheckout, trackPurchase } = useMetaPixel();
    const [step, setStep] = useState(1);
    const [form, setForm] = useState({ name: auth.user?.name || '', email: auth.user?.email || '', phone: auth.user?.phone || '' });
    const [processing, setProcessing] = useState(false);
    const [selectedMethod, setSelectedMethod] = useState(null);
    const [proofFile, setProofFile] = useState(null);
    const [activeTrxCode, setActiveTrxCode] = useState(null);
    const [copiedAccount, setCopiedAccount] = useState(null);

    const activeMethods = dbPaymentMethods.map(method => ({
        id: method.id,
        label: method.bank_name,
        accNo: method.account_number,
        accName: method.account_name,
        isManual: method.type === 'bank_transfer',
        enabled: Boolean(method.status),
        icon: method.type === 'midtrans' ? CreditCard : Building2,
    }));
    const midtransAvailable = activeMethods.some(method => !method.isManual && method.enabled);

    useEffect(() => {
        if (!midtransAvailable || !midtrans.client_key) return undefined;
        const script = document.createElement('script');
        script.src = midtrans.is_production ? 'https://app.midtrans.com/snap/snap.js' : 'https://app.sandbox.midtrans.com/snap/snap.js';
        script.setAttribute('data-client-key', midtrans.client_key);
        script.async = true;
        document.body.appendChild(script);
        return () => document.body.removeChild(script);
    }, [midtrans.client_key, midtrans.is_production, midtransAvailable]);

    const selectedPayment = activeMethods.find(method => method.id === selectedMethod);
    const availableMethods = activeMethods.filter(method => method.enabled);
    const total = getTotal();

    const copyAccountNumber = async method => {
        try {
            await navigator.clipboard.writeText(method.accNo);
            setCopiedAccount(method.id);
            toast.success('Nomor rekening disalin.');
        } catch {
            toast.error('Nomor rekening gagal disalin. Silakan salin secara manual.');
        }
    };

    const handleOrder = event => {
        event?.preventDefault();
        if (!form.name || !form.email || !form.phone) return toast.error('Lengkapi nama, email, dan nomor HP.');
        trackInitiateCheckout(cartItems, total);
        setStep(2);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handlePay = () => {
        if (!selectedPayment?.enabled) return toast.error('Pilih metode pembayaran yang tersedia.');
        if (selectedPayment.isManual && !proofFile) return toast.error('Unggah bukti pembayaran terlebih dahulu.');
        if (!selectedPayment.isManual && !window.snap) return toast.error('Midtrans belum siap. Tunggu sebentar lalu coba lagi.');

        setProcessing(true);
        const payload = {
            phone: form.phone,
            payment_method_id: selectedMethod,
            cart: cartItems.map(item => item.type === 'package'
                ? { package_slug: item.package_slug }
                : { id: item.id }),
            _method: 'post',
        };
        if (activeTrxCode) payload.active_trx = activeTrxCode;
        if (selectedPayment.isManual) payload.proof = proofFile;

        router.post(route('checkout.process'), payload, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: page => {
                const { snap_token, trx_code } = page.props.flash || {};
                if (trx_code) setActiveTrxCode(trx_code);
                if (snap_token && !selectedPayment.isManual) {
                    window.snap.pay(snap_token, {
                        onSuccess: () => router.post(route('checkout.verify', trx_code), {}, {
                            onSuccess: () => {
                                trackPurchase(trx_code, total, cartItems);
                                clearCart();
                                toast.success('Pembayaran berhasil. Materi siap dipelajari.');
                                router.visit(route('dashboard'));
                            },
                            onError: errors => {
                                setProcessing(false);
                                Object.values(errors).forEach(error => toast.error(error));
                            },
                        }),
                        onPending: () => {
                            setProcessing(false);
                            toast.success('Pembayaran sedang diproses.');
                            router.visit(route('dashboard'));
                        },
                        onError: () => {
                            setProcessing(false);
                            toast.error('Pembayaran gagal. Silakan coba kembali.');
                        },
                        onClose: () => {
                            setProcessing(false);
                            toast('Pembayaran ditunda. Pesanan tersimpan dan dapat dilanjutkan nanti.');
                        },
                    });
                } else if (selectedPayment.isManual) {
                    setProcessing(false);
                    clearCart();
                    setStep(3);
                } else {
                    setProcessing(false);
                    toast.error('Gateway pembayaran belum memberikan token. Keranjang Anda tetap tersimpan.');
                }
            },
            onError: errors => {
                setProcessing(false);
                Object.values(errors).forEach(error => toast.error(error));
            },
        });
    };

    if (step === 3) return <MainLayout>
        <Head title="Pesanan Diproses - JAGGAD ACADEMY" />
        <main className="checkout-state"><section className="checkout-state__panel"><CheckCircle2 size={52} aria-hidden="true" /><h1>Pesanan sedang diproses</h1><p>Bukti pembayaran telah diterima. Tim JAGGAD Academy akan memverifikasi pesanan Anda.{activeTrxCode && <> Nomor transaksi Anda <strong>{activeTrxCode}</strong>.</>}</p><div><Link href={route('dashboard')} className="checkout-button checkout-button--primary">Lihat dashboard</Link><Link href={route('products')} className="checkout-button checkout-button--secondary">Lihat produk lain</Link></div></section></main>
    </MainLayout>;

    if (cartItems.length === 0) return <MainLayout>
        <Head title="Keranjang Kosong - JAGGAD ACADEMY" />
        <main className="checkout-state"><section className="checkout-state__panel"><ShoppingBag size={52} aria-hidden="true" /><h1>Keranjang Anda masih kosong</h1><p>Pilih materi belajar yang sesuai, lalu kembali ke sini untuk menyelesaikan pembelian.</p><Link href={route('products')} className="checkout-button checkout-button--primary">Jelajahi produk <ArrowRight size={18} /></Link></section></main>
    </MainLayout>;

    return <MainLayout>
        <Head title="Checkout - JAGGAD ACADEMY" />
        <main className="checkout-page">
            <header className="checkout-header"><div className="container checkout-header__inner"><Link href={route('products')} className="checkout-back"><ArrowLeft size={18} /> Kembali ke katalog</Link><div className="checkout-header__row"><div><h1>Keranjang & checkout</h1><p>Periksa pesanan, lengkapi data, lalu pilih metode pembayaran.</p></div><ol className="checkout-progress" aria-label="Progres checkout"><li className={step === 1 ? 'active' : 'done'}><span>{step > 1 ? <Check size={18} /> : '1'}</span><div><strong>Data pemesan</strong><small>Informasi kontak</small></div></li><li className={step === 2 ? 'active' : ''}><span>2</span><div><strong>Pembayaran</strong><small>Pilih metode</small></div></li></ol></div></div></header>

            <div className="container checkout-layout">
                <div className="checkout-work">
                    {step === 1 && <form className="checkout-panel" onSubmit={handleOrder}><div className="checkout-panel__heading"><span><UserRound size={22} /></span><div><h2>Data pemesan</h2><p>Pastikan informasi berikut aktif dan dapat dihubungi.</p></div></div><div className="checkout-fields"><label className="checkout-field"><span>Nama lengkap</span><input required autoComplete="name" value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} placeholder="Nama lengkap Anda" /></label><label className="checkout-field"><span>Email</span><input required autoComplete="email" type="email" value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} placeholder="nama@email.com" /></label><label className="checkout-field"><span>Nomor HP</span><input required autoComplete="tel" type="tel" value={form.phone} onChange={event => setForm({ ...form, phone: event.target.value })} placeholder="08xx xxxx xxxx" /></label></div><div className="checkout-panel__footer"><p><ShieldCheck size={18} /> Data digunakan untuk memproses pesanan Anda.</p><button className="checkout-button checkout-button--primary" type="submit">Lanjut ke pembayaran <ArrowRight size={18} style={{ color: '#fff' }} /></button></div></form>}

                    {step === 2 && <section className="checkout-panel"><div className="checkout-panel__heading"><span><CreditCard size={22} /></span><div><h2>Metode pembayaran</h2><p>Pilih satu metode yang paling nyaman untuk Anda.</p></div></div>{activeMethods.length > 0 ? <div className="payment-methods-grid">{activeMethods.map(method => <div key={method.id} className={`payment-option ${selectedMethod === method.id ? 'selected' : ''} ${method.enabled ? '' : 'disabled'}`}><button type="button" className="payment-option__select" disabled={!method.enabled} onClick={() => { setSelectedMethod(method.id); setProofFile(null); }} aria-pressed={selectedMethod === method.id}><span className="payment-icon"><method.icon size={21} /></span><span className="payment-copy"><strong>{method.label}</strong><small>{method.isManual ? 'Verifikasi oleh admin setelah bukti dikirim' : method.enabled ? 'QRIS, Virtual Account, dan kartu' : 'Pembayaran otomatis sedang disiapkan'}</small></span>{method.enabled ? <span className="payment-radio" aria-hidden="true">{selectedMethod === method.id && <Check size={14} />}</span> : <span className="payment-maintenance">Dalam pemeliharaan</span>}</button>{selectedMethod === method.id && method.isManual && <div className="bank-details"><span><small>Nomor rekening</small><b>{method.accNo}</b><small>Atas nama {method.accName}</small></span><button type="button" onClick={() => copyAccountNumber(method)}><Copy size={17} aria-hidden="true" /> {copiedAccount === method.id ? 'Tersalin' : 'Salin'}</button></div>}</div>)}</div> : <div className="checkout-notice">Metode pembayaran belum tersedia. Silakan hubungi admin JAGGAD Academy.</div>}

                        {selectedPayment?.isManual && <div className="proof-upload-section"><h3>Unggah bukti transfer</h3><label className={`proof-upload-label ${proofFile ? 'has-file' : ''}`}>{proofFile ? <>{proofFile.type.startsWith('image/') ? <img src={URL.createObjectURL(proofFile)} alt="Pratinjau bukti pembayaran" className="proof-preview-image" /> : <CheckCircle2 size={32} />}<strong>{proofFile.name}</strong><span>Klik untuk mengganti file</span></> : <><Upload size={30} /><strong>Pilih bukti transfer</strong><span>JPG atau PNG, maksimal 5 MB</span></>}<input type="file" accept="image/jpeg,image/png" onChange={event => setProofFile(event.target.files?.[0] || null)} /></label></div>}

                        <div className="checkout-actions"><button className="checkout-button checkout-button--secondary" type="button" onClick={() => setStep(1)} disabled={processing}><ArrowLeft size={18} /> Kembali</button><button className="checkout-button checkout-button--primary" type="button" onClick={handlePay} disabled={processing || availableMethods.length === 0}><Lock size={18} /> {processing ? 'Memproses pembayaran…' : `Kirim bukti & konfirmasi ${formatCurrency(total)}`}</button></div></section>}
                </div>

                <aside className="checkout-summary"><section className="checkout-summary__panel"><div className="checkout-summary__heading"><div><ReceiptText size={21} /><h2>Ringkasan pesanan</h2></div><span>{cartItems.length} produk</span></div><div className="order-items">{cartItems.map(item => { const image = getStorageUrl(item.image || item.thumbnail); const name = item.name || item.title; return <article className="order-item" key={item.id}>{image ? <img src={image} alt="" /> : <div className="order-item__placeholder"><ShoppingBag size={20} /></div>}<div className="order-item__copy"><h3>{name}</h3><strong>{formatCurrency(item.price)}</strong></div>{step === 1 && <button type="button" className="btn-remove-item" onClick={() => removeFromCart(item.id)} aria-label={`Hapus ${name} dari keranjang`}><Trash2 size={18} /></button>}</article>; })}</div><div className="order-totals"><div><span>Subtotal</span><strong>{formatCurrency(total)}</strong></div><div className="order-total"><span>Total pembayaran</span><strong>{formatCurrency(total)}</strong></div></div><p className="checkout-summary__note"><Lock size={17} /> Pembayaran diproses melalui metode yang Anda pilih.</p></section></aside>
            </div>
        </main>
    </MainLayout>;
}
