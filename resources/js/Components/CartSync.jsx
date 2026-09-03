import { useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import { useCart } from '../Contexts/CartContext';

export default function CartSync() {
    const { auth } = usePage().props;
    const { setPurchasedIds } = useCart();

    useEffect(() => {
        const purchasedIds = auth?.purchased_products || [];
        setPurchasedIds(purchasedIds);
    }, [JSON.stringify(auth?.purchased_products)]);

    return null;
}
