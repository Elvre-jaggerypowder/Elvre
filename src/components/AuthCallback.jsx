import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "./AuthCallback.css";

const SESSION_WAIT_TIMEOUT_MS = 8000;

const AuthCallback = () => {
  const navigate = useNavigate();

  const [stage, setStage] = useState("loading");
  const [error, setError] = useState(null);

  const [authUser, setAuthUser] = useState(null);
  const [existingRow, setExistingRow] = useState(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [wantsPassword, setWantsPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handledRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user && !handledRef.current) {
        handledRef.current = true;
        loadUserAndDecide(session.user);
      }
    });

    const pollForSession = async () => {
      const start = Date.now();
      while (Date.now() - start < SESSION_WAIT_TIMEOUT_MS) {
        if (cancelled || handledRef.current) return;
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (!sessionError && data?.session?.user) {
          if (!handledRef.current) {
            handledRef.current = true;
            loadUserAndDecide(data.session.user);
          }
          return;
        }
        await new Promise((r) => setTimeout(r, 400));
      }
      if (!cancelled && !handledRef.current) {
        setError("We couldn't confirm your Google sign-in. Please try again.");
        setStage("error");
      }
    };

    const loadUserAndDecide = async (user) => {
      try {
        window.history.replaceState({}, document.title, window.location.pathname);

        console.log('👤 Checking user:', user.email);

        const { data: row, error: fetchError } = await supabase
          .from("users")
          .select("id, name, email, phone")
          .eq("email", user.email)
          .maybeSingle();

        if (fetchError) {
          console.error("Fetch error:", fetchError);
        }

        const googleName = user.user_metadata?.full_name || user.user_metadata?.name || "";
        const hasCompleteProfile = row && row.name && row.phone && row.phone.trim() !== "";

        if (hasCompleteProfile) {
          console.log('✅ User already has complete profile, logging in');
          finishLogin(row, user);
          return;
        }

        console.log('📝 New or incomplete user, showing form');
        setAuthUser(user);
        setExistingRow(row || null);
        setName(row?.name || googleName || "");
        setPhone(row?.phone || "");
        setStage("profile");
      } catch (err) {
        console.error("Auth handling error:", err);
        setError("Something went wrong finishing your sign-in. Please try again.");
        setStage("error");
      }
    };

    pollForSession();

    return () => {
      cancelled = true;
      listener?.subscription?.unsubscribe();
    };
  }, []);

  // ✅ FIX: Use window.location.href to force full page reload
  const finishLogin = (row, user) => {
    console.log('🏁 Finishing login for:', row.email);
    const currentUser = {
      id: row.id,
      name: row.name || user?.user_metadata?.full_name || "User",
      email: row.email,
      phone: row.phone || "",
    };
    localStorage.setItem("currentUser", JSON.stringify(currentUser));
    localStorage.removeItem("adminLoggedIn");

    const redirectTo = localStorage.getItem("redirectAfterLogin") || "/";
    localStorage.removeItem("redirectAfterLogin");

    // Force page reload to root – ensures app re-renders from scratch
    window.location.href = redirectTo;
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    const trimmedName = name.trim();
    const trimmedPhone = phone.replace(/\D/g, "");

    if (!trimmedName) {
      setFormError("Please enter your name.");
      return;
    }
    if (trimmedPhone.length !== 10) {
      setFormError("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (wantsPassword) {
      if (password.length < 8) {
        setFormError("Password must be at least 8 characters.");
        return;
      }
      if (password !== confirmPassword) {
        setFormError("Passwords do not match.");
        return;
      }
    }

    setSubmitting(true);
    console.log('📝 Profile submit started');

    try {
      let savedRow;

      if (existingRow) {
        console.log('🔄 Updating existing user:', existingRow.id);
        const { data: updated, error: updateError } = await supabase
          .from("users")
          .update({ name: trimmedName, phone: trimmedPhone })
          .eq("id", existingRow.id)
          .select("id, name, email, phone")
          .single();

        if (updateError) {
          console.error('❌ Update error:', updateError);
          setFormError("Failed to save your profile. Please try again.");
          setSubmitting(false);
          return;
        }
        savedRow = updated;
        console.log('✅ Update successful:', savedRow);
      } else {
        console.log('🆕 Inserting new user...');
        const { data: inserted, error: insertError } = await supabase
          .from("users")
          .insert([
            {
              id: authUser.id,
              name: trimmedName,
              email: authUser.email,
              phone: trimmedPhone,
              created_at: new Date().toISOString(),
            },
          ])
          .select("id, name, email, phone")
          .single();

        if (insertError) {
          console.error('❌ Insert error:', insertError);
          setFormError("Could not create your profile. Please try again.");
          setSubmitting(false);
          return;
        }
        savedRow = inserted;
        console.log('✅ Insert successful:', savedRow);
      }

      if (wantsPassword && password) {
        console.log('🔑 Setting password...');
        const { error: pwError } = await supabase.auth.updateUser({ password });
        if (pwError) {
          console.error('❌ Password set error:', pwError);
          alert("Profile saved, but we couldn't set your password. You can set it later from your profile page.");
        } else {
          console.log('✅ Password set');
        }
      }

      console.log('🏁 Finishing login...');
      finishLogin(savedRow, authUser);

    } catch (err) {
      console.error('🔥 Profile submit error:', err);
      setFormError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  if (stage === "error") {
    return (
      <div className="auth-callback-container">
        <div className="auth-callback-error">
          <h2>⚠️ Login Failed</h2>
          <p>{error}</p>
          <button onClick={() => navigate("/login", { replace: true })} className="auth-callback-btn">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (stage === "profile") {
    return (
      <div className="auth-callback-container">
        <div className="auth-callback-phone-form">
          <h2>👋 Complete Your Profile</h2>
          <p>You're signed in with Google as <strong>{authUser?.email}</strong>. Just a couple more details to set up your account.</p>

          {formError && <div className="auth-error" style={{ marginBottom: "12px", color: "#c0392b" }}>{formError}</div>}

          <form onSubmit={handleProfileSubmit}>
            <div className="auth-form-group">
              <label>Full Name *</label>
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={50}
                required
                disabled={submitting}
              />
            </div>

            <div className="auth-form-group">
              <label>Mobile Number *</label>
              <input
                type="tel"
                placeholder="Enter 10-digit mobile number"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                maxLength="10"
                required
                disabled={submitting}
              />
            </div>

            <div className="auth-form-group" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input
                type="checkbox"
                id="wantsPassword"
                checked={wantsPassword}
                onChange={(e) => setWantsPassword(e.target.checked)}
                disabled={submitting}
                style={{ width: "auto" }}
              />
              <label htmlFor="wantsPassword" style={{ margin: 0, cursor: "pointer" }}>
                Also set a password (so I can log in without Google next time)
              </label>
            </div>

            {wantsPassword && (
              <>
                <div className="auth-form-group">
                  <label>Password (min 8 chars)</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={submitting}
                      minLength={8}
                      required={wantsPassword}
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={submitting}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>
                <div className="auth-form-group">
                  <label>Confirm Password</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={submitting}
                      required={wantsPassword}
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={submitting}
                    >
                      {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>
              </>
            )}

            <button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Complete Profile"}
            </button>
          </form>

          <p className="auth-callback-skip">
            You can always add or change your password later from your profile page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-callback-container">
      <div className="auth-callback-loading">
        <div className="auth-callback-spinner"></div>
        <h2>Signing you in...</h2>
        <p>Please wait while we verify your account.</p>
      </div>
    </div>
  );
};

export default AuthCallback;