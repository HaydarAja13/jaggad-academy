import { useState } from 'react';
import { Head } from '@inertiajs/react';
import { ArrowUpRight, BookOpen, Handshake, Mail, MapPin, MessageCircle, Send, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';
import { useContent } from '../../Contexts/ContentContext';
import MainLayout from '../../Layouts/MainLayout';
import './Contact.css';

/*
THESIS: A confident consultation desk, not a generic icon-card directory.
OWN-WORLD: Cool white fields, one deep-maroon mass, bold Chillax display type, Synonym body copy, 16px corners, and pill actions.
STORY: Visitors see direct human help, choose WhatsApp or contact details, recognize their need, then open a prepared email.
FIRST VIEWPORT: Oversized question and CTA on the left; one maroon direct-contact panel on the right; the same order stacks on smaller screens.
FORM: User-directed code-led composition, grounded in the incumbent About page; surface seed ec40c6c8, with generated comps explicitly declined.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.
*/
const topicIcons = [BookOpen, ShoppingBag, Handshake];

export default function Contact({ previewMode = false }) {
    const { content } = useContent();
    const contact = content?.contact || {};
    const brandName = [content?.branding?.siteName, content?.branding?.siteTagline].filter(Boolean).join(' ') || 'JAGGAD Academy';
    const whatsappNumber = (contact.phone || '').replace(/[^0-9]/g, '');
    const whatsappUrl = whatsappNumber ? `https://wa.me/${whatsappNumber}` : null;
    const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });

    const updateForm = (field) => (event) => setForm(current => ({ ...current, [field]: event.target.value }));

    const handleSubmit = (event) => {
        event.preventDefault();
        if (previewMode || !contact.email) return;

        const body = `${contact.formEmailIntro}\n\n${contact.formNameLabel}: ${form.name}\n${contact.formEmailLabel}: ${form.email}\n\n${contact.formMessageLabel}:\n${form.message}`;
        window.location.href = `mailto:${contact.email}?subject=${encodeURIComponent(form.subject)}&body=${encodeURIComponent(body)}`;
        toast(contact.formOpenEmailNotice);
    };

    const directContacts = [
        { icon: MessageCircle, label: contact.phoneLabel, value: contact.phone, href: whatsappUrl },
        { icon: Mail, label: contact.emailLabel, value: contact.email, href: contact.email ? `mailto:${contact.email}` : null },
        { icon: MapPin, label: contact.addressLabel, value: contact.address, href: contact.mapsUrl },
    ].filter(item => item.value);

    const PageContent = (
        <div className="contact-page">
            <Head title={`${contact.pageTitle} - ${brandName}`} />

            <main>
                <section className="contact-hero" aria-labelledby="preview-contact-title">
                <div className="container contact-hero__layout">
                    <div className="contact-hero__copy">
                        <h1 id="preview-contact-title">{contact.title}</h1>
                        <p id="preview-contact-subtitle">{contact.subtitle}</p>
                        {whatsappUrl && (
                            <div className="contact-hero__action">
                                <a id="preview-contact-whatsapp-cta" href={whatsappUrl} target="_blank" rel="noreferrer" className="contact-button contact-button--primary">
                                    <MessageCircle size={20} aria-hidden="true" />
                                    {contact.whatsappCta}
                                    <ArrowUpRight size={18} aria-hidden="true" />
                                </a>
                                <span id="preview-contact-whatsapp-note">{contact.whatsappNote}</span>
                            </div>
                        )}
                    </div>

                    <aside className="contact-direct" aria-labelledby="preview-contact-direct-title">
                        <h2 id="preview-contact-direct-title">{contact.directTitle}</h2>
                        <div className="contact-direct__list">
                            {directContacts.map(({ icon: Icon, label, value, href }) => {
                                const details = (
                                    <>
                                        <Icon size={22} aria-hidden="true" />
                                        <span>
                                            <small>{label}</small>
                                            <strong>{value}</strong>
                                        </span>
                                        {href && <ArrowUpRight size={18} className="contact-direct__arrow" aria-hidden="true" />}
                                    </>
                                );

                                return href ? (
                                    <a key={label} href={href} target={href.startsWith('http') ? '_blank' : undefined} rel={href.startsWith('http') ? 'noreferrer' : undefined}>
                                        {details}
                                    </a>
                                ) : <div key={label}>{details}</div>;
                            })}
                        </div>
                    </aside>
                </div>
                </section>

                <section className="contact-guide" aria-labelledby="preview-contact-guide-title">
                    <div className="container contact-guide__layout">
                        <header>
                            <h2 id="preview-contact-guide-title">{contact.guideTitle}</h2>
                            <p id="preview-contact-guide-subtitle">{contact.guideSubtitle}</p>
                        </header>

                        <ul className="contact-topics">
                            {(contact.topics || []).map((topic, index) => {
                                const Icon = topicIcons[index] || MessageCircle;
                                return (
                                    <li key={`${topic.title}-${index}`}>
                                        <Icon size={22} aria-hidden="true" />
                                        <div>
                                            <h3 id={`preview-contact-topic-${index}-title`}>{topic.title}</h3>
                                            <p id={`preview-contact-topic-${index}-desc`}>{topic.desc}</p>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </section>

                <section className="contact-message" aria-labelledby="preview-contact-form-title">
                    <div className="container contact-message__layout">
                        <header>
                            <h2 id="preview-contact-form-title">{contact.formTitle}</h2>
                            <p id="preview-contact-form-subtitle">{contact.formSubtitle}</p>
                            {contact.email && (
                                <a className="contact-email-link" href={`mailto:${contact.email}`}>
                                    {contact.email}
                                    <ArrowUpRight size={18} aria-hidden="true" />
                                </a>
                            )}
                        </header>

                        <form className="contact-form" onSubmit={handleSubmit}>
                            <div className="contact-form__row">
                                <label>
                                    <span>{contact.formNameLabel}</span>
                                    <input name="name" type="text" autoComplete="name" placeholder={contact.formNamePlaceholder} value={form.name} onChange={updateForm('name')} required />
                                </label>
                                <label>
                                    <span>{contact.formEmailLabel}</span>
                                    <input name="email" type="email" autoComplete="email" placeholder={contact.formEmailPlaceholder} value={form.email} onChange={updateForm('email')} required />
                                </label>
                            </div>

                            <label>
                                <span>{contact.formSubjectLabel}</span>
                                <select name="subject" value={form.subject} onChange={updateForm('subject')} required>
                                    <option value="" disabled>{contact.formSubjectPlaceholder}</option>
                                    {(contact.topics || []).map((topic, index) => (
                                        <option key={`${topic.title}-${index}`} value={topic.title}>{topic.title}</option>
                                    ))}
                                </select>
                            </label>

                            <label>
                                <span>{contact.formMessageLabel}</span>
                                <textarea name="message" rows="6" placeholder={contact.formMessagePlaceholder} value={form.message} onChange={updateForm('message')} required />
                            </label>

                            <div className="contact-form__footer">
                                <p id="preview-contact-form-note">{contact.formNote}</p>
                                <button type="submit" disabled={!contact.email}>
                                    {contact.formSubmitLabel}
                                    <Send size={18} aria-hidden="true" />
                                </button>
                            </div>
                        </form>
                    </div>
                </section>
            </main>
        </div>
    );

    return previewMode ? PageContent : <MainLayout>{PageContent}</MainLayout>;
}
