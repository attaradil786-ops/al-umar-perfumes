'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { trackAddToCart } from '@/lib/analytics';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image_url: string;
  image?: string;
  category: string;
  quantity: number;
  size?: string;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: {
    id: string;
    name: string;
    price: number;
    slug?: string;
    mrp?: number | null;
    images?: string[];
    image_url?: string;
    image?: string;
    category: string;
  }, size?: string, quantity?: number) => void;
  removeFromCart: (id: string, size?: string) => void;
  updateQuantity: (id: string, delta: number, size?: string) => void;
  clearCart: () => void;
  subtotal: number;
  itemCount: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  quickViewProduct: any | null;
  setQuickViewProduct: (product: any | null) => void;
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<any | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('al_umar_cart');
      if (saved) {
        setCart(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage whenever cart changes
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem('al_umar_cart', JSON.stringify(cart));
      } catch {
        // ignore
      }
    }
  }, [cart, isLoaded]);

  const addToCart = (product: {
    id: string;
    name: string;
    price: number;
    slug?: string;
    mrp?: number | null;
    images?: string[];
    image_url?: string;
    image?: string;
    category: string;
  }, size = '6ml', quantity = 1) => {
    const imageUrl = product.image_url || product.image || product.images?.[0] || '/images/hero-perfume.jpg';

    // Analytics: GA4 & Meta Pixel add_to_cart
    try {
      trackAddToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity,
        category: product.category,
        size,
      });
    } catch {
      // ignore tracking errors
    }

    setCart(prev => {
      const existingIndex = prev.findIndex(item => item.id === product.id && item.size === size);
      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex].quantity += quantity;
        return next;
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          image_url: imageUrl,
          image: imageUrl,
          category: product.category,
          size,
          quantity,
        },
      ];
    });

    setIsCartOpen(true);
  };

  const removeFromCart = (id: string, size?: string) => {
    setCart(prev => prev.filter(item => !(item.id === id && item.size === size)));
  };

  const updateQuantity = (id: string, delta: number, size?: string) => {
    setCart(prev =>
      prev
        .map(item => {
          if (item.id === id && item.size === size) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const itemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        subtotal,
        itemCount,
        isCartOpen,
        setIsCartOpen,
        isSearchOpen,
        setIsSearchOpen,
        quickViewProduct,
        setQuickViewProduct,
        setCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
