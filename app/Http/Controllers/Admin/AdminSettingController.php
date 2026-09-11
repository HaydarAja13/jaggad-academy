<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Payment;
use App\Models\Product;
use App\Models\SiteContent;
use App\Models\Transaction;
use App\Models\TransactionItem;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\Encoders\WebpEncoder;
use Intervention\Image\ImageManager;

class AdminSettingController extends Controller
{
    // Settings for Credentials
    public function index()
    {
        $settingsData = SiteContent::where('key', 'site_settings')->first();
        $settings = $settingsData ? (json_decode($settingsData->value, true) ?: []) : [];
        foreach (['google_client_secret', 'midtrans_server_key', 'meta_access_token', 'mail_password'] as $secret) {
            unset($settings[$secret]);
        }

        return Inertia::render('Admin/AdminSettings', [
            'dbSettings' => $settings,
        ]);
    }

    public function saveSettings(Request $request)
    {
        $validated = $request->validate([
            'google_client_id' => 'nullable|string|max:255',
            'google_client_secret' => 'nullable|string|max:512',
            'google_redirect_url' => 'nullable|url:http,https|max:2048',
            'midtrans_server_key' => 'nullable|string|max:255',
            'midtrans_client_key' => 'nullable|string|max:255',
            'midtrans_is_production' => 'nullable|boolean',
            'meta_pixel_id' => 'nullable|string|max:32',
            'meta_access_token' => 'nullable|string|max:2048',
            'mail_mailer' => 'nullable|in:smtp',
            'mail_host' => 'nullable|string|max:255',
            'mail_port' => 'nullable|integer|min:1|max:65535',
            'mail_username' => 'nullable|string|max:255',
            'mail_password' => 'nullable|string|max:512',
            'mail_encryption' => 'nullable|in:tls,ssl',
            'mail_from_address' => 'nullable|email',
            'mail_from_name' => 'nullable|string|max:255',
        ]);

        $existing = SiteContent::where('key', 'site_settings')->first();
        $existingSettings = $existing ? json_decode($existing->value, true) : [];
        foreach (['google_client_secret', 'midtrans_server_key', 'meta_access_token', 'mail_password'] as $secret) {
            if (empty($validated[$secret]) && ! empty($existingSettings[$secret])) {
                $validated[$secret] = $existingSettings[$secret];
            }
        }
        $validated['midtrans_is_production'] = filter_var($validated['midtrans_is_production'] ?? false, FILTER_VALIDATE_BOOLEAN);

        SiteContent::updateOrCreate(
            ['key' => 'site_settings'],
            ['value' => json_encode($validated)]
        );

        return back()->with('success', 'Pengaturan kredensial berhasil disimpan!');
    }

    // Ads page
    public function ads()
    {
        $adsData = SiteContent::where('key', 'ads_promo')->first();
        $products = Product::with('category')->get();

        return Inertia::render('Admin/AdminAds', [
            'dbAds' => $adsData ? $adsData->value : null,
            'products' => $products,
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
                    if (! in_array($host, ['youtube.com', 'm.youtube.com', 'youtu.be'], true)) {
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

        if ($newImage && $oldImage && ! str_starts_with($oldImage, 'http') && Storage::disk('public')->exists($oldImage)) {
            Storage::disk('public')->delete($oldImage);
        }

        return back()->with('success', 'Landing Page Ads berhasil dipublikasikan!');
    }

    // Content page
    public function content()
    {
        $contentData = SiteContent::where('key', 'site_content')->first();
        $categories = Category::withCount('products')->get();
        $featuredProducts = Product::with('category')->where('featured', true)->take(6)->get();
        $allProducts = Product::with('category')->get();

        return Inertia::render('Admin/AdminContent', [
            'dbContent' => $contentData ? $contentData->value : null,
            'dbCategories' => $categories,
            'dbFeaturedProducts' => $featuredProducts,
            'dbAllProducts' => $allProducts,
        ]);
    }

    public function saveContent(Request $request)
    {
        if (! $request->has('home.consultation')) {
            $homeInput = $request->input('home', []);
            $homeInput['consultation'] = config('consultation.public');
            $request->merge(['home' => $homeInput]);
        }

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
            'home.heroCards' => 'nullable|array|max:3',
            'home.heroCards.*.title' => 'nullable|string|max:160',
            'home.heroCards.*.subtitle' => 'nullable|string|max:300',
            'home.heroCards.*.image' => 'nullable|string|max:2048',
            'home.heroCards.*.url' => ['nullable', 'string', 'max:2048', 'regex:/^(\/(?!\/)|https?:\/\/)/i'],
            'home.consultation' => 'required|array',
            'home.consultation.title' => 'required|string|max:160',
            'home.consultation.subtitle' => 'required|string|max:500',
            'home.consultation.scheduleLabel' => 'required|string|max:120',
            'home.consultation.ctaLabel' => 'required|string|max:80',
            'home.consultation.packages' => 'required|array|size:4',
            'home.consultation.packages.*.slug' => 'required|string|max:80|distinct',
            'home.consultation.packages.*.name' => 'required|string|max:120',
            'home.consultation.packages.*.icon' => 'required|string|max:80',
            'home.consultation.packages.*.durationLabel' => 'required|string|max:80',
            'home.consultation.packages.*.priceLabel' => 'required|string|max:120',
            'home.consultation.packages.*.popular' => 'required|boolean',
            'home.consultation.packages.*.description' => 'required|string|max:300',
            'home.consultation.packages.*.benefits' => 'required|array|min:1|max:8',
            'home.consultation.packages.*.benefits.*' => 'required|string|max:180',
            'home.consultation.packages.*.options' => 'required|array|min:1|max:4',
            'home.consultation.packages.*.options.*.key' => 'required|string|max:80',
            'home.consultation.packages.*.options.*.label' => 'required|string|max:120',
            'home.consultation.packages.*.options.*.durationMinutes' => 'required|integer|min:15|max:240',
            'home.consultation.packages.*.options.*.totalPrice' => 'required|integer|min:1000|max:100000000',
            'home.consultation.packages.*.options.*.depositAmount' => 'required|integer|min:500|max:50000000',
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
            'contact.mapsUrl' => 'nullable|url:http,https|max:2048',
            'dashboard' => 'required|array',
            'dashboard.*' => 'required|string|max:500',
            'social' => 'required|array',
            'social.instagram' => 'nullable|url:http,https|max:2048',
            'social.youtube' => 'nullable|url:http,https|max:2048',
            'social.twitter' => 'nullable|url:http,https|max:2048',
            'branding' => 'required|array',
            'checkout' => 'required|array',
            'logoFile' => 'nullable|image|mimes:png,jpg,jpeg,webp|max:2048',
            'faviconFile' => 'nullable|file|mimes:png,jpg,jpeg,ico|max:1024',
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
        foreach ($home['consultation']['packages'] as &$package) {
            $package['popular'] = filter_var($package['popular'], FILTER_VALIDATE_BOOLEAN);
        }
        unset($package);
        foreach ($home['consultation']['packages'] as $package) {
            foreach ($package['options'] as $option) {
                if ((int) $option['depositAmount'] * 2 !== (int) $option['totalPrice']) {
                    throw ValidationException::withMessages([
                        'home.consultation.packages' => 'DP setiap pilihan konsultasi harus tepat 50% dari harga total.',
                    ]);
                }
            }
        }
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

            if ($oldImage && ! str_starts_with($oldImage, 'http') && Storage::disk('public')->exists($oldImage)) {
                Storage::disk('public')->delete($oldImage);
            }
        }

        if ($request->hasFile('whyJaggadImageFile')) {
            $oldImage = $oldHome['whyJaggadImage'] ?? null;
            $home['whyJaggadImage'] = $this->saveImageAsWebp($request->file('whyJaggadImageFile'), 'home');

            if ($oldImage && ! str_starts_with($oldImage, 'http') && Storage::disk('public')->exists($oldImage)) {
                Storage::disk('public')->delete($oldImage);
            }
        }

        if ($request->hasFile('aboutHeroImageFile')) {
            $oldImage = $oldAbout['heroImage'] ?? null;
            $about['heroImage'] = $this->saveImageAsWebp($request->file('aboutHeroImageFile'), 'about');

            if ($oldImage && ! str_starts_with($oldImage, 'http') && Storage::disk('public')->exists($oldImage)) {
                Storage::disk('public')->delete($oldImage);
            }
        }

        foreach ($request->input('learningFormats', []) as $index => $formatData) {
            $category = Category::find($formatData['id']);
            if (! $category) {
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

            if ($oldImage && ! str_starts_with($oldImage, 'http') && Storage::disk('public')->exists($oldImage)) {
                Storage::disk('public')->delete($oldImage);
            }
        }

        if ($request->hasFile('logoFile')) {
            $file = $request->file('logoFile');
            $branding['logo'] = $this->saveImageAsWebp($file, 'branding');
            if ($oldBranding && ! empty($oldBranding['logo']) && Storage::disk('public')->exists($oldBranding['logo'])) {
                Storage::disk('public')->delete($oldBranding['logo']);
            }
        }

        if ($request->hasFile('faviconFile')) {
            $file = $request->file('faviconFile');
            if (strtolower($file->getClientOriginalExtension()) === 'ico') {
                $branding['favicon'] = $file->store('branding', 'public');
            } else {
                $branding['favicon'] = $this->saveImageAsWebp($file, 'branding');
            }
            if ($oldBranding && ! empty($oldBranding['favicon']) && Storage::disk('public')->exists($oldBranding['favicon'])) {
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

    // Danger Zone: hapus semua data dummy (produk, kategori, transaksi, customer)
    public function resetData(Request $request)
    {
        $request->validate([
            'confirmation' => ['required', 'string', Rule::in(['RESET'])],
        ]);

        $summary = DB::transaction(function () {
            $customerIds = User::query()->where('role', '!=', 'admin')->pluck('id');
            $customerEmails = User::query()->whereIn('id', $customerIds)->pluck('email');

            $summary = [
                'customers' => $customerIds->count(),
                'products' => Product::count(),
                'categories' => Category::count(),
                'transactions' => Transaction::count(),
            ];

            // Hapus dari tabel anak ke induk agar aman terhadap foreign key
            Payment::query()->delete();
            DB::table('material_progress')->delete();
            DB::table('user_products')->delete();
            TransactionItem::query()->delete();
            Transaction::query()->delete();
            DB::table('consultation_appointments')->delete();
            Product::query()->delete();
            Category::query()->delete();

            DB::table('sessions')->whereIn('user_id', $customerIds)->delete();
            DB::table('password_reset_tokens')->whereIn('email', $customerEmails)->delete();
            User::query()->whereIn('id', $customerIds)->delete();

            // Buang antrean email/notifikasi lama yang menunjuk data yang sudah dihapus
            if (Schema::hasTable('jobs')) {
                DB::table('jobs')->delete();
            }
            if (Schema::hasTable('failed_jobs')) {
                DB::table('failed_jobs')->delete();
            }

            // Statistik akun yang dipertahankan (admin) di-nol-kan
            DB::table('users')->update(['purchase_count' => 0, 'total_spent' => 0]);

            return $summary;
        });

        Storage::disk('local')->deleteDirectory('payments');
        foreach (['payments', 'products', 'categories', 'landing'] as $directory) {
            Storage::disk('public')->deleteDirectory($directory);
        }

        return back()->with(
            'success',
            "Reset selesai: {$summary['products']} produk, {$summary['categories']} kategori, {$summary['transactions']} transaksi, dan {$summary['customers']} akun customer telah dihapus."
        );
    }

    // Danger Zone: nol-kan semua angka statistik tanpa menghapus data
    public function resetStats()
    {
        DB::transaction(function () {
            DB::table('products')->update(['sold_count' => 0]);
            DB::table('users')->update(['purchase_count' => 0, 'total_spent' => 0]);
        });

        return back()->with('success', 'Statistik berhasil direset ke 0.');
    }

    private function saveImageAsWebp($file, $directory)
    {
        $manager = new ImageManager(new Driver);
        $image = $manager->decode($file->getRealPath());
        $encoded = $image->encode(new WebpEncoder(80));
        $filename = uniqid().'.webp';
        $path = "{$directory}/{$filename}";
        Storage::disk('public')->put($path, (string) $encoded);

        return $path;
    }
}
