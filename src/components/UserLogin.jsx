import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import { supabase } from "../supabaseClient";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "./UserLogin.css";

// ─── Google button row ───────────────────────────────
const SocialRow = ({ socialLoading, onSocial }) => (
  <>
    <div className="auth-divider">
      <span>or continue with</span>
    </div>
    <div className="auth-social-row">
      <button
        type="button"
        className="auth-social-btn"
        onClick={() => onSocial("google")}
        disabled={socialLoading.google}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        {socialLoading.google ? "Loading..." : "Google"}
      </button>
    </div>
  </>
);

// ─── Decorative branch motif ─────────────────────────
const BranchMotif = ({ animKey }) => (
  <svg key={animKey} className="auth-branch-svg" viewBox="0 0 150 150" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 130 C 40 100, 45 80, 40 55 C 55 65, 70 60, 75 40 C 85 55, 100 55, 110 35" />
    <path d="M40 55 C 30 45, 25 35, 30 22" />
    <path d="M75 40 C 82 28, 95 24, 105 15" />
    <circle cx="30" cy="22" r="4" />
    <circle cx="105" cy="15" r="4" />
    <circle cx="110" cy="35" r="3.2" />
  </svg>
);

const LOGIN_BLOCK_KEY = "loginBlockUntil";
const LOGIN_ATTEMPTS_KEY = "loginAttempts";

const UserLogin = () => {
  const [mode, setMode] = useState("login");
  const [animKey, setAnimKey] = useState(0);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");

  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirm, setShowSignupConfirm] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState({ google: false });

  const [loginAttempts, setLoginAttempts] = useState(() => Number(localStorage.getItem(LOGIN_ATTEMPTS_KEY)) || 0);
  const [isBlocked, setIsBlocked] = useState(() => {
    const until = Number(localStorage.getItem(LOGIN_BLOCK_KEY));
    return !!until && until > Date.now();
  });

  const [resetMessage, setResetMessage] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const navigate = useNavigate();

  // ─── ✅ FIXED: Admin credentials (fallback + env override) ───
  const ADMIN_EMAIL = process.env.REACT_APP_ADMIN_EMAIL || "elvreofficals@gmail.com";
  const ADMIN_PASSWORD = process.env.REACT_APP_ADMIN_PASSWORD || "Elvre@2024";

  // Auto-unblock once the 5-minute window (persisted in localStorage) has passed.
  useEffect(() => {
    if (!isBlocked) return;
    const until = Number(localStorage.getItem(LOGIN_BLOCK_KEY));
    const remaining = until - Date.now();
    const clearBlock = () => {
      setIsBlocked(false);
      setLoginAttempts(0);
      localStorage.removeItem(LOGIN_BLOCK_KEY);
      localStorage.removeItem(LOGIN_ATTEMPTS_KEY);
    };
    if (remaining <= 0) {
      clearBlock();
      return;
    }
    const timer = setTimeout(clearBlock, remaining);
    return () => clearTimeout(timer);
  }, [isBlocked]);

  // Session timeout for regular users while sitting on this page
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localStorage.getItem("currentUser") && !localStorage.getItem("adminLoggedIn")) {
        localStorage.removeItem("currentUser");
        alert("Session expired. Please login again.");
        navigate("/login");
      }
    }, 30 * 60 * 1000);
    return () => clearTimeout(timer);
  }, [navigate]);

  // Supabase fires PASSWORD_RECOVERY when the user opens their reset-password
  // email link — switch this page into "set new password" mode.
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setError("");
        setResetMessage("");
        setMode("reset");
      }
    });
    return () => listener?.subscription?.unsubscribe();
  }, []);

  const switchMode = (next) => {
    setError("");
    setResetMessage("");
    setMode(next);
    setAnimKey((k) => k + 1);
  };

  // ── Send password reset email ──
  const handleForgotPassword = async () => {
    setError("");
    setResetMessage("");

    if (!email) {
      setError("Please enter your email address first.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      if (error) {
        setError(error.message || "Failed to send reset email.");
        setLoading(false);
        return;
      }
      setResetMessage(`✅ Password reset link sent to ${email}. Please check your email (and spam folder).`);
      setLoading(false);
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  // ── Set new password after clicking the reset link ──
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");

    if (newPassword.trim().length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword.trim() !== confirmNewPassword.trim()) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword.trim() });
      if (error) {
        setError(error.message || "Failed to update password.");
        setLoading(false);
        return;
      }
      setLoading(false);
      alert("Password updated! Please log in with your new password.");
      setNewPassword("");
      setConfirmNewPassword("");
      switchMode("login");
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  // ── Email + password login ──
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setResetMessage("");

    if (isBlocked) {
      setError("Too many failed attempts. Please wait 5 minutes.");
      return;
    }

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    // ─── Admin check ───
    if (trimmedEmail === ADMIN_EMAIL && trimmedPassword === ADMIN_PASSWORD) {
      setLoading(true);
      try {
        // Use Supabase Auth to create a session so RLS policies work
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password: trimmedPassword,
        });
        if (authError) {
          setError("Admin user not found in Auth. Please sign up once with this email or create in Supabase Dashboard.");
          setLoading(false);
          return;
        }
        localStorage.setItem("adminLoggedIn", "true");
        localStorage.setItem("adminEmail", trimmedEmail);
        setLoading(false);
        navigate("/admin-dashboard");
        return;
      } catch (err) {
        setError("Login error: " + err.message);
        setLoading(false);
        return;
      }
    }

    // ─── Regular user login ───
    setLoading(true);
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password: trimmedPassword,
      });

      if (authError) {
        setError("Invalid credentials. Please try again.");
        const nextAttempts = loginAttempts + 1;
        setLoginAttempts(nextAttempts);
        localStorage.setItem(LOGIN_ATTEMPTS_KEY, String(nextAttempts));
        if (nextAttempts >= 5) {
          const until = Date.now() + 5 * 60 * 1000;
          localStorage.setItem(LOGIN_BLOCK_KEY, String(until));
          setIsBlocked(true);
        }
        setLoading(false);
        return;
      }

      if (data?.user) {
        const { data: userData } = await supabase
          .from("users")
          .select("id, name, email, phone")
          .eq("email", trimmedEmail)
          .maybeSingle();

        const userInfo = {
          id: data.user.id,
          name: userData?.name || data.user.user_metadata?.full_name || "User",
          email: data.user.email,
          phone: userData?.phone || "",
        };

        localStorage.setItem("currentUser", JSON.stringify(userInfo));
        localStorage.removeItem("adminLoggedIn");
        localStorage.setItem("sessionExpiry", Date.now() + 30 * 60 * 1000);
        localStorage.removeItem(LOGIN_ATTEMPTS_KEY);
        localStorage.removeItem(LOGIN_BLOCK_KEY);
        setLoginAttempts(0);

        setLoading(false);
        const redirectTo = localStorage.getItem("redirectAfterLogin") || "/";
        localStorage.removeItem("redirectAfterLogin");
        navigate(redirectTo);
        return;
      }
      setError("Something went wrong.");
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Email + password signup ──
  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    const trimmedPhone = phone.trim();

    if (trimmedPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (trimmedPassword !== confirmPassword.trim()) {
      setError("Passwords do not match.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email: trimmedEmail,
        password: trimmedPassword,
        options: {
          data: { full_name: trimmedName, phone: trimmedPhone },
        },
      });

      if (authError) {
        setError(authError.message || "Registration failed.");
        setLoading(false);
        return;
      }

      if (data?.user) {
        setLoading(false);
        alert("Account created! Please check your email to verify.");
        navigate("/login");
        return;
      }
      setError("Signup failed.");
    } catch (err) {
      console.error("Signup error:", err);
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  // ── Google sign-in ──
  const handleSocialLogin = async (provider) => {
    setSocialLoading((s) => ({ ...s, [provider]: true }));
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
      // Browser navigates away to Google here — no further code runs.
    } catch (err) {
      console.error("Social login error:", err);
      alert("Failed to login with " + provider);
      setSocialLoading((s) => ({ ...s, [provider]: false }));
    }
  };

  return (
    <>
      <Navbar />
      <div className="auth-page">
        <svg className="leaf-particle" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C7 2 3 6 3 11c0 6 9 11 9 11s9-5 9-11c0-5-4-9-9-9z"/></svg>
        <svg className="leaf-particle" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C7 2 3 6 3 11c0 6 9 11 9 11s9-5 9-11c0-5-4-9-9-9z"/></svg>
        <svg className="leaf-particle" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C7 2 3 6 3 11c0 6 9 11 9 11s9-5 9-11c0-5-4-9-9-9z"/></svg>
        <svg className="leaf-particle" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C7 2 3 6 3 11c0 6 9 11 9 11s9-5 9-11c0-5-4-9-9-9z"/></svg>

        {mode === "reset" ? (
          <div className="auth-card mode-login">
            <div className="auth-form-panel">
              <img src={`${process.env.PUBLIC_URL}/assets/ELVRElogo1.png`} alt="ELVRE" className="auth-logo" />
              <div className="auth-eyebrow">Elvre · Reset Password</div>
              <h2>Choose a New Password</h2>
              <p className="auth-sub">Enter and confirm your new password below.</p>

              {error && <div className="auth-error">{error}</div>}

              <form onSubmit={handleResetPassword}>
                <div className="auth-field">
                  <label>New Password (min 8 chars)</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      required
                      disabled={loading}
                      minLength={8}
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      disabled={loading}
                    >
                      {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>
                <div className="auth-field">
                  <label>Confirm New Password</label>
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    required
                    disabled={loading}
                  />
                </div>
                <button type="submit" className="auth-submit" disabled={loading}>
                  {loading ? "Updating..." : "Update Password"}
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className={`auth-card mode-${mode}`}>
            {/* Login Panel */}
            <div className={`auth-form-panel ${mode !== "login" ? "is-hidden" : ""}`}>
              <img src={`${process.env.PUBLIC_URL}/assets/ELVRElogo1.png`} alt="ELVRE" className="auth-logo" />
              <div className="auth-eyebrow">Elvre · Member Login</div>
              <h2>Welcome Back!</h2>
              <p className="auth-sub">Login to your account</p>

              {mode === "login" && error && <div className="auth-error">{error}</div>}
              {resetMessage && (
                <div className="auth-success" style={{ background: "#e8f5e9", color: "#2e7d32", padding: "10px", borderRadius: "8px", marginBottom: "15px" }}>
                  {resetMessage}
                </div>
              )}

              <form onSubmit={handleLogin}>
                <div className="auth-field">
                  <label>Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    disabled={loading || isBlocked}
                    maxLength={100}
                  />
                </div>

                <div className="auth-field">
                  <label>Password</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showLoginPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      disabled={loading || isBlocked}
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      disabled={loading || isBlocked}
                    >
                      {showLoginPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                <div style={{ textAlign: "right", marginTop: "-8px", marginBottom: "15px" }}>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={loading || isBlocked}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--primary-brown)",
                      textDecoration: "underline",
                      cursor: "pointer",
                      fontSize: "0.9rem",
                      fontWeight: "500",
                    }}
                  >
                    Forgot Password?
                  </button>
                </div>

                <button type="submit" className="auth-submit" disabled={loading || isBlocked}>
                  {loading ? "Logging in..." : isBlocked ? "Blocked (5 min)" : "Login"}
                </button>
              </form>

              <SocialRow socialLoading={socialLoading} onSocial={handleSocialLogin} />

              <p className="auth-switch-line">
                Don't have an account?
                <button type="button" onClick={() => switchMode("signup")}>Sign Up</button>
              </p>
            </div>

            {/* Signup Panel */}
            <div className={`auth-form-panel ${mode !== "signup" ? "is-hidden" : ""}`}>
              <img src={`${process.env.PUBLIC_URL}/assets/ELVRElogo1.png`} alt="ELVRE" className="auth-logo" />
              <div className="auth-eyebrow">Elvre · New Here</div>
              <h2>Join the Grove</h2>
              <p className="auth-sub">Create your account to get started</p>

              {mode === "signup" && error && <div className="auth-error">{error}</div>}

              <form onSubmit={handleSignup}>
                <div className="auth-field">
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    required
                    disabled={loading}
                    maxLength={50}
                  />
                </div>
                <div className="auth-field">
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
                </div>
                <div className="auth-field">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    placeholder="Enter your phone number"
                    maxLength={10}
                    disabled={loading}
                  />
                </div>
                <div className="auth-field">
                  <label>Password (min 8 chars)</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showSignupPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a password"
                      required
                      disabled={loading}
                      minLength={8}
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowSignupPassword(!showSignupPassword)}
                      disabled={loading}
                    >
                      {showSignupPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>
                <div className="auth-field">
                  <label>Confirm Password</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showSignupConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your password"
                      required
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowSignupConfirm(!showSignupConfirm)}
                      disabled={loading}
                    >
                      {showSignupConfirm ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                <button type="submit" className="auth-submit" disabled={loading}>
                  {loading ? "Creating account..." : "Sign Up"}
                </button>
              </form>

              <SocialRow socialLoading={socialLoading} onSocial={handleSocialLogin} />

              <p className="auth-switch-line">
                Already have an account?
                <button type="button" onClick={() => switchMode("login")}>Login</button>
              </p>
            </div>

            {/* Overlay */}
            <div className="auth-overlay-track">
              <div className="auth-overlay">
                <img src={`${process.env.PUBLIC_URL}/assets/ELVRElogo1.png`} alt="ELVRE" className="auth-overlay-logo" />
                <BranchMotif animKey={animKey} />
                <div className="auth-overlay-eyebrow">{mode === "login" ? "New to Elvre?" : "One of us already?"}</div>
                <h3>{mode === "login" ? "Grow something\nnew with us" : "Good to see\nyou again"}</h3>
                <p>
                  {mode === "login"
                    ? "Create an account and start your journey through the grove — it only takes a minute."
                    : "Sign back in to pick up right where you left off."}
                </p>
                <button type="button" className="auth-overlay-btn" onClick={() => switchMode(mode === "login" ? "signup" : "login")}>
                  {mode === "login" ? "Sign Up" : "Login"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default UserLogin;