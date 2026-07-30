import { useState, useEffect, useCallback } from "react";

export const useCart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cart load karna
  const loadCart = useCallback(() => {
    const savedCart = JSON.parse(localStorage.getItem("cart") || "[]");
    setCartItems(savedCart);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadCart();
    window.addEventListener("storage", loadCart);
    return () => window.removeEventListener("storage", loadCart);
  }, [loadCart]);

  // Quantity update
  const updateQuantity = (id, newQuantity) => {
    if (newQuantity < 1) return;
    const updatedCart = cartItems.map(item =>
      item.id === id ? { ...item, quantity: newQuantity } : item
    );
    setCartItems(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
    window.dispatchEvent(new Event("storage"));
  };

  // Ek item remove karna
  const removeFromCart = (id) => {
    const updatedCart = cartItems.filter(item => item.id !== id);
    setCartItems(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
    window.dispatchEvent(new Event("storage"));
  };

  // ✅ Poora cart clear karna (YE SANYAM WALA BUTTON HAI)
  const clearCart = () => {
    if (window.confirm("Clear your cart?")) {
      setCartItems([]);
      localStorage.removeItem("cart");
      window.dispatchEvent(new Event("storage"));
    }
  };

  // Subtotal nikalna
  const getSubtotal = useCallback(() => {
    return cartItems.reduce((sum, item) => {
      const price = item.priceValue || parseFloat(item.price?.replace('₹', '')) || 0;
      return sum + (price * (item.quantity || 1));
    }, 0);
  }, [cartItems]);

  // Total items count
  const getTotalItems = useCallback(() => {
    return cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
  }, [cartItems]);

  const subtotal = getSubtotal();
  const shipping = subtotal > 499 ? 0 : 40;
  const total = subtotal + shipping;

  return {
    cartItems,
    loading,
    updateQuantity,
    removeFromCart,
    clearCart, // 🔥 Ye function ab dono components mein available hai
    subtotal,
    shipping,
    total,
    getTotalItems,
    loadCart // Agar koi manual refresh kare toh
  };
};