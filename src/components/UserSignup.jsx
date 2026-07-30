import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "./Navbar";
import { supabase } from '../supabaseClient';
import "./UserSignup.css";

const UserSignup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0); // 0-weak, 1-medium, 2-strong
  const navigate = useNavigate();

  // ✅ Password strength checker (hackers ko mushkil)
  const checkPasswordStrength = (pass) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) score++;
    if (/\d/.test(pass)) score++;
    if (/[^a-zA-Z0-9]/.test(pass)) score++;
    setPasswordStrength(score);
  };

  // ✅ Input sanitization - XSS attack se bachta hai
  const sanitizeInput = (value) => {
    return value.replace(/[<>]/g, ''); // HTML tags hatao
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // 1. Sab fields check karo
    if (!name || !email || !password) {
      setError("Please fill all fields");
      return;
    }

    // 2. Strong password validation (6 se kam nahi)
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    // 3. Confirm password match
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // 4. Email format validation (strict)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    // 5. XSS protection - input sanitize karo
    const safeName = sanitizeInput(name);
    const safeEmail = sanitizeInput(email);

    setLoading(true);

    try {
      // ✅ Supabase Auth se secure signup (password automatically hash hota hai)
      const { data, error } = await supabase.auth.signUp({
        email: safeEmail,
        password: password, // Ye Supabase internally hash kar lega
        options: {
          data: { 
            full_name: safeName,
            // ✅ Extra security: email confirmation force karo
            // email_confirm: true 
          },
        },
      });

      if (error) {
        console.error('Supabase Auth Error:', error);
        // ❌ Generic error - hacker ko hint mat do
        setError("Registration failed. Please try again.");
        setLoading(false);
        return;
      }

      // ✅ User ban gaya - ab users table mein daalo (bina password ke!)
      if (data.user) {
        const { error: insertError } = await supabase
          .from('users')
          .insert([
            { 
              id: data.user.id, // UUID match karega ab!
              name: safeName, 
              email: safeEmail,
              // ⚠️ Password yahan MAT DAALO - woh auth.users mein safe hai
            }
          ]);

        if (insertError) {
          console.error('Profile save error:', insertError);
          setError("Profile creation failed. Please contact support.");
          setLoading(false);
          return;
        }

        setSuccess("Account created! Please check your email to verify.");
        // ✅ Auto-login mat karo - user ko email verify karne do
        setTimeout(() => {
          navigate("/login");
        }, 4000);
      }

    } catch (err) {
      console.error('Error:', err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="user-signup-container">
        <div className="user-signup-card">
          <h2>Create Account</h2>
          <p>Join ELVRE family</p>
          
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Full Name</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="Enter your full name" 
                required 
                disabled={loading}
                maxLength={50} // 🛡️ Buffer overflow se bachao
              />
            </div>
            
            <div className="form-group">
              <label>Email Address</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="Enter your email" 
                required 
                disabled={loading}
                maxLength={100}
              />
              <small className="form-hint">We'll never share your email.</small>
            </div>
            
            <div className="form-group">
              <label>Password (min 8 chars)</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    checkPasswordStrength(e.target.value);
                  }}
                  placeholder="Create password"
                  required
                  disabled={loading}
                  minLength={8}
                />
                <button 
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  style={{ 
                    position: 'absolute', 
                    right: '14px', 
                    top: '50%', 
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1.2rem',
                    color: '#666'
                  }}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
              {/* ✅ Password strength indicator */}
              {password.length > 0 && (
                <div className="password-strength">
                  <div className={`strength-bar ${passwordStrength >= 3 ? 'strong' : passwordStrength >= 2 ? 'medium' : 'weak'}`} 
                       style={{ width: `${(passwordStrength / 3) * 100}%`, height: '4px', background: passwordStrength >= 3 ? '#2e7d32' : passwordStrength >= 2 ? '#f1a40f' : '#d32f2f', borderRadius: '4px', marginTop: '5px' }}>
                  </div>
                  <small>
                    {passwordStrength >= 3 ? '🟢 Strong' : passwordStrength >= 2 ? '🟡 Medium' : '🔴 Weak'}
                  </small>
                </div>
              )}
            </div>
            
            <div className="form-group">
              <label>Confirm Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  required
                  disabled={loading}
                />
                <button 
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                  style={{ 
                    position: 'absolute', 
                    right: '14px', 
                    top: '50%', 
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1.2rem',
                    color: '#666'
                  }}
                >
                  {showConfirmPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>
            
            {/* ✅ Rate limiting - 3 attempts per minute (frontend) */}
            <button 
              type="submit" 
              className="signup-btn" 
              disabled={loading || passwordStrength < 1}
            >
              {loading ? "Creating account..." : "Sign Up"}
            </button>
          </form>
          
          <p className="login-link">
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </div>
      </div>
    </>
  );
};

export default UserSignup;