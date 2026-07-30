import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import WhatsApp from "./WhatsApp";
import { supabase } from '../supabaseClient';
import SuccessNotification from "./SuccessNotification";
import "./ProductDetails.css";

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({ rating: 5, comment: "", name: "" });
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");
  const [selectedImage, setSelectedImage] = useState(0);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  
  // ─── VARIANT STATE ───
  const [selectedVariant, setSelectedVariant] = useState(null);

  // ─── LOAD PRODUCT & REVIEWS ───
  useEffect(() => {
    loadProduct();
    loadReviews();

    const productSub = supabase
      .channel('product-details')
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'products', filter: `id=eq.${parseInt(id)}` }, 
        (payload) => {
          console.log('🔄 Product updated:', payload.new);
          setProduct(prev => ({ ...prev, ...payload.new }));
        }
      )
      .subscribe();

    const handleProductsUpdated = () => loadProduct();
    window.addEventListener("productsUpdated", handleProductsUpdated);

    return () => {
      productSub.unsubscribe();
      window.removeEventListener("productsUpdated", handleProductsUpdated);
    };
  }, [id]);

  // ─── LOAD PRODUCT ───
  const loadProduct = async () => {
    setLoading(true);
    try {
      const { data: supabaseProduct, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', parseInt(id))
        .single();
      
      if (!error && supabaseProduct) {
        const foundProduct = {
          id: supabaseProduct.id,
          name: supabaseProduct.name,
          description: supabaseProduct.description,
          price: `₹${supabaseProduct.price}`,
          priceValue: supabaseProduct.price,
          stock: supabaseProduct.stock,
          image: supabaseProduct.image || "/assets/jaggery.png",
          category: supabaseProduct.category,
          badge: supabaseProduct.badge,
          soldCount: supabaseProduct.sold_count || 0,
          variants: supabaseProduct.variants || [],  // ✅ load variants
          enhancedInfo: {
            brand: "ELVRE Enterprises",
            origin: "Made in India",
            certification: "FSSAI Certified, Organic Certified",
            shelfLife: "12 months",
            weight: "500g"
          },
          nutritionalInfo: {
            calories: "38 kcal",
            totalFat: "0g",
            sodium: "2mg",
            carbohydrates: "9.8g",
            sugars: "9.5g",
            protein: "0.1g",
            iron: "2.5mg (14% DV)",
            calcium: "8mg (1% DV)"
          },
          ingredients: ["Organic Sugarcane", "No Chemicals", "Natural Minerals"],
          healthBenefits: [
            "Rich in Iron - Helps prevent anemia",
            "Digestive Health - Aids digestion naturally",
            "Natural Detoxifier - Cleanses the body",
            "Energy Booster - Provides instant energy"
          ],
          usageInstructions: [
            "As a sweetener in tea, coffee, and milk",
            "In desserts like kheer, halwa, and laddoos",
            "For making traditional sweets and snacks",
            "As a natural substitute for white sugar"
          ]
        };
        setProduct(foundProduct);
        // Set default variant (first one if exists)
        if (foundProduct.variants && foundProduct.variants.length > 0) {
          setSelectedVariant(foundProduct.variants[0]);
        } else {
          setSelectedVariant(null);
        }
        // Update localStorage cache
        const savedProducts = localStorage.getItem("elvreProducts");
        if (savedProducts) {
          const products = JSON.parse(savedProducts);
          const updated = products.map(p => p.id === foundProduct.id ? foundProduct : p);
          localStorage.setItem("elvreProducts", JSON.stringify(updated));
        }
      } else {
        // fallback to localStorage
        const savedProducts = localStorage.getItem("elvreProducts");
        if (savedProducts) {
          const products = JSON.parse(savedProducts);
          const foundProduct = products.find(p => p.id === parseInt(id));
          if (foundProduct) {
            setProduct(foundProduct);
            if (foundProduct.variants && foundProduct.variants.length > 0) {
              setSelectedVariant(foundProduct.variants[0]);
            }
          }
        }
      }
    } catch (err) {
      console.error('❌ loadProduct error:', err);
    }
    setLoading(false);
  };

  // ─── LOAD REVIEWS ───
  const loadReviews = async () => {
    try {
      const { data: supabaseReviews, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', parseInt(id))
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('⚠️ Supabase load reviews error:', error);
        const savedReviews = localStorage.getItem(`reviews_${id}`);
        if (savedReviews) setReviews(JSON.parse(savedReviews));
        return;
      }
      
      if (supabaseReviews && supabaseReviews.length > 0) {
        setReviews(supabaseReviews);
        localStorage.setItem(`reviews_${id}`, JSON.stringify(supabaseReviews));
      } else {
        const savedReviews = localStorage.getItem(`reviews_${id}`);
        if (savedReviews) setReviews(JSON.parse(savedReviews));
        else setReviews([]);
      }
    } catch (err) {
      console.error('❌ loadReviews error:', err);
      const savedReviews = localStorage.getItem(`reviews_${id}`);
      if (savedReviews) setReviews(JSON.parse(savedReviews));
    }
  };

  // ─── SUBMIT REVIEW ───
  const submitReview = async (e) => {
    e.preventDefault();
    if (!newReview.name || !newReview.comment) {
      setNotificationMessage("Please fill all fields");
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
      return;
    }

    const review = {
      id: Date.now(),
      product_id: parseInt(id),
      product_name: product?.name,
      name: newReview.name,
      rating: newReview.rating,
      comment: newReview.comment,
      date: new Date().toISOString().split('T')[0],
      verified: false,
      approved: false,
      spam: false,
      created_at: new Date().toISOString()
    };

    try {
      const { error } = await supabase
        .from('reviews')
        .insert([review]);
      if (error) {
        console.error('❌ Supabase insert review error:', error);
      } else {
        console.log('✅ Review saved to Supabase');
      }
    } catch (err) {
      console.error('❌ Unexpected review save error:', err);
    }

    const updatedReviews = [review, ...reviews];
    setReviews(updatedReviews);
    localStorage.setItem(`reviews_${id}`, JSON.stringify(updatedReviews));
    setNewReview({ rating: 5, comment: "", name: "" });
    
    setNotificationMessage("Thank you! Your review has been submitted.");
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  // ─── CART ACTIONS (with variant) ───
  const getVariantPrice = () => {
    if (selectedVariant && selectedVariant.price) {
      return parseFloat(selectedVariant.price);
    }
    return product.priceValue;
  };

  const getVariantStock = () => {
    if (selectedVariant && selectedVariant.stock !== undefined) {
      return parseInt(selectedVariant.stock);
    }
    return product.stock;
  };

  const getVariantLabel = () => {
    return selectedVariant ? selectedVariant.label : null;
  };

  const addToCart = () => {
    const price = getVariantPrice();
    const stock = getVariantStock();
    const variantLabel = getVariantLabel();
    
    const cartItem = {
      id: product.id,
      name: product.name,
      variant: variantLabel,
      price: price,
      priceDisplay: `₹${price}`,
      quantity: quantity,
      image: product.image,
      stock: stock
    };

    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const existingItem = cart.find(item => 
      item.id === product.id && item.variant === variantLabel
    );
    
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.push(cartItem);
    }
    
    localStorage.setItem("cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("storage"));
    
    const toast = document.createElement("div");
    toast.className = "cart-toast";
    toast.innerHTML = `✓ ${product.name}${variantLabel ? ' ('+variantLabel+')' : ''} added to cart!`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  };

  const buyNow = () => {
    addToCart();
    const user = localStorage.getItem("currentUser");
    if (!user) {
      localStorage.setItem("redirectAfterLogin", "/checkout");
      navigate("/login");
    } else {
      navigate("/checkout");
    }
  };

  const getAverageRating = () => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, rev) => acc + rev.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!product) return <div className="not-found">Product not found</div>;

  const currentStock = getVariantStock();
  const currentPrice = getVariantPrice();

  // ─── RENDER ───
  return (
    <>
      <Navbar />
      <div className="product-detail-page">
        <div className="product-detail-container">
          <div className="back-btn-wrapper">
            <button className="back-btn" onClick={() => navigate(-1)}>
              <span className="back-icon">←</span> Back
            </button>
          </div>

          <div className="breadcrumb">
            <span onClick={() => navigate("/")}>Home</span> / 
            <span onClick={() => navigate("/products")}>Products</span> / 
            <span>{product.name}</span>
          </div>

          <div className="product-detail-grid">
            {/* Image Gallery */}
            <div className="product-gallery">
              <div className="main-image">
                <img src={product.image} alt={product.name} />
              </div>
              <div className="thumbnail-list">
                <img src={product.image} alt="View 1" className="thumbnail active" onClick={() => setSelectedImage(0)} />
                <img src="/assets/productpacking.png" alt="View 2" className="thumbnail" onClick={() => setSelectedImage(1)} />
                <img src="/assets/bowl.png" alt="View 3" className="thumbnail" onClick={() => setSelectedImage(2)} />
              </div>
            </div>

            {/* Product Info */}
            <div className="product-info-section">
              <h1>{product.name}</h1>
              
              <div className="rating-section">
                <div className="stars">
                  {"★".repeat(Math.floor(getAverageRating()))}
                  {"☆".repeat(5 - Math.floor(getAverageRating()))}
                </div>
                <span className="review-count">{reviews.length} reviews</span>
                <span className="verified">✓ Verified Seller</span>
              </div>

              <div className="price-section">
                <span className="current-price">₹{currentPrice}</span>
                <span className="original-price">₹{Math.round(product.priceValue * 1.2)}</span>
                <span className="discount-badge">Save {Math.round(product.priceValue * 0.2)}₹</span>
              </div>

              {/* ─── VARIANTS SELECTOR ─── */}
              {product.variants && product.variants.length > 0 && (
                <div className="variant-selector">
                  <label>Select Weight</label>
                  <div className="variant-options">
                    {product.variants.map((variant, idx) => (
                      <button
                        key={idx}
                        className={`variant-btn ${selectedVariant && selectedVariant.label === variant.label ? 'active' : ''}`}
                        onClick={() => setSelectedVariant(variant)}
                      >
                        {variant.label} - ₹{variant.price}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="certifications">
                <span className="cert-badge">✓ FSSAI Certified</span>
                <span className="cert-badge">✓ Organic Certified</span>
                <span className="cert-badge">✓ Lab Tested</span>
              </div>

              <div className="stock-status">
                {currentStock > 0 ? (
                  <span className="in-stock">✓ In Stock ({currentStock} units available)</span>
                ) : (
                  <span className="out-of-stock">✗ Out of Stock</span>
                )}
              </div>

              {currentStock > 0 && (
                <>
                  <div className="quantity-selector">
                    <label>Quantity:</label>
                    <div className="quantity-controls">
                      <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
                      <span>{quantity}</span>
                      <button onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}>+</button>
                    </div>
                    <span className="stock-info">{currentStock} units available</span>
                  </div>

                  <div className="action-buttons">
                    <button className="add-cart-btn" onClick={addToCart}>Add to Cart</button>
                    <button className="buy-now-btn" onClick={buyNow}>Buy Now</button>
                  </div>
                </>
              )}

              <div className="delivery-info">
                <div className="delivery-item">
                  <span className="delivery-icon">🚚</span>
                  <div>
                    <strong>Free Delivery</strong>
                    <p>On orders above ₹499</p>
                  </div>
                </div>
                <div className="delivery-item">
                  <span className="delivery-icon">🔄</span>
                  <div>
                    <strong>7-Day Return Policy</strong>
                    <p>Easy returns within 7 days</p>
                  </div>
                </div>
                <div className="delivery-item">
                  <span className="delivery-icon">💳</span>
                  <div>
                    <strong>Secure Payment</strong>
                    <p>100% safe checkout</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="product-tabs">
            <button className={`tab-btn ${activeTab === "description" ? "active" : ""}`} onClick={() => setActiveTab("description")}>Description</button>
            <button className={`tab-btn ${activeTab === "ingredients" ? "active" : ""}`} onClick={() => setActiveTab("ingredients")}>Ingredients</button>
            <button className={`tab-btn ${activeTab === "nutrition" ? "active" : ""}`} onClick={() => setActiveTab("nutrition")}>Nutrition</button>
            <button className={`tab-btn ${activeTab === "benefits" ? "active" : ""}`} onClick={() => setActiveTab("benefits")}>Benefits</button>
            <button className={`tab-btn ${activeTab === "usage" ? "active" : ""}`} onClick={() => setActiveTab("usage")}>How to Use</button>
            <button className={`tab-btn ${activeTab === "reviews" ? "active" : ""}`} onClick={() => setActiveTab("reviews")}>Reviews ({reviews.length})</button>
          </div>

          <div className="tab-content">
            {activeTab === "description" && (
              <div className="tab-pane">
                <p>{product.description}</p>
                <div className="info-grid">
                  <div><strong>Brand:</strong> {product.enhancedInfo?.brand}</div>
                  <div><strong>Origin:</strong> {product.enhancedInfo?.origin}</div>
                  <div><strong>Shelf Life:</strong> {product.enhancedInfo?.shelfLife}</div>
                  <div><strong>Weight:</strong> {product.enhancedInfo?.weight}</div>
                </div>
              </div>
            )}
            {activeTab === "ingredients" && (
              <div className="tab-pane">
                <ul className="ingredients-list">
                  {product.ingredients?.map((ing, i) => <li key={i}>✓ {ing}</li>)}
                </ul>
              </div>
            )}
            {activeTab === "nutrition" && (
              <div className="tab-pane">
                <table className="nutrition-table">
                  <tbody>
                    <tr><td>Calories</td><td>{product.nutritionalInfo?.calories}</td></tr>
                    <tr><td>Total Fat</td><td>{product.nutritionalInfo?.totalFat}</td></tr>
                    <tr><td>Sodium</td><td>{product.nutritionalInfo?.sodium}</td></tr>
                    <tr><td>Carbohydrates</td><td>{product.nutritionalInfo?.carbohydrates}</td></tr>
                    <tr><td>Sugars</td><td>{product.nutritionalInfo?.sugars}</td></tr>
                    <tr><td>Protein</td><td>{product.nutritionalInfo?.protein}</td></tr>
                    <tr><td>Iron</td><td>{product.nutritionalInfo?.iron}</td></tr>
                    <tr><td>Calcium</td><td>{product.nutritionalInfo?.calcium}</td></tr>
                  </tbody>
                </table>
              </div>
            )}
            {activeTab === "benefits" && (
              <div className="tab-pane">
                <div className="benefits-grid">
                  {product.healthBenefits?.map((benefit, i) => (
                    <div key={i} className="benefit-card">
                      <span className="benefit-icon">✨</span>
                      <p>{benefit}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {activeTab === "usage" && (
              <div className="tab-pane">
                <ul className="usage-list">
                  {product.usageInstructions?.map((instruction, i) => (
                    <li key={i}>
                      <span className="step-number">{i + 1}</span>
                      {instruction}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {activeTab === "reviews" && (
              <div className="tab-pane">
                <div className="reviews-summary">
                  <div className="avg-rating">
                    <div className="big-rating">{getAverageRating()}</div>
                    <div className="stars">{"★".repeat(Math.floor(getAverageRating()))}</div>
                    <div className="total-reviews">{reviews.length} reviews</div>
                  </div>
                  <div className="write-review">
                    <h3>Write a Review</h3>
                    <form onSubmit={submitReview}>
                      <input type="text" placeholder="Your Name" value={newReview.name} onChange={(e) => setNewReview({...newReview, name: e.target.value})} required />
                      <select value={newReview.rating} onChange={(e) => setNewReview({...newReview, rating: parseInt(e.target.value)})}>
                        <option value={5}>★★★★★ (5)</option>
                        <option value={4}>★★★★☆ (4)</option>
                        <option value={3}>★★★☆☆ (3)</option>
                        <option value={2}>★★☆☆☆ (2)</option>
                        <option value={1}>★☆☆☆☆ (1)</option>
                      </select>
                      <textarea placeholder="Your review..." rows="4" value={newReview.comment} onChange={(e) => setNewReview({...newReview, comment: e.target.value})} required />
                      <button type="submit">Submit Review</button>
                    </form>
                  </div>
                </div>
                <div className="reviews-list">
                  {reviews.map(review => (
                    <div key={review.id} className="review-item">
                      <div className="review-header">
                        <strong>{review.name}</strong>
                        {review.verified && <span className="verified-badge">✓ Verified Purchase</span>}
                        <div className="review-stars">{"★".repeat(review.rating)}</div>
                        <span className="review-date">{review.date}</span>
                      </div>
                      <p className="review-comment">{review.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div className="related-products">
              <h3>You May Also Like</h3>
              <div className="related-grid">
                {relatedProducts.map(related => (
                  <div key={related.id} className="related-card" onClick={() => navigate(`/product/${related.id}`)}>
                    <img src={related.image || "/assets/jaggery.png"} alt={related.name} />
                    <h4>{related.name}</h4>
                    <p>{related.price}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <WhatsApp />
      
      {showNotification && (
        <SuccessNotification 
          message={notificationMessage} 
          onClose={() => setShowNotification(false)}
        />
      )}

      {/* ─── STICKY ADD TO CART BAR ─── */}
      {currentStock > 0 && (
        <div className="sticky-add-to-cart">
          <div className="sticky-container">
            <div className="sticky-product-info">
              <img src={product.image} alt={product.name} className="sticky-product-image" />
              <div>
                <h4>{product.name}{selectedVariant ? ` (${selectedVariant.label})` : ''}</h4>
                <p className="sticky-price">₹{currentPrice}</p>
              </div>
            </div>
            <div className="sticky-actions">
              <div className="sticky-quantity">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
                <span>{quantity}</span>
                <button onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}>+</button>
              </div>
              <button className="sticky-add-btn" onClick={addToCart}>
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}
      
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
          animation: slideIn 0.3s ease;
          box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        }
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </>
  );
};

export default ProductDetails;