import React from "react";
import { Link } from "react-router-dom";
import "./AboutSection.css";

const AboutSection = () => {
  return (
    <section className="about-section" id="about">
      <div className="about-container">
        
        {/* LEFT IMAGE */}
        <div className="about-image" data-aos="fade-right">
          <div className="about-image-wrapper">
            <img
              src={`${process.env.PUBLIC_URL}/assets/about-us.png`}
              alt="About ELVRE"
              onError={(e) => {
                e.target.src = "/assets/jaggery.png";
              }}
            />
            <div className="about-image-badge">
              <span>✨ Since 2024</span>
            </div>
          </div>
        </div>

        {/* RIGHT CONTENT */}
        <div className="about-content" data-aos="fade-left">
          <span className="about-tag">About Us</span>
          <h2>Our Story</h2>
          <p className="about-subtitle">Pure, Organic & Traditional</p>
          <p className="about-text">
            At ELVRE, we believe in the power of nature. Our journey began with 
            a simple mission - to bring pure, organic jaggery from traditional 
            farms to your table. Made with love and care, our jaggery preserves 
            all the natural minerals and nutrients.
          </p>
          
          <div className="about-features">
            <div className="about-feature">
              <span>🌱</span>
              <div>
                <h4>100% Organic</h4>
                <p>No chemicals or preservatives</p>
              </div>
            </div>
            <div className="about-feature">
              <span>👨‍🌾</span>
              <div>
                <h4>Farmer Made</h4>
                <p>Directly from traditional farms</p>
              </div>
            </div>
          </div>

          <Link to="/our-story" className="about-btn">
            Read Our Story →
          </Link>
        </div>

      </div>
    </section>
  );
};

export default AboutSection;