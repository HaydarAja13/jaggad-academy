<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Str;

class Product extends Model
{
    public const STATUS_DRAFT = 'draft';
    public const STATUS_PUBLISHED = 'published';

    public const PRICING_FIXED = 'fixed';
    public const PRICING_DONATION = 'donation';

    protected $fillable = [
        'name',
        'slug',
        'previous_slugs',
        'category_id',
        'price',
        'pricing_type',
        'normal_price',
        'rating',
        'total_ratings',
        'sold_count',
        'image',
        'badge',
        'status',
        'featured',
        'short_description',
        'description',
        'benefits',
        'materials',
        'start_at',
        'end_at',
        'location',
        'landing_blocks',
        'landing_faq',
        'countdown_hours',
        'landing_quota_text',
        'sales_content',
    ];

    protected $casts = [
        'benefits' => 'array',
        'materials' => 'array',
        'landing_blocks' => 'array',
        'landing_faq' => 'array',
        'sales_content' => 'array',
        'previous_slugs' => 'array',
        'price' => 'decimal:2',
        'normal_price' => 'decimal:2',
        'rating' => 'decimal:1',
        'featured' => 'boolean',
        'start_at' => 'datetime',
        'end_at' => 'datetime',
    ];

    public function getRouteKeyName()
    {
        return 'slug';
    }

    protected static function booted()
    {
        static::creating(function ($product) {
            if (empty($product->slug)) {
                $base = Str::slug($product->name) ?: 'product';
                $product->slug = $base;

                for ($suffix = 2; static::where('slug', $product->slug)->exists(); $suffix++) {
                    $product->slug = "{$base}-{$suffix}";
                }
            }
        });

        static::updating(function ($product) {
            if (empty($product->slug)) {
                $product->slug = Str::slug($product->name).'-'.$product->getKey();
            }

            // Catat slug lama agar URL lama tetap hidup via redirect 301.
            if ($product->isDirty('slug') && $product->getOriginal('slug')) {
                $history = $product->previous_slugs ?? [];
                $history[] = $product->getOriginal('slug');
                // Simpan maksimal 20 slug lama, tanpa duplikat, terbaru di depan.
                $product->previous_slugs = array_slice(array_values(array_unique($history)), 0, 20);
            }
        });
    }

    /**
     * Jika slug lama tidak ditemukan, cari di riwayat previous_slugs
     * lalu redirect permanen (301) ke URL slug yang baru — link lama
     * yang sudah dibagikan tetap hidup dan SEO tidak rusak.
     */
    public function resolveRouteBinding($value, $field = null)
    {
        $product = parent::resolveRouteBinding($value, $field);

        if ($product || $field !== null) {
            return $product;
        }

        foreach (static::whereNotNull('previous_slugs')->get() as $candidate) {
            if (in_array($value, $candidate->previous_slugs ?? [], true)) {
                throw new HttpResponseException(
                    redirect(str_replace("/{$value}", "/{$candidate->slug}", url()->current()), 301)
                );
            }
        }

        return null;
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function scopePublished($query)
    {
        return $query->where('status', self::STATUS_PUBLISHED);
    }

    public function scopeDraft($query)
    {
        return $query->where('status', self::STATUS_DRAFT);
    }

    public function isPublished(): bool
    {
        return ($this->status ?? self::STATUS_DRAFT) === self::STATUS_PUBLISHED;
    }

    public function isDraft(): bool
    {
        return ! $this->isPublished();
    }

    /**
     * Produk donasi (pay-what-you-want): nominal bebas diisi pembeli,
     * harga DB selalu disimpan 0 dan tidak dipakai untuk penagihan.
     */
    public function isDonation(): bool
    {
        return ($this->pricing_type ?? self::PRICING_FIXED) === self::PRICING_DONATION;
    }

    public function users()
    {
        return $this->belongsToMany(User::class, 'user_products')->withPivot('purchased_at')->withTimestamps();
    }

    public function transactionItems()
    {
        return $this->hasMany(TransactionItem::class);
    }
}
