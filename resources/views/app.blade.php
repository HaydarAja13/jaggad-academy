<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        @php
            $siteContent = \App\Models\SiteContent::where('key', 'site_content')->first();
            $branding = $siteContent ? (json_decode($siteContent->value, true)['branding'] ?? []) : [];
            $siteTitle = ($branding['siteName'] ?? config('app.name', 'Laravel')) . ' ' . ($branding['siteTagline'] ?? '');
            
            $brandingFavicon = $branding['favicon'] ?? null;
            if ($brandingFavicon) {
                $favicon = str_starts_with($brandingFavicon, 'http') ? $brandingFavicon : asset('storage/' . $brandingFavicon);
            } else {
                $favicon = asset('favicon.ico');
            }
        @endphp

        <title inertia>{{ $siteTitle }}</title>
        <link rel="icon" type="image/x-icon" href="{{ $favicon }}">

        <!-- Fonts -->
        <link rel="preconnect" href="https://api.fontshare.com">
        <link href="https://api.fontshare.com/v2/css?f[]=synonym@400&f[]=chillax@600&display=swap" rel="stylesheet">

        <!-- Scripts -->
        @routes
        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.jsx'])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @if(request()->routeIs('consultations.*'))
        <!--
        THESIS: Consultation is a composed decision desk where a guest can compare four honest packages and request one precise offline appointment without ecommerce clutter.
        OWN-WORLD: Cool-white fields, warm rules, ink-black Chillax headings, Synonym copy, and one deep-maroon package and action mass.
        STORY: Compare scope and duration, understand the 50% deposit, request a valid evening schedule, then wait for personal WhatsApp confirmation.
        FIRST VIEWPORT: An editorial introduction and schedule rule lead directly into the four-package board; the booking form follows with a persistent financial summary on wide screens.
        FORM: Approved JAGGAD consultation desk direction, plan-2026-09-10.
        FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
        -->
        @endif
        @if(request()->routeIs('products.detail'))
        <!--
        THESIS: A familiar product-detail layout makes the media, product facts, and purchase action immediately legible without oversized marketing theatrics.
        OWN-WORLD: Cool-white editorial fields, warm dividers, near-black Chillax headlines, and one deep-maroon action mass with pill controls.
        STORY: Understand the product and its outcome, verify the contents, then continue toward purchase with confidence.
        FIRST VIEWPORT: A large 16:9 product image fills the left column while a compact sticky purchase summary occupies the right; mobile stacks media before summary and keeps one purchase action reachable.
        FORM: Polished incumbent product-detail composition, restored after direct user review.
        FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
        -->
        @endif
        @if(request()->routeIs('checkout'))
        <!--
        THESIS: Checkout is a calm two-step review desk where the cart, buyer data, payment choice, and total remain obvious without generic ecommerce clutter.
        OWN-WORLD: Cool-white page framing, white task surfaces, warm dividers, Chillax headings, Synonym body copy, and deep maroon reserved for decisive actions.
        STORY: Verify the products and total, complete buyer data, choose a payment method, then confirm with clear feedback.
        FIRST VIEWPORT: A compact page introduction and two-step progress lead into a wide task column beside a sticky order summary; tablet and mobile stack the summary before the active task.
        FORM: Existing checkout flow rebuilt inside the established JAGGAD public design system.
        FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
        -->
        @endif
        @inertia
    </body>
</html>
