import { Head } from '@inertiajs/react';
import { MessageSquare, Clock, Plus, Filter, Search, MoreHorizontal } from 'lucide-react';
import AdminLayout from '../../Layouts/AdminLayout';
import './Admin.css';

export default function AdminTestimonials() {
    return (
        <AdminLayout>
            <Head title="Testimoni - JAGGAD ACADEMY" />
            <div className="admin-page">
                <div className="admin-page-header">
                    <h1>Testimoni Pelanggan</h1>
                    <p className="admin-page-subtitle">Kelola dan kurasi ulasan dari para alumni JAGGAD ACADEMY</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '400px', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-xl)', border: '1px dashed var(--color-border)', color: 'var(--color-text-muted)' }}>
                    <MessageSquare size={64} style={{ opacity: 0.1, marginBottom: 'var(--space-4)' }} />
                    <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>Modul Dalam Pengembangan</h3>
                    <p style={{ fontSize: 'var(--text-sm)', textAlign: 'center', maxWidth: 400, marginTop: 'var(--space-2)' }}>
                        Fitur peninjauan testimoni dan sistem bintang sedang disiapkan untuk rilis versi berikutnya. Tetap pantau update kami!
                    </p>
                </div>
            </div>
        </AdminLayout>
    );
}
