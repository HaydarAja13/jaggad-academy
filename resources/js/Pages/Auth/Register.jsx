import { useState, useEffect } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import './Auth.css';

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const [showPass, setShowPass] = useState(false);

    useEffect(() => {
        return () => {
            reset('password', 'password_confirmation');
        };
    }, []);

    const submit = (e) => {
        e.preventDefault();
        post(route('register'));
    };

    return (
        <div className="auth-page">
            <Head title="Register" />
            <div className="auth-bg-glow" />
            
            <div className="auth-card">
                <div className="auth-header">
                    <Link href="/" className="auth-brand">JAGGAD<span>Academy</span></Link>
                    <h1 className="auth-title">Buat Akun</h1>
                    <p className="auth-subtitle">Daftar dan mulai perjalanan belajar Anda</p>
                </div>

                <form className="auth-form" onSubmit={submit}>
                    <div className="form-group">
                        <label htmlFor="name">Nama Lengkap</label>
                        <input 
                            id="name"
                            type="text" 
                            className="form-input" 
                            placeholder="Nama lengkap Anda" 
                            value={data.name} 
                            onChange={e => setData('name', e.target.value)} 
                            required 
                            autoComplete="name"
                        />
                        {errors.name && <span className="text-xs text-red-500 mt-1">{errors.name}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input 
                            id="email"
                            type="email" 
                            className="form-input" 
                            placeholder="email@example.com" 
                            value={data.email} 
                            onChange={e => setData('email', e.target.value)} 
                            required 
                            autoComplete="username"
                        />
                        {errors.email && <span className="text-xs text-red-500 mt-1">{errors.email}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <div className="input-wrap">
                            <input 
                                id="password"
                                type={showPass ? 'text' : 'password'} 
                                className="form-input" 
                                placeholder="Minimal 6 karakter" 
                                value={data.password} 
                                onChange={e => setData('password', e.target.value)} 
                                required 
                                autoComplete="new-password"
                            />
                            <button 
                                type="button" 
                                className="toggle-pass" 
                                onClick={() => setShowPass(!showPass)}
                            >
                                {showPass ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                )}
                            </button>
                        </div>
                        {errors.password && <span className="text-xs text-red-500 mt-1">{errors.password}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="password_confirmation">Konfirmasi Password</label>
                        <input 
                            id="password_confirmation"
                            type="password" 
                            className="form-input" 
                            placeholder="Ketik ulang password" 
                            value={data.password_confirmation} 
                            onChange={e => setData('password_confirmation', e.target.value)} 
                            required 
                            autoComplete="new-password"
                        />
                        {errors.password_confirmation && <span className="text-xs text-red-500 mt-1">{errors.password_confirmation}</span>}
                    </div>

                    <button type="submit" className="btn-auth mt-4" disabled={processing}>
                        {processing ? 'Memproses...' : 'Daftar Sekarang'}
                    </button>
                </form>

                <div className="auth-divider">atau</div>

                <a href={route('auth.google')} className="btn-google">
                    <svg viewBox="0 0 48 48">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                    </svg>
                    Daftar dengan Google
                </a>

                <p className="auth-footer">
                    Sudah punya akun? <Link href={route('login')}>Masuk</Link>
                </p>
                <p className="auth-footer">
                    Kembali ke halaman utama? <Link href="/">Kembali</Link>
                </p>
            </div>
        </div>
    );
}
