import React from "react";
import "./BenefitSection.css";

const BenefitSection = () => {
  const benefits = [
    {
      icon: "🛡️",
      title: "Immunity & Detox",
      description: "Natural antioxidants help boost immunity and detoxify body. Rich in essential minerals for overall wellness."
    },
    {
      icon: "🌿",
      title: "Hormonal Respiratory",
      description: "Balances hormones and supports respiratory health. Helps maintain hormonal equilibrium naturally."
    },
    {
      icon: "⚡",
      title: "Boosts Energy Naturally",
      description: "Provides sustained energy without sugar crashes. Perfect for daily nutrition and vitality."
    }
  ];

  return (
    <section className="benefit-section">
      <div className="benefit-container">
        <div className="benefit-header">
          <h2>Why Choose <span>ELVRE</span></h2>
          <p>NATURE'S BEST FOR YOUR WELLNESS</p>
        </div>

        <div className="benefit-grid">
          {benefits.map((benefit, index) => (
            <div key={index} className="benefit-card">
              <div className="benefit-icon">{benefit.icon}</div>
              <h3>{benefit.title}</h3>
              <div className="benefit-line"></div>
              <p>{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BenefitSection;