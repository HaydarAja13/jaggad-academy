import { Link, usePage } from '@inertiajs/react';
import {
    LayoutDashboard, Package, FileBox, Receipt, Users,
    MessageSquare, FileEdit, CreditCard, Bot, LogOut, ChevronRight, Menu, Megaphone, Settings
} from 'lucide-react';
import { useContent } from '../Contexts/ContentContext';
import { getStorageUrl } from '../Utils/helpers';
import { confirmLogout } from '../Utils/confirmLogout';
import './AdminSidebar.css';

const menuGroups = [
    {
        label: 'Ringkasan',
        items: [{ href: route('admin.dashboard'), icon: LayoutDashboard, label: 'Dashboard' }],
    },
    {
        label: 'Operasional',
        items: [
            { href: route('admin.transactions.index'), icon: Receipt, label: 'Transaksi' },
            { href: route('admin.products.index'), icon: Package, label: 'Produk' },
            { href: route('admin.categories.index'), icon: FileBox, label: 'Kategori' },
            { href: route('admin.users.index'), icon: Users, label: 'Pengguna' },
        ],
    },
    {
        label: 'Konten',
        items: [
            { href: route('admin.content.index'), icon: FileEdit, label: 'CMS Konten' },
            { href: route('admin.ads.index'), icon: Megaphone, label: 'Halaman Ads' },
            { href: route('admin.testimonials.index'), icon: MessageSquare, label: 'Testimoni', soon: true },
        ],
    },
    {
        label: 'Sistem',
        items: [
            { href: route('admin.payment.index'), icon: CreditCard, label: 'Pembayaran' },
            { href: route('admin.chatbot.index'), icon: Bot, label: 'Chatbot AI' },
            { href: route('admin.settings.index'), icon: Settings, label: 'Pengaturan' },
        ],
    },
];

export default function AdminSidebar({ isCollapsed, toggleSidebar }) {
    const { props, url } = usePage();
    const { auth } = props;
    const { content } = useContent();
    const user = auth?.user;

    const isActive = href => {
        const currentPath = url.split('?')[0];
        const hrefPath = new URL(href, 'http://jaggad.local').pathname;
        return hrefPath === '/admin' ? currentPath === hrefPath : currentPath === hrefPath || currentPath.startsWith(`${hrefPath}/`);
    };

    return (
        <aside className={`admin-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
            <div className="admin-sidebar__header">
                <Link href="/" className="admin-sidebar__brand" aria-label="Kembali ke situs JAGGAD ACADEMY">
                    {content.branding?.logo ? (
                        <img src={getStorageUrl(content.branding.logo)} alt="JAGGAD ACADEMY" className="brand-logo brand-logo--image" />
                    ) : (
                        <span className="brand-logo brand-logo--fallback">{content.branding?.siteName || "JAGGAD"}</span>
                    )}
                    {!isCollapsed && (
                        <span className="admin-sidebar__brand-copy">
                            <span className="brand-logo">{content.branding?.siteName || "JAGGAD"}</span>
                            <span className="brand-sub">{content.branding?.siteTagline || "Academy"}</span>
                        </span>
                    )}
                </Link>
                <button className="admin-sidebar__toggle" onClick={toggleSidebar} aria-label={isCollapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'} aria-expanded={!isCollapsed}>
                    <Menu size={20} />
                </button>
            </div>

            <nav className="admin-sidebar__nav">
                {menuGroups.map(group => (
                    <div className="admin-sidebar__group" key={group.label}>
                        {!isCollapsed && <p className="admin-sidebar__section-label">{group.label}</p>}
                        {group.items.map(({ href, icon: Icon, label, soon }) => {
                            const active = isActive(href);
                            return (
                                <Link
                                    key={label}
                                    href={href}
                                    className={`admin-sidebar__link ${active ? 'active' : ''}`}
                                    title={isCollapsed ? label : undefined}
                                    aria-current={active ? 'page' : undefined}
                                >
                                    <Icon size={19} aria-hidden="true" />
                                    {!isCollapsed && <span>{label}</span>}
                                    {!isCollapsed && soon && <small className="admin-sidebar__soon">Soon</small>}
                                    {!isCollapsed && !soon && <ChevronRight size={16} className="chevron" aria-hidden="true" />}
                                </Link>
                            );
                        })}
                    </div>
                ))}
            </nav>

            <div className="admin-sidebar__footer">
                <div className="admin-sidebar__user">
                    {user?.avatar ? (
                        <img src={user.avatar} alt={user.name} className="admin-sidebar__avatar admin-sidebar__avatar--image" />
                    ) : (
                        <div className="admin-sidebar__avatar">{user?.name?.[0] || 'A'}</div>
                    )}
                    {!isCollapsed && (
                        <div className="admin-sidebar__account">
                            <p className="admin-sidebar__name">{user?.name || 'Admin'}</p>
                            <p className="admin-sidebar__role">Administrator</p>
                        </div>
                    )}
                </div>
                <button onClick={confirmLogout} className="admin-sidebar__logout" title="Keluar" aria-label="Keluar dari akun admin">
                    <LogOut size={18} aria-hidden="true" />
                </button>
            </div>
        </aside>
    );
}
