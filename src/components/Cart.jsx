import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import WhatsApp from "./WhatsApp";
import "./Cart.css";

const Cart = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCart();
    window.addEventListener("storage", loadCart);
    return () => window.removeEventListener("storage", loadCart);
  }, []);

  const loadCart = () => {
    const savedCart = JSON.parse(localStorage.getItem("cart") || "[]");
    console.log("Cart loaded:", savedCart);
    setCartItems(savedCart);
    setLoading(false);
  };

  const updateQuantity = (id, newQuantity) => {
    if (newQuantity < 1) return;
    const updatedCart = cartItems.map(item =>
      item.id === id ? { ...item, quantity: newQuantity } : item
    );
    setCartItems(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
    window.dispatchEvent(new Event("storage"));
  };

  const removeFromCart = (id) => {
    const updatedCart = cartItems.filter(item => item.id !== id);
    setCartItems(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
    window.dispatchEvent(new Event("storage"));
  };

  const clearCart = () => {
    if (window.confirm("Clear your cart?")) {
      setCartItems([]);
      localStorage.removeItem("cart");
      window.dispatchEvent(new Event("storage"));
    }
  };

  const getSubtotal = () => {
    return cartItems.reduce((sum, item) => {
      const price = item.priceValue || parseFloat(item.price?.replace('₹', '')) || 0;
      return sum + (price * (item.quantity || 1));
    }, 0);
  };

  const getTotalItems = () => {
    return cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
  };

  const subtotal = getSubtotal();
  const shipping = subtotal > 499 ? 0 : 40;
  const total = subtotal + shipping;

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

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="cart-loading">Loading cart...</div>
        <WhatsApp />
      </>
    );
  }

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

                // ✅ Display variant label if present
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
                  {/* ✅ FIX: .00 hata diya - ab ₹249 dikhega */}
                  ✨ Add ₹{Math.ceil(499 - subtotal)} more for free shipping!
                </div>
              )}
              <div className="summary-row total">
                <span>Total</span>
                <span>₹{total}</span>
              </div>
              <div className="cart-actions">
                {/* ✅ Clear Cart button - YE RAHEGA (maine remove nahi kiya) */}
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