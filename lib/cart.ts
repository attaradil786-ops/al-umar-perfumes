/**
 * Al Umar - Cart Client Management Library
 * Mirrors js/app.js CartManager behavior with localStorage persistence and server-side validation
 */

export interface CartItem {
  id: string;
  name: string;
  price: number;
  basePrice?: number;
  image_url: string;
  image?: string;
  category?: string;
  size?: string;
  option?: string;
  quantity: number;
}

export interface CartValidationResult {
  valid: boolean;
  items: CartItem[];
  subtotal: number;
  shipping: number;
  total: number;
  warnings: string[];
}

export const CART_STORAGE_KEY = 'al_umar_cart';

export function loadCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Error loading cart from localStorage:', e);
    return [];
  }
}

export function saveCart(cart: CartItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    window.dispatchEvent(new CustomEvent('al_umar_cart_updated', { detail: cart }));
  } catch (e) {
    console.error('Error saving cart to localStorage:', e);
  }
}

export function addToCart(
  product: {
    id: string;
    name: string;
    price: number;
    image_url?: string;
    image?: string;
    images?: string[];
    category?: string;
    options?: string[];
  },
  option: string = '6ml',
  quantity: number = 1
): CartItem[] {
  const cart = loadCart();
  const imageUrl = product.image_url || product.image || product.images?.[0] || '/images/hero-perfume.jpg';

  let extraPrice = 0;
  if (option && option.includes('+₹')) {
    const match = option.match(/\+₹(\d+)/);
    if (match) extraPrice = parseInt(match[1], 10);
  } else if (option && option.includes('-₹')) {
    const match = option.match(/-₹(\d+)/);
    if (match) extraPrice = -parseInt(match[1], 10);
  }

  const unitPrice = product.price + extraPrice;
  const existingIndex = cart.findIndex(
    item => item.id === product.id && (item.size === option || item.option === option)
  );

  if (existingIndex > -1) {
    cart[existingIndex].quantity += quantity;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: unitPrice,
      basePrice: product.price,
      image_url: imageUrl,
      image: imageUrl,
      category: product.category || 'attar',
      size: option,
      option: option,
      quantity,
    });
  }

  saveCart(cart);
  return cart;
}

export function updateCartQuantity(id: string, delta: number, option?: string): CartItem[] {
  const cart = loadCart();
  const index = cart.findIndex(
    item => item.id === id && (!option || item.size === option || item.option === option)
  );

  if (index > -1) {
    cart[index].quantity += delta;
    if (cart[index].quantity <= 0) {
      cart.splice(index, 1);
    }
    saveCart(cart);
  }
  return cart;
}

export function removeCartItem(id: string, option?: string): CartItem[] {
  const cart = loadCart();
  const filtered = cart.filter(
    item => !(item.id === id && (!option || item.size === option || item.option === option))
  );
  saveCart(filtered);
  return filtered;
}

export function clearCart(): void {
  saveCart([]);
}

export function getCartSubtotal(cart?: CartItem[]): number {
  const items = cart || loadCart();
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function getCartCount(cart?: CartItem[]): number {
  const items = cart || loadCart();
  return items.reduce((count, item) => count + item.quantity, 0);
}

/**
 * Validate cart items against server stock and current prices
 */
export async function validateCart(items?: CartItem[]): Promise<CartValidationResult> {
  const itemsToValidate = items || loadCart();
  try {
    const res = await fetch('/api/cart/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: itemsToValidate }),
    });

    if (!res.ok) {
      throw new Error('Cart validation server error');
    }

    const result: CartValidationResult = await res.json();
    return result;
  } catch (error) {
    console.error('validateCart failed:', error);
    const subtotal = getCartSubtotal(itemsToValidate);
    const shipping = subtotal >= 1500 ? 0 : 100;
    return {
      valid: true,
      items: itemsToValidate,
      subtotal,
      shipping,
      total: subtotal + shipping,
      warnings: [],
    };
  }
}
