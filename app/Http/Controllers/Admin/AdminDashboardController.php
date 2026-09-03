<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Carbon;

class AdminDashboardController extends Controller
{
    public function index()
    {
        // Compute stats
        $totalRevenue = Transaction::where('status', 'success')->sum('total_amount');
        $totalSales = Transaction::where('status', 'success')->count();
        $totalUsers = User::where('role', 'customer')->count();
        $totalWaitingPayment = Transaction::where('status', 'pending')->count();
        $totalActiveProducts = Product::count();

        $now = Carbon::now();
        $lastMonth = Carbon::now()->subMonth();

        $calcPerc = function($curr, $prev) {
            if ($prev == 0) return $curr > 0 ? 100 : 0;
            return round((($curr - $prev) / $prev) * 100);
        };

        $salesThisMonth = Transaction::where('status', 'success')->whereYear('created_at', $now->year)->whereMonth('created_at', $now->month)->count();
        $salesLastMonth = Transaction::where('status', 'success')->whereYear('created_at', $lastMonth->year)->whereMonth('created_at', $lastMonth->month)->count();
        $salesChange = $calcPerc($salesThisMonth, $salesLastMonth);

        $revenueThisMonth = Transaction::where('status', 'success')->whereYear('created_at', $now->year)->whereMonth('created_at', $now->month)->sum('total_amount');
        $revenueLastMonth = Transaction::where('status', 'success')->whereYear('created_at', $lastMonth->year)->whereMonth('created_at', $lastMonth->month)->sum('total_amount');
        $revenueChange = $calcPerc($revenueThisMonth, $revenueLastMonth);

        $usersThisMonth = User::where('role', 'customer')->whereYear('created_at', $now->year)->whereMonth('created_at', $now->month)->count();
        $usersLastMonth = User::where('role', 'customer')->whereYear('created_at', $lastMonth->year)->whereMonth('created_at', $lastMonth->month)->count();
        $usersChange = $calcPerc($usersThisMonth, $usersLastMonth);

        $productsThisMonth = Product::whereYear('created_at', $now->year)->whereMonth('created_at', $now->month)->count();
        $productsLastMonth = Product::whereYear('created_at', $lastMonth->year)->whereMonth('created_at', $lastMonth->month)->count();
        $productsChange = $calcPerc($productsThisMonth, $productsLastMonth);

        $currentYear = Carbon::now()->year;
        $monthlyTransactions = Transaction::where('status', 'success')
            ->whereYear('created_at', $currentYear)
            ->get(['created_at', 'total_amount'])
            ->groupBy(fn ($transaction) => $transaction->created_at->month)
            ->map(fn ($transactions) => [
                'revenue' => $transactions->sum('total_amount'),
                'orders' => $transactions->count(),
            ]);

        $monthsLabel = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
        
        $salesData = [];
        // Only show up to current month for a cleaner chart (or all 12 if preferred, let's just do all 12)
        for ($i = 1; $i <= 12; $i++) {
            $data = $monthlyTransactions->get($i);
            $salesData[] = [
                'month' => $monthsLabel[$i - 1],
                'revenue' => $data ? (float) $data['revenue'] : 0,
                'orders' => $data ? (int) $data['orders'] : 0,
            ];
        }

        return Inertia::render('Admin/AdminDashboard', [
            'stats' => [
                'revenue' => $revenueThisMonth,
                'revenue_change' => $revenueChange,
                'sales' => $totalSales,
                'sales_change' => $salesChange,
                'users' => $totalUsers,
                'users_change' => $usersChange,
                'waiting_payment' => $totalWaitingPayment,
                'active_products' => $totalActiveProducts,
                'products_change' => $productsChange,
            ],
            'salesData' => $salesData,
            // fetch last 5 transactions
            'recentTransactions' => Transaction::with(['user', 'items.product'])->latest()->take(5)->get()
        ]);
    }
}
