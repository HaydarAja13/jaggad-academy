import { useState, useEffect } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import './Auth.css';

export default function ResetPassword({ token, email }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        token: token,
        email: email,
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
        post(route('password.store'));
    };

    return (
        <div className="auth-page">
            <Head title="Reset Password" />
            <div className="auth-bg-glow" />
            
            <div className="auth-card">
                <div className="auth-header">
                    <Link href="/" className="auth-brand">JAGGAD<span>Academy</span></Link>
                    <h1 className="auth-title">Reset Password</h1>
                    <p className="auth-subtitle">Masukkan password baru Anda.</p>
                </div>

                <form className="auth-form" onSubmit={submit}>
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input 
                            id="email"
                            type="email" 
                            className="form-input" 
                            value={data.email} 
                            onChange={e => setData('email', e.target.value)} 
                            required 
                            readOnly
                        />
                        {errors.email && <span className="text-xs text-red-500 mt-1">{errors.email}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password Baru</label>
                        <div className="input-wrap">
                            <input 
                                id="password"
                                type={showPass ? 'text' : 'password'} 
                                className="form-input" 
                                placeholder="••••••••" 
                                value={data.password} 
                                onChange={e => setData('password', e.target.value)} 
                                required 
                                autoFocus
                            />
                        </div>
                        {errors.password && <span className="text-xs text-red-500 mt-1">{errors.password}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="password_confirmation">Konfirmasi Password Baru</label>
                        <div className="input-wrap">
                            <input 
                                id="password_confirmation"
                                type={showPass ? 'text' : 'password'} 
                                className="form-input" 
                                placeholder="••••••••" 
                                value={data.password_confirmation} 
                                onChange={e => setData('password_confirmation', e.target.value)} 
                                required 
                            />
                        </div>
                        {errors.password_confirmation && <span className="text-xs text-red-500 mt-1">{errors.password_confirmation}</span>}
                    </div>

                    <div className="flex items-center justify-end mb-4">
                        <button 
                            type="button" 
                            className="text-xs text-zinc-600 hover:text-[var(--color-accent)]"
                            onClick={() => setShowPass(!showPass)}
                        >
                            {showPass ? 'Sembunyikan Password' : 'Lihat Password'}
                        </button>
                    </div>

                    <button type="submit" className="btn-auth" disabled={processing}>
                        {processing ? 'Memproses...' : 'Reset Password'}
                    </button>
                </form>
            </div>
        </div>
    );
}
