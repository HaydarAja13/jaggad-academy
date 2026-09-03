<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class AdminUserController extends Controller
{
    public function index()
    {
        // Ensure all users have slugs
        User::whereNull('slug')->orWhere('slug', '')->get()->each(function($u) {
            $u->slug = \Illuminate\Support\Str::slug($u->name) . '-' . uniqid();
            $u->save();
        });

        $users = User::latest()->get();
        return Inertia::render('Admin/AdminUsers', [
            'dbUsers' => $users
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'role' => 'required|string|in:customer,admin',
            'status' => 'required|string|in:active,inactive,Aktif,Nonaktif',
            'phone' => 'nullable|string|max:20',
        ]);

        User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => \Illuminate\Support\Facades\Hash::make($request->password),
            'role' => $request->role,
            'status' => $this->normalizeStatus($request->status),
            'phone' => $request->phone,
            'email_verified_at' => now(),
        ]);

        return back()->with('success', 'Pengguna berhasil ditambahkan.');
    }

    public function update(Request $request, User $user)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
            'password' => 'nullable|string|min:8',
            'role' => 'required|string|in:customer,admin',
            'status' => 'required|string|in:active,inactive,Aktif,Nonaktif',
            'phone' => 'nullable|string|max:20',
        ]);

        $newStatus = $this->normalizeStatus($request->status);
        $removesActiveAdmin = $user->isAdmin() && ($request->role !== 'admin' || $newStatus !== 'active');
        if ($removesActiveAdmin && User::where('role', 'admin')->where('status', 'active')->count() <= 1) {
            throw ValidationException::withMessages(['user' => 'Admin aktif terakhir tidak dapat diturunkan atau dinonaktifkan.']);
        }

        if ($user->is(auth()->user()) && ($request->role !== 'admin' || $newStatus !== 'active')) {
            throw ValidationException::withMessages(['user' => 'Anda tidak dapat menurunkan atau menonaktifkan akun sendiri.']);
        }

        $data = [
            'name' => $request->name,
            'email' => $request->email,
            'role' => $request->role,
            'status' => $newStatus,
            'phone' => $request->phone,
        ];

        if ($request->password) {
            $data['password'] = \Illuminate\Support\Facades\Hash::make($request->password);
        }

        $user->update($data);

        return back()->with('success', 'Data pengguna berhasil diperbarui.');
    }

    public function toggleStatus(User $user)
    {
        if ($user->is(auth()->user())) {
            throw ValidationException::withMessages(['user' => 'Anda tidak dapat menonaktifkan akun sendiri.']);
        }

        if ($user->isAdmin() && $user->status === 'active' && User::where('role', 'admin')->where('status', 'active')->count() <= 1) {
            throw ValidationException::withMessages(['user' => 'Admin aktif terakhir tidak dapat dinonaktifkan.']);
        }

        $user->status = $this->normalizeStatus($user->status) === 'active' ? 'inactive' : 'active';
        $user->save();

        return back()->with('success', 'Status pengguna diperbarui.');
    }

    public function destroy(User $user)
    {
        if ($user->is(auth()->user())) {
            throw ValidationException::withMessages(['user' => 'Anda tidak dapat menghapus akun sendiri.']);
        }

        if ($user->isAdmin() && User::where('role', 'admin')->count() <= 1) {
            throw ValidationException::withMessages(['user' => 'Admin terakhir tidak dapat dihapus.']);
        }

        if ($user->transactions()->exists()) {
            throw ValidationException::withMessages(['user' => 'Pengguna yang memiliki histori transaksi tidak dapat dihapus.']);
        }

        $user->delete();
        return back()->with('success', 'Pengguna berhasil dihapus.');
    }

    private function normalizeStatus(string $status): string
    {
        return in_array($status, ['inactive', 'Nonaktif'], true) ? 'inactive' : 'active';
    }
}
