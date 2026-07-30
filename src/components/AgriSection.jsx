import React from 'react';
import './AgriSection.css';

const ModernAgricultureSection = () => {
  return (
    <section className="modern-agriculture-section">
      {/* FULL SIZE IMAGE AT TOP - like hero section */}
      <div className="agri-image-full">
        <img 
          src={`${process.env.PUBLIC_URL}/assets/grass1.png`} 
          alt="Agriculture" 
          className="agri-grass-full"
        />
      </div>
      
      {/* CONTENT BELOW THE IMAGE */}
      <div className="agri-content-wrapper">
        <div className="agri-container">
          <div className="agri-content" data-aos="fade-up">
            <span className="agri-tag">✦ MODERN AGRICULTURE ✦</span>
            <h2 className="agri-heading">Providing High Quality Products</h2>
            <div className="agri-highlights">
              <div className="highlight-item">
                <span className="highlight-icon">🌱</span>
                <div>
                  <h4>100% Chemical Free</h4>
                  <p>No added colors or preservatives</p>
                </div>
              </div>
              <div className="highlight-item">
                <span className="highlight-icon">🏭</span>
                <div>
                  <h4>Technology Driven</h4>
                  <p>Modernizing traditional methods</p>
                </div>
              </div>
              <div className="highlight-item">
                <span className="highlight-icon">🌍</span>
                <div>
                  <h4>Sustainable Practices</h4>
                  <p>Eco-friendly production</p>
                </div>
              </div>
              <div className="highlight-item">
                <span className="highlight-icon">📦</span>
                <div>
                  <h4>Pan India Delivery</h4>
                  <p>Premium quality at affordable prices</p>
                </div>
              </div>
            </div>
            <p className="agri-description">
              At ELVRE, we are deeply committed to bringing you the authentic taste of jaggery powder, 
              crafted from fresh sugarcane juice. Our journey is driven by a passion to preserve tradition 
              while embracing innovation. Backed by a technology-driven team of professionals, we aim to 
              modernize the jaggery-making process, reducing its labor-intensive nature through strategic 
              collaborations with leading Indian institutes. We proudly offer high-quality, chemical-free 
              jaggery powder—with no added colors or preservatives—ensuring purity, taste, and nutrition 
              in every grain. Our sustainable, eco-friendly production practices, combined with a strong 
              distribution network across India, allow us to deliver premium quality at competitive and 
              affordable prices.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ModernAgricultureSection;