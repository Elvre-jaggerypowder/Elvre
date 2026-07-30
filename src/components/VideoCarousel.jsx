import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./TalesSection.css";

// ============================================================
// 📽️ VIDEO DATA – Copied from your VideoCarousel.jsx
// ============================================================
const talesData = [
  {
    id: 1,
    videoUrl: "/videos/WhatsApp%20Video%202026-05-13%20at%201.31.18%20AM.mp4",
    thumbnail: "/assets/tale1-thumb.jpg", // replace with actual thumbnail
    product: {
      id: 1,
      name: "ELVRE Organic Jaggery Powder",
      price: "₹149",
      priceValue: 149,
      image: "/assets/jaggery.png",
      description: "Chemical Free, Natural Sweetener",
      variants: [
        { label: "500g", price: "₹149" },
        { label: "1kg", price: "₹279" }
      ],
      colors: ["Brown", "Golden"],
      rating: 4.8
    },
    customer: "Priya Sharma",
    testimonial: "I've been using ELVRE jaggery for months, it's the best!"
  },
  {
    id: 2,
    videoUrl: "/videos/WhatsApp%20Video%202026-05-13%20at%201.31.46%20AM.mp4",
    thumbnail: "/assets/tale2-thumb.jpg",
    product: {
      id: 2,
      name: "ELVRE Palm Jaggery",
      price: "₹199",
      priceValue: 199,
      image: "/assets/productpacking.png",
      description: "Rich in Minerals",
      variants: [
        { label: "500g", price: "₹199" },
        { label: "1kg", price: "₹379" }
      ],
      colors: ["Brown", "Dark"],
      rating: 4.6
    },
    customer: "Rahul Kumar",
    testimonial: "Perfect for my daily chai, great taste!"
  },
  {
    id: 3,
    videoUrl: "/videos/WhatsApp%20Video%202026-05-13%20at%201.34.12%20AM.mp4",
    thumbnail: "/assets/tale3-thumb.jpg",
    product: {
      id: 3,
      name: "ELVRE Gift Pack",
      price: "₹299",
      priceValue: 299,
      image: "/assets/bowl.png",
      description: "Special Edition Gift",
      variants: [
        { label: "500g x 2", price: "₹299" },
        { label: "1kg x 2", price: "₹549" }
      ],
      colors: ["Assorted"],
      rating: 4.9
    },
    customer: "Ananya Singh",
    testimonial: "Made my Diwali gifts extra special!"
  },
  {
    id: 4,
    videoUrl: "/videos/WhatsApp%20Video%202026-05-13%20at%201.36.30%20AM.mp4",
    thumbnail: "/assets/tale4-thumb.jpg",
    product: {
      id: 4,
      name: "ELVRE Coconut Jaggery",
      price: "₹249",
      priceValue: 249,
      image: "/assets/jaggery.png",
      description: "Low Glycemic Index, Diabetic Friendly",
      variants: [
        { label: "500g", price: "₹249" },
        { label: "1kg", price: "₹459" }
      ],
      colors: ["Brown", "Light"],
      rating: 4.7
    },
    customer: "Sneha Reddy",
    testimonial: "Finally a healthy sweetener that doesn't compromise on taste!"
  }
];

// ============================================================
// MAIN COMPONENT
// ============================================================
const TalesSection = () => {
  const [selectedTale, setSelectedTale] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedColor, setSelectedColor] = useState("");
  const [videoPlaying, setVideoPlaying] = useState({});
  const videoRefs = useRef({});
  const navigate = useNavigate();

  // Toggle play/pause on video click
  const handleVideoClick = (taleId, e) => {
    e.stopPropagation(); // Prevent opening modal
    const video = videoRefs.current[taleId];
    if (video) {
      if (video.paused) {
        video.play();
        setVideoPlaying(prev => ({ ...prev, [taleId]: true }));
      } else {
        video.pause();
        setVideoPlaying(prev => ({ ...prev, [taleId]: false }));
      }
    }
  };

  // Open modal with product details (on card click)
  const openModal = (tale) => {
    setSelectedTale(tale);
    setSelectedVariant(tale.product.variants[0] || null);
    setSelectedColor(tale.product.colors[0] || "");
    setIsModalOpen(true);
    // Pause video if playing
    if (videoRefs.current[tale.id]) {
      videoRefs.current[tale.id].pause();
      setVideoPlaying(prev => ({ ...prev, [tale.id]: false }));
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTale(null);
  };

  const handleAddToCart = () => {
    const product = selectedTale.product;
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({ ...product, quantity: 1 });
    }
    localStorage.setItem("cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("storage"));
    alert(`${product.name} added to cart!`);
    closeModal();
  };

  const handleBuyNow = () => {
    handleAddToCart();
    const user = localStorage.getItem("currentUser");
    if (!user) {
      localStorage.setItem("redirectAfterLogin", "/checkout");
      navigate("/login");
    } else {
      navigate("/checkout");
    }
  };

  return (
    <section className="tales-section">
      <div className="tales-header">
        <h2 className="section-title">✨ ELVRE Tales</h2>
        <p className="section-subtitle">Real stories from our happy customers</p>
      </div>

      <div className="tales-grid">
        {talesData.map((tale) => (
          <div key={tale.id} className="tale-card" onClick={() => openModal(tale)}>
            <div className="tale-video-wrapper">
              {/* Video element – no play overlay */}
              <video
                ref={(el) => (videoRefs.current[tale.id] = el)}
                src={tale.videoUrl}
                poster={tale.thumbnail}
                muted
                playsInline
                onClick={(e) => handleVideoClick(tale.id, e)}
                className="tale-video"
                onError={(e) => {
                  // Fallback: show thumbnail image if video fails
                  const parent = e.target.parentNode;
                  const fallbackImg = document.createElement('img');
                  fallbackImg.src = tale.thumbnail;
                  fallbackImg.alt = tale.product.name;
                  fallbackImg.className = 'tale-fallback-img';
                  parent.appendChild(fallbackImg);
                  e.target.style.display = 'none';
                }}
              />
              {/* Product badge */}
              <div className="tale-product-badge">
                <img src={tale.product.image} alt={tale.product.name} />
                <span>{tale.product.name}</span>
              </div>
              <div className="tale-customer-name">{tale.customer}</div>
            </div>
            <div className="tale-quote">
              <p>"{tale.testimonial}"</p>
            </div>
          </div>
        ))}
      </div>

      {/* ===== MODAL ===== */}
      {isModalOpen && selectedTale && (
        <div className="tales-modal-overlay" onClick={closeModal}>
          <div className="tales-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>✕</button>
            <div className="modal-content">
              <div className="modal-product-image">
                <img src={selectedTale.product.image} alt={selectedTale.product.name} />
              </div>
              <div className="modal-product-info">
                <h3>{selectedTale.product.name}</h3>
                <p className="product-description">{selectedTale.product.description}</p>
                <div className="product-price">
                  <span className="current-price">
                    {selectedVariant ? selectedVariant.price : selectedTale.product.price}
                  </span>
                  <span className="original-price">
                    ₹{Math.round((selectedVariant ? selectedVariant.priceValue : selectedTale.product.priceValue) * 1.2)}
                  </span>
                </div>

                {/* Variants */}
                {selectedTale.product.variants && selectedTale.product.variants.length > 0 && (
                  <div className="variant-section">
                    <label>Select Weight</label>
                    <div className="variant-options">
                      {selectedTale.product.variants.map((v, idx) => (
                        <button
                          key={idx}
                          className={`variant-btn ${selectedVariant?.label === v.label ? 'active' : ''}`}
                          onClick={() => setSelectedVariant(v)}
                        >
                          {v.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Colors */}
                {selectedTale.product.colors && selectedTale.product.colors.length > 0 && (
                  <div className="color-section">
                    <label>Select Color</label>
                    <div className="color-options">
                      {selectedTale.product.colors.map((color, idx) => (
                        <button
                          key={idx}
                          className={`color-btn ${selectedColor === color ? 'active' : ''}`}
                          onClick={() => setSelectedColor(color)}
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="modal-actions">
                  <button className="add-to-cart-btn" onClick={handleAddToCart}>Add to Cart</button>
                  <button className="buy-now-btn" onClick={handleBuyNow}>Buy Now</button>
                </div>

                <div className="modal-trust-badges">
                  <span>🚚 Free Shipping on ₹499+</span>
                  <span>🔄 7-Day Returns</span>
                  <span>🔒 Secure Payment</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default TalesSection;