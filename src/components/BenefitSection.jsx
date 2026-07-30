import React from "react";
import "./BenefitSection.css";

const BenefitSection = () => {
  const benefits = [
    {
      icon: "🛡️",
      title: "Immunity & Detox",
      description: "Natural antioxidants help boost immunity and detoxify the body. Rich in essential minerals for overall wellness."
    },
    {
      icon: "🌿",
      title: "Hormonal & Respiratory Health",
      description: "Supports hormonal balance and respiratory wellness naturally, as part of a traditional, mineral-rich diet."
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
          <span className="benefit-tag">✦ WHY ELVRE ✦</span>
          <h2>Why Choose <span>ELVRE</span></h2>
          <p>Nature's best for your wellness</p>
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