import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import WhatsApp from "./WhatsApp";
import { supabase } from '../supabaseClient';
import { useWishlist } from "../context/WishlistContext";
import {
  FaHeart, FaRegHeart, FaLeaf, FaFlask, FaSeedling,
  FaCheckCircle, FaTimesCircle, FaEye, FaShoppingCart,
  FaShieldAlt, FaTruck, FaHeadset
} from "react-icons/fa";
import "./ProductsPage.css";

const DEFAULT_RATING = 4.0;

const ProductsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });
  const [sortBy, setSortBy] = useState("default");
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  const [reviews, setReviews] = useState({});

  const categories = [
    { id: "all", name: "All Products", icon: "📦" },
    { id: "jaggery", name: "Jaggery", icon: "🍯" },
    { id: "organic", name: "Organic", icon: "🌱" },
    { id: "special", name: "Special", icon: "⭐" }
  ];

  // ─── LOAD PRODUCTS ───
  const loadProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('id', { ascending: true });

      if (error) {
        console.error('❌ Supabase error:', error);
        const cached = localStorage.getItem("elvreProducts");
        if (cached) setProducts(JSON.parse(cached));
        else setProducts([]);
      } else if (data && data.length > 0) {
        const formatted = data.map(p => ({
          id: p.id,
          name: p.name,
          description: p.description,
          price: `₹${p.price}`,
          priceValue: p.price,
          stock: p.stock,
          image: p.image,
          category: p.category,
          badge: p.badge,
          soldCount: p.sold_count || 0
        }));
        setProducts(formatted);
        localStorage.setItem("elvreProducts", JSON.stringify(formatted));
      } else {
        const cached = localStorage.getItem("elvreProducts");
        if (cached) setProducts(JSON.parse(cached));
        else setProducts([]);
      }
    } catch (err) {
      console.error('❌ Error loading products:', err);
      const cached = localStorage.getItem("elvreProducts");
      if (cached) setProducts(JSON.parse(cached));
      else setProducts([]);
    }
    setLoading(false);
  };

  // ─── LOAD REVIEWS ───
  const loadReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*');

      if (error) {
        console.error('❌ Reviews error:', error);
        const saved = JSON.parse(localStorage.getItem("productReviews") || "{}");
        setReviews(saved);
        return;
      }

      if (data && data.length > 0) {
        const reviewMap = {};
        data.forEach(review => {
          const pid = review.product_id;
          if (!reviewMap[pid]) {
            reviewMap[pid] = { total: 0, count: 0 };
          }
          reviewMap[pid].total += review.rating;
          reviewMap[pid].count += 1;
        });
        const formatted = {};
        Object.keys(reviewMap).forEach(pid => {
          const avg = reviewMap[pid].total / reviewMap[pid].count;
          formatted[pid] = {
            rating: parseFloat(avg.toFixed(1)),
            count: reviewMap[pid].count
          };
        });
        setReviews(formatted);
        localStorage.setItem("productReviews", JSON.stringify(formatted));
      } else {
        setReviews({});
        localStorage.removeItem("productReviews");
      }
    } catch (err) {
      console.error('❌ Error loading reviews:', err);
      setReviews({});
    }
  };

  useEffect(() => {
    loadProducts();
    loadReviews();
    const handleProductsUpdated = () => {
      console.log('🔄 Manual products update event received');
      loadProducts();
    };
    window.addEventListener("productsUpdated", handleProductsUpdated);
    return () => {
      window.removeEventListener("productsUpdated", handleProductsUpdated);
    };
  }, []);

  useEffect(() => {
    const subscription = supabase
      .channel('products-channel')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        () => loadProducts()
      )
      .subscribe();
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setViewMode(window.innerWidth <= 768 ? "list" : "grid");
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const search = params.get("search");
    if (search) setSearchQuery(search);
  }, [location.search]);

  useEffect(() => {
    applyFilters();
  }, [products, searchQuery, selectedCategory, priceRange, sortBy, reviews]);

  const applyFilters = () => {
    let filtered = [...products];

    if (searchQuery) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    filtered = filtered.filter(p =>
      p.priceValue >= priceRange.min && p.priceValue <= priceRange.max
    );

    switch (sortBy) {
      case "price-low-high":
        filtered.sort((a, b) => a.priceValue - b.priceValue);
        break;
      case "price-high-low":
        filtered.sort((a, b) => b.priceValue - a.priceValue);
        break;
      case "rating": {
        const getRating = (p) => reviews[p.id]?.rating ?? DEFAULT_RATING;
        filtered.sort((a, b) => getRating(b) - getRating(a));
        break;
      }
      case "name-asc":
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        filtered.sort((a, b) => a.id - b.id);
    }

    setFilteredProducts(filtered);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setPriceRange({ min: 0, max: 1000 });
    setSortBy("default");
    setShowFilters(false);
    navigate("/products");
  };

  const addToCart = (product, e) => {
    if (e) e.stopPropagation();
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      existing.quantity = (existing.quantity || 1) + 1;
    } else {
      cart.push({ ...product, quantity: 1 });
    }
    localStorage.setItem("cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("storage"));

    const toast = document.createElement("div");
    toast.className = "cart-toast";
    toast.textContent = `✓ ${product.name} added to cart!`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  };

  const toggleWishlist = (product, e) => {
    if (e) e.stopPropagation();
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  // FIX: supports a `product.features` array (up to 3 short tags shown as
  // pills over the hero photo). Falls back to sensible defaults per
  // category so every card looks complete even without extra backend data.
  const FEATURE_ICONS = [FaLeaf, FaFlask, FaSeedling];
  const DEFAULT_FEATURES = {
    jaggery: ["100% Natural", "Chemical Free", "Rich in Iron & Minerals"],
    organic: ["100% Organic", "No Preservatives", "Farm Fresh"],
    special: ["Premium Quality", "Limited Batch", "Handcrafted"],
    default: ["100% Natural", "Chemical Free", "Premium Quality"]
  };

  const getProductFeatures = (product) => {
    if (Array.isArray(product.features) && product.features.length > 0) {
      return product.features.slice(0, 3);
    }
    return DEFAULT_FEATURES[product.category] || DEFAULT_FEATURES.default;
  };

  const getCategoryCount = (categoryId) => {
    if (categoryId === "all") return products.length;
    return products.filter(p => p.category === categoryId).length;
  };

  const handleMinPriceChange = (value) => {
    const min = parseInt(value) || 0;
    setPriceRange(prev => ({ ...prev, min: Math.min(min, prev.max) }));
  };

  const handleMaxPriceChange = (value) => {
    const max = parseInt(value) || 0;
    setPriceRange(prev => ({ ...prev, max: Math.max(max, prev.min) }));
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="products-loading">Loading products...</div>
        <WhatsApp />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="products-page">
        <div className="products-container">
          {/* Hero Banner */}
          <div className="products-hero">
            <h1>Our Premium Collection</h1>
            <p>Discover the finest quality jaggery and organic sweeteners</p>
          </div>

          {/* Search Bar */}
          <div className="products-search-wrapper">
            <div className="products-search-bar">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search products by name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="clear-search">✕</button>
              )}
            </div>
          </div>

          {/* Filter Toggle for Mobile */}
          <button className="filter-toggle-btn" onClick={() => setShowFilters(!showFilters)}>
            {showFilters ? "▲ Hide Filters" : "▼ Show Filters"}
          </button>

          <div className="products-layout">
            {/* Filters Sidebar */}
            <div className={`filters-sidebar ${showFilters ? "active" : ""}`}>
              <div className="filter-header">
                <h3>Filters</h3>
                <button className="reset-filters" onClick={clearFilters}>Reset</button>
                <button className="filter-close-btn" onClick={() => setShowFilters(false)}>✕</button>
              </div>

              <div className="filter-group">
                <h4>Categories</h4>
                <div className="category-list">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      className={`category-chip ${selectedCategory === cat.id ? "active" : ""}`}
                      onClick={() => setSelectedCategory(cat.id)}
                    >
                      <span className="cat-icon">{cat.icon}</span>
                      <span className="cat-name">{cat.name}</span>
                      <span className="cat-count">{getCategoryCount(cat.id)}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="filter-group">
                <h4>Price Range</h4>
                <div className="price-range-display">
                  <span>₹{priceRange.min}</span>
                  <div className="price-slider-track">
                    <input
                      type="range"
                      min="0"
                      max="1000"
                      value={priceRange.max}
                      onChange={(e) => handleMaxPriceChange(e.target.value)}
                      className="price-slider"
                      style={{
                        background: `linear-gradient(to right, #8B5E3C 0%, #8B5E3C ${(priceRange.max / 1000) * 100}%, #ddd ${(priceRange.max / 1000) * 100}%, #ddd 100%)`
                      }}
                    />
                  </div>
                  <span>₹{priceRange.max}</span>
                </div>
                <div className="price-inputs">
                  <input
                    type="number"
                    placeholder="Min"
                    value={priceRange.min}
                    onChange={(e) => handleMinPriceChange(e.target.value)}
                    className="price-input"
                  />
                  <span className="price-dash">—</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={priceRange.max}
                    onChange={(e) => handleMaxPriceChange(e.target.value)}
                    className="price-input"
                  />
                </div>
              </div>

              <div className="filter-group">
                <h4>Sort By</h4>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="sort-select">
                  <option value="default">Default</option>
                  <option value="price-low-high">Price: Low to High</option>
                  <option value="price-high-low">Price: High to Low</option>
                  <option value="rating">Top Rated</option>
                  <option value="name-asc">Name: A to Z</option>
                </select>
              </div>

              <button className="apply-filters-btn" onClick={() => setShowFilters(false)}>
                Apply Filters
              </button>
            </div>

            {/* Products Grid */}
            <div className="products-grid">
              <div className="products-header-bar">
                <p>{filteredProducts.length} products found</p>
                <div className="view-options">
                  <button
                    className={`view-btn ${viewMode === "grid" ? "active" : ""}`}
                    onClick={() => setViewMode("grid")}
                    title="Grid View"
                  >
                    ⊞
                  </button>
                  <button
                    className={`view-btn ${viewMode === "list" ? "active" : ""}`}
                    onClick={() => setViewMode("list")}
                    title="List View"
                  >
                    ☰
                  </button>
                </div>
              </div>

              {filteredProducts.length === 0 ? (
                <div className="no-products">
                  <div className="no-products-icon">🔍</div>
                  <h3>No products found</h3>
                  <p>Try adjusting your search or filter criteria</p>
                  <button onClick={clearFilters} className="reset-btn">Reset Filters</button>
                </div>
              ) : (
                <div className={`products-grid-list ${viewMode === "list" ? "list-view" : "grid-view"}`}>
                  {filteredProducts.map((product) => {
                    const rating = reviews[product.id]?.rating ?? DEFAULT_RATING;
                    const reviewCount = reviews[product.id]?.count || 0;
                    const description = product.description || "";
                    const features = getProductFeatures(product);

                    return (
                      <div
                        key={product.id}
                        className="product-card"
                        onClick={() => navigate(`/product/${product.id}`)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="product-hero">
                          <img src={product.image || "/assets/jaggery.png"} alt={product.name} className="hero-img" />

                          {product.badge && (
                            <span className="hero-badge">
                              <FaLeaf /> {product.badge}
                            </span>
                          )}

                          <button
                            className="hero-wishlist"
                            onClick={(e) => toggleWishlist(product, e)}
                            title={isInWishlist(product.id) ? "Remove from wishlist" : "Add to wishlist"}
                          >
                            {isInWishlist(product.id) ? (
                              <FaHeart style={{ color: "#e74c3c" }} />
                            ) : (
                              <FaRegHeart />
                            )}
                          </button>

                          <div className="hero-features">
                            {features.map((feature, i) => {
                              const Icon = FEATURE_ICONS[i] || FaLeaf;
                              return (
                                <React.Fragment key={feature}>
                                  <span className="hero-feature">
                                    <Icon /> {feature}
                                  </span>
                                  {i < features.length - 1 && <span className="hero-feature-divider" />}
                                </React.Fragment>
                              );
                            })}
                          </div>
                        </div>

                        <div className="product-info">
                          <h3>{product.name}</h3>

                          <div className="product-rating">
                            <div className="stars">
                              {"★".repeat(Math.floor(rating))}
                              {"☆".repeat(5 - Math.floor(rating))}
                            </div>
                            <span>({reviewCount} reviews)</span>
                          </div>

                          <div className="info-divider" />

                          {description && (
                            <p className="product-description">
                              <FaLeaf className="desc-icon" /> <span>{description}</span>
                            </p>
                          )}

                          <div className="product-price">
                            <span className="current-price">{product.price}</span>
                            <span className="original-price">₹{Math.round(product.priceValue * 1.2)}</span>
                            <span className="discount">Save {Math.round(product.priceValue * 0.2)}₹</span>
                          </div>

                          <div className={`stock-banner ${product.stock > 0 ? "in-stock" : "out-of-stock"}`}>
                            {product.stock > 0 ? (
                              <><FaCheckCircle /> In Stock ({product.stock} left)</>
                            ) : (
                              <><FaTimesCircle /> Out of Stock</>
                            )}
                          </div>

                          <div className="product-actions">
                            <button
                              className="view-details"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/product/${product.id}`);
                              }}
                            >
                              <FaEye /> View Details
                            </button>
                            <button
                              className="add-to-cart"
                              onClick={(e) => addToCart(product, e)}
                              disabled={product.stock === 0}
                            >
                              <FaShoppingCart /> Add to Cart
                            </button>
                          </div>

                          <div className="trust-footer">
                            <span><FaShieldAlt /> Trusted Quality</span>
                            <span><FaLeaf /> No Artificial Additives</span>
                            <span><FaTruck /> Fast &amp; Safe Delivery</span>
                            <span><FaHeadset /> Customer Support</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <WhatsApp />
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
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0%); opacity: 1; }
        }
      `}</style>
    </>
  );
};

export default ProductsPage;