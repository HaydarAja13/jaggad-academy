<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $contentData = \App\Models\SiteContent::where('key', 'site_content')->first();
        $dbContent = $contentData ? json_decode($contentData->value, true) : null;

        $purchasedProductIds = [];
        if ($request->user()) {
            $purchasedProductIds = $request->user()->products()->pluck('products.id')->toArray();
        }

        $settingsData = \App\Models\SiteContent::where('key', 'site_settings')->first();
        $siteSettings = $settingsData ? json_decode($settingsData->value, true) : [];

        $adsData = \App\Models\SiteContent::where('key', 'ads_promo')->first();
        $dbAds = $adsData ? json_decode($adsData->value, true) : null;

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user(),
                'purchased_products' => $purchasedProductIds,
            ],
            'siteContent' => array_merge($dbContent ?: [], [
                'ads' => $dbAds
            ]),
            'midtrans' => [
                'client_key' => $siteSettings['midtrans_client_key'] ?? config('services.midtrans.client_key'),
                'is_production' => $siteSettings['midtrans_is_production'] ?? config('services.midtrans.is_production'),
            ],
            'meta_pixel_id' => $siteSettings['meta_pixel_id'] ?? null,
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
                'info' => $request->session()->get('info'),
                'email_warning' => $request->session()->get('email_warning'),
                'snap_token' => $request->session()->get('snap_token'),
                'trx_code' => $request->session()->get('trx_code'),
            ],
        ];
    }
}
