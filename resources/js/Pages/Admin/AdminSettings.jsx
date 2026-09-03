import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Save, Loader2, Settings, ShieldCheck, Link2, AlertCircle, CreditCard, Activity, Mail } from 'lucide-react';
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
            
            <div className="admin-page">
                <div className="admin-page-header">
                    <h1>Pengaturan Sistem</h1>
                    <p className="admin-page-subtitle">Kelola kredensial API dan konfigurasi eksternal</p>
                </div>

                <div className="admin-table-card" style={{ padding: 'var(--space-8)' }}>
                    <form onSubmit={handleSave} className="modal-form">
                        {/* Google Auth Section */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: 'var(--space-4)', color: 'var(--color-accent-light)' }}>
                            <ShieldCheck size={20} />
                            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>Google Auth Credentials</h3>
                        </div>

                        <div className="form-group">
                            <label>Google Client ID</label>
                            <input 
                                type="text"
                                value={data.google_client_id}
                                onChange={e => setData({...data, google_client_id: e.target.value})}
                                placeholder="Contoh: 123456789-abc.apps.googleusercontent.com"
                            />
                        </div>

                        <div className="form-group">
                            <label>Google Client Secret</label>
                            <input 
                                type="password"
                                value={data.google_client_secret}
                                onChange={e => setData({...data, google_client_secret: e.target.value})}
                                placeholder="••••••••••••••••••••••••"
                            />
                        </div>

                        <div className="form-group" style={{ marginBottom: 'var(--space-8)' }}>
                            <label>Google Redirect URL (Callback)</label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input 
                                    type="text"
                                    value={data.google_redirect_url}
                                    onChange={e => setData({...data, google_redirect_url: e.target.value})}
                                />
                                <button 
                                    type="button" 
                                    className="btn-icon" 
                                    onClick={() => {
                                        navigator.clipboard.writeText(data.google_redirect_url);
                                        toast.success('URL berhasil disalin!');
                                    }}
                                >
                                    <Link2 size={18} />
                                </button>
                            </div>
                        </div>

                        <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 'var(--space-8) 0' }} />

                        {/* Midtrans Section */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: 'var(--space-4)', color: '#10b981' }}>
                            <CreditCard size={20} />
                            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>Midtrans Payment Gateway</h3>
                        </div>

                        <div style={{ 
                            padding: 'var(--space-6)', 
                            background: 'var(--color-bg-secondary)', 
                            borderRadius: 'var(--radius-xl)',
                            border: '1px solid var(--color-border)',
                            marginBottom: 'var(--space-6)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                             <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                                    Production Mode {data.midtrans_is_production ? '🚀' : '🛠️'}
                                </span>
                                <span style={{ fontSize: '16px', color: 'var(--color-text-muted)' }}>
                                    {data.midtrans_is_production 
                                        ? 'Sistem menggunakan akun Midtrans LIVE untuk transaksi asli.' 
                                        : 'Sistem menggunakan akun Midtrans Sandbox untuk simulasi.'}
                                </span>
                             </div>

                             <label className="toggle-switch">
                                <input 
                                    type="checkbox" 
                                    checked={data.midtrans_is_production}
                                    onChange={e => setData({...data, midtrans_is_production: e.target.checked})}
                                />
                                <span className="toggle-slider"></span>
                             </label>
                        </div>

                        <div className="form-group">
                            <label>Midtrans Server Key</label>
                            <input 
                                type="password"
                                value={data.midtrans_server_key}
                                onChange={e => setData({...data, midtrans_server_key: e.target.value})}
                                placeholder="SB-Mid-server-..."
                            />
                        </div>

                        <div className="form-group">
                            <label>Midtrans Client Key</label>
                            <input 
                                type="text"
                                value={data.midtrans_client_key}
                                onChange={e => setData({...data, midtrans_client_key: e.target.value})}
                                placeholder="SB-Mid-client-..."
                            />
                        </div>

                        <div style={{ marginTop: 'var(--space-8)' }}>
                            <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '0 0 var(--space-8) 0' }} />

                            {/* Meta Pixel Section */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: 'var(--space-4)', color: '#3b82f6' }}>
                                <Activity size={20} />
                                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>Meta Pixel (Facebook Ads)</h3>
                            </div>

                            <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
                                <label>Meta Pixel ID</label>
                                <input
                                    type="text"
                                    value={data.meta_pixel_id}
                                    onChange={e => setData({...data, meta_pixel_id: e.target.value})}
                                    placeholder="Contoh: 1234567890123456"
                                />
                                <p style={{ fontSize: '16px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                                    Temukan Pixel ID di <strong>Meta Business Manager → Events Manager → Data Sources</strong>.
                                    Kosongkan untuk menonaktifkan tracking.
                                </p>
                            </div>

                            <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
                                <label>Meta Conversions API Token</label>
                                <input
                                    type="password"
                                    value={data.meta_access_token}
                                    onChange={e => setData({...data, meta_access_token: e.target.value})}
                                    placeholder="EAABxxxxx..."
                                />
                                <p style={{ fontSize: '16px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                                    Digunakan untuk Server-Side Tracking. Generate token ini dari tab <strong>Settings</strong> di Meta Events Manager.
                                </p>
                            </div>

                            <div style={{ 
                                padding: 'var(--space-4)', 
                                background: 'rgba(59,130,246,0.1)', 
                                border: '1px solid rgba(59,130,246,0.2)', 
                                borderRadius: 'var(--radius-md)',
                                fontSize: '16px',
                                color: 'var(--color-text-secondary)',
                                lineHeight: 1.6
                            }}>
                                📊 <strong>Event yang dilacak otomatis:</strong><br/>
                                • <code>PageView</code> — setiap halaman dibuka<br/>
                                • <code>ViewContent</code> — halaman detail produk (dengan harga & nama produk)<br/>
                                • <code>InitiateCheckout</code> — saat user memulai checkout (dengan total nilai keranjang)<br/>
                                • <code>Purchase</code> — setelah pembayaran berhasil (dengan revenue & item data asli)
                            </div>
                        </div>

                        <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 'var(--space-8) 0' }} />

                        {/* Mail / SMTP Section */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: 'var(--space-4)', color: '#f59e0b' }}>
                            <Mail size={20} />
                            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>Pengaturan Email (SMTP)</h3>
                        </div>
                        <p style={{ fontSize: '16px', color: 'var(--color-text-muted)', marginBottom: 'var(--space-5)', lineHeight: 1.6 }}>
                            Konfigurasi ini digunakan untuk mengirim struk pembelian ke email pembeli. Isi dengan kredensial SMTP dari Hostinger, Gmail, atau provider email lainnya.
                        </p>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-2)' }}>
                            <div className="form-group">
                                <label>SMTP Host</label>
                                <input
                                    type="text"
                                    value={data.mail_host}
                                    onChange={e => setData({...data, mail_host: e.target.value})}
                                    placeholder="smtp.hostinger.com"
                                />
                            </div>
                            <div className="form-group">
                                <label>SMTP Port</label>
                                <input
                                    type="text"
                                    value={data.mail_port}
                                    onChange={e => setData({...data, mail_port: e.target.value})}
                                    placeholder="587"
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-2)' }}>
                            <div className="form-group">
                                <label>Username Email</label>
                                <input
                                    type="text"
                                    value={data.mail_username}
                                    onChange={e => setData({...data, mail_username: e.target.value})}
                                    placeholder="no-reply@jaggadacademy.com"
                                />
                            </div>
                            <div className="form-group">
                                <label>Password Email</label>
                                <input
                                    type="password"
                                    value={data.mail_password}
                                    onChange={e => setData({...data, mail_password: e.target.value})}
                                    placeholder="••••••••••••"
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-2)' }}>
                            <div className="form-group">
                                <label>Enkripsi</label>
                                <select
                                    value={data.mail_encryption}
                                    onChange={e => setData({...data, mail_encryption: e.target.value})}
                                    style={{ width: '100%', padding: '10px 12px', background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-primary)', fontSize: '16px' }}
                                >
                                    <option value="tls">TLS (port 587)</option>
                                    <option value="ssl">SSL (port 465)</option>
                                    <option value="">Tanpa Enkripsi</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Nama Pengirim</label>
                                <input
                                    type="text"
                                    value={data.mail_from_name}
                                    onChange={e => setData({...data, mail_from_name: e.target.value})}
                                    placeholder="JAGGAD ACADEMY"
                                />
                            </div>
                        </div>

                        <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
                            <label>Alamat Email Pengirim (From)</label>
                            <input
                                type="email"
                                value={data.mail_from_address}
                                onChange={e => setData({...data, mail_from_address: e.target.value})}
                                placeholder="no-reply@jaggadacademy.com"
                            />
                            <p style={{ fontSize: '16px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                                Alamat ini akan tampil sebagai pengirim di inbox penerima.
                            </p>
                        </div>

                        <div style={{ marginTop: 'var(--space-6)', display: 'flex', justifyContent: 'flex-end' }}>
                            <button className="btn-admin-primary" disabled={isSaving}>
                                {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                <span>{isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AdminLayout>
    );
}
