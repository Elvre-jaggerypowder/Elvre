// src/services/smsService.js
// SMS Service for OTP Verification

// ------------------ CONFIGURATION ------------------
const API_KEY = process.env.REACT_APP_SMS_API_KEY;
const PROVIDER = process.env.REACT_APP_SMS_PROVIDER || '2factor'; // '2factor', 'msg91', or 'demo'

// ------------------ HELPERS ------------------
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ------------------ SEND OTP (Provider Specific) ------------------
export const sendOTP = async (phoneNumber, otpCode) => {
  try {
    // Demo mode – just log OTP (use for testing without SMS credits)
    if (PROVIDER === 'demo' || !API_KEY) {
      console.log(`🔐 [DEMO] OTP for ${phoneNumber}: ${otpCode}`);
      return { success: true, messageId: 'DEMO_MODE' };
    }

    let url = '';
    let options = {};

    if (PROVIDER === '2factor') {
      // 2Factor.in API (GET request)
      url = `https://2factor.in/API/V1/${API_KEY}/SMS/${phoneNumber}/${otpCode}`;
      options = { method: 'GET' };
    } 
    else if (PROVIDER === 'msg91') {
      // MSG91 API (POST request)
      url = `https://api.msg91.com/api/v5/otp`;
      options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'authkey': API_KEY },
        body: JSON.stringify({
          mobile: phoneNumber,
          otp: otpCode,
          sender: 'ELVRE',
          message: `Your OTP for ELVRE is ${otpCode}. Valid for 5 minutes.`
        })
      };
    } 
    else {
      throw new Error('Invalid SMS provider. Set REACT_APP_SMS_PROVIDER to "2factor" or "msg91" or "demo"');
    }

    const response = await fetch(url, options);
    const data = await response.json();
    console.log('SMS Response:', data);

    // 2Factor success check
    if (data.Status === 'Success') {
      return { success: true, messageId: data.Details };
    } 
    // MSG91 success check
    else if (data.type === 'success') {
      return { success: true };
    }
    else {
      return { success: false, error: data.Details || data.message || 'SMS sending failed' };
    }
  } catch (error) {
    console.error('SMS send error:', error);
    return { success: false, error: error.message };
  }
};

// ------------------ LOCAL STORAGE OTP MANAGEMENT (Temporary) ------------------
// ⚠️ For production, use Supabase Edge Functions for secure verification
export const storeOTP = (phoneNumber, otpCode) => {
  const expiry = Date.now() + 5 * 60 * 1000; // 5 minutes
  localStorage.setItem(`otp_${phoneNumber}`, JSON.stringify({
    code: otpCode,
    expiry: expiry,
    attempts: 0
  }));
};

export const verifyOTP = (phoneNumber, enteredCode) => {
  const storedData = localStorage.getItem(`otp_${phoneNumber}`);
  if (!storedData) {
    return { success: false, message: 'No OTP found. Please request a new OTP.' };
  }
  
  const { code, expiry, attempts } = JSON.parse(storedData);
  
  // Check expiry
  if (Date.now() > expiry) {
    localStorage.removeItem(`otp_${phoneNumber}`);
    return { success: false, message: 'OTP expired. Please request a new OTP.' };
  }
  
  // Check attempts (Max 5)
  if (attempts >= 5) {
    localStorage.removeItem(`otp_${phoneNumber}`);
    return { success: false, message: 'Too many failed attempts. Please request a new OTP.' };
  }
  
  // Match OTP
  if (enteredCode === code) {
    localStorage.removeItem(`otp_${phoneNumber}`);
    return { success: true, message: 'Phone verified successfully!' };
  } else {
    // Increment attempts
    localStorage.setItem(`otp_${phoneNumber}`, JSON.stringify({
      code,
      expiry,
      attempts: attempts + 1
    }));
    return { success: false, message: `Invalid OTP. ${4 - attempts} attempts left.` };
  }
};

export const getOTPExpiryTime = (phoneNumber) => {
  const storedData = localStorage.getItem(`otp_${phoneNumber}`);
  if (!storedData) return 0;
  const { expiry } = JSON.parse(storedData);
  const remaining = Math.floor((expiry - Date.now()) / 1000);
  return remaining > 0 ? remaining : 0;
};