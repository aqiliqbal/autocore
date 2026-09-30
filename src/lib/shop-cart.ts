export type CartItem = {
  id: string;
  partNumber: string;
  name: string;
  sellingPrice: number;
  imageUrl: string | null;
  quantity: number;
};

const CART_KEY = "autocore-cart";

export function getCart(): CartItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const saved = localStorage.getItem(CART_KEY);

    if (!saved) {
      return [];
    }

    const parsed = JSON.parse(saved);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed;
  } catch (error) {
    console.error("Failed to load cart:", error);
    return [];
  }
}

export function saveCart(cart: CartItem[]) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(CART_KEY, JSON.stringify(cart));

  window.dispatchEvent(new Event("autocore-cart-updated"));
}

export function addToCart(item: Omit<CartItem, "quantity">) {
  const cart = getCart();

  const existingItem = cart.find(
    (cartItem) => cartItem.id === item.id
  );

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      ...item,
      quantity: 1,
    });
  }

  saveCart(cart);

  return cart;
}

export function removeFromCart(id: string) {
  const cart = getCart();

  const updatedCart = cart.filter(
    (item) => item.id !== id
  );

  saveCart(updatedCart);

  return updatedCart;
}

export function updateCartQuantity(
  id: string,
  quantity: number
) {
  const cart = getCart();

  const item = cart.find(
    (cartItem) => cartItem.id === id
  );

  if (!item) {
    return cart;
  }

  if (quantity <= 0) {
    return removeFromCart(id);
  }

  item.quantity = quantity;

  saveCart(cart);

  return cart;
}

export function clearCart() {
  saveCart([]);
}

export function getCartCount() {
  const cart = getCart();

  return cart.reduce(
    (total, item) => total + item.quantity,
    0
  );
}

export function getCartTotal() {
  const cart = getCart();

  return cart.reduce(
    (total, item) =>
      total + item.sellingPrice * item.quantity,
    0
  );
}