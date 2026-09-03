import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
    const [purchasedIds, setPurchasedIds] = useState([]);
    const [cartItems, setCartItems] = useState(() => {
        const saved = localStorage.getItem('jaggad_cart');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('jaggad_cart', JSON.stringify(cartItems));
    }, [cartItems]);

    // Filter cart items whenever purchasedIds changes
    useEffect(() => {
        if (purchasedIds.length > 0) {
            setCartItems(prev => {
                const filtered = prev.filter(item => !purchasedIds.includes(item.id));
                return filtered.length !== prev.length ? filtered : prev;
            });
        }
    }, [purchasedIds]);

    const addToCart = (product) => {
        // Prevent adding already purchased products
        if (purchasedIds.includes(product.id)) return;

        setCartItems(prev => {
            if (prev.find(i => i.id === product.id)) return prev;
            return [...prev, { ...product, quantity: 1 }];
        });
    };

    const removeFromCart = (id) => setCartItems(prev => prev.filter(i => i.id !== id));
    const clearCart = () => setCartItems([]);
    const getTotal = () => cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const isInCart = (id) => cartItems.some(i => i.id === id);

    return (
        <CartContext.Provider value={{ 
            cartItems, 
            addToCart, 
            removeFromCart, 
            clearCart, 
            getTotal, 
            isInCart, 
            count: cartItems.length,
            setPurchasedIds // Expose this to sync with page props
        }}>
            {children}
        </CartContext.Provider>
    );
}

export const useCart = () => {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error('useCart must be used within CartProvider');
    return ctx;
};
