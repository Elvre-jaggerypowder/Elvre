import React, { useState, useRef, useEffect } from 'react';
const RAZORPAY_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';

function loadRazorpayScript() {
  return new Promise((resolve) => {
    // Already loaded (e.g. from a previous mount) — don't load it twice
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const existingScript = document.querySelector(`script[src="${RAZORPAY_SCRIPT_URL}"]`);
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true));
      existingScript.addEventListener('error', () => resolve(false));
      return;
    }
    const script = document.createElement('script');
    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

const PaymentButton = ({ 
  amount,
  orderId,
  customerDetails,
  onSuccess,
  onFailure,
  buttonText = '💰 Pay Now',
}) => {
  const [loading, setLoading] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);

  // ✅ Same guard as before — a ref updates synchronously, so it blocks a
  // fast double-click/double-tap even before React re-renders to disable
  // the button. This is what was causing duplicate Razorpay orders earlier.
  const isProcessingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    loadRazorpayScript().then((loaded) => {
      if (!cancelled) setScriptReady(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handlePayment = async () => {
    if (isProcessingRef.current) {
      console.warn('⚠️ Payment already in progress — ignoring duplicate click.');
      return;
    }

    if (!scriptReady || !window.Razorpay) {
      alert('Payment gateway is still loading. Please wait a moment and try again.');
      return;
    }

    isProcessingRef.current = true;
    setLoading(true);

    try {
      const API_BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

      const response = await fetch(`${API_BASE}/api/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Math.round(amount * 100),
          receipt: orderId || 'order_' + Date.now(),
        }),
      });

      const orderData = await response.json();

      if (!response.ok) {
        throw new Error(orderData.error || 'Failed to create order');
      }

      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'ELVRE',
        // ✅ Shows your actual logo in the checkout modal instead of the
        // generic auto-generated "first letter" circle avatar. Must be a
        // publicly reachable URL (Razorpay's servers fetch it), so it can't
        // be a relative path served only from localhost — use the live
        // production URL once deployed, or window.location.origin if
        // testing against a publicly accessible dev URL.
        image: `${window.location.origin}/assets/ELVRElogo1.png`,
        description: 'Jaggery Powder Purchase',
        order_id: orderData.id,
        prefill: {
          name: customerDetails?.name || '',
          email: customerDetails?.email || '',
          contact: customerDetails?.phone || '',
        },
        theme: {
          color: '#8B5E3C',
        },
        handler: function (razorpayResponse) {
          console.log('💳 Payment response:', razorpayResponse);

          fetch(`${API_BASE}/api/verify-payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: razorpayResponse.razorpay_order_id,
              razorpay_payment_id: razorpayResponse.razorpay_payment_id,
              razorpay_signature: razorpayResponse.razorpay_signature,
            }),
          })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              alert('✅ Payment Successful!');
              if (onSuccess) onSuccess(razorpayResponse);
            } else {
              alert('⚠️ Payment verification failed: ' + (data.error || 'Unknown error'));
              if (onFailure) onFailure(data);
            }
          })
          .catch(err => {
            console.error('❌ Verification error:', err);
            alert('⚠️ Payment verification failed. Please contact support.');
            if (onFailure) onFailure(err);
          })
          .finally(() => {
            // Only release the guard once we have a final answer — not
            // the moment the checkout modal opens.
            isProcessingRef.current = false;
            setLoading(false);
          });
        },
        modal: {
          ondismiss: function () {
            console.log('❌ Checkout modal closed by user');
            isProcessingRef.current = false;
            setLoading(false);
            if (onFailure) onFailure({ error: 'User cancelled payment' });
          }
        }
      };

      const razorpayInstance = new window.Razorpay(options);

      // If the payment itself fails inside the Razorpay modal (card
      // declined, etc.), Razorpay fires this event rather than `handler`.
      razorpayInstance.on('payment.failed', function (resp) {
        console.error('❌ Razorpay payment failed:', resp.error);
        isProcessingRef.current = false;
        setLoading(false);
        if (onFailure) onFailure(resp.error);
      });

      razorpayInstance.open();
      // Deliberately no setLoading(false) here — stays disabled until the
      // handler, payment.failed, or ondismiss callback above fires.

    } catch (error) {
      console.error('❌ Payment error:', error);
      alert('Payment initiation failed: ' + error.message);
      isProcessingRef.current = false;
      setLoading(false);
      if (onFailure) onFailure(error);
    }
  };

  return (
    <button
      onClick={handlePayment}
      disabled={loading || !scriptReady}
      className="payment-btn"
      style={{
        width: '100%',
        padding: '14px',
        background: (loading || !scriptReady) ? '#aaa' : '#8B5E3C',
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        fontSize: '16px',
        fontWeight: '600',
        cursor: (loading || !scriptReady) ? 'not-allowed' : 'pointer',
        transition: '0.3s',
      }}
    >
      {loading ? '⏳ Processing...' : (!scriptReady ? 'Loading payment gateway...' : buttonText)}
    </button>
  );
};

export default PaymentButton;