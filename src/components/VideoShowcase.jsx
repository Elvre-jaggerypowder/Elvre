import React, { useState, useRef, useEffect } from "react";
import "./VideoShowcase.css";

const VideoShowcase = () => {
  const [playingStates, setPlayingStates] = useState({});
  const [videoErrors, setVideoErrors] = useState({});
  const videoRefs = useRef({});

  const videos = [
    {
      id: 1,
      file: "WhatsApp Video 2026-05-13 at 1.31.18 AM.mp4",
      title: "Traditional Jaggery Making",
      description: "Watch the age-old craft of pure jaggery preparation",
      duration: "0:45",
      views: "12.5K",
      category: "PROCESS"
    },
    {
      id: 2,
      file: "WhatsApp Video 2026-05-13 at 1.31.46 AM.mp4",
      title: "100% Chemical Free",
      description: "No preservatives, just pure sugarcane goodness",
      duration: "0:32",
      views: "8.2K",
      category: "QUALITY"
    },
    {
      id: 3,
      file: "WhatsApp Video 2026-05-13 at 1.34.12 AM.mp4",
      title: "Rich in Natural Minerals",
      description: "Iron, Calcium, Magnesium for better health",
      duration: "0:38",
      views: "15.7K",
      category: "BENEFITS"
    },
    {
      id: 4,
      file: "WhatsApp Video 2026-05-13 at 1.36.30 AM.mp4",
      title: "Farmer First Initiative",
      description: "Supporting local farming communities",
      duration: "0:52",
      views: "9.3K",
      category: "COMMUNITY"
    },
    {
      id: 5,
      file: "WhatsApp Video 2026-05-13 at 1.39.29 AM.mp4",
      title: "Premium Quality Promise",
      description: "Experience the ELVRE difference today",
      duration: "0:41",
      views: "21.4K",
      category: "PREMIUM"
    }
  ];

  const handleVideoError = (id) => {
    setVideoErrors(prev => ({ ...prev, [id]: true }));
  };

  const togglePlayPause = (id, e) => {
    e.stopPropagation();
    const video = videoRefs.current[id];
    if (!video) return;
    
    if (video.paused) {
      video.play().catch(err => {
        console.log("Play error:", err);
        setVideoErrors(prev => ({ ...prev, [id]: true }));
      });
      setPlayingStates(prev => ({ ...prev, [id]: true }));
    } else {
      video.pause();
      setPlayingStates(prev => ({ ...prev, [id]: false }));
    }
  };

  return (
    <section className="video-showcase-section">
      <div className="video-container">
        <div className="video-header" data-aos="fade-up">
          <span className="video-tag">✦ ELVRE EXPERIENCE ✦</span>
          <h2 className="video-title">Watch <span className="gradient-text">ELVRE</span> in Action</h2>
          <p className="video-subtitle">Discover the journey from farm to your table</p>
        </div>

        <div className="videos-grid">
          {videos.map((video, index) => (
            <div
              key={video.id}
              className="video-card"
              data-aos="fade-up"
              data-aos-delay={index * 100}
            >
              <div className="video-thumbnail-wrapper">
                {!videoErrors[video.id] ? (
                  <video
                    ref={el => videoRefs.current[video.id] = el}
                    className="video-element"
                    muted
                    playsInline
                    preload="metadata"
                    onError={() => handleVideoError(video.id)}
                    onClick={(e) => togglePlayPause(video.id, e)}
                  >
                    <source 
                      src={`${process.env.PUBLIC_URL}/videos/${encodeURIComponent(video.file)}`} 
                      type="video/mp4" 
                    />
                  </video>
                ) : (
                  <div className="video-placeholder">
                    <span>🎬</span>
                    <p>Video coming soon</p>
                  </div>
                )}

                {!playingStates[video.id] && !videoErrors[video.id] && (
                  <div className="play-overlay">
                    <button className="play-button" onClick={(e) => togglePlayPause(video.id, e)}>
                      <span>▶</span>
                    </button>
                  </div>
                )}

                <div className="category-badge">{video.category}</div>
                <div className="duration-badge">{video.duration}</div>
              </div>

              <div className="video-info">
                <h3 className="video-title-card">{video.title}</h3>
                <p className="video-description">{video.description}</p>
                <div className="video-stats">
                  <span className="views">👁️ {video.views} views</span>
                  <button className="watch-btn" onClick={(e) => togglePlayPause(video.id, e)}>
                    {playingStates[video.id] ? 'Pause' : 'Watch Now'} →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default VideoShowcase;