import { ArrowRight, Check, Clock3, MessageCircleMore, UserRound, UsersRound } from 'lucide-react';
import './ConsultationPackages.css';

const icons = { Clock3, MessageCircleMore, UserRound, UsersRound };
const isPopular = value => value === true || value === 1 || value === '1' || value === 'true';

export default function ConsultationPackages({ consultation = {}, compact = false }) {
    const packages = consultation.packages || [];

    return (
        <section id="paket-konsultasi" className={`consultation-packages ${compact ? 'consultation-packages--compact' : ''}`} aria-labelledby="preview-home-consultation-title">
            <div className="container">
                <header className="consultation-packages__header">
                    <div>
                        <h2 id="preview-home-consultation-title">{consultation.title}</h2>
                        <p id="preview-home-consultation-subtitle">{consultation.subtitle}</p>
                    </div>
                    <div className="consultation-packages__schedule"><Clock3 size={20} aria-hidden="true" /><span id="preview-home-consultation-schedule">{consultation.scheduleLabel}</span></div>
                </header>

                <div className="consultation-packages__grid">
                    {packages.map((item, index) => {
                        const Icon = icons[item.icon] || MessageCircleMore;
                        const popular = isPopular(item.popular);
                        const option = item.options?.[0];
                        const deposits = (item.options || []).map(({ depositAmount }) => Number(depositAmount));
                        const depositLabel = deposits.length > 1
                            ? `Rp ${Math.min(...deposits).toLocaleString('id-ID')}–Rp ${Math.max(...deposits).toLocaleString('id-ID')}`
                            : option ? `Rp ${Number(option.depositAmount).toLocaleString('id-ID')}` : '';
                        return (
                            <div className={`consultation-card-wrap ${popular ? 'consultation-card-wrap--popular' : ''}`} key={item.slug}>
                                {popular && <span className="consultation-card__popular">Paling populer</span>}
                                <article className={`consultation-card ${popular ? 'consultation-card--popular' : ''}`}>
                                    <div className="consultation-card__summary">
                                        <div className="consultation-card__top">
                                            <span className="consultation-card__icon"><Icon size={26} aria-hidden="true" /></span>
                                            <div>
                                                <h3 id={`preview-home-consultation-${index}-name`}>{item.name}</h3>
                                                <p id={`preview-home-consultation-${index}-duration`}>{item.durationLabel}</p>
                                            </div>
                                        </div>
                                        <div className="consultation-card__price" id={`preview-home-consultation-${index}-price`}>{item.priceLabel}</div>
                                        <p className="consultation-card__deposit">Booking dengan DP 50%{depositLabel ? ` · ${depositLabel}` : ''}</p>
                                        <a
                                            href={`${route('consultations.index', { package: item.slug, option: option?.key })}#ajukan-jadwal`}
                                            className="consultation-card__cta"
                                        >
                                            {consultation.ctaLabel || 'Ajukan Jadwal'} <ArrowRight size={18} aria-hidden="true" />
                                        </a>
                                    </div>
                                    <div className="consultation-card__details">
                                        <ul>
                                            {(item.benefits || []).map(benefit => <li key={benefit}><Check size={18} aria-hidden="true" /><span>{benefit}</span></li>)}
                                        </ul>
                                        <p className="consultation-card__description" id={`preview-home-consultation-${index}-description`}>{item.description}</p>
                                    </div>
                                </article>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
