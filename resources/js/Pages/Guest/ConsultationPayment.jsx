import { Head, useForm } from '@inertiajs/react';
import { CheckCircle2, Clock3, Landmark, LockKeyhole, Upload } from 'lucide-react';
import MainLayout from '../../Layouts/MainLayout';
import { formatPrice } from '../../Utils/helpers';
import './ConsultationPayment.css';

export default function ConsultationPayment({ appointment, transaction, dbPaymentMethods = [], uploadUrl }) {
    const payment = transaction?.payment;
    const canUpload = appointment.status === 'awaiting_deposit' && (!payment || payment.status === 'rejected');
    const { data, setData, post, processing, errors } = useForm({ payment_method_id: dbPaymentMethods[0]?.id || '', proof: null });

    const submit = event => {
        event.preventDefault();
        post(uploadUrl, { forceFormData: true, preserveScroll: true });
    };

    return (
        <MainLayout>
            <Head title={`Pembayaran DP ${appointment.booking_code} - JAGGAD Academy`} />
            <main className="consultation-payment">
                <div className="container consultation-payment__layout">
                    <section className="consultation-payment__summary">
                        <div className="consultation-payment__status"><LockKeyhole size={20} aria-hidden="true" /> Link pembayaran aman</div>
                        <h1>Amankan jadwal konsultasi Anda.</h1>
                        <p>Transfer DP sesuai nominal, lalu unggah bukti pembayaran sebelum batas waktu. Admin akan memverifikasinya secara manual.</p>
                        <dl>
                            <div><dt>Kode booking</dt><dd>{appointment.booking_code}</dd></div>
                            <div><dt>Paket</dt><dd>{appointment.package_name}</dd></div>
                            <div><dt>Jadwal</dt><dd>{new Date(appointment.scheduled_start_at).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Asia/Jakarta' })} WIB</dd></div>
                            <div><dt>Mentor</dt><dd>{appointment.mentor_name}</dd></div>
                            <div><dt>Lokasi</dt><dd>{appointment.location}</dd></div>
                            <div className="consultation-payment__amount"><dt>DP 50%</dt><dd>{formatPrice(appointment.deposit_amount)}</dd></div>
                        </dl>
                        <div className="consultation-payment__due"><Clock3 size={20} aria-hidden="true" /><span>Batas bayar {new Date(appointment.deposit_due_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta' })} WIB</span></div>
                    </section>

                    <section className="consultation-payment__form" aria-labelledby="payment-form-title">
                        {appointment.status === 'deposit_review' ? (
                            <div className="consultation-payment__notice"><CheckCircle2 size={28} aria-hidden="true" /><h2>Bukti DP sedang diperiksa.</h2><p>Admin akan memberi kabar melalui WhatsApp setelah pembayaran diverifikasi.</p></div>
                        ) : appointment.status === 'booked' || appointment.status === 'completed' ? (
                            <div className="consultation-payment__notice"><CheckCircle2 size={28} aria-hidden="true" /><h2>Jadwal sudah terkonfirmasi.</h2><p>Detail pertemuan tersimpan. Sampai bertemu bersama mentor JAGGAD.</p></div>
                        ) : appointment.status === 'expired' ? (
                            <div className="consultation-payment__notice"><Clock3 size={28} aria-hidden="true" /><h2>Link pembayaran kedaluwarsa.</h2><p>Hubungi admin melalui WhatsApp untuk meminta pengecekan jadwal kembali.</p></div>
                        ) : (
                            <>
                                <h2 id="payment-form-title">Transfer dan unggah bukti DP</h2>
                                {payment?.status === 'rejected' && <div className="consultation-payment__rejected"><strong>Bukti sebelumnya ditolak.</strong><span>{payment.rejection_reason}</span></div>}
                                {dbPaymentMethods.length ? (
                                    <form onSubmit={submit}>
                                        <fieldset>
                                            <legend>Pilih rekening tujuan</legend>
                                            {dbPaymentMethods.map(method => (
                                                <label className="consultation-bank" key={method.id}>
                                                    <input type="radio" name="payment_method_id" value={method.id} checked={String(data.payment_method_id) === String(method.id)} onChange={() => setData('payment_method_id', method.id)} />
                                                    <Landmark size={22} aria-hidden="true" />
                                                    <span><strong>{method.bank_name}</strong><small>{method.account_number} · {method.account_name}</small></span>
                                                </label>
                                            ))}
                                        </fieldset>
                                        {errors.payment_method_id && <small className="consultation-payment__error">{errors.payment_method_id}</small>}
                                        <label className="consultation-proof">
                                            <span>Bukti transfer</span>
                                            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={event => setData('proof', event.target.files[0])} required />
                                            <small>JPG, PNG, atau WebP. Maksimal 5 MB.</small>
                                        </label>
                                        {errors.proof && <small className="consultation-payment__error">{errors.proof}</small>}
                                        <button type="submit" disabled={processing || !canUpload}><Upload size={19} aria-hidden="true" /> {processing ? 'Mengunggah…' : 'Kirim bukti DP'}</button>
                                    </form>
                                ) : <div className="consultation-payment__notice"><Landmark size={28} aria-hidden="true" /><h2>Rekening belum tersedia.</h2><p>Admin akan menghubungi Anda setelah rekening pembayaran aktif.</p></div>}
                            </>
                        )}
                    </section>
                </div>
            </main>
        </MainLayout>
    );
}
