import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { FaHome, FaStore, FaShoppingCart, FaUser } from "react-icons/fa";
import "./BottomNav.css";

const BottomNav = () => {
  const location = useLocation();
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    loadCartCount();
    window.addEventListener("storage", loadCartCount);
    return () => window.removeEventListener("storage", loadCartCount);
  }, []);

  const loadCartCount = () => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const count = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    setCartCount(count);
  };

  // Hide bottom nav on admin, checkout, login, signup pages
  const hidePaths = ["/admin", "/admin-dashboard", "/login", "/signup", "/checkout"];
  if (hidePaths.some(path => location.pathname.startsWith(path))) {
    return null;
  }

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="bottom-nav">
      <Link to="/" className={`bottom-nav-item ${isActive("/") ? "active" : ""}`}>
        <FaHome className="nav-icon" />
        <span>Home</span>
      </Link>

      <Link to="/products" className={`bottom-nav-item ${isActive("/products") ? "active" : ""}`}>
        <FaStore className="nav-icon" />
        <span>Products</span>
      </Link>

      <Link to="/cart" className={`bottom-nav-item ${isActive("/cart") ? "active" : ""}`}>
        <FaShoppingCart className="nav-icon" />
        {cartCount > 0 && <span className="bottom-cart-badge">{cartCount}</span>}
        <span>Cart</span>
      </Link>

      <Link to="/profile" className={`bottom-nav-item ${isActive("/profile") ? "active" : ""}`}>
        <FaUser className="nav-icon" />
        <span>Profile</span>
      </Link>
    </nav>
  );
};

export default BottomNav;