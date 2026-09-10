import { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Clock3, Copy, ExternalLink, MessageCircle, Plus, Save, Trash2, UserRound } from 'lucide-react';
import toast from 'react-hot-toast';
import AdminLayout from '../../Layouts/AdminLayout';
import { formatPrice } from '../../Utils/helpers';
import './AdminConsultations.css';

const statusLabels = {
    requested: 'Perlu dicek', awaiting_deposit: 'Menunggu DP', deposit_review: 'Verifikasi DP', booked: 'Terkonfirmasi',
    completed: 'Selesai', rejected: 'Ditolak', expired: 'Kedaluwarsa', cancelled: 'Dibatalkan', no_show: 'Tidak hadir', refunded: 'Direfund',
};

const localParts = value => {
    if (!value) return { date: '', time: '' };
    const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
    const parts = Object.fromEntries(formatter.formatToParts(new Date(value)).map(part => [part.type, part.value]));
    return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` };
};

const displayDate = value => value ? `${new Date(value).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta' })} WIB` : 'Belum ditentukan';

export default function AdminConsultations({ appointments = {}, consultationSettings = {} }) {
    const [drafts, setDrafts] = useState({});
    const [busy, setBusy] = useState(null);
    const settingsForm = useForm({ ...consultationSettings, mentors: consultationSettings.mentors || [] });
    const rows = appointments.data || [];

    const draftFor = appointment => drafts[appointment.booking_code] || (() => {
        const parts = localParts(appointment.scheduled_start_at || appointment.requested_start_at);
        return {
            mentor_key: appointment.mentor_key || consultationSettings.mentors?.find(mentor => mentor.active)?.key || '',
            scheduled_date: parts.date, scheduled_time: parts.time, location: appointment.location || '',
            initiator: 'provider', cancellation_initiator: 'customer', amount: Number(appointment.total_price) - Number(appointment.deposit_amount), payment_method: 'cash',
            reason: '', note: '',
        };
    })();
    const updateDraft = (appointment, field, value) => setDrafts(current => ({ ...current, [appointment.booking_code]: { ...draftFor(appointment), ...current[appointment.booking_code], [field]: value } }));

    const act = (routeName, appointment, payload, success) => {
        if (busy) return;
        setBusy(`${routeName}-${appointment.booking_code}`);
        router.patch(route(routeName, appointment.booking_code), payload, {
            preserveScroll: true,
            onSuccess: () => toast.success(success),
            onError: errors => Object.values(errors).forEach(message => toast.error(message)),
            onFinish: () => setBusy(null),
        });
    };

    const copyLink = async link => {
        await navigator.clipboard.writeText(link);
        toast.success('Link pembayaran disalin.');
    };

    const saveSettings = event => {
        event.preventDefault();
        settingsForm.post(route('admin.consultations.settings'), {
            preserveScroll: true,
            onSuccess: () => toast.success('Pengaturan konsultasi disimpan.'),
            onError: errors => Object.values(errors).forEach(message => toast.error(message)),
        });
    };

    const updateMentor = (index, field, value) => settingsForm.setData('mentors', settingsForm.data.mentors.map((mentor, itemIndex) => itemIndex === index ? { ...mentor, [field]: value } : mentor));
    const links = appointments.links || [];

    return (
        <AdminLayout>
            <Head title="Konsultasi - Admin JAGGAD" />
            <main className="admin-page admin-consultations">
                <header className="admin-consultations__header">
                    <div><h1>Konsultasi</h1><p>Periksa bentrok per mentor, konfirmasi lewat WhatsApp, dan catat pembayaran sampai sesi selesai.</p></div>
                    <div className="admin-consultations__hours"><Clock3 size={20} aria-hidden="true" />{consultationSettings.workingDaysLabel}, {consultationSettings.opensAt}–{consultationSettings.closesAt} WIB</div>
                </header>

                <section className="admin-consultations__list" aria-labelledby="appointment-list-title">
                    <div className="admin-consultations__section-heading"><h2 id="appointment-list-title">Permintaan dan booking</h2><span>{appointments.total || 0} data</span></div>
                    {rows.length ? rows.map(appointment => {
                        const draft = draftFor(appointment);
                        const depositTransaction = appointment.transactions?.find(transaction => transaction.purpose === 'consultation_deposit');
                        return (
                            <details className="appointment-row" key={appointment.booking_code}>
                                <summary>
                                    <span className={`appointment-status appointment-status--${appointment.status}`}>{statusLabels[appointment.status] || appointment.status}</span>
                                    <span><strong>{appointment.customer_name}</strong><small>{appointment.booking_code} · {appointment.package_name}</small></span>
                                    <span><strong>{displayDate(appointment.scheduled_start_at || appointment.requested_start_at)}</strong><small>{appointment.mentor_name || 'Mentor belum dipilih'}</small></span>
                                    <span><strong>{formatPrice(appointment.total_price)}</strong><small>DP {formatPrice(appointment.deposit_amount)}</small></span>
                                </summary>
                                <div className="appointment-row__body">
                                    <section className="appointment-details">
                                        <h3>Detail permintaan</h3>
                                        <dl>
                                            <div><dt>WhatsApp</dt><dd>{appointment.whatsapp}</dd></div>
                                            <div><dt>Durasi</dt><dd>{appointment.option_label}</dd></div>
                                            <div><dt>Waktu diajukan</dt><dd>{displayDate(appointment.requested_start_at)}</dd></div>
                                            <div><dt>Lokasi</dt><dd>{appointment.location || 'Belum disepakati'}</dd></div>
                                            <div className="appointment-details__need"><dt>Kebutuhan</dt><dd>{appointment.consultation_need}</dd></div>
                                        </dl>
                                        <div className="appointment-quick-actions">
                                            <a href={appointment.whatsapp_url} target="_blank" rel="noreferrer"><MessageCircle size={18} aria-hidden="true" /> Hubungi WhatsApp</a>
                                            {appointment.payment_link && <button type="button" onClick={() => copyLink(appointment.payment_link)}><Copy size={18} aria-hidden="true" /> Salin link DP</button>}
                                            {depositTransaction?.payment?.id && <a href={route('payments.proof', depositTransaction.payment.id)} target="_blank" rel="noreferrer"><ExternalLink size={18} aria-hidden="true" /> Lihat bukti DP</a>}
                                        </div>
                                    </section>

                                    <section className="appointment-actions">
                                        {(appointment.status === 'requested' || appointment.status === 'expired') && (
                                            <>
                                                <h3>Setujui jadwal</h3>
                                                <label>Mentor<select value={draft.mentor_key} onChange={event => updateDraft(appointment, 'mentor_key', event.target.value)}><option value="">Pilih mentor</option>{consultationSettings.mentors?.filter(mentor => mentor.active).map(mentor => <option key={mentor.key} value={mentor.key}>{mentor.name}</option>)}</select></label>
                                                <div className="appointment-actions__pair"><label>Tanggal<input type="date" value={draft.scheduled_date} onChange={event => updateDraft(appointment, 'scheduled_date', event.target.value)} /></label><label>Waktu<input type="time" step="60" value={draft.scheduled_time} onChange={event => updateDraft(appointment, 'scheduled_time', event.target.value)} /></label></div>
                                                <label>Lokasi yang disepakati<input value={draft.location} onChange={event => updateDraft(appointment, 'location', event.target.value)} placeholder="Alamat atau lokasi pertemuan" /></label>
                                                <button type="button" onClick={() => act('admin.consultations.approve', appointment, draft, 'Jadwal disetujui. Link DP siap dikirim.')}>Periksa bentrok & setujui</button>
                                                <label>Alasan jika ditolak<textarea rows="2" value={draft.reason} onChange={event => updateDraft(appointment, 'reason', event.target.value)} /></label>
                                                <button type="button" className="secondary danger" onClick={() => act('admin.consultations.reject', appointment, { reason: draft.reason }, 'Permintaan ditolak.')}>Tolak permintaan</button>
                                            </>
                                        )}

                                        {appointment.status === 'deposit_review' && <><h3>DP perlu diverifikasi</h3><p>Buka bukti di samping, lalu gunakan halaman transaksi untuk menerima atau menolak bukti pembayaran.</p><Link className="appointment-actions__link" href={route('admin.transactions.index')}>Buka transaksi <ExternalLink size={18} aria-hidden="true" /></Link></>}

                                        {appointment.status === 'booked' && (
                                            <>
                                                <h3>Kelola booking</h3>
                                                <label>Inisiator reschedule<select value={draft.initiator} onChange={event => updateDraft(appointment, 'initiator', event.target.value)}><option value="provider">JAGGAD / mentor</option><option value="customer">Customer</option></select></label>
                                                <label>Mentor<select value={draft.mentor_key} onChange={event => updateDraft(appointment, 'mentor_key', event.target.value)}>{consultationSettings.mentors?.filter(mentor => mentor.active).map(mentor => <option key={mentor.key} value={mentor.key}>{mentor.name}</option>)}</select></label>
                                                <div className="appointment-actions__pair"><label>Tanggal baru<input type="date" value={draft.scheduled_date} onChange={event => updateDraft(appointment, 'scheduled_date', event.target.value)} /></label><label>Waktu baru<input type="time" step="60" value={draft.scheduled_time} onChange={event => updateDraft(appointment, 'scheduled_time', event.target.value)} /></label></div>
                                                <label>Lokasi<input value={draft.location} onChange={event => updateDraft(appointment, 'location', event.target.value)} /></label>
                                                <button type="button" className="secondary" onClick={() => act('admin.consultations.reschedule', appointment, draft, 'Jadwal diperbarui.')}>Periksa & simpan reschedule</button>
                                                <div className="appointment-actions__pair"><label>Pelunasan<input type="number" min="0" value={draft.amount} onChange={event => updateDraft(appointment, 'amount', event.target.value)} /></label><label>Metode<select value={draft.payment_method} onChange={event => updateDraft(appointment, 'payment_method', event.target.value)}><option value="cash">Tunai</option><option value="bank_transfer">Transfer bank</option><option value="qris">QRIS</option><option value="other">Lainnya</option></select></label></div>
                                                <button type="button" onClick={() => act('admin.consultations.complete', appointment, draft, 'Sesi dan pelunasan dicatat selesai.')}><CheckCircle2 size={18} aria-hidden="true" /> Selesaikan konsultasi</button>
                                                <label>Pihak yang membatalkan<select value={draft.cancellation_initiator} onChange={event => updateDraft(appointment, 'cancellation_initiator', event.target.value)}><option value="customer">Customer</option><option value="provider">JAGGAD / mentor</option></select></label>
                                                <label>Alasan pembatalan<input value={draft.reason} onChange={event => updateDraft(appointment, 'reason', event.target.value)} /></label>
                                                <div className="appointment-actions__pair"><button type="button" className="secondary danger" onClick={() => act('admin.consultations.cancel', appointment, { status: 'cancelled', initiator: draft.cancellation_initiator, reason: draft.reason }, 'Booking dibatalkan.')}>Batalkan booking</button><button type="button" className="secondary danger" onClick={() => act('admin.consultations.cancel', appointment, { status: 'no_show', initiator: 'customer', reason: draft.reason }, 'Customer dicatat tidak hadir.')}>Tandai tidak hadir</button></div>
                                            </>
                                        )}

                                        {appointment.status === 'cancelled' && appointment.cancellation_initiator === 'provider' && (
                                            <><h3>Refund oleh JAGGAD</h3><label>Catatan refund<textarea rows="3" value={draft.note} onChange={event => updateDraft(appointment, 'note', event.target.value)} /></label><button type="button" onClick={() => act('admin.consultations.refund', appointment, { note: draft.note }, 'Refund DP dicatat.')}>Catat refund DP penuh</button></>
                                        )}
                                    </section>
                                </div>
                            </details>
                        );
                    }) : <div className="admin-consultations__empty"><CalendarDays size={32} aria-hidden="true" /><h3>Belum ada permintaan konsultasi</h3><p>Pengajuan customer dari halaman publik akan muncul di sini.</p></div>}

                    {appointments.last_page > 1 && <nav className="admin-consultations__pagination">{links[0]?.url ? <Link href={links[0].url}><ChevronLeft size={18} /> Sebelumnya</Link> : <span /> }<span>Halaman {appointments.current_page} dari {appointments.last_page}</span>{links.at(-1)?.url ? <Link href={links.at(-1).url}>Berikutnya <ChevronRight size={18} /></Link> : <span />}</nav>}
                </section>

                <section className="consultation-settings" aria-labelledby="consultation-settings-title">
                    <div className="admin-consultations__section-heading"><div><h2 id="consultation-settings-title">Jadwal dan mentor</h2><p>Perubahan berlaku untuk permintaan baru dan validasi admin.</p></div></div>
                    <form onSubmit={saveSettings}>
                        <input type="hidden" name="timezone" value={settingsForm.data.timezone} />
                        <div className="consultation-settings__grid">
                            <label>Label hari layanan<input value={settingsForm.data.workingDaysLabel} onChange={event => settingsForm.setData('workingDaysLabel', event.target.value)} /></label>
                            <label>Jam buka<input type="time" value={settingsForm.data.opensAt} onChange={event => settingsForm.setData('opensAt', event.target.value)} /></label>
                            <label>Jam tutup<input type="time" value={settingsForm.data.closesAt} onChange={event => settingsForm.setData('closesAt', event.target.value)} /></label>
                            <label>Minimal pengajuan (jam)<input type="number" min="1" value={settingsForm.data.minimumLeadHours} onChange={event => settingsForm.setData('minimumLeadHours', Number(event.target.value))} /></label>
                            <label>Masa aktif link DP (jam)<input type="number" min="1" value={settingsForm.data.depositExpiryHours} onChange={event => settingsForm.setData('depositExpiryHours', Number(event.target.value))} /></label>
                            <label>Batas reschedule (jam)<input type="number" min="1" value={settingsForm.data.rescheduleCutoffHours} onChange={event => settingsForm.setData('rescheduleCutoffHours', Number(event.target.value))} /></label>
                        </div>
                        <div className="consultation-mentors">
                            <div><h3>Mentor</h3><button type="button" className="secondary" onClick={() => settingsForm.setData('mentors', [...settingsForm.data.mentors, { key: '', name: '', active: true }])}><Plus size={18} /> Tambah mentor</button></div>
                            {settingsForm.data.mentors.map((mentor, index) => <div className="consultation-mentor" key={mentor.key || index}><UserRound size={20} /><input aria-label={`Nama mentor ${index + 1}`} value={mentor.name} onChange={event => updateMentor(index, 'name', event.target.value)} placeholder="Nama mentor" /><label><input type="checkbox" checked={mentor.active} onChange={event => updateMentor(index, 'active', event.target.checked)} /> Aktif</label><button type="button" aria-label={`Hapus mentor ${mentor.name || index + 1}`} onClick={() => settingsForm.setData('mentors', settingsForm.data.mentors.filter((_, itemIndex) => itemIndex !== index))}><Trash2 size={18} /></button></div>)}
                        </div>
                        <button type="submit" disabled={settingsForm.processing}><Save size={18} /> {settingsForm.processing ? 'Menyimpan…' : 'Simpan pengaturan'}</button>
                    </form>
                </section>
            </main>
        </AdminLayout>
    );
}
