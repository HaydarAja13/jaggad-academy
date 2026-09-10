<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::call(fn () => app(\App\Services\ConsultationManager::class)->expireOverdue())
    ->everyMinute()
    ->name('expire-consultation-deposit-holds')
    ->withoutOverlapping();
