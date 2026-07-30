import React from "react";
import "./TermsAndConditions.css";

const TermsAndConditions = () => {
  // Temporary static content until ContentContext is ready
  const content = `# Terms & Conditions

## 1. Introduction
Welcome to ELVRE. By accessing or using our website, you agree to be bound by these Terms & Conditions.

## 2. Products & Pricing
All products are subject to availability. We reserve the right to modify product prices without prior notice.

## 3. Shipping & Delivery
We ship across India. Delivery times typically range from 3-7 business days depending on location.

## 4. Returns & Refunds
If you're not satisfied with your purchase, please contact us within 7 days of delivery for a refund or replacement.

## 5. Privacy Policy
We value your privacy. Your personal information is used only for order processing and will never be shared with third parties.

## 6. Contact Us
Email: elvreofficals@gmail.com
Phone: +91-7060998050`;

  return (
    <div className="terms-container">
      <div className="terms-content">
        {content.split('\n').map((line, index) => {
          if (line.startsWith('# ')) {
            return <h1 key={index}>{line.substring(2)}</h1>;
          }
          if (line.startsWith('## ')) {
            return <h2 key={index}>{line.substring(3)}</h2>;
          }
          if (line.startsWith('- ')) {
            return <li key={index}>{line.substring(2)}</li>;
          }
          if (line.trim() === '') {
            return <br key={index} />;
          }
          return <p key={index}>{line}</p>;
        })}
      </div>
    </div>
  );
};

export default TermsAndConditions;