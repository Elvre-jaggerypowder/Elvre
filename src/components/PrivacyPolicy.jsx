import React from "react";
import "./PrivacyPolicy.css";

const PrivacyPolicy = () => {
  // Temporary static content until ContentContext is ready
  const content = `# Privacy Policy

## Information We Collect
We collect information you provide directly to us, such as when you create an account, make a purchase, or contact us.

## How We Use Your Information
We use your information to process orders, communicate with you, and improve our services.

## Data Security
We implement appropriate security measures to protect your personal information.

## Your Rights
You have the right to access, correct, or delete your personal information.

## Contact Us
For any privacy concerns, please contact us at elvreofficals@gmail.com`;

  return (
    <div className="privacy-container">
      <div className="privacy-content">
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

export default PrivacyPolicy;