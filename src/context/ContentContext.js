import React, { createContext, useState, useContext, useEffect } from "react";

const ContentContext = createContext();

export const useContent = () => useContext(ContentContext);

export const ContentProvider = ({ children }) => {
  const [websiteContent, setWebsiteContent] = useState({
    // Hero Section
    heroTitle: "Cane Jaggery Products",
    heroSubtitle: "Handcrafted by Farmers",
    heroButtonText: "Book Now",
    
    // About Section
    aboutTitle: "Our Story",
    aboutText: "At ELVRE, we believe in the power of nature. Our journey began with a simple mission - to bring pure, organic jaggery from traditional farms to your table.",
    
    // Products Section
    productsTitle: "Our Products",
    productsSubtitle: "Shop the best quality jaggery powder",
    
    // Footer
    footerCopyright: "©Elvre Enterprises Private Limited. All Rights Reserved.",
    footerEmail: "elvreofficals@gmail.com",
    
    // Contact Info
    contactPhone: "+91-7916396629",
    contactEmail: "elvreofficals@gmail.com",
    contactAddress: "ELVRE Enterprises, India",
    
    // Terms & Conditions
    termsContent: `# Terms & Conditions

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
Phone: +91-7916396629`,
    
    // Privacy Policy
    privacyContent: `# Privacy Policy

## Information We Collect
We collect information you provide directly to us, such as when you create an account, make a purchase, or contact us.

## How We Use Your Information
We use your information to process orders, communicate with you, and improve our services.

## Data Security
We implement appropriate security measures to protect your personal information.

## Your Rights
You have the right to access, correct, or delete your personal information.

## Contact Us
For any privacy concerns, please contact us at elvreofficals@gmail.com`,
    
    // Social Links
    socialFacebook: "https://www.facebook.com/profile.php?id=61579641740801",
    socialInstagram: "https://www.instagram.com/elvre_officals_/",
    socialWhatsapp: "https://wa.me/917906396629",
    socialLinkedin: "https://www.linkedin.com/company/elvre-enterprised-private-limited/",
    
    // Shipping Info
    freeShippingThreshold: 499,
    shippingCharge: 40,
    returnPolicy: "7-Day Easy Returns",
    
    // SEO
    metaTitle: "ELVRE - Pure Organic Jaggery",
    metaDescription: "Buy pure organic jaggery powder online. Chemical-free, natural sweetener made with traditional methods.",
    metaKeywords: "jaggery, organic jaggery, natural sweetener, elvre"
  });

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = () => {
    const savedContent = localStorage.getItem("websiteContent");
    if (savedContent) {
      setWebsiteContent(JSON.parse(savedContent));
    } else {
      localStorage.setItem("websiteContent", JSON.stringify(websiteContent));
    }
  };

  const updateContent = (key, value) => {
    const updatedContent = { ...websiteContent, [key]: value };
    setWebsiteContent(updatedContent);
    localStorage.setItem("websiteContent", JSON.stringify(updatedContent));
  };

  const updateTermsContent = (content) => {
    updateContent("termsContent", content);
  };

  const updatePrivacyContent = (content) => {
    updateContent("privacyContent", content);
  };

  return (
    <ContentContext.Provider value={{
      websiteContent,
      updateContent,
      updateTermsContent,
      updatePrivacyContent
    }}>
      {children}
    </ContentContext.Provider>
  );
};