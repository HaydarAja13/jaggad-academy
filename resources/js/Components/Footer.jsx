import { Link } from '@inertiajs/react';
import { Instagram, Youtube, Twitter, Mail, Phone, MapPin, Zap } from 'lucide-react';
import { useContent } from '../Contexts/ContentContext';
import { getStorageUrl } from '../Utils/helpers';
import './Footer.css';

export default function Footer() {
    const { content } = useContent();
    const contact = content?.contact || {};
    const home = content?.home || {};
    const social = content?.social || {};
    const productLinks = [
        { id: 'preview-home-footer-product-ebook', label: home.footerProductEbookLabel, href: route('products', { category: 'ebook' }) },
        { id: 'preview-home-footer-product-video', label: home.footerProductVideoLabel, href: route('products', { category: 'video' }) },
        { id: 'preview-home-footer-product-webinar', label: home.footerProductWebinarLabel, href: route('products', { category: 'webinar' }) },
        { id: 'preview-home-footer-product-offline', label: home.footerProductOfflineLabel, href: route('products', { category: 'offline' }) },
    ];
    const companyLinks = [
        { id: 'preview-home-footer-consultation', label: home.navConsultationLabel || 'Konsultasi', href: route('consultations.index') },
        { id: 'preview-home-footer-about', label: home.footerAboutLabel, href: route('about') },
        { id: 'preview-home-footer-contact', label: home.footerContactLabel, href: route('contact') },
    ];
    
    const dynamicSocialLinks = [
        { icon: Instagram, href: social.instagram, label: 'Instagram' },
        { icon: Youtube, href: social.youtube, label: 'YouTube' },
        { icon: Twitter, href: social.twitter, label: 'Twitter/X' },
    ].filter(item => item.href);

    const contactItems = [
        { 
            icon: Mail, 
            text: contact.email || 'halo@jaggad.id',
            href: `mailto:${contact.email || 'halo@jaggad.id'}`
        },
        { 
            icon: Phone, 
            text: contact.phone || '+62 812 3456 7890',
            href: `https://wa.me/${(contact.phone || '6281234567890').replace(/[^0-9]/g, '')}`
        },
        { 
            icon: MapPin, 
            text: contact.address || 'Gedung JAGGAD Digital Hub, Lt. 5, Jl. Sudirman No. 123, Jakarta Selatan',
            href: contact.mapsUrl || null
        },
    ];

    return (
        <footer className="footer">
            <div className="footer__accent-bar" aria-hidden="true" />

            <div className="container">
                <div className="footer__grid">
                    <div className="footer__brand">
                        <Link href="/" className="footer__logo">
                            {content.branding?.logo ? (
                                <img src={getStorageUrl(content.branding.logo)} alt={content.branding.siteName} style={{ height: '32px' }} />
                            ) : (
                                <>
                                    <span className="footer-logo-jaggad">{content.branding?.siteName || "JAGGAD"}</span>
                                    <span className="footer-logo-academy">{content.branding?.siteTagline || "Academy"}</span>
                                </>
                            )}
                        </Link>
                        <p className="footer__tagline">
                            {home.whyJaggadSubtitle || "Platform pembelajaran digital terpercaya untuk akselerasi karir dan bisnis Anda di era modern."}
                        </p>

                        <div className="footer__socials">
                            {dynamicSocialLinks.map(({ icon: Icon, href, label }) => (
                                <a key={label} href={href} className="footer-social" aria-label={label} target="_blank" rel="noreferrer">
                                    <Icon size={20} aria-hidden="true" />
                                </a>
                            ))}
                        </div>
                    </div>

                    <div className="footer__col">
                        <h4 id="preview-home-footer-products-title" className="footer__col-title">{home.footerProductsTitle}</h4>
                        <ul className="footer__col-links">
                            {productLinks.map(({ id, label, href }) => (
                                <li key={label}>
                                    <Link id={id} href={href}>{label}</Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="footer__col">
                        <h4 id="preview-home-footer-company-title" className="footer__col-title">{home.footerCompanyTitle}</h4>
                        <ul className="footer__col-links">
                            {companyLinks.map(({ id, label, href }) => (
                                <li key={label}>
                                    <Link id={id} href={href}>{label}</Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="footer__col">
                        <h4 id="preview-home-footer-contact-title" className="footer__col-title">{home.footerContactTitle}</h4>
                        <ul className="footer__contact-list">
                            {contactItems.map(({ icon: Icon, text, href }) => (
                                <li key={text}>
                                    {href && href !== '#' ? (
                                        <a href={href} target={href.startsWith('http') ? "_blank" : "_self"} rel="noreferrer" className="footer__contact-item">
                                            <Icon size={18} className="footer__contact-icon" aria-hidden="true" />
                                            <span>{text}</span>
                                        </a>
                                    ) : (
                                        <span className="footer__contact-item">
                                            <Icon size={18} className="footer__contact-icon" aria-hidden="true" />
                                            <span>{text}</span>
                                        </span>
                                    )}
                                </li>
                            ))}
                        </ul>
                        <Link id="preview-home-footer-cta" href={route('products')} className="footer__cta-btn">
                            <Zap size={16} aria-hidden="true" /> {home.footerCtaLabel || "Mulai Belajar Sekarang"}
                        </Link>
                    </div>
                </div>

                <div className="footer__bottom">
                    <p id="preview-home-footer-rights">© {new Date().getFullYear()} {content.branding?.siteName || "JAGGAD"} {content.branding?.siteTagline || "ACADEMY"}. {home.footerRightsText}</p>
                </div>
            </div>
        </footer>
    );
}
