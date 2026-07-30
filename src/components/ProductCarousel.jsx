import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";
import { useCart } from "../context/CartContext";
import { supabase } from '../supabaseClient';
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import "./ProductCarousel.css";

const ProductCarousel = () => {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // ─── LOAD PRODUCTS FROM SUPABASE ───
  const loadProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('id', { ascending: true });

      if (error) {
        console.error('❌ Error fetching products:', error);
        setProducts([]);
        return;
      }

      if (data && data.length > 0) {
        const formatted = data.map(p => ({
          id: p.id,
          name: p.name,
          description: p.description,
          price: `₹${p.price}`,
          priceValue: p.price,
          image: p.image || `${process.env.PUBLIC_URL}/assets/jaggery.png`,
          stock: p.stock,
          category: p.category,
          badge: p.badge,
          variants: p.variants || [],
          soldCount: p.sold_count || 0
        }));
        setProducts(formatted);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error('❌ Error loading products:', err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // ─── REALTIME SUBSCRIPTION (add/edit/delete from admin reflects instantly) ───
  useEffect(() => {
    loadProducts();

    const subscription = supabase
      .channel('products-carousel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        () => loadProducts()
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // ─── HANDLERS ───
  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`);
  };

  const handleAddToCart = (product) => {
    addToCart(product, 1);
    const toast = document.createElement("div");
    toast.className = "carousel-cart-toast";
    toast.innerHTML = `✓ ${product.name} added to cart!`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  };

  const handleBuyNow = (product) => {
    addToCart(product, 1);
    setTimeout(() => {
      const user = localStorage.getItem("currentUser");
      if (!user) {
        localStorage.setItem("redirectAfterLogin", "/checkout");
        navigate("/login");
      } else {
        navigate("/checkout");
      }
    }, 100);
  };

  // ─── LOADING / EMPTY STATE ───
  if (loading) {
    return (
      <section className="product-carousel-section">
        <div className="product-carousel-header">
          <h2 className="product-carousel-title">Our Products</h2>
          <p className="product-carousel-subtitle">Loading products...</p>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return (
      <section className="product-carousel-section">
        <div className="product-carousel-header">
          <h2 className="product-carousel-title">Our Products</h2>
          <p className="product-carousel-subtitle">No products available at the moment.</p>
        </div>
      </section>
    );
  }

  // ─── REUSABLE CARD (same markup used in single-view and Swiper) ───
  const ProductCard = ({ product }) => (
    <div
      className="product-card"
      onClick={() => handleProductClick(product.id)}
    >
      {product.badge && (
        <span className={`carousel-tag carousel-tag-badge ${product.badge.toLowerCase()}`}>
          {product.badge}
        </span>
      )}
      <span className="carousel-tag carousel-tag-organic">🌿 Chemical-Free</span>

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
            onClick={(e) => {
              e.stopPropagation();
              handleAddToCart(product);
            }}
          >
            🛒 Add to Cart
          </button>
          <button
            className="product-btn buy-now-btn-small"
            onClick={(e) => {
              e.stopPropagation();
              handleBuyNow(product);
            }}
          >
            Buy Now
          </button>
        </div>
      )}
    </div>
  );

  const isSingleProduct = products.length === 1;
  // Swiper's centeredSlides only behaves correctly when slidesPerView is 1.
  // With 2-3 products the same problem can show up on wide screens, so we
  // render a plain centered flex grid instead of Swiper for small counts.
  const useSimpleGrid = products.length <= 3;

  return (
    <section className="product-carousel-section">
      <div className="product-carousel-header">
        <h2 className="product-carousel-title">Our Products</h2>
        <p className="product-carousel-subtitle">Shop the best quality jaggery powder</p>
      </div>

      {useSimpleGrid ? (
        <div className={`product-simple-grid ${isSingleProduct ? "single" : ""}`}>
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
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
              <ProductCard product={product} />
            </SwiperSlide>
          ))}
        </Swiper>
      )}

      <button className="view-all-products-btn" onClick={() => navigate("/products")}>
        View All Products →
      </button>
    </section>
  );
};

export default ProductCarousel;