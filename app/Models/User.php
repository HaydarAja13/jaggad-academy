<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'slug',
        'email',
        'password',
        'phone',
        'purchase_count',
        'total_spent',
        'status',
        'role',
        'google_id',
        'avatar',
        'email_verified_at',
    ];

    public function getRouteKeyName()
    {
        return 'slug';
    }

    protected static function booted()
    {
        static::creating(function ($user) {
            if (empty($user->slug)) {
                $user->slug = \Illuminate\Support\Str::slug($user->name) . '-' . uniqid();
            }
        });

        static::updating(function ($user) {
            if (($user->isDirty('name') && empty($user->slug)) || empty($user->slug)) {
                $user->slug = \Illuminate\Support\Str::slug($user->name) . '-' . uniqid();
            }
        });
    }

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }

    public function products()
    {
        return $this->belongsToMany(Product::class, 'user_products')->withPivot('purchased_at')->withTimestamps();
    }

    public function isAdmin()
    {
        return $this->role === 'admin';
    }
}
