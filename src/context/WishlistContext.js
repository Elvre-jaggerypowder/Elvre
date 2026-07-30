import React, { createContext, useState, useContext, useEffect } from "react";
import { supabase } from "../supabaseClient";

const WishlistContext = createContext();

export const useWishlist = () => useContext(WishlistContext);

const getCurrentUser = () => {
  try {
    const user = localStorage.getItem("currentUser");
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

export const WishlistProvider = ({ children }) => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // ─── Load wishlist whenever user changes ───
  useEffect(() => {
    const loadWishlistIfUser = async () => {
      const user = getCurrentUser();
      if (user && user.email) {
        await loadWishlist(user.email);
      } else {
        setWishlistItems([]);
        setLoading(false);
      }
    };

    loadWishlistIfUser();

    // Listen for login/logout changes (storage events)
    const handleStorageChange = () => {
      loadWishlistIfUser();
    };
    window.addEventListener("storage", handleStorageChange);

    // Also listen for custom login events if you dispatch them
    const handleLogin = () => {
      loadWishlistIfUser();
    };
    window.addEventListener("user-login", handleLogin);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("user-login", handleLogin);
    };
  }, []);

  // ─── Load wishlist from Supabase ───
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
        console.error("❌ Error loading wishlist:", error);
        setWishlistItems([]);
      } else {
        const items = data.map((item) => ({
          id: item.product_id,
          name: item.product_name,
          price: item.product_price || `₹${item.product_price_value}`,
          priceValue: item.product_price_value,
          image: item.product_image || "/assets/jaggery.png",
          description: item.product_description || "",
        }));
        setWishlistItems(items);
      }
    } catch (err) {
      console.error("❌ Error loading wishlist:", err);
      setWishlistItems([]);
    } finally {
      setLoading(false);
    }
  };

  // ─── Add to wishlist ───
  const addToWishlist = async (product) => {
    const user = getCurrentUser();
    if (!user || !user.email) {
      alert("Please login to add items to wishlist.");
      return;
    }

    if (wishlistItems.find((item) => item.id === product.id)) {
      return; // already in wishlist
    }

    try {
      const { error } = await supabase.from("wishlist").insert([
        {
          user_email: user.email,
          product_id: product.id,
          product_name: product.name,
          product_price: product.price,
          product_price_value: product.priceValue,
          product_image: product.image || "/assets/jaggery.png",
          product_description: product.description || "",
        },
      ]);

      if (error) {
        console.error("❌ Error adding to wishlist:", error);
        alert("Failed to add to wishlist. Please try again.");
        return;
      }

      // Update UI
      setWishlistItems((prev) => [...prev, product]);
    } catch (err) {
      console.error("❌ Error:", err);
    }
  };

  // ─── Remove from wishlist ───
  const removeFromWishlist = async (productId) => {
    const user = getCurrentUser();
    if (!user || !user.email) return;

    try {
      const { error } = await supabase
        .from("wishlist")
        .delete()
        .eq("user_email", user.email)
        .eq("product_id", productId);

      if (error) {
        console.error("❌ Error removing from wishlist:", error);
        return;
      }

      setWishlistItems((prev) => prev.filter((item) => item.id !== productId));
    } catch (err) {
      console.error("❌ Error:", err);
    }
  };

  // ─── Clear entire wishlist ───
  const clearWishlist = async () => {
    const user = getCurrentUser();
    if (!user || !user.email) return;

    if (!window.confirm("Are you sure you want to clear your wishlist?")) return;

    try {
      const { error } = await supabase
        .from("wishlist")
        .delete()
        .eq("user_email", user.email);

      if (error) {
        console.error("❌ Error clearing wishlist:", error);
        return;
      }

      setWishlistItems([]);
    } catch (err) {
      console.error("❌ Error:", err);
    }
  };

  // ─── Check if product is in wishlist ───
  const isInWishlist = (productId) => {
    return wishlistItems.some((item) => item.id === productId);
  };

  // ─── Refresh wishlist manually ───
  const refreshWishlist = () => {
    const user = getCurrentUser();
    if (user && user.email) {
      loadWishlist(user.email);
    } else {
      setWishlistItems([]);
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