<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'category_id',
        'price',
        'normal_price',
        'rating',
        'total_ratings',
        'sold_count',
        'image',
        'badge',
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
                $product->slug = \Illuminate\Support\Str::slug($product->name) . '-' . uniqid();
            }
        });

        static::updating(function ($product) {
            if ($product->isDirty('name') || empty($product->slug)) {
                $product->slug = \Illuminate\Support\Str::slug($product->name) . '-' . uniqid();
            }
        });
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
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
