import { usePage } from '@inertiajs/react';

/**
 * Meta Pixel tracking helper hook.
 * 
 * Events that are tracked:
 * - PageView     : automatic in app.jsx
 * - ViewContent  : product detail page
 * - InitiateCheckout : checkout page when opened
 * - Purchase     : after payment confirmed successful
 */
export function useMetaPixel() {
    const { meta_pixel_id } = usePage().props;

    const isActive = () => {
        return meta_pixel_id && typeof window !== 'undefined' && typeof window.fbq === 'function';
    };

    const track = (event, data = {}) => {
        if (!isActive()) return;
        window.fbq('track', event, data);
    };

    const trackViewContent = (product) => {
        track('ViewContent', {
            content_ids: [String(product.id)],
            content_name: product.name || product.title,
            content_type: 'product',
            value: parseFloat(product.price) || 0,
            currency: 'IDR',
        });
    };

    const trackInitiateCheckout = (cartItems, total) => {
        track('InitiateCheckout', {
            content_ids: cartItems.map(i => String(i.id)),
            content_type: 'product',
            num_items: cartItems.length,
            value: parseFloat(total) || 0,
            currency: 'IDR',
        });
    };

    const trackPurchase = (transactionCode, totalAmount, cartItems = []) => {
        track('Purchase', {
            transaction_id: transactionCode,
            content_ids: cartItems.map(i => String(i.id)),
            content_type: 'product',
            num_items: cartItems.length,
            value: parseFloat(totalAmount) || 0,
            currency: 'IDR',
            contents: cartItems.map(i => ({
                id: String(i.id),
                quantity: 1,
                item_price: parseFloat(i.price) || 0,
            })),
        });
    };

    return { track, trackViewContent, trackInitiateCheckout, trackPurchase, isActive };
}
