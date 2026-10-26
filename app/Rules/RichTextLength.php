<?php

namespace App\Rules;

use App\Support\RichText;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Batas karakter untuk konten kaya: menghitung teks polos saja sehingga
 * tag format (bold/list) tidak memakan jatah karakter admin.
 */
class RichTextLength implements ValidationRule
{
    public function __construct(private readonly int $max)
    {
    }

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if ($value === null || $value === '') {
            return;
        }

        if (! is_string($value)) {
            $fail('Format :attribute tidak valid.');

            return;
        }

        if (RichText::length($value) > $this->max) {
            $fail('Isi :attribute maksimal '.$this->max.' karakter (tidak termasuk format).');
        }
    }
}
