import React from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import WhatsApp from "./WhatsApp";
import { useCart } from "../hooks/useCart"; // ⬅️ Hook import karo
import "./Cart.css";

const Cart = () => {
  const navigate = useNavigate();
  // Hook se saare functions aur data le lo
  const {
    cartItems,
    loading,
    updateQuantity,
    removeFromCart,
    clearCart, // 🔥 Clear cart function yahan se aaya
    subtotal,
    shipping,
    total,
    getTotalItems
  } = useCart();

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      alert("Your cart is empty!");
      return;
    }
    const user = localStorage.getItem("currentUser");
    if (!user) {
      localStorage.setItem("redirectAfterLogin", "/checkout");
      navigate("/login");
    } else {
      navigate("/checkout");
    }
  };

  // Loading state
  if (loading) {
    return (
      <>
        <Navbar />
        <div className="cart-loading">Loading cart...</div>
        <WhatsApp />
      </>
    );
  }

  // Empty state
  if (cartItems.length === 0) {
    return (
      <>
        <Navbar />
        <div className="cart-empty">
          <div className="cart-empty-content">
            <h2>Your Cart is Empty 🛒</h2>
            <p>Looks like you haven't added any products to your cart yet.</p>
            <Link to="/products" className="continue-shopping-btn">
              Continue Shopping
            </Link>
          </div>
        </div>
        <WhatsApp />
      </>
    );
  }

  // Full Cart Page UI
  return (
    <>
      <Navbar />
      <div className="cart-page">
        <div className="cart-container">
          <h1 className="cart-title">Shopping Cart ({getTotalItems()} items)</h1>
          
          <div className="cart-content">
            <div className="cart-items">
              {cartItems.map((item) => {
                const itemPrice = item.priceValue || parseFloat(item.price?.replace('₹', '')) || 0;
                const itemTotal = itemPrice * (item.quantity || 1);
                const displayName = item.variant ? `${item.name} (${item.variant})` : item.name;

                return (
                  <div key={item.id} className="cart-item">
                    <img src={item.image || "/assets/jaggery.png"} alt={item.name} className="cart-item-image" />
                    <div className="cart-item-details">
                      <h3>{displayName}</h3>
                      <p className="cart-item-price">₹{itemPrice}</p>
                      <p className="cart-item-stock">In Stock</p>
                      <button onClick={() => removeFromCart(item.id)} className="cart-remove-btn">
                        Remove
                      </button>
                    </div>
                    <div className="cart-item-quantity">
                      <button onClick={() => updateQuantity(item.id, (item.quantity || 1) - 1)} className="qty-btn">-</button>
                      <span className="qty-value">{item.quantity || 1}</span>
                      <button onClick={() => updateQuantity(item.id, (item.quantity || 1) + 1)} className="qty-btn">+</button>
                    </div>
                    <div className="cart-item-total">₹{itemTotal}</div>
                  </div>
                );
              })}
            </div>
            
            <div className="cart-summary">
              <h3>Order Summary</h3>
              <div className="summary-row">
                <span>Subtotal ({getTotalItems()} items)</span>
                <span>₹{subtotal}</span>
              </div>
              <div className="summary-row">
                <span>Shipping</span>
                <span>{shipping === 0 ? "Free" : `₹${shipping}`}</span>
              </div>
              {subtotal < 499 && subtotal > 0 && (
                <div className="free-shipping-note">
                  ✨ Add ₹{Math.ceil(499 - subtotal)} more for free shipping!
                </div>
              )}
              <div className="summary-row total">
                <span>Total</span>
                <span>₹{total}</span>
              </div>
              <div className="cart-actions">
                {/* ✅ Sanyam ka Clear Cart button - ab hook se call ho raha hai */}
                <button onClick={clearCart} className="clear-cart-btn">
                  Clear Cart
                </button>
                <button onClick={handleCheckout} className="checkout-btn">
                  Proceed to Checkout →
                </button>
              </div>
              <Link to="/products" className="continue-shopping-link">
                ← Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
      <WhatsApp />
    </>
  );
};

export default Cart;