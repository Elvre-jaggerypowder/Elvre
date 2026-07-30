import React, { useState, useEffect, useRef } from "react";
import { supabase } from '../supabaseClient';
import "./Testimonial.css";

const Testimonial = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);

  useEffect(() => {
    loadFeedbacks();

    const subscription = supabase
      .channel('testimonial-feedbacks')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'Feedbacks' },
        (payload) => {
          console.log('📬 New testimonial feedback:', payload.new);
          setFeedbacks(prev => {
            const updated = [payload.new, ...prev];
            return updated.slice(0, 10);
          });
          setCurrentIndex(0);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadFeedbacks = async () => {
    setLoading(true);
    try {
      // Use '*' to avoid column mismatch
      const { data, error } = await supabase
        .from('Feedbacks')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Supabase error:', error);
        const cached = JSON.parse(localStorage.getItem("feedbacks") || "[]");
        setFeedbacks(cached);
      } else if (data && data.length > 0) {
        setFeedbacks(data);
        localStorage.setItem("feedbacks", JSON.stringify(data));
      } else {
        const demo = [
          {
            id: 1,
            name: "Deepankar",
            rating: 5,
            message: "Best Taste, Best Quality, totally trustable company!!",
            created_at: new Date().toISOString()
          },
          {
            id: 2,
            name: "Savnoor Singh",
            rating: 5,
            message: "A great idea! It was the need of hour. One step forward to healthy life.",
            created_at: new Date().toISOString()
          }
        ];
        setFeedbacks(demo);
        localStorage.setItem("feedbacks", JSON.stringify(demo));
      }
    } catch (err) {
      console.error('Error loading feedbacks:', err);
      const cached = JSON.parse(localStorage.getItem("feedbacks") || "[]");
      setFeedbacks(cached);
    }
    setLoading(false);
  };

  const total = feedbacks.length;
  const current = feedbacks[currentIndex] || { name: "", message: "", rating: 0 };

  useEffect(() => {
    if (total === 0) return;
    startAutoSlide();
    return () => clearInterval(intervalRef.current);
  }, [total]);

  const startAutoSlide = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % total);
    }, 5000);
  };

  const goNext = () => {
    clearInterval(intervalRef.current);
    setCurrentIndex((prev) => (prev + 1) % total);
    startAutoSlide();
  };

  const goPrev = () => {
    clearInterval(intervalRef.current);
    setCurrentIndex((prev) => (prev - 1 + total) % total);
    startAutoSlide();
  };

  const goTo = (index) => {
    clearInterval(intervalRef.current);
    setCurrentIndex(index);
    startAutoSlide();
  };

  const handleFeedbackClick = () => {
    const contactSection = document.getElementById("contact");
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  if (loading) {
    return <div className="testimonial-loading">Loading...</div>;
  }

  return (
    <section
      className="testimonial-hero"
      id="testimonial"
      style={{
        backgroundImage: `url(${process.env.PUBLIC_URL}/assets/testimonial-bg.jpg)`
      }}
    >
      <div className="testimonial-overlay">
        <div className="testimonial-content">
          <div className="testimonial-right">
            <div className="testimonial-card-wrapper">
              <p className="testimonial-tagline">Pure by Nature, Trusted by You.</p>
              <h2 className="testimonial-heading">OUR TESTIMONIALS</h2>
              <p className="testimonial-subheading">What They’re Talking About</p>

              <div className="testimonial-card">
                <div className="quote-icon">❝</div>
                <p className="testimonial-message">{current.message}</p>
                <div className="testimonial-user">
                  <div className="user-avatar">
                    {current.name?.charAt(0) || "A"}
                  </div>
                  <div>
                    <h4>{current.name}</h4>
                    <div className="stars">
                      {"★".repeat(current.rating || 5)}{"☆".repeat(5 - (current.rating || 5))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="slider-controls">
                <div className="slider-dots">
                  {feedbacks.map((_, idx) => (
                    <span
                      key={idx}
                      className={`dot ${idx === currentIndex ? "active" : ""}`}
                      onClick={() => goTo(idx)}
                    />
                  ))}
                </div>
                <p className="counter">
                  {currentIndex + 1} / {total}
                </p>
              </div>

              <button className="testimonial-cta-btn" onClick={handleFeedbackClick}>
                Share Your Feedback
              </button>
              <p className="cta-subtext">YOUR OPINION MATTERS TO US</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonial;