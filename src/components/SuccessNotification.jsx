import React, { useEffect } from "react";
import "./SuccessNotification.css";

const SuccessNotification = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="success-notification">
      <div className="success-notification-content">
        <div className="success-icon">✓</div>
        <div className="success-message">
          <h4>Success!</h4>
          <p>{message}</p>
        </div>
        <button className="success-close" onClick={onClose}>×</button>
      </div>
    </div>
  );
};

export default SuccessNotification;