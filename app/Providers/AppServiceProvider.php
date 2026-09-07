<?php

namespace App\Providers;

use App\Models\SiteContent;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Midtrans\Config;

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
            if (Schema::hasTable('site_contents')) {
                $settings = SiteContent::where('key', 'site_settings')->first();
                if ($settings) {
                    $json = json_decode($settings->value, true);
                    if (! empty($json['google_client_id'])) {
                        config(['services.google.client_id' => $json['google_client_id']]);
                    }
                    if (! empty($json['google_client_secret'])) {
                        config(['services.google.client_secret' => $json['google_client_secret']]);
                    }
                    if (! empty($json['google_redirect_url'])) {
                        config(['services.google.redirect' => $json['google_redirect_url']]);
                    }

                    if (! empty($json['midtrans_server_key'])) {
                        config(['services.midtrans.server_key' => $json['midtrans_server_key']]);
                    }
                    if (! empty($json['midtrans_client_key'])) {
                        config(['services.midtrans.client_key' => $json['midtrans_client_key']]);
                    }
                    if (isset($json['midtrans_is_production'])) {
                        config(['services.midtrans.is_production' => (bool) $json['midtrans_is_production']]);
                    }

                    // Dynamically set Mail config from database
                    if (! empty($json['mail_host'])) {
                        config(['mail.mailers.smtp.host' => $json['mail_host']]);
                    }
                    if (! empty($json['mail_port'])) {
                        config(['mail.mailers.smtp.port' => $json['mail_port']]);
                    }
                    if (! empty($json['mail_username'])) {
                        config(['mail.mailers.smtp.username' => $json['mail_username']]);
                    }
                    if (! empty($json['mail_password'])) {
                        config(['mail.mailers.smtp.password' => $json['mail_password']]);
                    }
                    if (isset($json['mail_encryption'])) {
                        config(['mail.mailers.smtp.scheme' => $json['mail_encryption'] === 'ssl' ? 'smtps' : 'smtp']);
                    }
                    if (! empty($json['mail_from_address'])) {
                        config(['mail.from.address' => $json['mail_from_address']]);
                    }
                    if (! empty($json['mail_from_name'])) {
                        config(['mail.from.name' => $json['mail_from_name']]);
                    }
                    // Switch mailer to smtp if host is configured
                    if (! empty($json['mail_host'])) {
                        config(['mail.default' => 'smtp']);
                    }
                }
            }
        } catch (\Exception $e) {
            // Silently fail if DB not found/ready
        }

        // Configure the SDK even when settings only come from environment variables.
        Config::$serverKey = config('services.midtrans.server_key');
        Config::$isProduction = config('services.midtrans.is_production');
        Config::$isSanitized = config('services.midtrans.is_sanitized');
        Config::$is3ds = config('services.midtrans.is_3ds');
        Config::$curlOptions = [
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_TIMEOUT => 20,
            CURLOPT_HTTPHEADER => ['Expect:'],
        ];

        // Force HTTPS in production
        if (config('app.env') === 'production') {
            URL::forceScheme('https');
        }
    }
}
