import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./TalesSection.css";

const talesData = [
  {
    id: 1,
    videoUrl: "/videos/tale1.mp4",
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
      colors: ["Brown", "Golden"]
    },
    customer: "Priya Sharma",
    testimonial: "I've been using ELVRE jaggery for months, it's the best!"
  },
  {
    id: 2,
    videoUrl: "/videos/tale2.mp4",
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
      colors: ["Brown", "Dark"]
    },
    customer: "Rahul Kumar",
    testimonial: "Perfect for my daily chai, great taste!"
  },
  {
    id: 3,
    videoUrl: "/videos/tale3.mp4",
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
      colors: ["Assorted"]
    },
    customer: "Ananya Singh",
    testimonial: "Made my Diwali gifts extra special!"
  },
  {
    id: 4,
    videoUrl: "/videos/tale4.mp4",
    product: {
      id: 4,
      name: "ELVRE Coconut Jaggery",
      price: "₹249",
      priceValue: 249,
      image: "/assets/coconut-jaggery.png",
      description: "Low Glycemic Index",
      variants: [
        { label: "500g", price: "₹249" },
        { label: "1kg", price: "₹449" }
      ],
      colors: ["Brown"]
    },
    customer: "Vikram Singh",
    testimonial: "Great for my diabetic diet, tastes amazing!"
  },
  {
    id: 5,
    videoUrl: "/videos/tale5.mp4",
    product: {
      id: 5,
      name: "ELVRE Date Jaggery",
      price: "₹299",
      priceValue: 299,
      image: "/assets/date-jaggery.png",
      description: "Natural Dates Sweetener",
      variants: [
        { label: "500g", price: "₹299" },
        { label: "1kg", price: "₹549" }
      ],
      colors: ["Dark Brown"]
    },
    customer: "Neha Gupta",
    testimonial: "Perfect replacement for sugar in my recipes!"
  },
  // ✅ FIXED: Added missing comma above
  {
    id: 6,
    videoUrl: "/videos/tale6.mp4",
    product: {
      id: 6,
      name: "ELVRE Organic Jaggery Powder",
      price: "₹149",
      priceValue: 149,
      image: "/assets/jaggery.png",
      description: "Chemical Free, Natural Sweetener",
      variants: [
        { label: "500g", price: "₹149" },
        { label: "1kg", price: "₹279" }
      ],
      colors: ["Brown", "Golden"]
    },
    customer: "New Customer 1",
    testimonial: "Amazing quality, I love it!"
  },
  {
    id: 7,
    videoUrl: "/videos/tale7.mp4",
    product: {
      id: 7,
      name: "ELVRE Palm Jaggery",
      price: "₹199",
      priceValue: 199,
      image: "/assets/productpacking.png",
      description: "Rich in Minerals",
      variants: [
        { label: "500g", price: "₹199" },
        { label: "1kg", price: "₹379" }
      ],
      colors: ["Brown", "Dark"]
    },
    customer: "Jyoti Singh",
    testimonial: "Perfect for my daily chai!"
  },
  {
    id: 8,
    videoUrl: "/videos/tale8.mp4",
    product: {
      id: 8,
      name: "ELVRE Gift Pack",
      price: "₹299",
      priceValue: 299,
      image: "/assets/bowl.png",
      description: "Special Edition Gift",
      variants: [
        { label: "500g x 2", price: "₹299" },
        { label: "1kg x 2", price: "₹549" }
      ],
      colors: ["Assorted"]
    },
    customer: "New Customer 3",
    testimonial: "Made my gifts extra special!"
  },
  {
    id: 9,
    videoUrl: "/videos/tale9.mp4",
    product: {
      id: 9,
      name: "ELVRE Coconut Jaggery",
      price: "₹249",
      priceValue: 249,
      image: "/assets/coconut-jaggery.png",
      description: "Low Glycemic Index",
      variants: [
        { label: "500g", price: "₹249" },
        { label: "1kg", price: "₹449" }
      ],
      colors: ["Brown"]
    },
    customer: "Shreya Chauhan",
    testimonial: "Great for my diabetic diet!"
  },
  {
    id: 10,
    videoUrl: "/videos/tale10.mp4",
    product: {
      id: 10,
      name: "ELVRE Date Jaggery",
      price: "₹299",
      priceValue: 299,
      image: "/assets/date-jaggery.png",
      description: "Natural Dates Sweetener",
      variants: [
        { label: "500g", price: "₹299" },
        { label: "1kg", price: "₹549" }
      ],
      colors: ["Dark Brown"]
    },
    customer: "New Customer 5",
    testimonial: "Perfect replacement for sugar!"
  }
];

const TalesSection = () => {
  const [selectedTale, setSelectedTale] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedColor, setSelectedColor] = useState("");
  const videoRefs = useRef({});
  const modalVideoRef = useRef(null);
  const navigate = useNavigate();

  // Auto-play all card videos on mount (muted)
  useEffect(() => {
    Object.keys(videoRefs.current).forEach((id) => {
      const vid = videoRefs.current[id];
      if (vid) {
        vid.muted = true;
        vid.play().catch(() => {});
      }
    });
  }, []);

  // Open modal - pauses card videos, plays modal video with sound
  const openModal = (tale) => {
    // Pause all card videos
    Object.keys(videoRefs.current).forEach((id) => {
      const vid = videoRefs.current[id];
      if (vid) vid.pause();
    });
    setSelectedTale(tale);
    setSelectedVariant(tale.product.variants[0] || null);
    setSelectedColor(tale.product.colors[0] || "");
    setIsModalOpen(true);
  };

  // Close modal - resume card videos (muted)
  const closeModal = () => {
    if (modalVideoRef.current) {
      modalVideoRef.current.pause();
    }
    setIsModalOpen(false);
    setSelectedTale(null);
    // Resume card videos
    Object.keys(videoRefs.current).forEach((id) => {
      const vid = videoRefs.current[id];
      if (vid) {
        vid.muted = true;
        vid.play().catch(() => {});
      }
    });
  };

  // Auto-play modal video when opened (with sound)
  useEffect(() => {
    if (isModalOpen && modalVideoRef.current) {
      modalVideoRef.current.muted = false;
      modalVideoRef.current.play().catch(() => {});
    }
  }, [isModalOpen]);

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
    // Reload cart count in navbar via event
    window.dispatchEvent(new Event("storage"));
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

      <div className="tales-scroll-wrapper">
        <div className="tales-grid">
          {talesData.map((tale) => (
            <div key={tale.id} className="tale-card" onClick={() => openModal(tale)}>
              <div className="tale-video-wrapper">
                <video
                  ref={(el) => (videoRefs.current[tale.id] = el)}
                  src={tale.videoUrl}
                  muted
                  playsInline
                  className="tale-video"
                  preload="auto"
                  loop
                />
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
      </div>

      {/* ===== MODAL ===== */}
      {isModalOpen && selectedTale && (
        <div className="tales-modal-overlay" onClick={closeModal}>
          <div className="tales-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>✕</button>
            <div className="modal-content">
              {/* LEFT: Video with sound */}
              <div className="modal-video-wrapper">
                <video
                  ref={modalVideoRef}
                  src={selectedTale.videoUrl}
                  controls
                  playsInline
                  className="modal-video"
                  muted={false}
                  autoPlay
                />
                <div className="modal-video-caption">
                  <span>{selectedTale.customer}</span>
                  <p>"{selectedTale.testimonial}"</p>
                </div>
              </div>

              {/* RIGHT: Product Info */}
              <div className="modal-product-info">
                <h3>{selectedTale.product.name}</h3>
                <p className="product-description">{selectedTale.product.description}</p>
                <div className="product-price">
                  <span className="current-price">{selectedVariant ? selectedVariant.price : selectedTale.product.price}</span>
                  <span className="original-price">₹{Math.round((selectedVariant ? selectedVariant.priceValue : selectedTale.product.priceValue) * 1.2)}</span>
                </div>

                {selectedTale.product.variants && (
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

                {selectedTale.product.colors && (
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