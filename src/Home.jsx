import React from "react";
import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import StatsCounter from "./components/StatsCounter";
import ProductCarousel from "./components/ProductCarousel";
import MadeSection from "./components/MadeSection";
import AgriSection from "./components/AgriSection";
import BenefitSection from "./components/BenefitSection";
import Testimonial from "./components/Testimonial";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import WhatsApp from "./components/WhatsApp";
// ✅ New component imported
import TalesSection from "./components/TalesSection";

const Home = () => {
  return (
    <>
      <Navbar />
      <HeroSection />
      <TalesSection />
      <StatsCounter />
      <ProductCarousel />
      <MadeSection />
      <AgriSection />
      <BenefitSection />
      <Testimonial />
      <Contact />
      <WhatsApp />
    </>
  );
};

export default Home;