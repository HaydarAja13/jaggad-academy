import { useEffect, useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Clock3, Copy, ExternalLink, Eye, Filter, MessageCircle, Plus, Save, Search, Trash2, UserRound, X } from 'lucide-react';
import toast from 'react-hot-toast';
import AdminLayout from '../../Layouts/AdminLayout';
import { formatPrice } from '../../Utils/helpers';
import './AdminConsultations.css';

const statusLabels = {
    requested: 'Perlu dicek', awaiting_deposit: 'Menunggu DP', deposit_review: 'Verifikasi DP', booked: 'Terkonfirmasi',
    completed: 'Selesai', rejected: 'Ditolak', expired: 'Kedaluwarsa', cancelled: 'Dibatalkan', no_show: 'Tidak hadir', refunded: 'Direfund',
};
const statusOptions = Object.entries(statusLabels);
const isChecked = value => value === true || value === 1 || value === '1' || value === 'true';
const filterQuery = values => Object.fromEntries(Object.entries(values)
    .filter(([key, value]) => value !== '' && !(key === 'conflict' && !isChecked(value)))
    .map(([key, value]) => [key, value === true ? 1 : value]));
const localParts = value => {
    if (!value) return { date: '', time: '' };
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(value)).map(part => [part.type, part.value]));
    return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` };
};
const displayDate = value => value ? `${new Date(value).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta' })} WIB` : 'Belum ditentukan';
const appointmentStart = appointment => appointment.scheduled_start_at || appointment.requested_start_at;

export default function AdminConsultations({ appointments = {}, consultationSettings = {}, filters = {}, mentorOptions = [], summary = {} }) {
    const [drafts, setDrafts] = useState({});
    const [busy, setBusy] = useState(null);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [filterState, setFilterState] = useState({ search: '', status: '', mentor: '', date: '', conflict: false, ...filters });
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(Boolean(filters.mentor || filters.date || isChecked(filters.conflict)));
    const settingsForm = useForm({ ...consultationSettings, mentors: consultationSettings.mentors || [] });
    const rows = appointments.data || [];
    const links = appointments.links || [];

    useEffect(() => {
        setFilterState({ search: '', status: '', mentor: '', date: '', conflict: false, ...filters });
        if (filters.mentor || filters.date || isChecked(filters.conflict)) setShowAdvancedFilters(true);
    }, [filters]);
    useEffect(() => {
        if (!selectedAppointment) return undefined;
        const closeOnEscape = event => event.key === 'Escape' && setSelectedAppointment(null);
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', closeOnEscape);
        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener('keydown', closeOnEscape);
        };
    }, [selectedAppointment]);

    const draftFor = appointment => drafts[appointment.booking_code] || (() => {
        const parts = localParts(appointmentStart(appointment));
        return {
            mentor_key: appointment.mentor_key || consultationSettings.mentors?.find(mentor => isChecked(mentor.active))?.key || '',
            scheduled_date: parts.date, scheduled_time: parts.time, location: appointment.location || '', initiator: 'provider',
            cancellation_initiator: 'customer', amount: Number(appointment.total_price) - Number(appointment.deposit_amount), payment_method: 'cash', reason: '', note: '',
        };
    })();
    const updateDraft = (appointment, field, value) => setDrafts(current => ({ ...current, [appointment.booking_code]: { ...draftFor(appointment), ...current[appointment.booking_code], [field]: value } }));
    const closeDetail = () => setSelectedAppointment(null);
    const act = (routeName, appointment, payload, success) => {
        if (busy) return;
        setBusy(`${routeName}-${appointment.booking_code}`);
        router.patch(route(routeName, appointment.booking_code), payload, {
            preserveScroll: true,
            onSuccess: () => { toast.success(success); closeDetail(); },
            onError: errors => Object.values(errors).forEach(message => toast.error(message)),
            onFinish: () => setBusy(null),
        });
    };
    const copyLink = async link => {
        await navigator.clipboard.writeText(link);
        toast.success('Link pembayaran disalin.');
    };
    const applyFilters = event => {
        event.preventDefault();
        router.get(route('admin.consultations.index'), filterQuery(filterState), { preserveScroll: true, preserveState: true, replace: true });
    };
    const resetFilters = () => {
        setFilterState({ search: '', status: '', mentor: '', date: '', conflict: false });
        router.get(route('admin.consultations.index'), {}, { preserveScroll: true, replace: true });
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
    const selectedDraft = selectedAppointment ? draftFor(selectedAppointment) : null;
    const depositTransaction = selectedAppointment?.transactions?.find(transaction => transaction.purpose === 'consultation_deposit');
    const activeFilterCount = Object.keys(filterQuery(filterState)).length;
    const advancedFilterCount = ['mentor', 'date', 'conflict'].filter(key => filterState[key] !== '' && filterState[key] !== false).length;
    const hasFilters = activeFilterCount > 0;
    const toggleConflictFilter = checked => {
        const nextFilters = { ...filterState, conflict: checked };
        setFilterState(nextFilters);
        router.get(route('admin.consultations.index'), filterQuery(nextFilters), { preserveScroll: true, replace: true });
    };

    return (
        <AdminLayout>
            <Head title="Konsultasi - Admin JAGGAD" />
            <main className="admin-page admin-consultations">
                <header className="consultations-header">
                    <div><h1>Konsultasi</h1><p>Kelola antrean, jadwal, pembayaran, dan bentrok sesi dari satu tempat.</p></div>
                    <div className="consultations-hours"><Clock3 size={20} aria-hidden="true" />{consultationSettings.workingDaysLabel}, {consultationSettings.opensAt}–{consultationSettings.closesAt} WIB</div>
                </header>

                <section className="consultations-overview" aria-label="Ringkasan konsultasi">
                    <div><strong>{summary.total || 0}</strong><span>Total pengajuan</span></div>
                    <div><strong>{summary.active || 0}</strong><span>Masih aktif</span></div>
                    <button type="button" className={filterState.conflict ? 'active' : ''} onClick={() => toggleConflictFilter(!filterState.conflict)} aria-pressed={filterState.conflict}><AlertTriangle size={20} aria-hidden="true" /><strong>{summary.conflicts || 0}</strong><span>Jadwal bentrok</span></button>
                </section>

                <section className="consultations-filter-panel" aria-labelledby="consultations-filter-title">
                    <div className="consultations-filter-heading">
                        <div>
                            <h2 id="consultations-filter-title">Filter antrean</h2>
                            <p>Temukan pengajuan berdasarkan pelanggan, status, mentor, atau jadwal.</p>
                        </div>
                        {hasFilters && <button type="button" className="consultations-reset" onClick={resetFilters}><X size={17} aria-hidden="true" /> Bersihkan {activeFilterCount} filter</button>}
                    </div>
                    <form className="consultations-filters" onSubmit={applyFilters}>
                        <div className="consultations-filters__primary">
                            <label className="consultations-filter-field consultations-filter-field--search">
                                <span>Kata kunci</span>
                                <span className="consultations-search-control"><Search size={19} aria-hidden="true" /><input type="search" placeholder="Nama, WhatsApp, atau kode booking" value={filterState.search} onChange={event => setFilterState(current => ({ ...current, search: event.target.value }))} /></span>
                            </label>
                            <label className="consultations-filter-field">
                                <span>Status</span>
                                <select value={filterState.status} onChange={event => setFilterState(current => ({ ...current, status: event.target.value }))}><option value="">Semua status</option>{statusOptions.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select>
                            </label>
                            <div className="consultations-filter-actions">
                                <button type="button" className={`secondary ${showAdvancedFilters ? 'active' : ''}`} onClick={() => setShowAdvancedFilters(current => !current)} aria-expanded={showAdvancedFilters} aria-controls="consultations-advanced-filters"><Filter size={18} aria-hidden="true" /> Filter lainnya{advancedFilterCount > 0 && <span className="consultations-filter-count">{advancedFilterCount}</span>}</button>
                                <button type="submit">Terapkan filter</button>
                            </div>
                        </div>
                        {showAdvancedFilters && <div className="consultations-filters__advanced" id="consultations-advanced-filters">
                            <label className="consultations-filter-field"><span>Mentor</span><select value={filterState.mentor} onChange={event => setFilterState(current => ({ ...current, mentor: event.target.value }))}><option value="">Semua mentor</option>{mentorOptions.map(mentor => <option value={mentor} key={mentor}>{mentor}</option>)}</select></label>
                            <label className="consultations-filter-field"><span>Tanggal sesi</span><input type="date" value={filterState.date} onChange={event => setFilterState(current => ({ ...current, date: event.target.value }))} /></label>
                            <label className="consultations-conflict-filter"><input type="checkbox" checked={isChecked(filterState.conflict)} onChange={event => toggleConflictFilter(event.target.checked)} /> Tampilkan jadwal bentrok saja</label>
                        </div>}
                    </form>
                </section>

                <section className="consultations-list" aria-labelledby="consultations-list-title">
                    <div className="consultations-list-header">
                        <div><h2 id="consultations-list-title">Antrean konsultasi</h2><p>Menampilkan {appointments.from || 0}–{appointments.to || 0} dari {appointments.total || 0} pengajuan; urutan pengajuan paling awal.</p></div>
                        <span className="consultations-result-count">{appointments.total || 0} pengajuan</span>
                    </div>

                    <div className="admin-table-wrap">
                        <table className="admin-table consultations-table">
                            <thead><tr><th>Pelanggan</th><th>Konsultasi</th><th>Jadwal</th><th>Mentor</th><th>Diajukan</th><th>Status</th><th><span className="sr-only">Aksi</span></th></tr></thead>
                            <tbody>{rows.length ? rows.map(appointment => {
                                const conflicts = appointment.conflicts || [];
                                return <tr key={appointment.booking_code} className={conflicts.length ? 'has-conflict' : ''}>
                                    <td data-label="Pelanggan"><strong>{appointment.customer_name}</strong><span>{appointment.booking_code}</span><span>{appointment.whatsapp}</span></td>
                                    <td data-label="Konsultasi"><strong>{appointment.package_name}</strong><span>{appointment.option_label}</span><span>{formatPrice(appointment.total_price)} · DP {formatPrice(appointment.deposit_amount)}</span></td>
                                    <td data-label="Jadwal"><strong>{displayDate(appointmentStart(appointment))}</strong>{conflicts.length > 0 && <span className="consultation-conflict-badge"><AlertTriangle size={16} aria-hidden="true" /> Bentrok dengan {conflicts.length} pengajuan</span>}</td>
                                    <td data-label="Mentor"><strong>{appointment.mentor_name || 'Belum dipilih'}</strong><span>{appointment.location || 'Lokasi belum disepakati'}</span></td>
                                    <td data-label="Diajukan"><time dateTime={appointment.created_at}>{displayDate(appointment.created_at)}</time></td>
                                    <td data-label="Status"><span className={`consultation-status consultation-status--${appointment.status}`}>{statusLabels[appointment.status] || appointment.status}</span></td>
                                    <td data-label="Aksi"><button type="button" className="consultation-detail-button" onClick={() => setSelectedAppointment(appointment)}>Detail <Eye size={18} aria-hidden="true" /></button></td>
                                </tr>;
                            }) : <tr><td colSpan="7"><div className="consultations-empty"><Search size={30} aria-hidden="true" /><h3>{hasFilters ? 'Konsultasi tidak ditemukan' : 'Belum ada pengajuan konsultasi'}</h3><p>{hasFilters ? 'Ubah kata kunci atau filter untuk melihat data lain.' : 'Pengajuan customer akan tampil di sini.'}</p>{hasFilters && <button type="button" onClick={resetFilters}>Reset filter</button>}</div></td></tr>}</tbody>
                        </table>
                    </div>
                    {appointments.last_page > 1 && <nav className="consultations-pagination" aria-label="Navigasi halaman konsultasi">{links[0]?.url ? <Link href={links[0].url} preserveScroll><ChevronLeft size={20} aria-hidden="true" /> Sebelumnya</Link> : <span className="disabled"><ChevronLeft size={20} aria-hidden="true" /> Sebelumnya</span>}<span>Halaman <strong>{appointments.current_page}</strong> dari {appointments.last_page}</span>{links.at(-1)?.url ? <Link href={links.at(-1).url} preserveScroll>Berikutnya <ChevronRight size={20} aria-hidden="true" /></Link> : <span className="disabled">Berikutnya <ChevronRight size={20} aria-hidden="true" /></span>}</nav>}
                </section>

                <section className="consultation-settings" aria-labelledby="consultation-settings-title">
                    <div className="consultations-section-heading"><div><h2 id="consultation-settings-title">Jadwal dan mentor</h2><p>Perubahan berlaku untuk permintaan baru dan validasi admin.</p></div></div>
                    <form onSubmit={saveSettings}><input type="hidden" name="timezone" value={settingsForm.data.timezone} />
                        <div className="consultation-settings__grid"><label>Label hari layanan<input value={settingsForm.data.workingDaysLabel} onChange={event => settingsForm.setData('workingDaysLabel', event.target.value)} /></label><label>Jam buka<input type="time" value={settingsForm.data.opensAt} onChange={event => settingsForm.setData('opensAt', event.target.value)} /></label><label>Jam tutup<input type="time" value={settingsForm.data.closesAt} onChange={event => settingsForm.setData('closesAt', event.target.value)} /></label><label>Minimal pengajuan (jam)<input type="number" min="1" value={settingsForm.data.minimumLeadHours} onChange={event => settingsForm.setData('minimumLeadHours', Number(event.target.value))} /></label><label>Masa aktif link DP (jam)<input type="number" min="1" value={settingsForm.data.depositExpiryHours} onChange={event => settingsForm.setData('depositExpiryHours', Number(event.target.value))} /></label><label>Batas reschedule (jam)<input type="number" min="1" value={settingsForm.data.rescheduleCutoffHours} onChange={event => settingsForm.setData('rescheduleCutoffHours', Number(event.target.value))} /></label></div>
                        <div className="consultation-mentors"><div><h3>Mentor</h3><button type="button" className="secondary" onClick={() => settingsForm.setData('mentors', [...settingsForm.data.mentors, { key: '', name: '', active: true }])}><Plus size={18} /> Tambah mentor</button></div>{settingsForm.data.mentors.map((mentor, index) => <div className="consultation-mentor" key={mentor.key || index}><UserRound size={20} /><input aria-label={`Nama mentor ${index + 1}`} value={mentor.name} onChange={event => updateMentor(index, 'name', event.target.value)} placeholder="Nama mentor" /><label><input type="checkbox" checked={isChecked(mentor.active)} onChange={event => updateMentor(index, 'active', event.target.checked)} /> Aktif</label><button type="button" aria-label={`Hapus mentor ${mentor.name || index + 1}`} onClick={() => settingsForm.setData('mentors', settingsForm.data.mentors.filter((_, itemIndex) => itemIndex !== index))}><Trash2 size={18} /></button></div>)}</div>
                        <button type="submit" disabled={settingsForm.processing}><Save size={18} /> {settingsForm.processing ? 'Menyimpan…' : 'Simpan pengaturan'}</button>
                    </form>
                </section>
            </main>

            {selectedAppointment && <div className="consultation-modal-overlay" onClick={closeDetail}><section className="consultation-detail" role="dialog" aria-modal="true" aria-labelledby="consultation-detail-title" onClick={event => event.stopPropagation()}><header><div><span className={`consultation-status consultation-status--${selectedAppointment.status}`}>{statusLabels[selectedAppointment.status] || selectedAppointment.status}</span><h2 id="consultation-detail-title">{selectedAppointment.booking_code}</h2><p>{selectedAppointment.customer_name} · diajukan {displayDate(selectedAppointment.created_at)}</p></div><button type="button" onClick={closeDetail} aria-label="Tutup detail"><X size={22} /></button></header><div className="consultation-detail__body">
                {selectedAppointment.conflicts?.length > 0 && <section className="consultation-conflict-alert"><AlertTriangle size={24} aria-hidden="true" /><div><h3>Jadwal ini bertabrakan</h3><p>Atur ulang salah satu konsultasi sebelum mengonfirmasi jadwal.</p><ol>{selectedAppointment.conflicts.map(conflict => <li key={conflict.booking_code}><strong>{conflict.customer_name}</strong> · {conflict.booking_code}<span>{displayDate(conflict.scheduled_start_at)} · diajukan {displayDate(conflict.created_at)}</span></li>)}</ol></div></section>}
                <section className="consultation-detail__section"><h3>Detail permintaan</h3><dl><div><dt>WhatsApp</dt><dd>{selectedAppointment.whatsapp}</dd></div><div><dt>Paket</dt><dd>{selectedAppointment.package_name} · {selectedAppointment.option_label}</dd></div><div><dt>Jadwal</dt><dd>{displayDate(appointmentStart(selectedAppointment))}</dd></div><div><dt>Durasi</dt><dd>{selectedAppointment.duration_minutes} menit</dd></div><div><dt>Nilai konsultasi</dt><dd>{formatPrice(selectedAppointment.total_price)} · DP {formatPrice(selectedAppointment.deposit_amount)}</dd></div><div><dt>Mentor</dt><dd>{selectedAppointment.mentor_name || 'Belum dipilih'}</dd></div><div className="wide"><dt>Kebutuhan</dt><dd>{selectedAppointment.consultation_need}</dd></div></dl><div className="consultation-quick-actions"><a href={selectedAppointment.whatsapp_url} target="_blank" rel="noreferrer"><MessageCircle size={18} aria-hidden="true" /> Hubungi WhatsApp</a>{selectedAppointment.payment_link && <button type="button" onClick={() => copyLink(selectedAppointment.payment_link)}><Copy size={18} aria-hidden="true" /> Salin link DP</button>}{depositTransaction?.payment?.id && <a href={route('payments.proof', depositTransaction.payment.id)} target="_blank" rel="noreferrer"><ExternalLink size={18} aria-hidden="true" /> Lihat bukti DP</a>}</div></section>
                <section className="consultation-action-panel">
                    {(selectedAppointment.status === 'requested' || selectedAppointment.status === 'expired') && <><h3>Setujui jadwal</h3><p>Pilih mentor dan waktu bebas bentrok sebelum mengirim link DP.</p><label>Mentor<select value={selectedDraft.mentor_key} onChange={event => updateDraft(selectedAppointment, 'mentor_key', event.target.value)}><option value="">Pilih mentor</option>{consultationSettings.mentors?.filter(mentor => mentor.active).map(mentor => <option key={mentor.key} value={mentor.key}>{mentor.name}</option>)}</select></label><div className="consultation-action-pair"><label>Tanggal<input type="date" value={selectedDraft.scheduled_date} onChange={event => updateDraft(selectedAppointment, 'scheduled_date', event.target.value)} /></label><label>Waktu<input type="time" step="60" value={selectedDraft.scheduled_time} onChange={event => updateDraft(selectedAppointment, 'scheduled_time', event.target.value)} /></label></div><label>Lokasi yang disepakati<input value={selectedDraft.location} onChange={event => updateDraft(selectedAppointment, 'location', event.target.value)} placeholder="Alamat atau lokasi pertemuan" /></label><button type="button" onClick={() => act('admin.consultations.approve', selectedAppointment, selectedDraft, 'Jadwal disetujui. Link DP siap dikirim.')}>Periksa bentrok & setujui</button><label>Alasan jika ditolak<textarea rows="2" value={selectedDraft.reason} onChange={event => updateDraft(selectedAppointment, 'reason', event.target.value)} /></label><button type="button" className="secondary danger" onClick={() => act('admin.consultations.reject', selectedAppointment, { reason: selectedDraft.reason }, 'Permintaan ditolak.')}>Tolak permintaan</button></>}
                    {selectedAppointment.status === 'deposit_review' && <><h3>DP perlu diverifikasi</h3><p>Buka bukti pembayaran, lalu verifikasi melalui halaman transaksi.</p><Link className="consultation-action-link" href={route('admin.transactions.index')}>Buka transaksi <ExternalLink size={18} aria-hidden="true" /></Link></>}
                    {selectedAppointment.status === 'booked' && <><h3>Reschedule atau selesaikan</h3><label>Inisiator reschedule<select value={selectedDraft.initiator} onChange={event => updateDraft(selectedAppointment, 'initiator', event.target.value)}><option value="provider">JAGGAD / mentor</option><option value="customer">Customer</option></select></label><label>Mentor<select value={selectedDraft.mentor_key} onChange={event => updateDraft(selectedAppointment, 'mentor_key', event.target.value)}>{consultationSettings.mentors?.filter(mentor => mentor.active).map(mentor => <option key={mentor.key} value={mentor.key}>{mentor.name}</option>)}</select></label><div className="consultation-action-pair"><label>Tanggal baru<input type="date" value={selectedDraft.scheduled_date} onChange={event => updateDraft(selectedAppointment, 'scheduled_date', event.target.value)} /></label><label>Waktu baru<input type="time" step="60" value={selectedDraft.scheduled_time} onChange={event => updateDraft(selectedAppointment, 'scheduled_time', event.target.value)} /></label></div><label>Lokasi<input value={selectedDraft.location} onChange={event => updateDraft(selectedAppointment, 'location', event.target.value)} /></label><button type="button" className="secondary" onClick={() => act('admin.consultations.reschedule', selectedAppointment, selectedDraft, 'Jadwal diperbarui.')}>Periksa & simpan reschedule</button><div className="consultation-action-pair"><label>Pelunasan<input type="number" min="0" value={selectedDraft.amount} onChange={event => updateDraft(selectedAppointment, 'amount', event.target.value)} /></label><label>Metode<select value={selectedDraft.payment_method} onChange={event => updateDraft(selectedAppointment, 'payment_method', event.target.value)}><option value="cash">Tunai</option><option value="bank_transfer">Transfer bank</option><option value="qris">QRIS</option><option value="other">Lainnya</option></select></label></div><button type="button" onClick={() => act('admin.consultations.complete', selectedAppointment, selectedDraft, 'Sesi dan pelunasan dicatat selesai.')}><CheckCircle2 size={18} aria-hidden="true" /> Selesaikan konsultasi</button><label>Pihak yang membatalkan<select value={selectedDraft.cancellation_initiator} onChange={event => updateDraft(selectedAppointment, 'cancellation_initiator', event.target.value)}><option value="customer">Customer</option><option value="provider">JAGGAD / mentor</option></select></label><label>Alasan pembatalan<input value={selectedDraft.reason} onChange={event => updateDraft(selectedAppointment, 'reason', event.target.value)} /></label><button type="button" className="secondary danger" onClick={() => act('admin.consultations.cancel', selectedAppointment, { status: 'cancelled', initiator: selectedDraft.cancellation_initiator, reason: selectedDraft.reason }, 'Booking dibatalkan.')}>Batalkan booking</button></>}
                    {selectedAppointment.status === 'cancelled' && selectedAppointment.cancellation_initiator === 'provider' && <><h3>Refund oleh JAGGAD</h3><label>Catatan refund<textarea rows="3" value={selectedDraft.note} onChange={event => updateDraft(selectedAppointment, 'note', event.target.value)} /></label><button type="button" onClick={() => act('admin.consultations.refund', selectedAppointment, { note: selectedDraft.note }, 'Refund DP dicatat.')}>Catat refund DP penuh</button></>}
                </section>
            </div></section></div>}
        </AdminLayout>
    );
}
