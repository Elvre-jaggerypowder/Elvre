import React from "react";
import { useNavigate } from "react-router-dom";
import { FaTimes, FaMinus, FaPlus, FaTrash } from "react-icons/fa";
import { useCart } from "../hooks/useCart"; // ⬅️ Hook import karo
import "./CartDrawer.css";

const CartDrawer = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  
  // Hook se saara data le lo
  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    subtotal,
    shipping,
    total
  } = useCart(); // 🔥 Dhyaan rakho, isme `clearCart` nahi use kar rahe, kyunki drawer mein button nahi hai

  const handleCheckout = () => {
    onClose(); // Drawer band karo
    const user = localStorage.getItem("currentUser");
    if (!user) {
      localStorage.setItem("redirectAfterLogin", "/checkout");
      navigate("/login");
    } else {
      navigate("/checkout");
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={`cart-drawer-overlay ${isOpen ? "active" : ""}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div className={`cart-drawer ${isOpen ? "open" : ""}`}>
        <div className="cart-drawer-header">
          <h3>Your Cart</h3>
          <button className="cart-drawer-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="cart-drawer-body">
          {cartItems.length === 0 ? (
            <div className="empty-cart-msg">
              <p>Your cart is empty.</p>
              <button className="continue-shopping" onClick={onClose}>
                Continue Shopping
              </button>
            </div>
          ) : (
            <>
              <div className="cart-items-list">
                {cartItems.map((item) => {
                  const price = item.priceValue || 0;
                  const qty = item.quantity || 1;
                  return (
                    <div key={item.id} className="cart-drawer-item">
                      <img src={item.image} alt={item.name} />
                      <div className="item-details">
                        <h4>{item.name}</h4>
                        <p>₹{price}</p>
                        <div className="item-actions">
                          <button
                            className="qty-btn"
                            onClick={() => updateQuantity(item.id, qty - 1)}
                          >
                            <FaMinus />
                          </button>
                          <span>{qty}</span>
                          <button
                            className="qty-btn"
                            onClick={() => updateQuantity(item.id, qty + 1)}
                          >
                            <FaPlus />
                          </button>
                          <button
                            className="remove-btn"
                            onClick={() => removeFromCart(item.id)}
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                      <div className="item-total">₹{price * qty}</div>
                    </div>
                  );
                })}
              </div>

              <div className="cart-drawer-summary">
                <div className="summary-row">
                  <span>Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>
                <div className="summary-row">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? "Free" : `₹${shipping}`}</span>
                </div>
                {subtotal < 499 && subtotal > 0 && (
                  <div className="free-shipping-notice">
                    Add ₹{499 - subtotal} more for free shipping
                  </div>
                )}
                <div className="summary-row total">
                  <span>Total</span>
                  <span>₹{total}</span>
                </div>
                <button className="checkout-btn" onClick={handleCheckout}>
                  Proceed to Checkout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default CartDrawer;