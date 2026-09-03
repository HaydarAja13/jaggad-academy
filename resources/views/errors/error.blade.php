<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex">
    <title>{{ $code }} — JAGGAD Academy</title>
    @vite('resources/css/app.css')
</head>
<body>
    <main class="error-page">
        <a class="error-page__brand" href="{{ url('/') }}">JAGGAD <span>ACADEMY</span></a>
        <section class="error-page__main" aria-labelledby="error-title">
            <div class="error-page__copy">
                <p class="error-page__code">{{ $code }}</p>
                <h1 id="error-title" class="error-page__title">{{ $title }}</h1>
                <p class="error-page__message">{{ $message }}</p>
                <div class="error-page__actions">
                    <a class="error-page__button" href="{{ url('/') }}">Kembali ke beranda <span aria-hidden="true">→</span></a>
                    <a class="error-page__button error-page__button--secondary" href="{{ url('/products') }}">Lihat produk</a>
                </div>
            </div>
            <div class="error-page__art" aria-hidden="true">
                <div class="error-page__symbol">
                    @if ($type === 'forbidden')
                        <svg viewBox="0 0 24 24"><path d="M8 10V7a4 4 0 0 1 8 0v3"/><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M12 14v2"/></svg>
                    @elseif ($type === 'server')
                        <svg viewBox="0 0 24 24"><path d="M5 5h14v6H5zM5 13h14v6H5z"/><path d="M8 8h.01M8 16h.01M12 8h4M12 16h4"/></svg>
                    @else
                        <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6"/><path d="m16 16 4 4"/><path d="M9 11h4"/></svg>
                    @endif
                </div>
            </div>
        </section>
        <p class="error-page__foot">JAGGAD Academy · Belajar untuk berkembang.</p>
    </main>
</body>
</html>
