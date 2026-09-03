import { Head, Link, useForm } from '@inertiajs/react';
import './Auth.css';

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('password.email'));
    };

    return (
        <div className="auth-page">
            <Head title="Lupa Password" />
            <div className="auth-bg-glow" />
            
            <div className="auth-card">
                <div className="auth-header">
                    <Link href="/" className="auth-brand">JAGGAD<span>Academy</span></Link>
                    <h1 className="auth-title">Lupa Password?</h1>
                    <p className="auth-subtitle">Masukkan email Anda untuk menerima link reset password.</p>
                </div>

                {status && (
                    <div className="mb-4 text-sm font-medium text-green-600 text-center">
                        {status}
                    </div>
                )}

                <form className="auth-form" onSubmit={submit}>
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
                            autoFocus
                        />
                        {errors.email && <span className="text-xs text-red-500 mt-1">{errors.email}</span>}
                    </div>

                    <button type="submit" className="btn-auth" disabled={processing}>
                        {processing ? 'Mengirim...' : 'Kirim Link Reset'}
                    </button>
                </form>

                <p className="auth-footer">
                    Ingat password Anda? <Link href={route('login')}>Masuk kembali</Link>
                </p>
                <p className="auth-footer">
                    Kembali ke halaman utama? <Link href="/">Kembali</Link>
                </p>
            </div>
        </div>
    );
}
