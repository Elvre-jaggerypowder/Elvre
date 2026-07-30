import React, { Suspense, lazy } from "react";
import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";

// ✅ Baki ke components ab 'lazy' load honge (jab scroll karenge tab aayenge)
const TalesSection = lazy(() => import("./components/TalesSection"));
const StatsCounter = lazy(() => import("./components/StatsCounter"));
const ProductCarousel = lazy(() => import("./components/ProductCarousel"));
const MadeSection = lazy(() => import("./components/MadeSection"));
const AgriSection = lazy(() => import("./components/AgriSection"));
const BenefitSection = lazy(() => import("./components/BenefitSection"));
const Testimonial = lazy(() => import("./components/Testimonial"));
const Contact = lazy(() => import("./components/Contact"));
const WhatsApp = lazy(() => import("./components/WhatsApp"));
const Footer = lazy(() => import("./components/Footer")); // ✅ Footer bhi add kar diya

const Home = () => {
  return (
    <>
      <Navbar />
      <HeroSection />

      {/* ✅ Suspense – jab tak component load ho, ye 'fallback' dikhega */}
      <Suspense
        fallback={
          <div
            style={{
              textAlign: "center",
              padding: "60px 20px",
              color: "#8B5E3C",
              fontSize: "1.2rem",
            }}
          >
            🌿 Loading organic goodness...
          </div>
        }
      >
        <TalesSection />
        <StatsCounter />
        <ProductCarousel />
        <MadeSection />
        <AgriSection />
        <BenefitSection />
        <Testimonial />
        <Contact />
        <WhatsApp />
      </Suspense>
    </>
  );
};

export default Home;