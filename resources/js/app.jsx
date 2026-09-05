import './Styles/Global.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import { CartProvider } from './Contexts/CartContext';
import { ContentProvider } from './Contexts/ContentContext';
import { router } from '@inertiajs/react';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// Fix Inertia + Vite CSS race condition: force browser to re-evaluate
// styles after client-side navigation so lazy-loaded CSS chunks apply
// immediately instead of requiring a manual page refresh.
router.on('finish', () => {
    // Single rAF may fire before Vite injects the new CSS chunk.
    // Double-rAF + forced reflow guarantees the browser has painted
    // with the freshly-loaded stylesheet applied.
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            void document.body.offsetHeight;
        });
    });
});

// Meta Pixel: inject base code and track PageView on every navigation
function initMetaPixel(pixelId) {
    if (!pixelId || window._fbPixelInitialized) return;
    window._fbPixelInitialized = true;

    (function(f, b, e, v, n, t, s) {
        if (f.fbq) return;
        n = f.fbq = function() {
            n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        };
        if (!f._fbq) f._fbq = n;
        n.push = n; n.loaded = !0; n.version = '2.0';
        n.queue = [];
        t = b.createElement(e); t.async = !0;
        t.src = v;
        s = b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t, s);
    })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

    window.fbq('init', pixelId);
    window.fbq('track', 'PageView');

    // Track PageView on every Inertia navigation
    router.on('finish', () => {
        if (typeof window.fbq === 'function') {
            window.fbq('track', 'PageView');
        }
    });
}

createInertiaApp({
    title: (title) => {
        const branding = window.window.__inertia_props?.siteContent?.branding;
        const siteName = branding?.siteName || appName;
        const tagline = branding?.siteTagline || '';
        return title ? `${title} - ${siteName} ${tagline}` : `${siteName} ${tagline}`;
    },
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob('./Pages/**/*.jsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        // Initialize Meta Pixel from shared props
        const pixelId = props.initialPage.props.meta_pixel_id;
        if (pixelId) initMetaPixel(pixelId);

        root.render(
            <ContentProvider initialData={props.initialPage.props.siteContent}>
                <CartProvider>
                    <Toaster
                        position="top-right"
                        toastOptions={{
                            style: { background: 'var(--color-bg-card)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)', borderRadius: '12px', fontSize: '16px', boxShadow: '0 8px 30px rgba(0,0,0,0.08)' },
                            success: { iconTheme: { primary: 'var(--color-success)', secondary: 'white' } },
                            error: { iconTheme: { primary: 'var(--color-error)', secondary: 'white' } },
                        }}
                    />
                    <App {...props} />
                </CartProvider>
            </ContentProvider>
        );
    },
    progress: {
        color: '#dc2626',
    },
});

