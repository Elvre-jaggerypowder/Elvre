import React, { createContext, useState, useContext, useEffect } from "react";
import { supabase } from "../supabaseClient";

const WishlistContext = createContext();

export const useWishlist = () => useContext(WishlistContext);

// ─── Helper: get current user ───
const getCurrentUser = () => {
  try {
    const user = localStorage.getItem("currentUser");
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

// ─── LocalStorage helpers ───
const loadFromLocalStorage = () => {
  try {
    const data = localStorage.getItem("wishlist");
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const saveToLocalStorage = (items) => {
  try {
    localStorage.setItem("wishlist", JSON.stringify(items));
  } catch (e) {
    console.error("Failed to save wishlist to localStorage", e);
  }
};

// ─── Toast helper ───
const showToast = (message, bgColor = "#4caf50") => {
  const toast = document.createElement("div");
  toast.style.cssText = `
    position: fixed; bottom: 30px; right: 30px;
    background: ${bgColor}; color: white;
    padding: 12px 24px; border-radius: 30px;
    z-index: 10000; font-weight: 500;
    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    animation: slideInRight 0.3s ease;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
};

export const WishlistProvider = ({ children }) => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // ─── Load wishlist on mount & user change ───
  useEffect(() => {
    const load = async () => {
      const user = getCurrentUser();
      if (user && user.email) {
        await loadWishlist(user.email);
      } else {
        const localItems = loadFromLocalStorage();
        setWishlistItems(localItems);
        setLoading(false);
      }
    };
    load();

    const handleStorageChange = () => load();
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("user-login", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("user-login", handleStorageChange);
    };
  }, []);

  // ─── Load from Supabase, fallback to localStorage ───
  const loadWishlist = async (email) => {
    if (!email) {
      setWishlistItems([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("wishlist")
        .select("*")
        .eq("user_email", email)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("❌ Supabase load error:", error);
        const localItems = loadFromLocalStorage();
        setWishlistItems(localItems);
        setLoading(false);
        return;
      }

      if (data && data.length > 0) {
        const items = data.map((item) => ({
          id: item.product_id,
          name: item.product_name,
          price: item.product_price || `₹${item.product_price_value}`,
          priceValue: item.product_price_value,
          image: item.product_image || "/assets/jaggery.png",
          description: item.product_description || "",
        }));
        setWishlistItems(items);
        saveToLocalStorage(items);
      } else {
        const localItems = loadFromLocalStorage();
        setWishlistItems(localItems);
      }
    } catch (err) {
      console.error("❌ Load error:", err);
      const localItems = loadFromLocalStorage();
      setWishlistItems(localItems);
    } finally {
      setLoading(false);
    }
  };

  // ─── Add to wishlist ───
  const addToWishlist = async (product) => {
    const user = getCurrentUser();

    // If not logged in → save only to localStorage
    if (!user || !user.email) {
      const existing = wishlistItems.find((item) => item.id === product.id);
      if (!existing) {
        const updated = [...wishlistItems, product];
        setWishlistItems(updated);
        saveToLocalStorage(updated);
        showToast("❤️ Added to wishlist (local)", "#4caf50");
      }
      return;
    }

    // Already in wishlist?
    if (wishlistItems.find((item) => item.id === product.id)) {
      showToast("Already in wishlist", "#ff9800");
      return;
    }

    const wishlistEntry = {
      user_email: user.email,
      product_id: product.id,
      product_name: product.name,
      product_price: product.price || `₹${product.priceValue}`,
      product_price_value: product.priceValue || product.price,
      product_image: product.image || "/assets/jaggery.png",
      product_description: product.description || "",
    };

    try {
      // 🔥 Try to insert into Supabase
      const { data, error } = await supabase
        .from("wishlist")
        .insert([wishlistEntry])
        .select();

      if (error) {
        console.error("❌ Supabase insert error:", error);
        // Fallback: save locally
        const updated = [...wishlistItems, product];
        setWishlistItems(updated);
        saveToLocalStorage(updated);
        showToast("⚠️ Saved locally (cloud error)", "#f44336");
        return;
      }

      console.log("✅ Wishlist saved to Supabase:", data);
      // Success: update state and localStorage
      const updated = [...wishlistItems, product];
      setWishlistItems(updated);
      saveToLocalStorage(updated);
      showToast("❤️ Added to wishlist!", "#4caf50");

    } catch (err) {
      console.error("❌ Exception:", err);
      // Fallback: save locally
      const updated = [...wishlistItems, product];
      setWishlistItems(updated);
      saveToLocalStorage(updated);
      showToast("⚠️ Saved locally (error)", "#f44336");
    }
  };

  // ─── Remove from wishlist ───
  const removeFromWishlist = async (productId) => {
    const user = getCurrentUser();

    // Optimistic update
    const updatedItems = wishlistItems.filter((item) => item.id !== productId);
    setWishlistItems(updatedItems);
    saveToLocalStorage(updatedItems);

    if (user && user.email) {
      try {
        const { error } = await supabase
          .from("wishlist")
          .delete()
          .eq("user_email", user.email)
          .eq("product_id", productId);

        if (error) {
          console.error("❌ Supabase delete error:", error);
          // local already removed
        } else {
          console.log("✅ Removed from Supabase wishlist");
        }
      } catch (err) {
        console.error("❌ Delete error:", err);
      }
    }
  };

  // ─── Clear wishlist ───
  const clearWishlist = async () => {
    if (!window.confirm("Are you sure you want to clear your wishlist?")) return;

    // Optimistic update
    setWishlistItems([]);
    saveToLocalStorage([]);

    const user = getCurrentUser();
    if (user && user.email) {
      try {
        const { error } = await supabase
          .from("wishlist")
          .delete()
          .eq("user_email", user.email);

        if (error) {
          console.error("❌ Supabase clear error:", error);
        } else {
          console.log("✅ Cleared wishlist from Supabase");
        }
      } catch (err) {
        console.error("❌ Clear error:", err);
      }
    }
  };

  // ─── Check if product is in wishlist ───
  const isInWishlist = (productId) => {
    return wishlistItems.some((item) => item.id === productId);
  };

  // ─── Refresh wishlist ───
  const refreshWishlist = () => {
    const user = getCurrentUser();
    if (user && user.email) {
      loadWishlist(user.email);
    } else {
      const localItems = loadFromLocalStorage();
      setWishlistItems(localItems);
      setLoading(false);
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        loading,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        clearWishlist,
        refreshWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};