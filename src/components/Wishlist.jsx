import React from "react";
import { useNavigate } from "react-router-dom";
import { useWishlist } from "../context/WishlistContext";
import Navbar from "./Navbar";
import { FaHeart, FaTrash, FaShoppingCart, FaRegHeart } from "react-icons/fa";
import "./Wishlist.css";

const Wishlist = () => {
  const { wishlistItems, removeFromWishlist, clearWishlist } = useWishlist();
  const navigate = useNavigate();

  const moveToCart = (product, e) => {
    e.stopPropagation(); // Prevent navigation when clicking button
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const existing = cart.find((item) => item.id === product.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({ ...product, quantity: 1 });
    }
    localStorage.setItem("cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("storage"));
    
    const toast = document.createElement("div");
    toast.className = "wishlist-toast";
    toast.innerHTML = `✓ ${product.name} added to cart!`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  };

  const toggleWishlist = (product, e) => {
    e.stopPropagation();
    removeFromWishlist(product.id);
    const toast = document.createElement("div");
    toast.className = "wishlist-toast-remove";
    toast.innerHTML = `✕ ${product.name} removed from wishlist`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  };

  const goToProduct = (productId) => {
    navigate(`/product/${productId}`);
  };

  if (wishlistItems.length === 0) {
    return (
      <>
        <Navbar />
        <div className="wishlist-empty-page">
          <div className="wishlist-empty-card">
            <div className="wishlist-empty-icon">
              <FaRegHeart size={60} />
            </div>
            <h2>Your Wishlist is Empty</h2>
            <p>Save your favorite products here and come back anytime.</p>
            <button onClick={() => navigate("/products")} className="wishlist-shop-btn">
              Start Shopping
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="wishlist-page">
        <div className="wishlist-container">
          <div className="wishlist-header">
            <div>
              <h1>My Wishlist</h1>
              <p className="wishlist-count">{wishlistItems.length} items saved</p>
            </div>
            <button className="clear-wishlist-btn" onClick={clearWishlist}>
              <FaTrash /> Clear All
            </button>
          </div>

          <div className="wishlist-grid">
            {wishlistItems.map((product) => (
              <div 
                key={product.id} 
                className="wishlist-card"
                onClick={() => goToProduct(product.id)}
              >
                <div className="wishlist-image-wrapper">
                  <img src={product.image || "/assets/jaggery.png"} alt={product.name} />
                  <button 
                    className="wishlist-remove-btn"
                    onClick={(e) => toggleWishlist(product, e)}
                    title="Remove from wishlist"
                  >
                    <FaHeart style={{ color: "#e74c3c" }} />
                  </button>
                </div>
                <div className="wishlist-card-content">
                  <h3>{product.name}</h3>
                  <p className="wishlist-description">{product.description?.substring(0, 50)}...</p>
                  <div className="wishlist-price">{product.price}</div>
                  <button 
                    className="wishlist-add-cart-btn"
                    onClick={(e) => moveToCart(product, e)}
                  >
                    <FaShoppingCart /> Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .wishlist-toast {
          position: fixed;
          bottom: 30px;
          right: 30px;
          background: #4caf50;
          color: white;
          padding: 12px 24px;
          border-radius: 30px;
          z-index: 10000;
          animation: slideInRight 0.3s ease;
          box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        }
        .wishlist-toast-remove {
          position: fixed;
          bottom: 30px;
          right: 30px;
          background: #f44336;
          color: white;
          padding: 12px 24px;
          border-radius: 30px;
          z-index: 10000;
          animation: slideInRight 0.3s ease;
          box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0%); opacity: 1; }
        }
      `}</style>
    </>
  );
};

export default Wishlist;