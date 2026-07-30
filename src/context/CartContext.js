import React, { createContext, useState, useContext, useEffect } from "react";
import { supabase } from "../supabaseClient";

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

const getCurrentUser = () => {
  try {
    const user = localStorage.getItem("currentUser");
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // ─── Load cart from Supabase ───
  const loadCart = async (email) => {
    if (!email) {
      // Fallback: load from localStorage
      const saved = localStorage.getItem("cart");
      setCartItems(saved ? JSON.parse(saved) : []);
      setLoading(false);
      return;
    }

    try {
      console.log("🔄 Loading cart for:", email);
      const { data, error } = await supabase
        .from("cart")
        .select("*")
        .eq("user_email", email)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("❌ Supabase load error:", error);
        // Fallback to localStorage
        const saved = localStorage.getItem("cart");
        setCartItems(saved ? JSON.parse(saved) : []);
      } else if (data && data.length > 0) {
        console.log("✅ Cart loaded from Supabase:", data);
        const items = data.map((item) => ({
          id: item.product_id,
          name: item.product_name,
          price: item.product_price || `₹${item.product_price_value}`,
          priceValue: item.product_price_value,
          image: item.product_image || "/assets/jaggery.png",
          description: item.product_description || "",
          variant: item.product_variant || null,
          quantity: item.quantity || 1,
        }));
        setCartItems(items);
        // Update localStorage as backup
        localStorage.setItem("cart", JSON.stringify(items));
      } else {
        // No data in Supabase – fallback to localStorage
        const saved = localStorage.getItem("cart");
        setCartItems(saved ? JSON.parse(saved) : []);
      }
    } catch (err) {
      console.error("❌ Load error:", err);
      const saved = localStorage.getItem("cart");
      setCartItems(saved ? JSON.parse(saved) : []);
    } finally {
      setLoading(false);
    }
  };

  // ─── Sync cart to Supabase ───
  const syncCartToSupabase = async (items) => {
    const user = getCurrentUser();
    if (!user || !user.email) {
      console.warn("⚠️ No user logged in – saving to localStorage only.");
      localStorage.setItem("cart", JSON.stringify(items));
      return;
    }

    try {
      console.log(`🔄 Syncing ${items.length} items to Supabase for ${user.email}`);

      // Delete existing
      const { error: deleteError } = await supabase
        .from("cart")
        .delete()
        .eq("user_email", user.email);

      if (deleteError) {
        console.error("❌ Delete error:", deleteError);
        // Still save to localStorage
        localStorage.setItem("cart", JSON.stringify(items));
        return;
      }

      if (items.length === 0) {
        console.log("🗑️ Cart cleared.");
        localStorage.setItem("cart", JSON.stringify([]));
        return;
      }

      // Insert current
      const inserts = items.map((item) => ({
        user_email: user.email,
        product_id: item.id,
        product_name: item.name,
        product_price: item.price,
        product_price_value: item.priceValue,
        product_image: item.image || "/assets/jaggery.png",
        product_description: item.description || "",
        product_variant: item.variant || null,
        quantity: item.quantity || 1,
      }));

      const { data, error } = await supabase.from("cart").insert(inserts);
      if (error) {
        console.error("❌ Insert error:", error);
        // Fallback to localStorage
        localStorage.setItem("cart", JSON.stringify(items));
      } else {
        console.log("✅ Cart synced successfully:", data);
        // Also update localStorage with the synced items
        localStorage.setItem("cart", JSON.stringify(items));
      }
    } catch (err) {
      console.error("❌ Sync error:", err);
      // Fallback to localStorage
      localStorage.setItem("cart", JSON.stringify(items));
    }
  };

  // ─── Refresh cart ───
  const refreshCart = () => {
    const user = getCurrentUser();
    if (user && user.email) {
      loadCart(user.email);
    } else {
      const saved = localStorage.getItem("cart");
      setCartItems(saved ? JSON.parse(saved) : []);
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshCart();

    const handleStorage = () => refreshCart();
    window.addEventListener("storage", handleStorage);
    window.addEventListener("user-login", refreshCart);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("user-login", refreshCart);
    };
  }, []);

  // ─── Add to cart ───
  const addToCart = async (product, quantity = 1) => {
    const user = getCurrentUser();
    if (!user || !user.email) {
      alert("Please login to add items to cart.");
      return;
    }

    setCartItems((prev) => {
      const existingItem = prev.find((item) => item.id === product.id);
      let newItems;
      if (existingItem) {
        newItems = prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: (item.quantity || 1) + quantity }
            : item
        );
      } else {
        newItems = [...prev, { ...product, quantity }];
      }
      // Sync in background
      syncCartToSupabase(newItems);
      return newItems;
    });
  };

  // ─── Remove from cart ───
  const removeFromCart = async (id) => {
    setCartItems((prev) => {
      const newItems = prev.filter((item) => item.id !== id);
      syncCartToSupabase(newItems);
      return newItems;
    });
  };

  // ─── Update quantity ───
  const updateQuantity = async (id, newQuantity) => {
    if (newQuantity < 1) return;
    setCartItems((prev) => {
      const newItems = prev.map((item) =>
        item.id === id ? { ...item, quantity: newQuantity } : item
      );
      syncCartToSupabase(newItems);
      return newItems;
    });
  };

  // ─── Clear cart ───
  const clearCart = async () => {
    if (!window.confirm("Clear your cart?")) return;
    setCartItems([]);
    const user = getCurrentUser();
    if (user && user.email) {
      await supabase.from("cart").delete().eq("user_email", user.email);
    }
    localStorage.setItem("cart", JSON.stringify([]));
    console.log("🗑️ Cart cleared.");
  };

  // ─── Get total ───
  const getCartTotal = () => {
    return cartItems.reduce((total, item) => {
      const price = item.priceValue || parseFloat(item.price?.replace("₹", "")) || 0;
      return total + price * (item.quantity || 1);
    }, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        loading,
        addToCart,
        removeFromCart,
        updateQuantity,
        getCartTotal,
        clearCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};