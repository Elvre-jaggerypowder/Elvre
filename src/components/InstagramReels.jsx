import React, { useState, useEffect } from "react";
import "./InstagramReels.css";

const InstagramReels = () => {
  const [loaded, setLoaded] = useState(false);

  // Your 5 Instagram Reel URLs
  const reels = [
    {
      id: 1,
      url: "https://www.instagram.com/reel/DYFXSW7Sd4S/",
      embedUrl: "https://www.instagram.com/reel/DYFXSW7Sd4S/embed",
      caption: "Foodie meets fitness - Balanced eating with ELVRE Jaggery",
      badge: "🌿 Lifestyle"
    },
    {
      id: 2,
      url: "https://www.instagram.com/reel/DU3G8CJkkct/",
      embedUrl: "https://www.instagram.com/reel/DU3G8CJkkct/embed",
      caption: "Slow mornings with chemical-free sweetness",
      badge: "☀️ Morning"
    },
    {
      id: 3,
      url: "https://www.instagram.com/reel/DXyBYRhxeuP/",
      embedUrl: "https://www.instagram.com/reel/DXyBYRhxeuP/embed",
      caption: "Must try this product! Customer love",
      badge: "❤️ Testimonial"
    },
    {
      id: 4,
      url: "https://www.instagram.com/reel/DUkL-JiEVPp/",
      embedUrl: "https://www.instagram.com/reel/DUkL-JiEVPp/embed",
      caption: "Handcrafted jaggery - Rich in iron, magnesium & potassium",
      badge: "✨ Benefits"
    },
    {
      id: 5,
      url: "https://www.instagram.com/reel/DUkL-JiEVPp/",
      embedUrl: "https://www.instagram.com/reel/DUkL-JiEVPp/embed",
      caption: "Switch to sweetness that actually gives back",
      badge: "🛒 Shop"
    }
  ];

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="instagram-reels-section">
      <div className="reels-container">
        <div className="reels-header" data-aos="fade-up">
          <span className="reels-tag">✦ FOLLOW OUR JOURNEY ✦</span>
          <h2 className="reels-title">As Seen On <span className="insta-gradient">Instagram</span></h2>
          <p className="reels-subtitle">
            Real stories from real people loving ELVRE Jaggery
          </p>
        </div>

        {!loaded ? (
          <div className="reels-loading">
            <div className="loading-spinner"></div>
          </div>
        ) : (
          <div className="reels-grid">
            {reels.map((reel, index) => (
              <div 
                className="reel-card" 
                key={reel.id}
                data-aos="zoom-in"
                data-aos-delay={index * 100}
              >
                <div className="reel-wrapper">
                  <div className="reel-badge">{reel.badge}</div>
                  <iframe
                    className="reel-frame"
                    src={reel.embedUrl}
                    title={`Instagram Reel ${reel.id}`}
                    frameBorder="0"
                    allowFullScreen
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                </div>
                <div className="reel-caption">
                  <a href={reel.url} target="_blank" rel="noopener noreferrer">
                    @elvre.farmessence
                  </a>
                  <span>{reel.caption}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="reels-footer" data-aos="fade-up">
          <a 
            href="https://www.instagram.com/elvre_officals_/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="follow-btn"
          >
            <span>📸</span> Follow @elvre_officals_ on Instagram
          </a>
        </div>
      </div>
    </section>
  );
};

export default InstagramReels;