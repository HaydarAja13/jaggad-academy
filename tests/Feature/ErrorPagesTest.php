<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class ErrorPagesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Route::get('/__error-test/{status}', fn (int $status) => abort($status));
    }

    public function test_error_statuses_use_the_branded_error_page(): void
    {
        foreach ([403, 404, 500] as $status) {
            $this->get("/__error-test/{$status}")
                ->assertStatus($status)
                ->assertSee("{$status} — JAGGAD Academy")
                ->assertSee('Kembali ke beranda');
        }
    }

    public function test_inertia_errors_use_the_error_component(): void
    {
        $this->get('/__error-test/404', ['X-Inertia' => 'true'])
            ->assertStatus(404)
            ->assertHeader('X-Inertia', 'true')
            ->assertJsonPath('component', 'Error')
            ->assertJsonPath('props.status', 404);
    }
}
