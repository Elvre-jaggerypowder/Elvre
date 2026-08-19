import React, { useState, useEffect } from "react";
import { supabase } from '../supabaseClient';
import "./Contact.css";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    message: "",
    category: "general",
    rating: 5
  });
  const [status, setStatus] = useState("");
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // ─── CONTACT INFO STATE (dynamic, not hardcoded) ───
  const [contactInfo, setContactInfo] = useState({
    phone1: "",
    phone2: "",
    email: "",
    address: ""
  });
  const [infoLoading, setInfoLoading] = useState(true);

  const categories = [
    { value: "general", label: "General Feedback", icon: "💬" },
    { value: "product", label: "Product Quality", icon: "🛍️" },
    { value: "delivery", label: "Delivery Experience", icon: "🚚" },
    { value: "customer_service", label: "Customer Service", icon: "🤝" },
    { value: "website", label: "Website Experience", icon: "💻" },
    { value: "suggestion", label: "Suggestion / Idea", icon: "💡" }
  ];

  // ─── LOAD CONTACT INFO (localStorage → Supabase) ───
  const loadContactInfo = async () => {
    setInfoLoading(true);
    try {
      // 1️⃣ First try localStorage (fast, reflects admin updates)
      const local = localStorage.getItem("contactInfo");
      if (local) {
        try {
          const parsed = JSON.parse(local);
          setContactInfo(parsed);
          setInfoLoading(false);
          return;
        } catch (e) {
          console.error("Error parsing localStorage contact info:", e);
        }
      }

      // 2️⃣ If no localStorage, fetch from Supabase
      const { data, error } = await supabase
        .from('contact_info')
        .select('*')
        .limit(1);

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching contact info:', error);
        // fallback to default
        setDefaultContact();
        setInfoLoading(false);
        return;
      }

      if (data && data.length > 0) {
        const info = data[0];
        const loaded = {
          phone1: info.phone1 || "",
          phone2: info.phone2 || "",
          email: info.email || "",
          address: info.address || ""
        };
        setContactInfo(loaded);
        localStorage.setItem("contactInfo", JSON.stringify(loaded));
      } else {
        // 3️⃣ No data in Supabase → use defaults
        setDefaultContact();
      }
    } catch (err) {
      console.error("Error loading contact info:", err);
      setDefaultContact();
    } finally {
      setInfoLoading(false);
    }
  };

  const setDefaultContact = () => {
    const defaultInfo = {
      phone1: "+91 7060998050",
      phone2: "+91 7906396629",
      email: "elvreofficals@gmail.com",
      address: "1st Floor, Sangam Tent House, Jawalapur, Haridwar, Uttrakhand, 249407"
    };
    setContactInfo(defaultInfo);
    localStorage.setItem("contactInfo", JSON.stringify(defaultInfo));
  };

  useEffect(() => {
    loadContactInfo();
    loadFeedbacks();

    // ─── Realtime feedback subscription ───
    const subscription = supabase
      .channel('contact-feedbacks')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'Feedbacks' },
        (payload) => {
          console.log('📬 New feedback received:', payload.new);
          setFeedbacks(prev => [payload.new, ...prev]);
          const cached = JSON.parse(localStorage.getItem("feedbacks") || "[]");
          localStorage.setItem("feedbacks", JSON.stringify([payload.new, ...cached]));
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // ─── LOAD FEEDBACKS ───
  const loadFeedbacks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('Feedbacks')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) {
        console.error('Supabase error:', error);
        const cached = JSON.parse(localStorage.getItem("feedbacks") || "[]");
        setFeedbacks(cached);
      } else if (data && data.length > 0) {
        setFeedbacks(data);
        localStorage.setItem("feedbacks", JSON.stringify(data));
      } else {
        const cached = JSON.parse(localStorage.getItem("feedbacks") || "[]");
        setFeedbacks(cached);
      }
    } catch (err) {
      console.error('Error loading feedbacks:', err);
      const cached = JSON.parse(localStorage.getItem("feedbacks") || "[]");
      setFeedbacks(cached);
    }
    setLoading(false);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRating = (rating) => {
    setFormData({ ...formData, rating });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.message) {
      setStatus("❌ Please fill your name and message");
      setTimeout(() => setStatus(""), 3000);
      return;
    }

    const newFeedback = {
      name: formData.name,
      message: formData.message,
      category: formData.category,
      rating: formData.rating,
      created_at: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase
        .from('Feedbacks')
        .insert([newFeedback]);
      
      if (error) {
        console.error('❌ Supabase insert error:', error);
        // Fallback to localStorage
        const cached = JSON.parse(localStorage.getItem("feedbacks") || "[]");
        const fake = { id: Date.now(), ...newFeedback };
        localStorage.setItem("feedbacks", JSON.stringify([fake, ...cached]));
        setFeedbacks(prev => [fake, ...prev]);
        setStatus("⚠️ Saved locally (Supabase error)");
        setTimeout(() => setStatus(""), 4000);
        return;
      }
      
      console.log('✅ Feedback saved to Supabase!', data);
      setFeedbacks(prev => [{ id: Date.now(), ...newFeedback }, ...prev]);
      setFormData({ name: "", message: "", category: "general", rating: 5 });
      setStatus("✅ Thank you! Your feedback has been submitted.");
      setTimeout(() => setStatus(""), 3000);
    } catch (err) {
      console.error('❌ Unexpected error:', err);
      setStatus("❌ Something went wrong. Please try again.");
      setTimeout(() => setStatus(""), 3000);
    }
  };

  if (infoLoading) {
    return <div className="contact-loading">Loading contact info...</div>;
  }

  return (
    <section className="contact-section" id="contact">
      <div className="contact-container">
        <div className="contact-header">
          <h2>Share Your Feedback</h2>
          <p>YOUR OPINION MATTERS TO US</p>
        </div>

        <div className="contact-grid">
          <div className="contact-info">
            <h3>Get in Touch</h3>
            <p className="contact-info-sub">We'd love to hear from you</p>
            <div className="contact-info-items">
              <div className="contact-info-item">
                <div className="contact-info-icon">📞</div>
                <div>
                  <h4>Phone</h4>
                  <p className="contact-phone">{contactInfo.phone1}</p>
                  {contactInfo.phone2 && <p className="contact-phone">{contactInfo.phone2}</p>}
                </div>
              </div>
              <div className="contact-info-item">
                <div className="contact-info-icon">✉️</div>
                <div>
                  <h4>Email</h4>
                  <p className="contact-email">{contactInfo.email}</p>
                </div>
              </div>
              <div className="contact-info-item">
                <div className="contact-info-icon">📍</div>
                <div>
                  <h4>Address</h4>
                  <p className="contact-address">{contactInfo.address}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="contact-form">
            <h3>Share Your Experience</h3>
            <p className="form-subtitle">Help us serve you better</p>

            <form onSubmit={handleSubmit}>
              <div className="form-group rating-group">
                <label>How was your experience? <span className="required">*</span></label>
                <div className="rating-stars">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={`star-btn ${star <= formData.rating ? "active" : ""}`}
                      onClick={() => handleRating(star)}
                    >
                      {star <= formData.rating ? "⭐" : "☆"}
                    </button>
                  ))}
                  <span className="rating-label">
                    {formData.rating === 1 && "😔 Needs Improvement"}
                    {formData.rating === 2 && "😕 Could be better"}
                    {formData.rating === 3 && "😐 Average"}
                    {formData.rating === 4 && "😊 Good"}
                    {formData.rating === 5 && "🌟 Excellent"}
                  </span>
                </div>
              </div>

              <div className="form-group">
                <label>Feedback Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="category-select"
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.icon} {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Your Name <span className="required">*</span></label>
                <input
                  type="text"
                  name="name"
                  placeholder="Enter your name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Your Message <span className="required">*</span></label>
                <textarea
                  name="message"
                  placeholder="What did you like or what can we improve?"
                  rows="4"
                  value={formData.message}
                  onChange={handleChange}
                  required
                ></textarea>
              </div>

              <button type="submit" className="submit-btn">
                Send Feedback
              </button>
            </form>

            {status && <p className="form-status">{status}</p>}

            <div className="secure-note">
              <p>🔒 Your data is safe with us. We value your privacy.</p>
            </div>
          </div>
        </div>

        {feedbacks.length > 0 && (
          <div className="recent-feedbacks">
            <h3>Recent Feedback</h3>
            <div className="feedback-list">
              {feedbacks.slice(0, 3).map((fb) => (
                <div key={fb.id || fb.created_at} className="feedback-item">
                  <div className="feedback-item-header">
                    <div>
                      <strong>{fb.name}</strong>
                      <span className="feedback-rating">
                        {"⭐".repeat(fb.rating || 5)}
                      </span>
                    </div>
                    <span className="feedback-date">
                      {fb.created_at ? new Date(fb.created_at).toLocaleDateString() : ''}
                    </span>
                  </div>
                  <p className="feedback-message">{fb.message}</p>
                  {fb.category && (
                    <span className="feedback-category">
                      {categories.find(c => c.value === fb.category)?.icon || "💬"} {fb.category}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default Contact;