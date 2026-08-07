import './HeroSection.css';
import { Link } from 'react-router-dom';

function HeroSection() {
  return (
    <section id="hero" className="hero-section">
      <div className="image-slider">
        <img
          src={`${process.env.PUBLIC_URL}/assets/newproduct.png`}
          className="hero-product-image"
          alt="ELVRE Jaggery Product"
        />
        
        {/* Floating Text 1 - Top Left */}
        <div className="hero-tagline">
          <h2 className="tagline-title">Keeps Digestion</h2>
          <h2 className="tagline-title1">Smooth</h2>
        </div>

        {/* Floating Text 2 - Bottom Left */}
        <div className="hero-tagline1">
          <h2 className="tagline-title3">Rich in</h2>
          <h2 className="tagline-title2">Minerals &amp; Vitamins</h2>
        </div>

        {/* Floating Text 3 - Right Side */}
        <div className="product-highlight">
          <h2 className="highlight-text">A Natural source</h2>
          <h2 className="highlight-text1">of Energy</h2>
        </div>
      </div>

      <Link to="/products">
        <button className="buy-now-btn" data-aos="zoom-in" data-aos-delay="500">
          🛒 Order Now
        </button>
      </Link>
    </section>
  );
}

export default HeroSection;