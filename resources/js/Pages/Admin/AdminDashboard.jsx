import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import {
    ArrowDownRight, ArrowUpRight, ChevronRight, Clock, Minus,
    Package, Receipt, TrendingUp, Users,
} from 'lucide-react';
import {
    Area, AreaChart, Bar, BarChart, CartesianGrid,
    ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import AdminLayout from '../../Layouts/AdminLayout';
import { formatCurrency } from '../../Utils/helpers';
import './Admin.css';

const compactCurrency = new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', notation: 'compact', maximumFractionDigits: 1,
});

const formatChange = value => value === 0
    ? 'Stabil dari bulan lalu'
    : `${value > 0 ? '+' : ''}${value}% dari bulan lalu`;

export default function AdminDashboard({ stats = {}, recentTransactions = [], salesData = [] }) {
    const [chartMetric, setChartMetric] = useState('revenue');
    const revenueChange = stats.revenue_change || 0;
    const RevenueChangeIcon = revenueChange > 0 ? ArrowUpRight : revenueChange < 0 ? ArrowDownRight : Minus;
    const pendingPayments = stats.waiting_payment || 0;
    const chartIsEmpty = salesData.every(item => !item[chartMetric]);
    const dashboardStats = [
        { icon: Receipt, label: 'Transaksi berhasil', value: stats.sales || 0, change: stats.sales_change || 0 },
        { icon: Users, label: 'Pengguna terdaftar', value: stats.users || 0, change: stats.users_change || 0 },
        { icon: Package, label: 'Produk', value: stats.active_products || 0, change: stats.products_change || 0 },
        { icon: Clock, label: 'Pembayaran pending', value: pendingPayments, urgent: pendingPayments > 0 },
    ];
    const recentOrders = recentTransactions.map(transaction => ({
        id: transaction.transaction_code,
        customer: transaction.user?.name || 'Pelanggan dihapus',
        product: transaction.items?.map(item => item.product?.name).filter(Boolean).join(', ') || 'Produk tidak tersedia',
        amount: transaction.total_amount || 0,
        status: transaction.status === 'success' ? 'Berhasil' : transaction.status === 'failed' ? 'Gagal' : 'Pending',
        date: new Date(transaction.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
    }));

    return (
        <AdminLayout>
            <Head title="Admin Dashboard - JAGGAD ACADEMY" />
            <div className="admin-page dashboard-page">
                <header className="dashboard-header">
                    <div>
                        <h1>Dashboard</h1>
                        <p>Pantau transaksi, pendapatan, dan aktivitas JAGGAD ACADEMY.</p>
                    </div>
                    <Link href={route('admin.transactions.index')} className={`dashboard-pending-link ${pendingPayments > 0 ? 'is-urgent' : ''}`}>
                        <Clock size={20} aria-hidden="true" />
                        <span>{pendingPayments > 0 ? <><strong>{pendingPayments}</strong> pembayaran menunggu</> : 'Tidak ada pembayaran menunggu'}</span>
                        <ChevronRight size={20} aria-hidden="true" />
                    </Link>
                </header>

                <section className="dashboard-overview" aria-label="Ringkasan platform">
                    <div className="dashboard-revenue">
                        <div className="dashboard-revenue__heading">
                            <span className="dashboard-overview__icon"><TrendingUp size={22} aria-hidden="true" /></span>
                            <span>Pendapatan bulan ini</span>
                        </div>
                        <strong>{formatCurrency(stats.revenue || 0)}</strong>
                        <span className={`dashboard-change ${revenueChange > 0 ? 'is-up' : revenueChange < 0 ? 'is-down' : ''}`}>
                            <RevenueChangeIcon size={18} aria-hidden="true" />
                            {formatChange(revenueChange)}
                        </span>
                    </div>
                    <div className="dashboard-metrics">
                        {dashboardStats.map(({ icon: Icon, label, value, change, urgent }) => (
                            <div className={`dashboard-metric ${urgent ? 'is-urgent' : ''}`} key={label}>
                                <span className="dashboard-overview__icon"><Icon size={20} aria-hidden="true" /></span>
                                <div>
                                    <span>{label}</span>
                                    <strong>{value}</strong>
                                    {change !== undefined && <small>{formatChange(change)}</small>}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <div className="dashboard-workspace">
                    <section className="dashboard-activity" aria-labelledby="recent-transactions-title">
                        <div className="dashboard-section-header">
                            <div>
                                <h2 id="recent-transactions-title">Transaksi terbaru</h2>
                                <p>Lima aktivitas pembayaran paling baru.</p>
                            </div>
                            <Link href={route('admin.transactions.index')} className="dashboard-text-link">
                                Lihat semua <ChevronRight size={18} aria-hidden="true" />
                            </Link>
                        </div>
                        {recentOrders.length > 0 ? (
                            <div className="dashboard-transaction-list">
                                {recentOrders.map(order => (
                                    <article className="dashboard-transaction" key={order.id}>
                                        <div className="dashboard-transaction__customer">
                                            <strong>{order.customer}</strong>
                                            <span title={order.product}>{order.product}</span>
                                        </div>
                                        <div className="dashboard-transaction__meta">
                                            <span>{order.id}</span>
                                            <time>{order.date}</time>
                                        </div>
                                        <div className="dashboard-transaction__amount">
                                            <strong>{formatCurrency(order.amount)}</strong>
                                            <span className={`status-badge ${order.status === 'Berhasil' ? 'success' : order.status === 'Pending' ? 'warning' : 'error'}`}>
                                                {order.status}
                                            </span>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        ) : (
                            <div className="dashboard-empty-state">
                                <Receipt size={30} aria-hidden="true" />
                                <h3>Belum ada transaksi</h3>
                                <p>Transaksi pelanggan akan muncul di sini setelah checkout.</p>
                            </div>
                        )}
                    </section>

                    <section className="dashboard-trend" aria-labelledby="dashboard-trend-title">
                        <div className="dashboard-section-header">
                            <div>
                                <h2 id="dashboard-trend-title">Tren {new Date().getFullYear()}</h2>
                                <p>Performa bulanan platform.</p>
                            </div>
                        </div>
                        <div className="dashboard-chart-switch" aria-label="Pilih metrik grafik">
                            <button type="button" className={chartMetric === 'revenue' ? 'active' : ''} aria-pressed={chartMetric === 'revenue'} onClick={() => setChartMetric('revenue')}>Pendapatan</button>
                            <button type="button" className={chartMetric === 'orders' ? 'active' : ''} aria-pressed={chartMetric === 'orders'} onClick={() => setChartMetric('orders')}>Pesanan</button>
                        </div>
                        {chartIsEmpty ? (
                            <div className="dashboard-chart-empty">
                                <TrendingUp size={28} aria-hidden="true" />
                                <p>Belum ada data {chartMetric === 'revenue' ? 'pendapatan' : 'pesanan'} tahun ini.</p>
                            </div>
                        ) : (
                            <div className="dashboard-chart">
                                <ResponsiveContainer width="100%" height="100%">
                                    {chartMetric === 'revenue' ? (
                                        <AreaChart data={salesData} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="dashboardRevenue" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#660810" stopOpacity={0.22} />
                                                    <stop offset="100%" stopColor="#660810" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid vertical={false} stroke="#e7e9ee" />
                                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#667085', fontSize: 16 }} />
                                            <YAxis width={72} axisLine={false} tickLine={false} tickFormatter={value => compactCurrency.format(value)} tick={{ fill: '#667085', fontSize: 16 }} />
                                            <Tooltip formatter={value => [formatCurrency(value), 'Pendapatan']} contentStyle={{ border: '1px solid #e2e8f0', borderRadius: 12, fontSize: 16 }} />
                                            <Area type="monotone" dataKey="revenue" stroke="#660810" fill="url(#dashboardRevenue)" strokeWidth={3} />
                                        </AreaChart>
                                    ) : (
                                        <BarChart data={salesData} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
                                            <CartesianGrid vertical={false} stroke="#e7e9ee" />
                                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#667085', fontSize: 16 }} />
                                            <YAxis width={40} allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#667085', fontSize: 16 }} />
                                            <Tooltip formatter={value => [value, 'Pesanan']} contentStyle={{ border: '1px solid #e2e8f0', borderRadius: 12, fontSize: 16 }} />
                                            <Bar dataKey="orders" fill="#660810" radius={[6, 6, 0, 0]} maxBarSize={24} />
                                        </BarChart>
                                    )}
                                </ResponsiveContainer>
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </AdminLayout>
    );
}
