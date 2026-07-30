import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";
import { useCart } from "../context/CartContext";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import "./ProductCarousel.css";

const ProductCarousel = () => {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);

  useEffect(() => {
    loadProducts();
    
    // Listen for product updates from admin panel
    window.addEventListener("productsUpdated", loadProducts);
    return () => window.removeEventListener("productsUpdated", loadProducts);
  }, []);

  const loadProducts = () => {
    const savedProducts = localStorage.getItem("elvreProducts");
    if (savedProducts) {
      setProducts(JSON.parse(savedProducts));
    } else {
      // Default products
      const defaultProducts = [
        {
          id: 1,
          name: "ELVRE Organic Jaggery Powder",
          description: "500g - Chemical Free",
          price: "₹149",
          priceValue: 149,
          image: `${process.env.PUBLIC_URL}/assets/jaggery.png`,
          stock: 50
        },
        {
          id: 2,
          name: "ELVRE Premium Jaggery",
          description: "1kg - Farmer's Choice",
          price: "₹279",
          priceValue: 279,
          image: `${process.env.PUBLIC_URL}/assets/productpacking.png`,
          stock: 35
        },
        {
          id: 3,
          name: "ELVRE Gift Pack",
          description: "500g x 2 - Special Edition",
          price: "₹299",
          priceValue: 299,
          image: `${process.env.PUBLIC_URL}/assets/bowl.png`,
          stock: 20
        }
      ];
      setProducts(defaultProducts);
      localStorage.setItem("elvreProducts", JSON.stringify(defaultProducts));
    }
  };

  const handleAddToCart = (product) => {
    addToCart(product, 1);
    // Show toast notification instead of alert
    const toast = document.createElement("div");
    toast.className = "cart-toast";
    toast.innerHTML = `✓ ${product.name} added to cart!`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  };

  const handleBuyNow = (product) => {
    // Add to cart first
    addToCart(product, 1);
    
    // Small delay to ensure cart is updated
    setTimeout(() => {
      // Check if user is logged in
      const user = localStorage.getItem("currentUser");
      if (!user) {
        // Save redirect URL for after login
        localStorage.setItem("redirectAfterLogin", "/checkout");
        navigate("/login");
      } else {
        navigate("/checkout");
      }
    }, 100);
  };

  return (
    <section className="product-carousel-section" data-aos="fade-up">
      <div className="product-carousel-header">
        <h2 className="product-carousel-title">Our Products</h2>
        <p className="product-carousel-subtitle">Shop the best quality jaggery powder</p>
      </div>

      <Swiper
        modules={[Autoplay, Pagination, Navigation]}
        spaceBetween={30}
        slidesPerView={1}
        pagination={{ clickable: true }}
        navigation={true}
        autoplay={{ delay: 4000, disableOnInteraction: false }}
        breakpoints={{
          640: { slidesPerView: 2 },
          1024: { slidesPerView: 3 },
        }}
        className="product-swiper"
      >
        {products.map((product) => (
          <SwiperSlide key={product.id}>
            <div className="product-card">
              <img src={product.image} alt={product.name} className="product-image" />
              <h3 className="product-name">{product.name}</h3>
              <p className="product-description">{product.description}</p>
              <div className="product-price">{product.price}</div>
              <div className="product-stock">
                {product.stock > 0 ? (
                  <span className="in-stock">✓ In Stock ({product.stock} available)</span>
                ) : (
                  <span className="out-of-stock">✗ Out of Stock</span>
                )}
              </div>
              {product.stock > 0 && (
                <div className="product-buttons">
                  <button 
                    className="product-btn add-to-cart-btn" 
                    onClick={() => handleAddToCart(product)}
                  >
                    🛒 Add to Cart
                  </button>
                  <button 
                    className="product-btn buy-now-btn-small" 
                    onClick={() => handleBuyNow(product)}
                  >
                    Buy Now
                  </button>
                </div>
              )}
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Toast Notification Styles */}
      <style>{`
        .cart-toast {
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
          font-size: 14px;
        }
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </section>
  );
};

export default ProductCarousel;