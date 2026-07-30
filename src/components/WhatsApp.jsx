// ============================================
// FILE: src/components/WhatsApp.jsx
// ============================================
import React from "react";
import "./WhatsApp.css";

function WhatsApp() {
  return (
    <a
      href="https://wa.me/917906396629"   // ✅ Fixed: Added country code 91
      target="_blank"
      rel="noopener noreferrer"
      className="whatsapp-button"
      aria-label="Chat on WhatsApp"
    >
      <img
        src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
        alt="WhatsApp"
        loading="lazy"
      />
    </a>
  );
}

export default WhatsApp;