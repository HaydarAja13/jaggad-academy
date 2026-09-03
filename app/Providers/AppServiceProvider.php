<?php

namespace App\Providers;

use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        // Dynamically set Socialite Google config from database
        try {
            if (\Illuminate\Support\Facades\Schema::hasTable('site_contents')) {
                $settings = \App\Models\SiteContent::where('key', 'site_settings')->first();
                if ($settings) {
                    $json = json_decode($settings->value, true);
                    if (!empty($json['google_client_id'])) {
                        config(['services.google.client_id' => $json['google_client_id']]);
                    }
                    if (!empty($json['google_client_secret'])) {
                        config(['services.google.client_secret' => $json['google_client_secret']]);
                    }
                    if (!empty($json['google_redirect_url'])) {
                        config(['services.google.redirect' => $json['google_redirect_url']]);
                    }

                    if (!empty($json['midtrans_server_key'])) {
                        config(['services.midtrans.server_key' => $json['midtrans_server_key']]);
                    }
                    if (!empty($json['midtrans_client_key'])) {
                        config(['services.midtrans.client_key' => $json['midtrans_client_key']]);
                    }
                    if (isset($json['midtrans_is_production'])) {
                        config(['services.midtrans.is_production' => (bool)$json['midtrans_is_production']]);
                    }

                    // Dynamically set Mail config from database
                    if (!empty($json['mail_host'])) {
                        config(['mail.mailers.smtp.host' => $json['mail_host']]);
                    }
                    if (!empty($json['mail_port'])) {
                        config(['mail.mailers.smtp.port' => $json['mail_port']]);
                    }
                    if (!empty($json['mail_username'])) {
                        config(['mail.mailers.smtp.username' => $json['mail_username']]);
                    }
                    if (!empty($json['mail_password'])) {
                        config(['mail.mailers.smtp.password' => $json['mail_password']]);
                    }
                    if (isset($json['mail_encryption'])) {
                        config(['mail.mailers.smtp.encryption' => $json['mail_encryption'] ?: null]);
                    }
                    if (!empty($json['mail_from_address'])) {
                        config(['mail.from.address' => $json['mail_from_address']]);
                    }
                    if (!empty($json['mail_from_name'])) {
                        config(['mail.from.name' => $json['mail_from_name']]);
                    }
                    // Switch mailer to smtp if host is configured
                    if (!empty($json['mail_host'])) {
                        config(['mail.default' => 'smtp']);
                    }
                }
            }
        } catch (\Exception $e) {
            // Silently fail if DB not found/ready
        }

        // Configure the SDK even when settings only come from environment variables.
        \Midtrans\Config::$serverKey = config('services.midtrans.server_key');
        \Midtrans\Config::$isProduction = config('services.midtrans.is_production');
        \Midtrans\Config::$isSanitized = config('services.midtrans.is_sanitized');
        \Midtrans\Config::$is3ds = config('services.midtrans.is_3ds');

        // Force HTTPS in production
        if (config('app.env') === 'production' || config('app.debug') === false) {
            \Illuminate\Support\Facades\URL::forceScheme('https');
        }
    }
}
