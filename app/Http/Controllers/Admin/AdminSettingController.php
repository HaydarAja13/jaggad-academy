<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\SiteContent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\Encoders\WebpEncoder;
use Inertia\Inertia;

class AdminSettingController extends Controller
{
    // Settings for Credentials
    public function index()
    {
        $settingsData = SiteContent::where('key', 'site_settings')->first();
        return Inertia::render('Admin/AdminSettings', [
            'dbSettings' => $settingsData ? json_decode($settingsData->value, true) : null,
        ]);
    }

    public function saveSettings(Request $request)
    {
        $request->validate([
            'google_client_id' => 'nullable|string',
            'google_client_secret' => 'nullable|string',
            'google_redirect_url' => 'nullable|url',
            'midtrans_server_key' => 'nullable|string',
            'midtrans_client_key' => 'nullable|string',
            'midtrans_is_production' => 'nullable|boolean',
            'meta_pixel_id' => 'nullable|string',
            'meta_access_token' => 'nullable|string',
            'mail_mailer' => 'nullable|string',
            'mail_host' => 'nullable|string',
            'mail_port' => 'nullable|string',
            'mail_username' => 'nullable|string',
            'mail_password' => 'nullable|string',
            'mail_encryption' => 'nullable|string',
            'mail_from_address' => 'nullable|email',
            'mail_from_name' => 'nullable|string',
        ]);

        SiteContent::updateOrCreate(
            ['key' => 'site_settings'],
            ['value' => json_encode($request->all())]
        );

        return back()->with('success', 'Pengaturan kredensial berhasil disimpan!');
    }

    // Ads page
    public function ads()
    {
        $adsData = SiteContent::where('key', 'ads_promo')->first();
        $products = \App\Models\Product::with('category')->get();
        return Inertia::render('Admin/AdminAds', [
            'dbAds' => $adsData ? $adsData->value : null,
            'products' => $products
        ]);
    }

    public function saveAds(Request $request)
    {
        $validated = $request->validate([
            'hero' => 'required|array',
            'hero.badge' => 'nullable|string|max:80',
            'hero.title' => 'required|string|max:200',
            'hero.subtitle' => 'nullable|string|max:500',
            'hero.mediaType' => 'required|in:image,youtube',
            'hero.imageAlt' => 'nullable|string|max:200',
            'hero.videoUrl' => [
                'nullable',
                'required_if:hero.mediaType,youtube',
                'url',
                'max:2048',
                function ($attribute, $value, $fail) {
                    $host = strtolower(parse_url($value, PHP_URL_HOST) ?: '');
                    $host = preg_replace('/^www\./', '', $host);
                    if (!in_array($host, ['youtube.com', 'm.youtube.com', 'youtu.be'], true)) {
                        $fail('URL video harus berasal dari YouTube.');
                    }
                },
            ],
            'hero.guarantee' => 'nullable|string|max:240',
            'heroImageFile' => 'nullable|image|mimes:png,jpg,jpeg,webp|max:5120',
            'urgency' => 'required|array',
            'urgency.countdownHours' => 'required|integer|min:0|max:720',
            'urgency.quotaText' => 'nullable|string|max:200',
            'urgency.ctaNote' => 'nullable|string|max:200',
            'proofItems' => 'required|array|size:3',
            'proofItems.*' => 'nullable|string|max:200',
            'offers' => 'required|array',
            'offers.title' => 'required|string|max:160',
            'offers.description' => 'nullable|string|max:500',
            'trust' => 'required|array',
            'trust.title' => 'nullable|string|max:160',
            'trust.description' => 'nullable|string|max:500',
            'trust.items' => 'required|array|size:3',
            'trust.items.*.title' => 'nullable|string|max:120',
            'trust.items.*.description' => 'nullable|string|max:360',
            'cta' => 'required|array',
            'cta.primary' => 'required|string|max:80',
            'closing' => 'required|array',
            'closing.title' => 'required|string|max:200',
            'closing.description' => 'nullable|string|max:600',
            'closing.primary' => 'required|string|max:80',
            'closing.secondary' => 'nullable|string|max:80',
            'closing.asideTitle' => 'nullable|string|max:120',
            'closing.asideDescription' => 'nullable|string|max:360',
            'selectedProductIds' => 'required|array',
            'selectedProductIds.*' => 'integer|distinct|exists:products,id',
        ]);

        $existing = SiteContent::where('key', 'ads_promo')->first();
        $oldContent = $existing ? (json_decode($existing->value, true) ?: []) : [];
        $oldImage = data_get($oldContent, 'hero.image', $oldContent['heroImage'] ?? null);
        $newImage = null;

        unset($validated['heroImageFile']);
        if ($request->hasFile('heroImageFile')) {
            $newImage = $this->saveImageAsWebp($request->file('heroImageFile'), 'promo');
        }
        $validated['hero']['image'] = $newImage ?: $oldImage ?: '';

        SiteContent::updateOrCreate(
            ['key' => 'ads_promo'],
            ['value' => json_encode($validated, JSON_UNESCAPED_UNICODE)]
        );

        if ($newImage && $oldImage && !str_starts_with($oldImage, 'http') && Storage::disk('public')->exists($oldImage)) {
            Storage::disk('public')->delete($oldImage);
        }

        return back()->with('success', 'Landing Page Ads berhasil dipublikasikan!');
    }

    // Content page
    public function content()
    {
        $contentData = SiteContent::where('key', 'site_content')->first();
        $categories = \App\Models\Category::withCount('products')->get();
        $featuredProducts = \App\Models\Product::with('category')->where('featured', true)->take(6)->get();
        $allProducts = \App\Models\Product::with('category')->get();
        
        return Inertia::render('Admin/AdminContent', [
            'dbContent' => $contentData ? $contentData->value : null,
            'dbCategories' => $categories,
            'dbFeaturedProducts' => $featuredProducts,
            'dbAllProducts' => $allProducts
        ]);
    }

    public function saveContent(Request $request)
    {
        $request->validate([
            'home' => 'required|array',
            'home.faqTitle' => 'nullable|string|max:160',
            'home.faqSubtitle' => 'nullable|string|max:500',
            'home.faqs' => 'nullable|array|max:8',
            'home.faqs.*.q' => 'nullable|required_with:home.faqs.*.a|string|max:180',
            'home.faqs.*.a' => 'nullable|required_with:home.faqs.*.q|string|max:1000',
            'home.ctaBannerTitle' => 'nullable|string|max:160',
            'home.ctaBannerDesc' => 'nullable|string|max:500',
            'home.ctaBannerBtn' => 'nullable|string|max:80',
            'about' => 'required|array',
            'contact' => 'required|array',
            'contact.pageTitle' => 'nullable|string|max:80',
            'contact.title' => 'required|string|max:160',
            'contact.subtitle' => 'required|string|max:500',
            'contact.whatsappCta' => 'nullable|string|max:80',
            'contact.whatsappNote' => 'nullable|string|max:240',
            'contact.directTitle' => 'nullable|string|max:120',
            'contact.guideTitle' => 'nullable|string|max:140',
            'contact.guideSubtitle' => 'nullable|string|max:400',
            'contact.topics' => 'nullable|array|max:3',
            'contact.topics.*.title' => 'required|string|max:100',
            'contact.topics.*.desc' => 'required|string|max:360',
            'contact.formTitle' => 'nullable|string|max:140',
            'contact.formSubtitle' => 'nullable|string|max:400',
            'contact.formNameLabel' => 'nullable|string|max:60',
            'contact.formNamePlaceholder' => 'nullable|string|max:100',
            'contact.formEmailLabel' => 'nullable|string|max:60',
            'contact.formEmailPlaceholder' => 'nullable|string|max:100',
            'contact.formSubjectLabel' => 'nullable|string|max:60',
            'contact.formSubjectPlaceholder' => 'nullable|string|max:100',
            'contact.formMessageLabel' => 'nullable|string|max:60',
            'contact.formMessagePlaceholder' => 'nullable|string|max:200',
            'contact.formSubmitLabel' => 'nullable|string|max:80',
            'contact.formNote' => 'nullable|string|max:240',
            'contact.formEmailIntro' => 'nullable|string|max:120',
            'contact.formOpenEmailNotice' => 'nullable|string|max:120',
            'contact.phoneLabel' => 'nullable|string|max:60',
            'contact.emailLabel' => 'nullable|string|max:60',
            'contact.addressLabel' => 'nullable|string|max:60',
            'contact.email' => 'required|email|max:255',
            'contact.phone' => 'required|string|max:40',
            'contact.address' => 'required|string|max:500',
            'contact.mapsUrl' => 'nullable|url|max:2048',
            'dashboard' => 'required|array',
            'dashboard.*' => 'required|string|max:500',
            'social' => 'required|array',
            'branding' => 'required|array',
            'checkout' => 'required|array',
            'logoFile' => 'nullable|file|mimes:png,jpg,jpeg,svg,webp|max:2048',
            'faviconFile' => 'nullable|file|mimes:png,jpg,jpeg,ico,svg|max:1024',
            'heroCardImages' => 'nullable|array|max:3',
            'heroCardImages.*' => 'nullable|image|mimes:png,jpg,jpeg,webp|max:5120',
            'whyJaggadImageFile' => 'nullable|image|mimes:png,jpg,jpeg,webp|max:5120',
            'aboutHeroImageFile' => 'nullable|image|mimes:png,jpg,jpeg,webp|max:5120',
            'learningFormats' => 'nullable|array|max:4',
            'learningFormats.*.id' => 'required|integer|exists:categories,id',
            'learningFormats.*.name' => 'required|string|max:255',
            'learningFormats.*.description' => 'nullable|string|max:1000',
            'learningFormatImages' => 'nullable|array|max:4',
            'learningFormatImages.*' => 'nullable|image|mimes:png,jpg,jpeg,webp|max:5120',
        ]);

        $branding = $request->input('branding');
        $home = $request->input('home');
        $about = $request->input('about');
        $oldBranding = null;
        $oldHome = null;
        $oldAbout = null;
        $existingContent = SiteContent::where('key', 'site_content')->first();
        if ($existingContent) {
            $parsed = json_decode($existingContent->value, true);
            $oldBranding = $parsed['branding'] ?? null;
            $oldHome = $parsed['home'] ?? null;
            $oldAbout = $parsed['about'] ?? null;
        }

        foreach ($request->file('heroCardImages', []) as $index => $file) {
            $oldImage = $oldHome['heroCards'][$index]['image'] ?? null;
            $home['heroCards'][$index]['image'] = $this->saveImageAsWebp($file, 'hero');

            if ($oldImage && !str_starts_with($oldImage, 'http') && Storage::disk('public')->exists($oldImage)) {
                Storage::disk('public')->delete($oldImage);
            }
        }

        if ($request->hasFile('whyJaggadImageFile')) {
            $oldImage = $oldHome['whyJaggadImage'] ?? null;
            $home['whyJaggadImage'] = $this->saveImageAsWebp($request->file('whyJaggadImageFile'), 'home');

            if ($oldImage && !str_starts_with($oldImage, 'http') && Storage::disk('public')->exists($oldImage)) {
                Storage::disk('public')->delete($oldImage);
            }
        }

        if ($request->hasFile('aboutHeroImageFile')) {
            $oldImage = $oldAbout['heroImage'] ?? null;
            $about['heroImage'] = $this->saveImageAsWebp($request->file('aboutHeroImageFile'), 'about');

            if ($oldImage && !str_starts_with($oldImage, 'http') && Storage::disk('public')->exists($oldImage)) {
                Storage::disk('public')->delete($oldImage);
            }
        }

        $allowedFormatSlugs = ['ebook', 'video', 'webinar', 'offline'];
        foreach ($request->input('learningFormats', []) as $index => $formatData) {
            $category = Category::find($formatData['id']);
            if (!$category || !in_array($category->slug, $allowedFormatSlugs, true)) {
                continue;
            }

            $updates = [
                'name' => $formatData['name'],
                'description' => $formatData['description'] ?? null,
            ];
            $file = $request->file("learningFormatImages.{$index}");
            $oldImage = null;

            if ($file) {
                $oldImage = $category->image;
                $updates['image'] = $this->saveImageAsWebp($file, 'categories');
            }

            $category->update($updates);

            if ($oldImage && !str_starts_with($oldImage, 'http') && Storage::disk('public')->exists($oldImage)) {
                Storage::disk('public')->delete($oldImage);
            }
        }

        if ($request->hasFile('logoFile')) {
            $file = $request->file('logoFile');
            if ($file->getClientOriginalExtension() === 'svg') {
                $branding['logo'] = $file->store('branding', 'public');
            } else {
                $branding['logo'] = $this->saveImageAsWebp($file, 'branding');
            }
            if ($oldBranding && !empty($oldBranding['logo']) && Storage::disk('public')->exists($oldBranding['logo'])) {
                Storage::disk('public')->delete($oldBranding['logo']);
            }
        }
        
        if ($request->hasFile('faviconFile')) {
            $file = $request->file('faviconFile');
            if (in_array(strtolower($file->getClientOriginalExtension()), ['svg', 'ico'])) {
                $branding['favicon'] = $file->store('branding', 'public');
            } else {
                $branding['favicon'] = $this->saveImageAsWebp($file, 'branding');
            }
            if ($oldBranding && !empty($oldBranding['favicon']) && Storage::disk('public')->exists($oldBranding['favicon'])) {
                Storage::disk('public')->delete($oldBranding['favicon']);
            }
        }

        $allContent = [
            'home' => $home,
            'about' => $about,
            'contact' => $request->input('contact'),
            'dashboard' => $request->input('dashboard'),
            'social' => $request->input('social'),
            'branding' => $branding,
            'checkout' => $request->input('checkout'),
        ];

        SiteContent::updateOrCreate(
            ['key' => 'site_content'],
            ['value' => json_encode($allContent)]
        );

        return back()->with('success', 'Konten berhasil disimpan dan dipublikasikan!');
    }

    // Chatbot page
    public function chatbot()
    {
        return Inertia::render('Admin/AdminChatbot');
    }

    private function saveImageAsWebp($file, $directory)
    {
        $manager = new ImageManager(new Driver());
        $image = $manager->decode($file->getRealPath());
        $encoded = $image->encode(new WebpEncoder(80));
        $filename = uniqid() . '.webp';
        $path = "{$directory}/{$filename}";
        Storage::disk('public')->put($path, (string) $encoded);
        return $path;
    }
}
