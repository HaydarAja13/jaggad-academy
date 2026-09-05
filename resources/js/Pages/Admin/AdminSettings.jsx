import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Save, Loader2, ShieldCheck, CreditCard, Activity, Mail, Info } from 'lucide-react';
import AdminLayout from '../../Layouts/AdminLayout';
import toast from 'react-hot-toast';
import './Admin.css';

export default function AdminSettings({ dbSettings }) {
    const [data, setData] = useState({
        google_client_id: dbSettings?.google_client_id || '',
        google_client_secret: dbSettings?.google_client_secret || '',
        google_redirect_url: dbSettings?.google_redirect_url || window.location.origin + '/auth/google/callback',
        midtrans_server_key: dbSettings?.midtrans_server_key || '',
        midtrans_client_key: dbSettings?.midtrans_client_key || '',
        midtrans_is_production: dbSettings?.midtrans_is_production ?? false,
        meta_pixel_id: dbSettings?.meta_pixel_id || '',
        meta_access_token: dbSettings?.meta_access_token || '',
        mail_mailer: dbSettings?.mail_mailer || 'smtp',
        mail_host: dbSettings?.mail_host || '',
        mail_port: dbSettings?.mail_port || '587',
        mail_username: dbSettings?.mail_username || '',
        mail_password: dbSettings?.mail_password || '',
        mail_encryption: dbSettings?.mail_encryption || 'tls',
        mail_from_address: dbSettings?.mail_from_address || '',
        mail_from_name: dbSettings?.mail_from_name || 'JAGGAD ACADEMY',
    });

    const [isSaving, setIsSaving] = useState(false);

    const handleSave = (e) => {
        e.preventDefault();
        setIsSaving(true);
        router.post(route('admin.settings.store'), data, {
            preserveScroll: true,
            onSuccess: () => {
                setIsSaving(false);
                toast.success('Pengaturan berhasil disimpan!');
            },
            onError: (errors) => {
                setIsSaving(false);
                toast.error('Gagal menyimpan pengaturan.');
            }
        });
    };

    return (
        <AdminLayout>
            <Head title="Pengaturan Sistem - JAGGAD ACADEMY" />

            <main className="admin-page settings-page">
                <header className="settings-header">
                    <div>
                        <h1>Pengaturan Sistem</h1>
                        <p>Kelola kredensial API, integrasi eksternal, dan konfigurasi email.</p>
                    </div>
                    <button type="button" className="products-primary" onClick={handleSave} disabled={isSaving}>
                        {isSaving ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : <Save size={18} aria-hidden="true" />}
                        {isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}
                    </button>
                </header>

                <form onSubmit={handleSave}>
                    {/* Google Auth Section */}
                    <section className="settings-section" aria-labelledby="settings-google-title">
                        <div className="settings-section-header">
                            <div className="settings-section-heading">
                                <span className="settings-section-icon settings-section-icon--google"><ShieldCheck size={20} /></span>
                                <div>
                                    <h2 id="settings-google-title">Google Auth Credentials</h2>
                                    <p>Konfigurasi OAuth untuk login dengan Google.</p>
                                </div>
                            </div>
                        </div>
                        <div className="settings-section-body">
                            <div className="settings-form-grid">
                                <div className="form-group">
                                    <label htmlFor="google_client_id">Google Client ID</label>
                                    <input
                                        id="google_client_id"
                                        type="text"
                                        value={data.google_client_id}
                                        onChange={e => setData({...data, google_client_id: e.target.value})}
                                        placeholder="Contoh: 123456789-abc.apps.googleusercontent.com"
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="google_client_secret">Google Client Secret</label>
                                    <input
                                        id="google_client_secret"
                                        type="password"
                                        value={data.google_client_secret}
                                        onChange={e => setData({...data, google_client_secret: e.target.value})}
                                        placeholder="••••••••••••••••••••••••"
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label htmlFor="google_redirect_url">Google Redirect URL (Callback)</label>
                                <input
                                    id="google_redirect_url"
                                    type="text"
                                    value={data.google_redirect_url}
                                    onChange={e => setData({...data, google_redirect_url: e.target.value})}
                                />
                                <p className="settings-field-hint">Salahkan URL ini ke Google Cloud Console untuk redirect URI.</p>
                            </div>
                        </div>
                    </section>

                    {/* Midtrans Section */}
                    <section className="settings-section" aria-labelledby="settings-midtrans-title">
                        <div className="settings-section-header">
                            <div className="settings-section-heading">
                                <span className="settings-section-icon settings-section-icon--midtrans"><CreditCard size={20} /></span>
                                <div>
                                    <h2 id="settings-midtrans-title">Midtrans Payment Gateway</h2>
                                    <p>QRIS, Virtual Account, dan kartu kredit secara otomatis.</p>
                                </div>
                            </div>
                            <label className="toggle-switch" title={data.midtrans_is_production ? 'Mode Live aktif' : 'Mode Sandbox aktif'}>
                                <input
                                    type="checkbox"
                                    checked={data.midtrans_is_production}
                                    onChange={e => setData({...data, midtrans_is_production: e.target.checked})}
                                />
                                <span className="toggle-slider"></span>
                            </label>
                        </div>
                        <div className="settings-section-body">
                            <div className={`settings-mode-banner ${data.midtrans_is_production ? 'live' : 'sandbox'}`}>
                                <div className="settings-mode-banner__content">
                                    <strong>{data.midtrans_is_production ? 'Mode Live' : 'Mode Sandbox'}</strong>
                                    <span>{data.midtrans_is_production
                                        ? 'Menggunakan akun Midtrans LIVE untuk transaksi asli.'
                                        : 'Menggunakan akun Midtrans Sandbox untuk simulasi.'}
                                    </span>
                                </div>
                                <span className="settings-mode-banner__icon">{data.midtrans_is_production ? '🚀' : '🛠️'}</span>
                            </div>
                            <div className="settings-form-grid">
                                <div className="form-group">
                                    <label htmlFor="midtrans_server_key">Midtrans Server Key</label>
                                    <input
                                        id="midtrans_server_key"
                                        type="password"
                                        value={data.midtrans_server_key}
                                        onChange={e => setData({...data, midtrans_server_key: e.target.value})}
                                        placeholder="SB-Mid-server-..."
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="midtrans_client_key">Midtrans Client Key</label>
                                    <input
                                        id="midtrans_client_key"
                                        type="text"
                                        value={data.midtrans_client_key}
                                        onChange={e => setData({...data, midtrans_client_key: e.target.value})}
                                        placeholder="SB-Mid-client-..."
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Meta Pixel Section */}
                    <section className="settings-section" aria-labelledby="settings-meta-title">
                        <div className="settings-section-header">
                            <div className="settings-section-heading">
                                <span className="settings-section-icon settings-section-icon--meta"><Activity size={20} /></span>
                                <div>
                                    <h2 id="settings-meta-title">Meta Pixel (Facebook Ads)</h2>
                                    <p>Server-side tracking untuk konversi iklan.</p>
                                </div>
                            </div>
                        </div>
                        <div className="settings-section-body">
                            <div className="settings-form-grid">
                                <div className="form-group">
                                    <label htmlFor="meta_pixel_id">Meta Pixel ID</label>
                                    <input
                                        id="meta_pixel_id"
                                        type="text"
                                        value={data.meta_pixel_id}
                                        onChange={e => setData({...data, meta_pixel_id: e.target.value})}
                                        placeholder="Contoh: 1234567890123456"
                                    />
                                    <p className="settings-field-hint">Temukan Pixel ID di <strong>Meta Business Manager → Events Manager → Data Sources</strong>. Kosongkan untuk menonaktifkan tracking.</p>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="meta_access_token">Meta Conversions API Token</label>
                                    <input
                                        id="meta_access_token"
                                        type="password"
                                        value={data.meta_access_token}
                                        onChange={e => setData({...data, meta_access_token: e.target.value})}
                                        placeholder="EAABxxxxx..."
                                    />
                                    <p className="settings-field-hint">Generate token ini dari tab <strong>Settings</strong> di Meta Events Manager.</p>
                                </div>
                            </div>
                            <div className="settings-info-card">
                                <div className="settings-info-card__header"><Info size={16} aria-hidden="true" /> Event yang dilacak otomatis</div>
                                <div className="settings-info-card__list">
                                    <div><code>PageView</code> — setiap halaman dibuka</div>
                                    <div><code>ViewContent</code> — halaman detail produk (dengan harga &amp; nama produk)</div>
                                    <div><code>InitiateCheckout</code> — saat user memulai checkout (dengan total nilai keranjang)</div>
                                    <div><code>Purchase</code> — setelah pembayaran berhasil (dengan revenue &amp; item data asli)</div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Mail / SMTP Section */}
                    <section className="settings-section" aria-labelledby="settings-mail-title">
                        <div className="settings-section-header">
                            <div className="settings-section-heading">
                                <span className="settings-section-icon settings-section-icon--mail"><Mail size={20} /></span>
                                <div>
                                    <h2 id="settings-mail-title">Pengaturan Email (SMTP)</h2>
                                    <p>Kirim struk pembelian dan notifikasi ke email pembeli.</p>
                                </div>
                            </div>
                        </div>
                        <div className="settings-section-body">
                            <div className="settings-form-grid">
                                <div className="form-group">
                                    <label htmlFor="mail_host">SMTP Host</label>
                                    <input
                                        id="mail_host"
                                        type="text"
                                        value={data.mail_host}
                                        onChange={e => setData({...data, mail_host: e.target.value})}
                                        placeholder="smtp.hostinger.com"
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="mail_port">SMTP Port</label>
                                    <input
                                        id="mail_port"
                                        type="text"
                                        value={data.mail_port}
                                        onChange={e => setData({...data, mail_port: e.target.value})}
                                        placeholder="587"
                                    />
                                </div>
                            </div>
                            <div className="settings-form-grid">
                                <div className="form-group">
                                    <label htmlFor="mail_username">Username Email</label>
                                    <input
                                        id="mail_username"
                                        type="text"
                                        value={data.mail_username}
                                        onChange={e => setData({...data, mail_username: e.target.value})}
                                        placeholder="no-reply@jaggadacademy.com"
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="mail_password">Password Email</label>
                                    <input
                                        id="mail_password"
                                        type="password"
                                        value={data.mail_password}
                                        onChange={e => setData({...data, mail_password: e.target.value})}
                                        placeholder="••••••••••••"
                                    />
                                </div>
                            </div>
                            <div className="settings-form-grid">
                                <div className="form-group">
                                    <label htmlFor="mail_encryption">Enkripsi</label>
                                    <select
                                        id="mail_encryption"
                                        value={data.mail_encryption}
                                        onChange={e => setData({...data, mail_encryption: e.target.value})}
                                    >
                                        <option value="tls">TLS (port 587)</option>
                                        <option value="ssl">SSL (port 465)</option>
                                        <option value="">Tanpa Enkripsi</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="mail_from_name">Nama Pengirim</label>
                                    <input
                                        id="mail_from_name"
                                        type="text"
                                        value={data.mail_from_name}
                                        onChange={e => setData({...data, mail_from_name: e.target.value})}
                                        placeholder="JAGGAD ACADEMY"
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label htmlFor="mail_from_address">Alamat Email Pengirim (From)</label>
                                <input
                                    id="mail_from_address"
                                    type="email"
                                    value={data.mail_from_address}
                                    onChange={e => setData({...data, mail_from_address: e.target.value})}
                                    placeholder="no-reply@jaggadacademy.com"
                                />
                                <p className="settings-field-hint">Alamat ini akan tampil sebagai pengirim di inbox penerima.</p>
                            </div>
                        </div>
                    </section>

                    <div className="settings-footer">
                        <button className="btn-admin-primary" type="submit" disabled={isSaving}>
                            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                            <span>{isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}</span>
                        </button>
                    </div>
                </form>
            </main>
        </AdminLayout>
    );
}
