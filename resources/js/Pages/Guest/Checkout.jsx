import { useEffect, useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Building2, Check, CheckCircle2, Copy, CreditCard, HeartHandshake, Lock, ReceiptText, ShieldCheck, ShoppingBag, Trash2, Upload, UserRound } from 'lucide-react';
import { useCart } from '../../Contexts/CartContext';
import { formatCurrency, formatPriceOrFree, getStorageUrl, isDonationProduct } from '../../Utils/helpers';
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
    // Status pengiriman email akses (magic link) untuk tamu — default sukses.
    const [accessEmail, setAccessEmail] = useState(true);
    // Nominal donasi per produk (pay-what-you-want), bebas diisi >= Rp 0.
    const [donationAmounts, setDonationAmounts] = useState({});
    const [donationOrder, setDonationOrder] = useState(false);
    // Tamu: hanya keranjang donasi yang boleh checkout tanpa login.
    const isGuest = !auth?.user;

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
    const donationItems = cartItems.filter(item => isDonationProduct(item));
    const hasDonation = donationItems.length > 0;
    const isMixedCart = hasDonation && donationItems.length !== cartItems.length;
    const donationTotal = donationItems.reduce((sum, item) => sum + Number(donationAmounts[item.id] || 0), 0);
    const total = getTotal() + donationTotal;
    const isFreeOrder = cartItems.length > 0 && Number(total) === 0 && !isMixedCart;

    // Tamu dengan keranjang non-donasi dialihkan ke login (hanya donasi yang boleh tanpa akun).
    useEffect(() => {
        if (isGuest && cartItems.length > 0 && !hasDonation) {
            toast.error('Silakan login atau daftar terlebih dahulu untuk membeli produk ini.');
            router.visit(route('login'));
        }
    }, [isGuest, cartItems.length, hasDonation]);

    const setDonationAmount = (id, raw) => {
        const digits = String(raw).replace(/\D/g, '').slice(0, 9);
        const value = Math.min(Number(digits || 0), 100000000);
        setDonationAmounts(prev => ({ ...prev, [id]: value }));
    };

    // Payload keranjang: produk donasi ikut menyertakan nominal pilihan pembeli.
    // Backend tetap memakai harga DB untuk produk harga tetap.
    const buildCartPayload = () => cartItems.map(item => {
        if (item.type === 'package') return { package_slug: item.package_slug };
        if (isDonationProduct(item)) return { id: item.id, donation_amount: Number(donationAmounts[item.id] || 0) };
        return { id: item.id };
    });

    const copyAccountNumber = async method => {
        try {
            await navigator.clipboard.writeText(method.accNo);
            setCopiedAccount(method.id);
            toast.success('Nomor rekening disalin.');
        } catch {
            toast.error('Nomor rekening gagal disalin. Silakan salin secara manual.');
        }
    };

    const handleFreeClaim = () => {
        if (!form.name || !form.email || !form.phone) return toast.error('Lengkapi nama, email, dan nomor HP.');
        setProcessing(true);
        router.post(route('checkout.process'), {
            name: form.name,
            email: form.email,
            phone: form.phone,
            cart: buildCartPayload(),
        }, {
            preserveScroll: true,
            onSuccess: page => {
                const { trx_code, free_claim, success, access_email } = page.props.flash || {};
                setProcessing(false);
                if (free_claim || trx_code) {
                    clearCart();
                    if (isGuest) {
                        // Tamu tidak punya dashboard — arahkan ke info email akses.
                        setAccessEmail(access_email !== false);
                        setDonationOrder(hasDonation);
                        setStep(3);
                        return;
                    }
                    if (cartItems.length === 1 && cartItems[0].slug) {
                        toast.success(success || 'Produk gratis berhasil dibuka! Materi sudah tersedia.');
                        router.visit(route('dashboard.learning', cartItems[0].slug));
                        return;
                    }
                    toast.success(success || 'Produk gratis berhasil dibuka! Materi sudah tersedia di dashboard.');
                    router.visit(route('dashboard'));
                }
            },
            onError: errors => {
                setProcessing(false);
                Object.values(errors).forEach(error => toast.error(error));
            },
        });
    };

    const handleOrder = event => {
        event?.preventDefault();
        if (!form.name || !form.email || !form.phone) return toast.error('Lengkapi nama, email, dan nomor HP.');
        if (isMixedCart) return toast.error('Produk dengan nominal bebas harus di-checkout terpisah dari produk lain. Hapus salah satu dari keranjang.');
        if (isGuest && !hasDonation) {
            toast.error('Silakan login atau daftar terlebih dahulu untuk membeli produk ini.');
            router.visit(route('login'));
            return;
        }
        if (isFreeOrder) {
            handleFreeClaim();
            return;
        }
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
            name: form.name,
            email: form.email,
            phone: form.phone,
            payment_method_id: selectedMethod,
            cart: buildCartPayload(),
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
                            onSuccess: page => {
                                // Donasi tidak dikirim sebagai event Purchase (bukan penjualan produk).
                                if (!hasDonation) trackPurchase(trx_code, total, cartItems);
                                clearCart();
                                toast.success(hasDonation ? 'Pembayaran berhasil. Terima kasih!' : 'Pembayaran berhasil. Materi siap dipelajari.');
                                if (isGuest) {
                                    setAccessEmail((page.props.flash || {}).access_email !== false);
                                    setDonationOrder(hasDonation);
                                    setStep(3);
                                    return;
                                }
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
                            if (isGuest) {
                                setDonationOrder(hasDonation);
                                setStep(3);
                                return;
                            }
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
                    setAccessEmail((page.props.flash || {}).access_email !== false);
                    setDonationOrder(hasDonation);
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
        <main className="checkout-state"><section className="checkout-state__panel"><CheckCircle2 size={52} aria-hidden="true" /><h1>{isGuest ? 'Cek email Anda' : donationOrder ? 'Pembayaran tercatat' : 'Pesanan sedang diproses'}</h1><p>{isGuest ? (accessEmail ? <>Link akses materi sudah dikirim ke <strong>{form.email}</strong>. Buka inbox (atau folder spam) lalu klik tombol di email tersebut untuk membuka materi — tanpa perlu password.</> : 'Email akses gagal dikirim otomatis. Jangan khawatir, akses Anda tetap aktif — gunakan "Lupa Password" di halaman masuk untuk mengatur password lalu buka materi dari dashboard.') : donationOrder ? 'Terima kasih! Akses materi sudah aktif dan bisa dibuka sekarang dari dashboard. Verifikasi bukti hanya untuk konfirmasi nominal.' : 'Bukti pembayaran telah diterima. Tim JAGGAD Academy akan memverifikasi pesanan Anda.'}{activeTrxCode && <> Nomor transaksi Anda <strong>{activeTrxCode}</strong>.</>}</p><div>{isGuest ? <><Link href={route('home')} className="checkout-button checkout-button--primary">Kembali ke beranda</Link><Link href={route('products')} className="checkout-button checkout-button--secondary">Lihat produk lain</Link></> : <><Link href={route('dashboard')} className="checkout-button checkout-button--primary">Lihat dashboard</Link><Link href={route('products')} className="checkout-button checkout-button--secondary">Lihat produk lain</Link></>}</div></section></main>
    </MainLayout>;

    if (cartItems.length === 0) return <MainLayout>
        <Head title="Keranjang Kosong - JAGGAD ACADEMY" />
        <main className="checkout-state"><section className="checkout-state__panel"><ShoppingBag size={52} aria-hidden="true" /><h1>Keranjang Anda masih kosong</h1><p>Pilih materi belajar yang sesuai, lalu kembali ke sini untuk menyelesaikan pembelian.</p><Link href={route('products')} className="checkout-button checkout-button--primary">Jelajahi produk <ArrowRight size={18} /></Link></section></main>
    </MainLayout>;

    return <MainLayout>
        <Head title="Checkout - JAGGAD ACADEMY" />
        <main className="checkout-page">
            <header className="checkout-header"><div className="container checkout-header__inner"><Link href={route('products')} className="checkout-back"><ArrowLeft size={18} /> Kembali ke katalog</Link><div className="checkout-header__row"><div><h1>Keranjang & checkout</h1><p>{isFreeOrder ? (hasDonation ? 'Isi nominal dukungan (boleh Rp0) — akses langsung terbuka tanpa pembayaran.' : 'Lengkapi data diri, produk gratis langsung terbuka tanpa pembayaran.') : hasDonation ? 'Tentukan nominal dukungan Anda, lalu pilih metode pembayaran.' : 'Periksa pesanan, lengkapi data, lalu pilih metode pembayaran.'}</p></div>{!isFreeOrder && <ol className="checkout-progress" aria-label="Progres checkout"><li className={step === 1 ? 'active' : 'done'}><span>{step > 1 ? <Check size={18} /> : '1'}</span><div><strong>Data pemesan</strong><small>Informasi kontak</small></div></li><li className={step === 2 ? 'active' : ''}><span>2</span><div><strong>Pembayaran</strong><small>Pilih metode</small></div></li></ol>}</div></div></header>

            <div className="container checkout-layout">
                <div className="checkout-work">
                    {step === 1 && <form className="checkout-panel" onSubmit={handleOrder}><div className="checkout-panel__heading"><span><UserRound size={22} /></span><div><h2>Data pemesan</h2><p>{isFreeOrder ? (hasDonation ? 'Isi identitas, lalu tentukan nominal dukungan Anda.' : 'Isi identitas untuk membuka produk gratis Anda.') : hasDonation ? 'Isi identitas — nominal dukungan sudah Anda tentukan di bawah.' : 'Pastikan informasi berikut aktif dan dapat dihubungi.'}</p></div></div><div className="checkout-fields"><label className="checkout-field"><span>Nama lengkap</span><input required autoComplete="name" value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} placeholder="Nama lengkap Anda" /></label><label className="checkout-field"><span>Email</span><input required autoComplete="email" type="email" value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} placeholder="nama@email.com" /></label><label className="checkout-field"><span>Nomor HP</span><input required autoComplete="tel" type="tel" value={form.phone} onChange={event => setForm({ ...form, phone: event.target.value })} placeholder="08xx xxxx xxxx" /></label></div>

                                        {hasDonation && !isMixedCart && <div className="checkout-donation">{donationItems.map(item => { const amount = Number(donationAmounts[item.id] || 0); return <div className="checkout-donation__item" key={item.id}><div className="checkout-donation__intro"><span className="checkout-donation__icon"><HeartHandshake size={20} aria-hidden="true" /></span><div><h3>Nominal dukungan{donationItems.length > 1 ? ` · ${item.name || item.title}` : ''}</h3><p>Isi bebas mulai dari Rp0. Nominal yang Anda masukkan sudah termasuk total, dan akses materi langsung terbuka.</p></div></div><div className="checkout-donation__chips" role="group" aria-label="Saran nominal dukungan">{[1000, 2000, 5000, 10000].map(value => <button type="button" key={value} className={amount === value ? 'active' : ''} aria-pressed={amount === value} onClick={() => setDonationAmount(item.id, value)}>{formatCurrency(value)}</button>)}<button type="button" className={amount === 0 ? 'active' : ''} aria-pressed={amount === 0} onClick={() => setDonationAmount(item.id, 0)}>Rp0</button></div><label className="checkout-field"><span>Nominal dukungan (Rp)</span><input inputMode="numeric" value={amount ? amount.toLocaleString('id-ID') : ''} onChange={event => setDonationAmount(item.id, event.target.value)} placeholder="0" /></label></div>; })}</div>}

                                        {isMixedCart && <div className="checkout-notice">Produk dengan nominal bebas harus di-checkout terpisah dari produk lain. Hapus salah satu dari keranjang untuk melanjutkan.</div>}

                                        <div className="checkout-panel__footer"><p><ShieldCheck size={18} /> {isGuest ? 'Tanpa password — link akses materi dikirim ke email Anda.' : isFreeOrder ? (hasDonation ? 'Rp0 — tanpa pembayaran, tanpa upload bukti.' : 'Tanpa pembayaran, tanpa upload bukti.') : hasDonation ? 'Akses langsung terbuka — verifikasi nominal dilakukan admin.' : 'Data digunakan untuk memproses pesanan Anda.'}</p><button className="checkout-button checkout-button--primary" type="submit" disabled={processing}>{isFreeOrder ? (processing ? 'Membuka akses…' : (hasDonation ? 'Buka Akses (Rp0)' : 'Ambil Produk Gratis')) : <>Lanjut ke pembayaran <ArrowRight size={18} style={{ color: '#fff' }} /></>}</button></div></form>}

                    {step === 2 && !isFreeOrder && <section className="checkout-panel"><div className="checkout-panel__heading"><span><CreditCard size={22} /></span><div><h2>Metode pembayaran</h2><p>Pilih satu metode yang paling nyaman untuk Anda.</p></div></div>{activeMethods.length > 0 ? <div className="payment-methods-grid">{activeMethods.map(method => <div key={method.id} className={`payment-option ${selectedMethod === method.id ? 'selected' : ''} ${method.enabled ? '' : 'disabled'}`}><button type="button" className="payment-option__select" disabled={!method.enabled} onClick={() => { setSelectedMethod(method.id); setProofFile(null); }} aria-pressed={selectedMethod === method.id}><span className="payment-icon"><method.icon size={21} /></span><span className="payment-copy"><strong>{method.label}</strong><small>{method.isManual ? 'Verifikasi oleh admin setelah bukti dikirim' : method.enabled ? 'QRIS, Virtual Account, dan kartu' : 'Pembayaran otomatis sedang disiapkan'}</small></span>{method.enabled ? <span className="payment-radio" aria-hidden="true">{selectedMethod === method.id && <Check size={14} />}</span> : <span className="payment-maintenance">Dalam pemeliharaan</span>}</button>{selectedMethod === method.id && method.isManual && <div className="bank-details"><span><small>Nomor rekening</small><b>{method.accNo}</b><small>Atas nama {method.accName}</small></span><button type="button" onClick={() => copyAccountNumber(method)}><Copy size={17} aria-hidden="true" /> {copiedAccount === method.id ? 'Tersalin' : 'Salin'}</button></div>}</div>)}</div> : <div className="checkout-notice">Metode pembayaran belum tersedia. Silakan hubungi admin JAGGAD Academy.</div>}

                        {selectedPayment?.isManual && <div className="proof-upload-section"><h3>Unggah bukti transfer</h3><label className={`proof-upload-label ${proofFile ? 'has-file' : ''}`}>{proofFile ? <>{proofFile.type.startsWith('image/') ? <img src={URL.createObjectURL(proofFile)} alt="Pratinjau bukti pembayaran" className="proof-preview-image" /> : <CheckCircle2 size={32} />}<strong>{proofFile.name}</strong><span>Klik untuk mengganti file</span></> : <><Upload size={30} /><strong>Pilih bukti transfer</strong><span>JPG atau PNG, maksimal 5 MB</span></>}<input type="file" accept="image/jpeg,image/png" onChange={event => setProofFile(event.target.files?.[0] || null)} /></label></div>}

                        <div className="checkout-actions"><button className="checkout-button checkout-button--secondary" type="button" onClick={() => setStep(1)} disabled={processing}><ArrowLeft size={18} /> Kembali</button><button className="checkout-button checkout-button--primary" type="button" onClick={handlePay} disabled={processing || availableMethods.length === 0}><Lock size={18} /> {processing ? 'Memproses pembayaran…' : `Kirim bukti & konfirmasi ${formatCurrency(total)}`}</button></div></section>}
                </div>

                <aside className="checkout-summary"><section className="checkout-summary__panel"><div className="checkout-summary__heading"><div><ReceiptText size={21} /><h2>Ringkasan pesanan</h2></div><span>{cartItems.length} produk</span></div><div className="order-items">{cartItems.map(item => { const image = getStorageUrl(item.image || item.thumbnail); const name = item.name || item.title; return <article className="order-item" key={item.id}>{image ? <img src={image} alt="" /> : <div className="order-item__placeholder"><ShoppingBag size={20} /></div>}<div className="order-item__copy"><h3>{name}</h3><strong>{isDonationProduct(item) ? (Number(donationAmounts[item.id] || 0) > 0 ? formatCurrency(donationAmounts[item.id]) : 'Rp0') : formatPriceOrFree(item.price)}</strong></div>{step === 1 && <button type="button" className="btn-remove-item" onClick={() => removeFromCart(item.id)} aria-label={`Hapus ${name} dari keranjang`}><Trash2 size={18} /></button>}</article>; })}</div><div className="order-totals"><div><span>Subtotal</span><strong>{formatPriceOrFree(total)}</strong></div><div className="order-total"><span>{isFreeOrder ? (hasDonation ? 'Total (Rp0)' : 'Total (Gratis)') : 'Total pembayaran'}</span><strong>{formatPriceOrFree(total)}</strong></div></div><p className="checkout-summary__note"><Lock size={17} /> {isGuest ? 'Tanpa akun — link akses dikirim ke email Anda setelah checkout.' : hasDonation && isFreeOrder ? 'Rp0 — akses langsung terbuka tanpa pembayaran.' : isFreeOrder ? 'Produk gratis — tidak ada pembayaran.' : hasDonation ? 'Nominal dukungan diproses melalui metode yang Anda pilih.' : 'Pembayaran diproses melalui metode yang Anda pilih.'}</p></section></aside>
            </div>
        </main>
    </MainLayout>;
}
