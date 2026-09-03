import { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { Save, ArrowLeft, Loader2 } from 'lucide-react';
import MainLayout from '../../Layouts/MainLayout';
import toast from 'react-hot-toast';
import './User.css';

export default function EditProfile({ auth }) {
    const user = auth.user;
    
    const { data, setData, patch, errors, processing, recentlySuccessful } = useForm({
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        password: '',
        password_confirmation: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        patch(route('profile.update'), {
            onSuccess: () => toast.success('Profil berhasil diperbarui'),
            onError: () => toast.error('Gagal memperbarui profil. Periksa data kembali.'),
            preserveScroll: true
        });
    };

    return (
        <MainLayout>
            <Head title="Edit Profil - JAGGAD ACADEMY" />
            <div className="edit-profile-page">
                <div className="dashboard-header">
                    <div className="container">
                        <Link href={route('dashboard')} className="btn-back">
                            <ArrowLeft size={18} /> Kembali ke Dashboard
                        </Link>
                        <div className="dashboard-welcome" style={{ marginTop: 'var(--space-4)' }}>
                            <div className="welcome-avatar">{user?.name?.[0] || 'U'}</div>
                            <div>
                                <h1>Edit Profil, <span className="text-gradient">{user?.name}</span>!</h1>
                                <p>Perbarui informasi pribadi dan keamanan akun Anda.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="container edit-profile-main">
                    <div className="edit-profile-card">
                        <form onSubmit={handleSubmit}>
                            {/* Personal Info */}
                            <div className="form-section">
                                <h3 className="section-title-small">Informasi Pribadi</h3>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Nama Lengkap</label>
                                        <input
                                            type="text"
                                            value={data.name}
                                            onChange={e => setData('name', e.target.value)}
                                            required
                                            className={errors.name ? 'border-red-500' : ''}
                                        />
                                        {errors.name && <small className="text-red-500">{errors.name}</small>}
                                    </div>
                                    <div className="form-group">
                                        <label>Email</label>
                                        <input
                                            type="email"
                                            value={data.email}
                                            onChange={e => setData('email', e.target.value)}
                                            required
                                            className={errors.email ? 'border-red-500' : ''}
                                        />
                                        {errors.email && <small className="text-red-500">{errors.email}</small>}
                                    </div>
                                    <div className="form-group">
                                        <label>Nomor Telepon</label>
                                        <input
                                            type="tel"
                                            value={data.phone}
                                            onChange={e => setData('phone', e.target.value)}
                                            placeholder="Contoh: 081234567890"
                                        />
                                        {errors.phone && <small className="text-red-500">{errors.phone}</small>}
                                    </div>
                                </div>
                            </div>

                            <div className="form-divider" />

                            {/* Security Info */}
                            <div className="form-section">
                                <h3 className="section-title-small">Keamanan (Ganti Password)</h3>
                                <p className="section-desc">Kosongkan jika tidak ingin mengubah password.</p>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Password Baru</label>
                                        <input
                                            type="password"
                                            value={data.password}
                                            onChange={e => setData('password', e.target.value)}
                                            placeholder="Minimal 8 karakter"
                                            autoComplete="new-password"
                                        />
                                        {errors.password && <small className="text-red-500">{errors.password}</small>}
                                    </div>
                                    <div className="form-group">
                                        <label>Konfirmasi Password</label>
                                        <input
                                            type="password"
                                            value={data.password_confirmation}
                                            onChange={e => setData('password_confirmation', e.target.value)}
                                            autoComplete="new-password"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="form-actions">
                                <Link href={route('dashboard')} className="btn-secondary">Batal</Link>
                                <button type="submit" className="btn-primary" disabled={processing}>
                                    {processing ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                                    Simpan Perubahan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
