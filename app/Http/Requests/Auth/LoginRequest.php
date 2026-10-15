<?php

namespace App\Http\Requests\Auth;

use App\Models\Transaction;
use App\Models\User;
use Illuminate\Auth\Events\Lockout;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class LoginRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'email' => ['required', 'string', 'email'],
            'password' => ['nullable', 'string'],
        ];
    }

    /**
     * Attempt to authenticate the request's credentials.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function authenticate(): void
    {
        $this->ensureIsNotRateLimited();

        if ($this->string('password')->toString() === '') {
            $this->authenticatePasswordless();

            RateLimiter::clear($this->throttleKey());

            return;
        }

        if (! Auth::attempt($this->only('email', 'password'), $this->boolean('remember'))) {
            RateLimiter::hit($this->throttleKey());

            throw ValidationException::withMessages([
                'email' => trans('auth.failed'),
            ]);
        }

        // Check if user is active
        $this->ensureIsActive();

        RateLimiter::clear($this->throttleKey());
    }

    /**
     * Login tanpa password — hanya untuk akun donasi (dibuat otomatis saat
     * checkout donasi tanpa login, password null). Akun dengan password wajib
     * mengisi password seperti biasa.
     */
    private function authenticatePasswordless(): void
    {
        $user = User::query()
            ->where('email', $this->input('email'))
            ->whereNull('password')
            ->whereHas('transactions', fn ($query) => $query->where('purpose', Transaction::PURPOSE_DONATION))
            ->first();

        if (! $user) {
            RateLimiter::hit($this->throttleKey());

            throw ValidationException::withMessages([
                'password' => 'Masukkan password Anda.',
            ]);
        }

        $this->ensureIsActive($user);

        Auth::login($user, $this->boolean('remember'));
    }

    /**
     * @throws \Illuminate\Validation\ValidationException
     */
    private function ensureIsActive(?User $user = null): void
    {
        $user ??= Auth::user();

        if (in_array($user->status, ['inactive', 'Nonaktif'], true)) {
            Auth::logout();

            throw ValidationException::withMessages([
                'email' => 'Akun Anda sedang dinonaktifkan. Silakan hubungi admin untuk bantuan.',
            ]);
        }
    }

    /**
     * Ensure the login request is not rate limited.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function ensureIsNotRateLimited(): void
    {
        if (! RateLimiter::tooManyAttempts($this->throttleKey(), 5)) {
            return;
        }

        event(new Lockout($this));

        $seconds = RateLimiter::availableIn($this->throttleKey());

        throw ValidationException::withMessages([
            'email' => trans('auth.throttle', [
                'seconds' => $seconds,
                'minutes' => ceil($seconds / 60),
            ]),
        ]);
    }

    /**
     * Get the rate limiting throttle key for the request.
     */
    public function throttleKey(): string
    {
        return Str::transliterate(Str::lower($this->string('email')).'|'.$this->ip());
    }
}
