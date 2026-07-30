import React from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import WhatsApp from "./WhatsApp";
import BackToTop from "./BackToTop";
import "./Blog.css";

const Blog = () => {
  return (
    <>
      <Navbar />
      <section className="blog-page">
        <div className="blog-hero" data-aos="fade-down">
          <h1>Our Blog</h1>
          <p>Discover the Goodness of Jaggery, Beyond Taste</p>
        </div>

        {/* Introduction Section - MOVED HERE from Our Story */}
        <div className="blog-introduction" data-aos="fade-up">
          <div className="intro-badge">OUR INTRODUCTION</div>
          <h2 className="intro-title">The Goodness of Jaggery, Beyond Taste</h2>
          <div className="intro-images">
            <img src={`${process.env.PUBLIC_URL}/assets/bowl.png`} alt="Jaggery bowl" className="intro-img" />
            <img src={`${process.env.PUBLIC_URL}/assets/man.png`} alt="Farmer" className="intro-img" />
            <img src={`${process.env.PUBLIC_URL}/assets/lady.png`} alt="Lady Farmer" className="intro-img" />
          </div>
          <p className="intro-description">
            Jaggery is a traditional, natural sweetener crafted from concentrated sugarcane or palm juice, 
            cherished for its rich flavor and remarkable health benefits. It is packed with essential minerals 
            such as iron, calcium, magnesium, and potassium, along with vital vitamins including A, C, D2, E, 
            and B-complex. Jaggery helps improve digestion, purify the blood, detoxify the liver, and boost 
            immunity. Its antioxidant and antiallergic properties support respiratory health, especially in 
            polluted environments. Providing steady, long-lasting energy, jaggery is suitable for all age groups. 
            A staple of both wellness and tradition, it's an ideal choice for those seeking a naturally 
            nourishing lifestyle.
          </p>
        </div>

        {/* How It's Made Section */}
        <div className="blog-howmade" data-aos="fade-up" data-aos-delay="200">
          <h2>How ELVRE is Made</h2>
          <p>
            ElVRE Jaggery is made using traditional methods with modern techniques. Fresh sugarcane is crushed 
            to get the juice, which is slowly boiled into jaggery syrup. The syrup is then dried and ground 
            into golden powder. Every step is done by farmers, using no chemicals or preservatives—just pure, 
            simple goodness.
          </p>
        </div>
      </section>
      <Footer />
      <WhatsApp />
      <BackToTop />
    </>
  );
};

export default Blog;