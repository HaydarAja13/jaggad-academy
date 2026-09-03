import { Head, Link } from '@inertiajs/react';
import { ArrowRight, Check, MessageCircle } from 'lucide-react';
import { useContent } from '../../Contexts/ContentContext';
import MainLayout from '../../Layouts/MainLayout';
import { getStorageUrl } from '../../Utils/helpers';
import './About.css';

export default function About({ previewMode = false, heroImagePreview = null }) {
    const { content } = useContent();
    const about = content?.about || {};
    const brandName = [content?.branding?.siteName, content?.branding?.siteTagline].filter(Boolean).join(' ') || 'JAGGAD Academy';
    const heroImage = heroImagePreview || getStorageUrl(about.heroImage);

    const PageContent = (
        <div className="about-page">
            <Head title={`Tentang Kami - ${brandName}`} />

            <section className="about-hero" aria-labelledby="preview-about-hero-title">
                <div className="container about-hero__layout">
                    <div className="about-hero__copy">
                        <h1 id="preview-about-hero-title" className="about-hero__title">
                            <span id="preview-about-hero-prefix">{about.heroTitlePrefix}</span>{' '}
                            <strong>{about.heroTitle}</strong>
                        </h1>
                        <p id="preview-about-hero-desc" className="about-hero__desc">{about.heroDesc}</p>
                        <div className="about-hero__actions">
                            <Link id="preview-about-hero-primary-cta" href={route('products')} className="about-button about-button--primary">
                                {about.heroPrimaryCta} <ArrowRight size={18} aria-hidden="true" />
                            </Link>
                            <Link id="preview-about-hero-secondary-cta" href={route('contact')} className="about-button about-button--secondary">
                                {about.heroSecondaryCta}
                            </Link>
                        </div>
                    </div>

                    <figure className={`about-hero__visual${heroImage ? '' : ' about-hero__visual--empty'}`}>
                        {heroImage && <img id="preview-about-hero-image" src={heroImage} alt="Pengalaman belajar bersama JAGGAD Academy" />}
                        <figcaption id="preview-about-image-caption">
                            <span>{about.imageCaption}</span>
                            <strong>{about.imageCaptionStrong}</strong>
                        </figcaption>
                    </figure>
                </div>
            </section>

            <main>
                <section className="about-story" aria-labelledby="preview-about-story-title">
                    <div className="container about-story__layout">
                        <header className="about-story__intro">
                            <h2 id="preview-about-story-title">{about.storyTitle}</h2>
                            <div className="about-story__copy">
                                <p id="preview-about-story-p1">{about.storyP1}</p>
                                <p id="preview-about-story-p2">{about.storyP2}</p>
                            </div>
                        </header>

                        <ol className="about-timeline" aria-label="Perjalanan JAGGAD Academy">
                            {(about.milestones || []).map((milestone, index) => (
                                <li key={`${milestone.year}-${index}`}>
                                    <time id={`preview-about-milestone-${index}-year`}>{milestone.year}</time>
                                    <p id={`preview-about-milestone-${index}-text`}>{milestone.text}</p>
                                </li>
                            ))}
                        </ol>
                    </div>
                </section>

                <section className="about-purpose" aria-label="Visi dan misi JAGGAD Academy">
                    <div className="container">
                        <div className="about-purpose__shell">
                            <article className="about-vision">
                                <h2 id="preview-about-vision-title">{about.visionTitle}</h2>
                                <p id="preview-about-vision-desc">{about.visionDesc}</p>
                            </article>

                            <article className="about-mission">
                                <h2 id="preview-about-mission-title">{about.missionTitle}</h2>
                                <ul>
                                    {(about.missions || []).map((mission, index) => (
                                        <li key={index}>
                                            <Check size={18} aria-hidden="true" />
                                            <span id={`preview-about-mission-${index}`}>{mission}</span>
                                        </li>
                                    ))}
                                </ul>
                            </article>
                        </div>
                    </div>
                </section>

                <section className="about-proof" aria-labelledby="preview-about-proof-title">
                    <div className="container about-proof__layout">
                        <header>
                            <h2 id="preview-about-proof-title">{about.proofTitle}</h2>
                            <p id="preview-about-proof-desc">{about.proofDesc}</p>
                        </header>

                        <dl className="about-proof__stats">
                            {(about.achievements || []).map(({ value, label }, index) => (
                                <div key={`${label}-${index}`}>
                                    <dd id={`preview-about-achievement-${index}-value`}>{value}</dd>
                                    <dt id={`preview-about-achievement-${index}-label`}>{label}</dt>
                                </div>
                            ))}
                        </dl>
                    </div>
                </section>

                <section className="about-cta">
                    <div className="container">
                        <div className="about-cta__shell">
                            <div>
                                <h2 id="preview-about-cta-title">{about.ctaTitle}</h2>
                                <p id="preview-about-cta-desc">{about.ctaDesc}</p>
                            </div>
                            <div className="about-cta__actions">
                                <Link id="preview-about-cta-primary" href={route('products')} className="about-button about-button--light">
                                    {about.ctaPrimary} <ArrowRight size={18} aria-hidden="true" />
                                </Link>
                                <Link id="preview-about-cta-secondary" href={route('contact')} className="about-button about-button--ghost">
                                    <MessageCircle size={18} aria-hidden="true" /> {about.ctaSecondary}
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );

    if (previewMode) return PageContent;

    return <MainLayout>{PageContent}</MainLayout>;
}
