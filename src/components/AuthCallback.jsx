import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import "./AuthCallback.css";

const AuthCallback = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPhoneForm, setShowPhoneForm] = useState(false);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // ─── Eye toggle states ───
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const handleAuth = async () => {
      try {
        let sessionData = null;
        for (let i = 0; i < 5; i++) {
          const { data, error } = await supabase.auth.getSession();
          if (!error && data?.session) {
            sessionData = data;
            break;
          }
          await new Promise(r => setTimeout(r, 300));
        }

        if (!sessionData?.session) {
          navigate('/login');
          return;
        }

        const user = sessionData.session.user;
        console.log('✅ Authenticated:', user.email);

        const { data: userData, error: fetchError } = await supabase
          .from('users')
          .select('id, name, email, phone')
          .eq('email', user.email)
          .maybeSingle();

        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error('Fetch error:', fetchError);
        }

        let userRecord = userData;

        if (!userRecord) {
          const newUser = {
            id: user.id,
            name: user.user_metadata?.full_name || user.user_metadata?.name || 'User',
            email: user.email,
            phone: user.phone || '',
          };
          const { data: inserted, error: insertError } = await supabase
            .from('users')
            .insert([newUser])
            .select('id, name, email, phone')
            .single();
          if (insertError) {
            console.error('Insert error:', insertError);
            setError('Could not create user profile.');
            setLoading(false);
            return;
          }
          userRecord = inserted;
        }

        if (!userRecord.phone || userRecord.phone.trim() === '') {
          setUserEmail(user.email);
          setUserName(userRecord.name || user.user_metadata?.full_name || 'User');
          setShowPhoneForm(true);
          setLoading(false);
          return;
        }

        proceedToHome(userRecord, user);

      } catch (err) {
        console.error('Auth error:', err);
        setError('Something went wrong.');
        setLoading(false);
      }
    };

    handleAuth();
  }, [navigate]);

  const proceedToHome = (userRecord, user) => {
    const currentUser = {
      id: userRecord.id,
      name: userRecord.name || user?.user_metadata?.full_name || 'User',
      email: userRecord.email,
      phone: userRecord.phone || '',
    };
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    localStorage.removeItem('adminLoggedIn');

    const redirectTo = localStorage.getItem('redirectAfterLogin') || '/';
    localStorage.removeItem('redirectAfterLogin');
    navigate(redirectTo);
  };

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    if (!phone || phone.length < 10) {
      alert('Please enter a valid 10-digit phone number.');
      setSubmitting(false);
      return;
    }

    if (password) {
      if (password.length < 8) {
        alert('Password must be at least 8 characters.');
        setSubmitting(false);
        return;
      }
      if (password !== confirmPassword) {
        alert('Passwords do not match.');
        setSubmitting(false);
        return;
      }
    }

    try {
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({ phone: phone })
        .eq('email', userEmail)
        .select('id, name, email, phone')
        .single();

      if (updateError) {
        console.error('Update error:', updateError);
        alert('Failed to update phone. Please try again.');
        setSubmitting(false);
        return;
      }

      if (password) {
        try {
          const { error: pwError } = await supabase.auth.updateUser({
            password: password
          });
          if (pwError) {
            console.error('Password update error:', pwError);
            alert('Phone updated, but failed to set password. You can set it later from profile.');
          } else {
            console.log('✅ Password set successfully');
          }
        } catch (pwErr) {
          console.error('Password exception:', pwErr);
          alert('Phone updated, but failed to set password. You can set it later from profile.');
        }
      }

      const user = { email: userEmail, user_metadata: { full_name: userName } };
      proceedToHome(updatedUser, user);

    } catch (err) {
      console.error('Submit error:', err);
      alert('Something went wrong. Please try again.');
      setSubmitting(false);
    }
  };

  if (error) {
    return (
      <div className="auth-callback-container">
        <div className="auth-callback-error">
          <h2>⚠️ Login Failed</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/login')} className="auth-callback-btn">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (showPhoneForm) {
    return (
      <div className="auth-callback-container">
        <div className="auth-callback-phone-form">
          <h2>📱 Complete Your Profile</h2>
          <p>Please enter your phone number. Optionally, set a password to log in with email later.</p>
          <form onSubmit={handlePhoneSubmit}>
            <div className="auth-form-group">
              <label>Phone Number *</label>
              <input
                type="tel"
                placeholder="Enter 10-digit mobile number"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                maxLength="10"
                required
                disabled={submitting}
              />
            </div>

            <div className="auth-form-group">
              <label>Set Password (optional)</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Leave blank to skip"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={submitting}
                  minLength={8}
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

            <button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : 'Continue'}
            </button>
          </form>
          <p className="auth-callback-skip">
            You can also set password later from your profile page.
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