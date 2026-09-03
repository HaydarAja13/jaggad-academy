import { Head } from '@inertiajs/react';
import { Bot, Construction, Rocket, Zap, Brain, MessageSquare } from 'lucide-react';
import AdminLayout from '../../Layouts/AdminLayout';
import './Admin.css';

export default function AdminChatbot() {
    return (
        <AdminLayout>
            <Head title="Chatbot & AI Management - JAGGAD ACADEMY" />
            <div className="admin-page">
                <div className="admin-page-header">
                    <h1>JAGGAD AI Chatbot</h1>
                    <p className="admin-page-subtitle">Otomatisasi pelayanan pelanggan menggunakan teknologi Artificial Intelligence</p>
                </div>

                <div className="admin-table-card" style={{ 
                    minHeight: '400px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    textAlign: 'center',
                    padding: 'var(--space-10)',
                    background: 'linear-gradient(180deg, var(--color-bg-secondary) 0%, rgba(var(--color-bg-primary-rgb), 0) 100%)',
                    border: '1px dashed var(--color-border)',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    {/* Decorative Background Icons */}
                    <div style={{ position: 'absolute', top: '10%', left: '10%', opacity: 0.05, transform: 'rotate(-15deg)' }}><Brain size={120} /></div>
                    <div style={{ position: 'absolute', bottom: '10%', right: '10%', opacity: 0.05, transform: 'rotate(15deg)' }}><MessageSquare size={120} /></div>
                    
                    <div style={{ 
                        width: 80, 
                        height: 80, 
                        borderRadius: '24px', 
                        background: 'var(--color-accent-dim)', 
                        color: 'var(--color-accent-light)',
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        marginBottom: 'var(--space-6)',
                        boxShadow: '0 0 40px rgba(var(--color-accent-rgb), 0.2)'
                    }}>
                        <Construction size={40} className="animate-pulse" />
                    </div>

                    <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: 'var(--space-2)' }}>
                        Fitur Dalam Pengembangan 🛠️
                    </h2>
                    <p style={{ maxWidth: '450px', color: 'var(--color-text-muted)', lineHeight: 1.6, fontSize: 'var(--text-base)' }}>
                        Kami sedang membangun integrasi kecerdasan buatan (AI) untuk membantu Anda melayani pelanggan secara otomatis 24/7.
                    </p>

                    {/* <div style={{ 
                        display: 'flex', 
                        gap: 'var(--space-4)', 
                        marginTop: 'var(--space-8)',
                        flexWrap: 'wrap',
                        justifyContent: 'center'
                    }}>
                        <div className="status-badge warning" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: 16 }}>
                            <Zap size={14} /> OpenAI GPT-4o Integration
                        </div>
                        <div className="status-badge" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: 16, background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-muted)', border: 'none' }}>
                            <Rocket size={14} /> Smart Knowledge (RAG)
                        </div>
                    </div> */}

                    {/* <div style={{ marginTop: 'var(--space-10)', fontSize: 'var(--text-xs)', color: 'var(--color-text-dim)', fontStyle: 'italic' }}>
                        Estimasi rilis: Q2 2026
                    </div> */}
                </div>
            </div>
        </AdminLayout>
    );
}
