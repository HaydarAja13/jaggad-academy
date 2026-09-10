import { Head, useForm, usePage } from '@inertiajs/react';
import { CalendarDays, CheckCircle2, Clock3, MessageCircle, ShieldCheck } from 'lucide-react';
import ConsultationPackages from '../../Components/ConsultationPackages';
import MainLayout from '../../Layouts/MainLayout';
import { formatPrice } from '../../Utils/helpers';
import './Consultation.css';

const tomorrow = () => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    const pad = value => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const consultationTimes = (opensAt = '19:00', closesAt = '23:00', duration = 30) => {
    const toMinutes = value => {
        const [hours, minutes] = value.split(':').map(Number);
        return hours * 60 + minutes;
    };
    const pad = value => String(value).padStart(2, '0');
    const first = toMinutes(opensAt);
    const last = toMinutes(closesAt) - Number(duration || 30);

    return Array.from({ length: Math.max(0, Math.floor((last - first) / 30) + 1) }, (_, index) => {
        const total = first + (index * 30);
        return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
    });
};

export default function Consultation({ consultation = {}, consultationSettings = {} }) {
    const { url, props } = usePage();
    const query = new URLSearchParams(url.split('?')[1] || '');
    const packages = consultation.packages || [];
    const initialPackage = packages.find(item => item.slug === query.get('package')) || packages[0];
    const initialOption = initialPackage?.options?.find(item => item.key === query.get('option')) || initialPackage?.options?.[0];
    const { data, setData, post, processing, errors } = useForm({
        customer_name: '',
        whatsapp: '',
        package_slug: initialPackage?.slug || '',
        option_key: initialOption?.key || '',
        consultation_need: '',
        requested_date: '',
        requested_time: '19:00',
        policy_accepted: false,
    });
    const selectedPackage = packages.find(item => item.slug === data.package_slug) || initialPackage;
    const selectedOption = selectedPackage?.options?.find(item => item.key === data.option_key) || selectedPackage?.options?.[0];
    const availableTimes = consultationTimes(consultationSettings.opensAt, consultationSettings.closesAt, selectedOption?.durationMinutes);

    const choosePackage = event => {
        const item = packages.find(pkg => pkg.slug === event.target.value);
        setData(previous => ({ ...previous, package_slug: item?.slug || '', option_key: item?.options?.[0]?.key || '' }));
    };

    const submit = event => {
        event.preventDefault();
        post(route('consultations.store'), { preserveScroll: true });
    };

    return (
        <MainLayout>
            <Head title="Konsultasi Personal - JAGGAD Academy" />
            <main className="consultation-page">
                <section className="consultation-hero">
                    <div className="container consultation-hero__layout">
                        <div>
                            <h1>Ruang bicara yang jelas untuk langkah berikutnya.</h1>
                            <p>Pilih sesi yang sesuai, ajukan satu waktu, lalu tim JAGGAD memeriksa mentor dan potensi bentrok sebelum menghubungi Anda lewat WhatsApp.</p>
                        </div>
                        <ol className="consultation-flow" aria-label="Alur booking konsultasi">
                            <li><CalendarDays size={22} aria-hidden="true" /><span><strong>Ajukan jadwal</strong>Minimal {consultationSettings.minimumLeadHours || 24} jam sebelumnya</span></li>
                            <li><MessageCircle size={22} aria-hidden="true" /><span><strong>Konfirmasi WhatsApp</strong>Admin memastikan mentor, tempat, dan jadwal</span></li>
                            <li><ShieldCheck size={22} aria-hidden="true" /><span><strong>Bayar DP 50%</strong>Link aman aktif {consultationSettings.depositExpiryHours || 24} jam</span></li>
                        </ol>
                    </div>
                </section>

                <ConsultationPackages consultation={consultation} />

                <section className="consultation-request" id="ajukan-jadwal" aria-labelledby="consultation-form-title">
                    <div className="container consultation-request__layout">
                        <div className="consultation-request__intro">
                            <h2 id="consultation-form-title">Ajukan waktu yang Anda inginkan.</h2>
                            <p>Jadwal belum otomatis terpesan. Admin akan mengecek bentrok per mentor dan menghubungi nomor WhatsApp yang Anda isi.</p>
                            <div className="consultation-request__availability"><Clock3 size={20} aria-hidden="true" /><span>{consultationSettings.workingDaysLabel || 'Selasa–Sabtu'}, {consultationSettings.opensAt || '19:00'}–{consultationSettings.closesAt || '23:00'} WIB</span></div>
                            {selectedOption && (
                                <div className="consultation-summary">
                                    <span>Pilihan saat ini</span>
                                    <strong>{selectedPackage?.name}</strong>
                                    <dl>
                                        <div><dt>Durasi</dt><dd>{selectedOption.label}</dd></div>
                                        <div><dt>Total</dt><dd>{formatPrice(selectedOption.totalPrice)}</dd></div>
                                        <div><dt>DP booking</dt><dd>{formatPrice(selectedOption.depositAmount)}</dd></div>
                                    </dl>
                                </div>
                            )}
                        </div>

                        <div className="consultation-form-surface">
                            {props.flash?.booking_code && (
                                <div className="consultation-success" role="status">
                                    <CheckCircle2 size={24} aria-hidden="true" />
                                    <div><strong>Permintaan {props.flash.booking_code} sudah diterima.</strong><span>Simpan kode ini. Admin akan melanjutkan melalui WhatsApp.</span></div>
                                </div>
                            )}
                            <form onSubmit={submit} className="consultation-form">
                                <label>Nama lengkap<input value={data.customer_name} onChange={event => setData('customer_name', event.target.value)} autoComplete="name" required />{errors.customer_name && <small>{errors.customer_name}</small>}</label>
                                <label>Nomor WhatsApp<input value={data.whatsapp} onChange={event => setData('whatsapp', event.target.value)} inputMode="tel" autoComplete="tel" placeholder="08xxxxxxxxxx" required />{errors.whatsapp && <small>{errors.whatsapp}</small>}</label>
                                <label>Paket<select value={data.package_slug} onChange={choosePackage} required>{packages.map(item => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select>{errors.package_slug && <small>{errors.package_slug}</small>}</label>
                                <label>Pilihan sesi<select value={data.option_key} onChange={event => setData('option_key', event.target.value)} required>{(selectedPackage?.options || []).map(option => <option key={option.key} value={option.key}>{option.label}</option>)}</select>{errors.option_key && <small>{errors.option_key}</small>}</label>
                                <div className="consultation-form__pair">
                                    <label>Tanggal yang diajukan<input type="date" min={tomorrow()} value={data.requested_date} onChange={event => setData('requested_date', event.target.value)} required />{errors.requested_date && <small>{errors.requested_date}</small>}</label>
                                    <label>Waktu mulai<select value={data.requested_time} onChange={event => setData('requested_time', event.target.value)} required>{availableTimes.map(time => <option key={time} value={time}>{time} WIB</option>)}</select>{errors.requested_time && <small>{errors.requested_time}</small>}</label>
                                </div>
                                <label>Ceritakan kebutuhan konsultasi<textarea rows="5" value={data.consultation_need} onChange={event => setData('consultation_need', event.target.value)} placeholder="Konteks, tujuan, atau masalah yang ingin dibahas…" required />{errors.consultation_need && <small>{errors.consultation_need}</small>}</label>
                                <label className="consultation-policy"><input type="checkbox" checked={data.policy_accepted} onChange={event => setData('policy_accepted', event.target.checked)} required /><span>Saya memahami jadwal baru terkonfirmasi setelah dicek admin dan DP dibayar. Reschedule customer maksimal 1 kali, minimal 24 jam sebelum sesi; DP hangus untuk pembatalan atau tidak hadir dari pihak customer.</span></label>
                                {errors.policy_accepted && <small className="consultation-form__error">{errors.policy_accepted}</small>}
                                <button type="submit" disabled={processing}>{processing ? 'Mengirim permintaan…' : 'Kirim permintaan jadwal'}</button>
                            </form>
                        </div>
                    </div>
                </section>
            </main>
        </MainLayout>
    );
}
