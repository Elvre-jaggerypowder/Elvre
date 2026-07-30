import React from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "./Navbar";
import "./OurStory.css";

const OurStory = () => {
  const navigate = useNavigate();

  return (
    <>
      <Navbar />
      <div className="our-story-page">
        <div className="our-story-container">
          
          {/* ===== BACK BUTTON ===== */}
          <button className="back-btn" onClick={() => navigate(-1)}>
            ← Back
          </button>

          {/* ===== HERO SECTION ===== */}
          <div className="story-hero">
            <div className="hero-badge">Our Story</div>
            <h1>From Chemical Engineer to <span>Health Movement</span></h1>
            <div className="hero-quote">
              <div className="quote-icon">"</div>
              <p>The best engineering protects people first.</p>
            </div>
          </div>

          {/* ===== FOUNDER SECTION ===== */}
          <div className="story-founder">
            <div className="founder-card">
              <div className="founder-avatar">
                <span>SS</span>
                <div className="avatar-ring"></div>
              </div>
              <div className="founder-info">
                <h2>Sanyam Singh</h2>
                <p className="founder-title">Chemical Process Engineer. Problem-Solver. Health Advocate.</p>
                <div className="founder-desc">
                  <p>
                    My journey began at <strong>Thapar Institute of Engineering and Technology</strong>, where I earned my degree in Chemical Engineering. 
                    Eager to bridge technical depth with strategic thinking, I later completed an <strong>Executive Management Program</strong> at the 
                    <strong>Indian Institute of Management Kashipur</strong>.
                  </p>
                  <p className="founder-highlight">
                    Engineering taught me how systems work. Management taught me how decisions scale.
                  </p>
                </div>
                <div className="founder-tags">
                  <span className="tag">🎓 Chemical Engineer</span>
                  <span className="tag">📈 IIM Kashipur</span>
                  <span className="tag">❤️ Health Advocate</span>
                </div>
              </div>
            </div>
          </div>

          {/* ===== STORY SECTION ===== */}
          <div className="story-content premium-card">
            <div className="story-number">01</div>
            <h2>The Lesson from a Jaggery Cube</h2>
            <p>
              Early in my career, I worked in a chemical manufacturing plant, surrounded by hazardous compounds every day. Along with our safety gear, 
              we were given jaggery cubes. The company strongly recommended jaggery powder in our daily diet.
            </p>
            <div className="story-highlight-box">
              <p>
                The reason was simple and passed down by generations: jaggery is traditionally believed to help cleanse the lungs and support 
                respiratory health for those exposed to pollutants and chemicals.
              </p>
            </div>
          </div>

          {/* ===== MISSION SECTION ===== */}
          <div className="story-mission premium-card">
            <div className="story-number">02</div>
            <h2>Our Mission</h2>
            <p>
              Our goal is simple: Help people shift from refined sugar to a cleaner, more natural alternative that supports long-term health 
              and well-being.
            </p>
            <p>
              Excessive refined sugar consumption is directly linked to lifestyle diseases like diabetes. We believe mindful alternatives 
              can create meaningful change — for individuals, families, and generations.
            </p>
            <div className="mission-highlight-box">
              <p className="mission-highlight">
                This is not just a product journey. It is a health movement rooted in science, tradition, and responsibility.
              </p>
            </div>
            <p className="mission-invite">And you're invited to be part of it.</p>
            <Link to="/products" className="join-movement-btn">
              Join the Movement →
            </Link>
          </div>

          {/* ============================================
              FOUNDER DETAILS SECTION
              ============================================ */}
          <div className="story-founder-details">
            <div className="founder-detail-card">
              <div className="detail-icon">🎓</div>
              <h3>Education</h3>
              <p>B.Tech Chemical Engineering</p>
              <span className="detail-institute">Thapar Institute</span>
              <p>Executive Management Program</p>
              <span className="detail-institute">IIM Kashipur</span>
            </div>
            <div className="founder-detail-card">
              <div className="detail-icon">🏭</div>
              <h3>Inspiration</h3>
              <p>Started in a chemical plant where workers were given jaggery daily to support lung health</p>
              <span className="detail-tag">🌿 Traditional Wisdom</span>
            </div>
            <div className="founder-detail-card">
              <div className="detail-icon">🌍</div>
              <h3>Vision</h3>
              <p>Revive jaggery in pure block and powder form</p>
              <p>Help people move from refined sugar to a cleaner, natural alternative</p>
              <span className="detail-tag">🚀 Health Movement</span>
            </div>
          </div>
          
          {/* ============================================
              BOTTOM CTA
              ============================================ */}
          <div className="story-cta">
            <h3>Ready to Make the Switch?</h3>
            <p>Join the movement towards a healthier, more natural lifestyle.</p>
            <Link to="/products" className="cta-btn">
              Explore Our Products →
            </Link>
          </div>

        </div>
      </div>
    </>
  );
};

export default OurStory;