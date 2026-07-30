import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./AdminLogin.css";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Fixed credentials
  const ADMIN_EMAIL = "elvreofficals@gmail.com";
  const ADMIN_PASSWORD = "Elvre@2024";

  const handleSubmit = (e) => {
    e.preventDefault();
    
    console.log("Email entered:", email);
    console.log("Password entered:", password);
    console.log("Expected Email:", ADMIN_EMAIL);
    console.log("Expected Password:", ADMIN_PASSWORD);
    
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      console.log("Login successful!");
      localStorage.setItem("adminLoggedIn", "true");
      navigate("/admin-dashboard");
    } else {
      console.log("Login failed!");
      setError("Invalid email or password. Use: elvreofficals@gmail.com / Elvre@2024");
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <img 
          src={`${process.env.PUBLIC_URL}/assets/ELVRElogo1.png`} 
          alt="ELVRE Logo" 
          className="admin-login-logo"
        />
        <h2>Admin Login</h2>
        <p className="admin-login-subtitle">Manage Products & Inventory</p>
        
        {error && <div className="admin-login-error">{error}</div>}
        
        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="admin-form-group">
            <label>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter admin email"
              required
            />
          </div>
          
          <div className="admin-form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
          </div>
          
          <button type="submit" className="admin-login-btn">
            Login to Dashboard
          </button>
        </form>
        
        <p className="admin-login-note">
          <strong>Demo Credentials:</strong><br />
          Email: elvreofficals@gmail.com<br />
          Password: Elvre@2024
        </p>
        
        <Link to="/" className="back-to-site">← Back to Website</Link>
      </div>
    </div>
  );
};

export default AdminLogin;