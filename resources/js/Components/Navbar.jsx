import { useState, useEffect, useId, useRef } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { ShoppingCart, Menu, X, User, LogOut, LayoutDashboard, Shield } from 'lucide-react';
import { useCart } from '../Contexts/CartContext';
import { useContent } from '../Contexts/ContentContext';
import { getStorageUrl } from '../Utils/helpers';
import { confirmLogout } from '../Utils/confirmLogout';
import './Navbar.css';

export default function Navbar({ previewMode = false }) {
    const { auth } = usePage().props;
    const { count } = useCart();
    const user = previewMode ? null : auth.user;
    const isAdmin = user && user.role === 'admin';

    const [mobileOpen, setMobileOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const dropdownId = useId();

    const { url } = usePage();
    useEffect(() => {
        const handler = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handler);
        // Sync scroll state on navigation
        handler();
        return () => window.removeEventListener('scroll', handler);
    }, [url]);

    useEffect(() => {
        setDropdownOpen(false);
        setMobileOpen(false);
    }, [url]);

    useEffect(() => {
        if (!dropdownOpen && !mobileOpen) return;

        const handlePointerDown = (event) => {
            if (!dropdownRef.current?.contains(event.target)) {
                setDropdownOpen(false);
            }
        };

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                setDropdownOpen(false);
                setMobileOpen(false);
                if (dropdownOpen) requestAnimationFrame(() => dropdownRef.current?.querySelector('button')?.focus());
            }
        };

        document.addEventListener('mousedown', handlePointerDown);
        document.addEventListener('touchstart', handlePointerDown);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('mousedown', handlePointerDown);
            document.removeEventListener('touchstart', handlePointerDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [dropdownOpen, mobileOpen]);

    const { content } = useContent();
    const home = content?.home || {};
    const navLinks = [
        { name: 'home', href: route('home'), label: home.navHomeLabel, previewId: 'preview-home-nav-home' },
        { name: 'products', href: route('products'), label: home.navProductsLabel, previewId: 'preview-home-nav-products' },
        { name: 'ads', href: route('ads'), label: 'Promo' },
        { name: 'about', href: route('about'), label: home.navAboutLabel, previewId: 'preview-home-nav-about' },
        { name: 'contact', href: route('contact'), label: home.navContactLabel, previewId: 'preview-home-nav-contact' },
    ];

    return (
        <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
            <div className="navbar__inner container">
                <Link href={route('home')} className="navbar__brand">
                    {content.branding?.logo && <img src={getStorageUrl(content.branding.logo)} alt="" style={{ height: '44px', width: 'auto', objectFit: 'contain' }} />}
                    <span className="navbar__logo">{content.branding.siteName}</span>
                    <span className="navbar__tagline">{content.branding.siteTagline}</span>
                </Link>

                <ul className="navbar__links">
                    {navLinks.map(link => (
                        <li key={link.label}>
                            <Link 
                                id={link.previewId}
                                href={link.href} 
                                className={`navbar__link ${link.name && route().current(link.name) ? 'navbar__link--active' : ''}`}
                            >
                                {link.label}
                            </Link>
                        </li>
                    ))}
                </ul>

                <div className="navbar__actions">
                    {user && (
                        <Link href={route('checkout')} className="navbar__cart" aria-label={`Keranjang belanja, ${count} item`}>
                            <ShoppingCart size={20} aria-hidden="true" />
                            {count > 0 && <span className="navbar__cart-badge">{count}</span>}
                        </Link>
                    )}

                    {user ? (
                        <div className="navbar__user" ref={dropdownRef}>
                            <button
                                type="button"
                                className={`navbar__avatar ${dropdownOpen ? 'navbar__avatar--open' : ''}`}
                                aria-expanded={dropdownOpen}
                                aria-controls={dropdownId}
                                aria-label={`Buka menu akun ${user.name}`}
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                            >
                                <div className="avatar-circle">{user.name?.[0] || '?'}</div>
                            </button>
                            {dropdownOpen && (
                                <div className="navbar__dropdown" id={dropdownId}>
                                    <div className="navbar__dropdown-header">
                                        <p className="dropdown-name">{user.name}</p>
                                        <p className="dropdown-email">{user.email}</p>
                                    </div>
                                    <div className="navbar__dropdown-divider" />
                                    {isAdmin ? (
                                        <Link href="/admin" className="navbar__dropdown-item" onClick={() => setDropdownOpen(false)}>
                                            <Shield size={16} aria-hidden="true" /> Dashboard Admin
                                        </Link>
                                    ) : (
                                        <Link href={route('dashboard')} className="navbar__dropdown-item" onClick={() => setDropdownOpen(false)}>
                                            <LayoutDashboard size={16} aria-hidden="true" /> Dashboard Saya
                                        </Link>
                                    )}
                                    <Link href={route('profile.edit')} className="navbar__dropdown-item" onClick={() => setDropdownOpen(false)}>
                                        <User size={16} aria-hidden="true" /> Edit Profil
                                    </Link>
                                    <button 
                                        type="button"
                                        className="navbar__dropdown-item navbar__dropdown-item--danger" 
                                        onClick={(e) => {
                                            setDropdownOpen(false);
                                            confirmLogout(e);
                                        }}
                                    >
                                        <LogOut size={16} aria-hidden="true" /> Keluar
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="navbar__auth">
                            <Link id="preview-home-nav-login" href={route('login')} className="btn-ghost-sm">{home.navLoginLabel}</Link>
                            <Link id="preview-home-nav-register" href={route('register')} className="btn-primary-sm">{home.navRegisterLabel}</Link>
                        </div>
                    )}

                    <button
                        type="button"
                        className="navbar__mobile-toggle"
                        aria-label={mobileOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
                        aria-expanded={mobileOpen}
                        aria-controls="navbar-mobile-menu"
                        onClick={() => setMobileOpen(!mobileOpen)}
                    >
                        {mobileOpen ? <X size={22} /> : <Menu size={22} />}
                    </button>
                </div>
            </div>

            {mobileOpen && (
                <div className="navbar__mobile" id="navbar-mobile-menu">
                    {navLinks.map(link => (
                        <Link 
                            key={link.label} 
                            href={link.href} 
                            className={`navbar__mobile-link ${link.name && route().current(link.name) ? 'active' : ''}`} 
                            onClick={() => setMobileOpen(false)}
                        >
                            {link.label}
                        </Link>
                    ))}
                    {!user && (
                        <div className="navbar__mobile-auth">
                            <Link href={route('login')} className="btn-ghost-sm" onClick={() => setMobileOpen(false)}>{home.navLoginLabel}</Link>
                            <Link href={route('register')} className="btn-primary-sm" onClick={() => setMobileOpen(false)}>{home.navRegisterLabel}</Link>
                        </div>
                    )}
                </div>
            )}
        </nav>
    );
}
