import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import WhatsApp from "./WhatsApp";
import { supabase } from '../supabaseClient';
import { useWishlist } from "../context/WishlistContext"; // ✅ Import wishlist hook
import { FaHeart, FaRegHeart } from "react-icons/fa"; // ✅ Heart icons
import "./ProductsPage.css";

const ProductsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist(); // ✅ Wishlist functions

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

  // ─── LOAD PRODUCTS (PRIMARY: SUPABASE, FALLBACK: LOCALSTORAGE) ───
  const loadProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('id', { ascending: true });
      
      if (error) {
        console.error('❌ Supabase error:', error);
        // Fallback to localStorage
        const cached = localStorage.getItem("elvreProducts");
        if (cached) {
          console.log('📦 Loaded from localStorage (fallback)');
          setProducts(JSON.parse(cached));
        } else {
          setProducts([]);
        }
      } else if (data && data.length > 0) {
        console.log(`✅ Loaded ${data.length} products from Supabase`);
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
        // Update cache
        localStorage.setItem("elvreProducts", JSON.stringify(formatted));
      } else {
        // No products in Supabase – use localStorage (if any)
        const cached = localStorage.getItem("elvreProducts");
        if (cached) {
          console.log('📦 Loaded from localStorage (cache)');
          setProducts(JSON.parse(cached));
        } else {
          console.log('📭 No products found – showing empty');
          setProducts([]);
        }
      }
    } catch (err) {
      console.error('❌ Error loading products:', err);
      // Last resort: localStorage
      const cached = localStorage.getItem("elvreProducts");
      if (cached) setProducts(JSON.parse(cached));
      else setProducts([]);
    }
    setLoading(false);
  };

  // ─── LOAD REVIEWS (for ratings) ───
  const loadReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*');
      
      if (error) {
        console.error('❌ Reviews error:', error);
        // fallback to localStorage
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
            rating: avg.toFixed(1),
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

  // ─── INITIAL LOAD ───
  useEffect(() => {
    loadProducts();
    loadReviews();

    // Listen for manual refresh events from admin
    const handleProductsUpdated = () => {
      console.log('🔄 Manual products update event received');
      loadProducts();
    };
    window.addEventListener("productsUpdated", handleProductsUpdated);

    return () => {
      window.removeEventListener("productsUpdated", handleProductsUpdated);
    };
  }, []);

  // ─── REAL‑TIME SUBSCRIPTION ───
  useEffect(() => {
    const subscription = supabase
      .channel('products-channel')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'products' },
        (payload) => {
          console.log('🔄 Real‑time product change detected:', payload);
          loadProducts();
        }
      )
      .subscribe();

    return () => subscription.unsubscribe();
  }, []);

  // ─── AUTO VIEW MODE ───
  useEffect(() => {
    const handleResize = () => {
      setViewMode(window.innerWidth <= 768 ? "list" : "grid");
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ─── SEARCH FROM URL ───
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const search = params.get("search");
    if (search) setSearchQuery(search);
  }, [location.search]);

  // ─── APPLY FILTERS ───
  useEffect(() => {
    applyFilters();
  }, [products, searchQuery, selectedCategory, priceRange, sortBy]);

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
      case "rating":
        filtered.sort((a, b) => (reviews[a.id]?.rating || 0) - (reviews[b.id]?.rating || 0));
        break;
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
    navigate("/products");
  };

  const addToCart = (product) => {
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
    toast.innerHTML = `✓ ${product.name} added to cart!`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  };

  const getCategoryCount = (categoryId) => {
    if (categoryId === "all") return products.length;
    return products.filter(p => p.category === categoryId).length;
  };

  // ─── WISHLIST HANDLERS ───
  const toggleWishlist = (product) => {
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
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

  // ─── RENDER ───
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
                      onChange={(e) => setPriceRange({ ...priceRange, max: parseInt(e.target.value) })}
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
                    onChange={(e) => setPriceRange({ ...priceRange, min: parseInt(e.target.value) || 0 })}
                    className="price-input"
                  />
                  <span className="price-dash">—</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange({ ...priceRange, max: parseInt(e.target.value) || 1000 })}
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
                  {filteredProducts.map((product) => (
                    <div key={product.id} className="product-card">
                      {product.badge && (
                        <span className={`product-badge ${product.badge.toLowerCase()}`}>{product.badge}</span>
                      )}
                      <div className="product-image" onClick={() => navigate(`/product/${product.id}`)}>
                        <img src={product.image || "/assets/jaggery.png"} alt={product.name} />
                        <div className="product-overlay">
                          <button className="quick-view" onClick={() => navigate(`/product/${product.id}`)}>
                            Quick View
                          </button>
                        </div>
                      </div>
                      <div className="product-info">
                        <div className="product-header-row">
                          <h3 onClick={() => navigate(`/product/${product.id}`)}>{product.name}</h3>
                          {/* ✅ Wishlist Button */}
                          <button 
                            className="wishlist-btn" 
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleWishlist(product);
                            }}
                            title={isInWishlist(product.id) ? "Remove from wishlist" : "Add to wishlist"}
                          >
                            {isInWishlist(product.id) ? (
                              <FaHeart style={{ color: "#e74c3c" }} />
                            ) : (
                              <FaRegHeart />
                            )}
                          </button>
                        </div>
                        <div className="product-rating">
                          <div className="stars">
                            {"★".repeat(Math.floor(reviews[product.id]?.rating || 4))}
                            {"☆".repeat(5 - Math.floor(reviews[product.id]?.rating || 4))}
                          </div>
                          <span>({reviews[product.id]?.count || 0} reviews)</span>
                        </div>
                        <p className="product-description">{product.description?.substring(0, 80)}...</p>
                        <div className="product-price">
                          <span className="current-price">{product.price}</span>
                          <span className="original-price">₹{Math.round(product.priceValue * 1.2)}</span>
                          <span className="discount">Save {Math.round(product.priceValue * 0.2)}₹</span>
                        </div>
                        <div className="stock-status">
                          {product.stock > 0 ? (
                            <span className="in-stock">✓ In Stock ({product.stock} left)</span>
                          ) : (
                            <span className="out-of-stock">✗ Out of Stock</span>
                          )}
                        </div>
                        <div className="product-actions">
                          <button className="view-details" onClick={() => navigate(`/product/${product.id}`)}>
                            View Details
                          </button>
                          <button className="add-to-cart" onClick={() => addToCart(product)} disabled={product.stock === 0}>
                            Add to Cart
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
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