<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;

class GoogleController extends Controller
{
    public function redirectToGoogle()
    {
        return Socialite::driver('google')->redirect();
    }

    public function handleGoogleCallback(Request $request)
    {
        try {
            $user = Socialite::driver('google')->user();
            $findUser = User::where('email', $user->email)->first();

            if ($findUser) {
                if ($findUser->status === 'inactive') {
                    return redirect()->route('login')->withErrors([
                        'email' => 'Akun Anda sedang dinonaktifkan. Silakan hubungi admin untuk bantuan.',
                    ]);
                }

                // If user doesn't have google_id yet, sync it
                if (is_null($findUser->google_id)) {
                    $findUser->update([
                        'google_id' => $user->id,
                        'avatar' => $user->avatar,
                    ]);
                }

                Auth::login($findUser);
                $request->session()->regenerate();

                return redirect()->intended(route('dashboard', absolute: false));
            } else {
                $newUser = User::create([
                    'name' => $user->name,
                    'email' => $user->email,
                    'google_id' => $user->id,
                    'avatar' => $user->avatar,
                    'password' => null, // Password is null for social login
                    'status' => 'active',
                    'role' => 'customer',
                    'email_verified_at' => now(),
                ]);

                Auth::login($newUser);
                $request->session()->regenerate();

                return redirect()->intended(route('dashboard', absolute: false));
            }

        } catch (Exception $e) {
            return redirect(route('login'))->withErrors(['email' => 'Gagal masuk menggunakan Google.']);
        }
    }
}
