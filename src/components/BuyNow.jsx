import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import "./BuyNow.css";

const BuyNow = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get product from URL params or localStorage
    const params = new URLSearchParams(location.search);
    const productId = params.get("id");
    
    if (productId) {
      const products = JSON.parse(localStorage.getItem("elvreProducts") || "[]");
      const foundProduct = products.find(p => p.id === parseInt(productId));
      setProduct(foundProduct);
    } else {
      // Get from localStorage (last viewed product)
      const lastProduct = localStorage.getItem("lastProduct");
      if (lastProduct) {
        setProduct(JSON.parse(lastProduct));
      }
    }
    setLoading(false);
  }, [location]);

  const handleBuyNow = () => {
    if (!product) return;

    // Add to cart
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      existingItem.quantity = (existingItem.quantity || 1) + quantity;
    } else {
      cart.push({ ...product, quantity: quantity });
    }
    
    localStorage.setItem("cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("storage"));
    
    // Check if user is logged in
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
        <div className="buynow-loading">Loading...</div>
        <Footer />
      </>
    );
  }

  if (!product) {
    return (
      <>
        <Navbar />
        <div className="buynow-error">
          <h2>Product not found</h2>
          <button onClick={() => navigate("/products")}>Browse Products</button>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="buynow-container">
        <div className="buynow-wrapper">
          <h1>Buy Now</h1>
          
          <div className="buynow-grid">
            {/* Product Image */}
            <div className="product-image-section">
              <img src={product.image || "/assets/jaggery.png"} alt={product.name} />
            </div>
            
            {/* Product Details */}
            <div className="product-details-section">
              <h2>{product.name}</h2>
              <p className="product-price">{product.price}</p>
              <p className="product-desc">{product.description}</p>
              
              <div className="quantity-section">
                <label>Quantity:</label>
                <div className="quantity-controls">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
                  <span>{quantity}</span>
                  <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}>+</button>
                </div>
                <span className="stock-info">{product.stock} units available</span>
              </div>
              
              <div className="total-price">
                <span>Total Amount:</span>
                <span>₹{(product.priceValue * quantity).toFixed(2)}</span>
              </div>
              
              <button onClick={handleBuyNow} className="proceed-btn">
                Proceed to Checkout
              </button>
              
              <button onClick={() => navigate("/products")} className="continue-shopping">
                ← Continue Shopping
              </button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default BuyNow;