import React, { useState, useRef } from 'react';
import { useRazorpay } from 'react-razorpay'; // ✅ named import

const PaymentButton = ({ 
  amount,
  orderId,
  customerDetails,
  onSuccess,
  onFailure,
  buttonText = '💰 Pay Now',
}) => {
  const { Razorpay } = useRazorpay(); 
  const [loading, setLoading] = useState(false);

  // ✅ FIX (the actual duplicate-order bug): `setLoading(true)` doesn't take
  // effect until the next render, so `disabled={loading}` alone can't stop
  // a fast double-click/double-tap — both clicks can fire handlePayment
  // before the button visually disables. That's what was creating two
  // Razorpay orders with the same receipt in the earlier logs. A ref updates
  // synchronously (no waiting for a re-render), so it closes that gap.
  const isProcessingRef = useRef(false);

  const handlePayment = async () => {
    if (isProcessingRef.current) {
      console.warn('⚠️ Payment already in progress — ignoring duplicate click.');
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

      // Razorpay checkout options
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'ELVRE',
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
        handler: function (response) {
          console.log('💳 Payment response:', response);

          // Verify payment
          fetch(`${API_BASE}/api/verify-payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              alert('✅ Payment Successful!');
              if (onSuccess) onSuccess(response);
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
            // ✅ FIX: release the guard once we have a final answer (success
            // or failure) from verification, so the button can be used again
            // if something goes wrong and the user needs to retry.
            isProcessingRef.current = false;
            setLoading(false);
          });
        },
        modal: {
          ondismiss: function() {
            console.log('❌ Checkout modal closed by user');
            isProcessingRef.current = false;
            setLoading(false);
            if (onFailure) onFailure({ error: 'User cancelled payment' });
          }
        }
      };

      // ✅ Check if Razorpay is available
      if (!Razorpay) {
        throw new Error('Razorpay SDK not loaded. Please check your internet connection.');
      }

      const razorpayInstance = new Razorpay(options);
      razorpayInstance.open();

      // Note: we intentionally do NOT reset isProcessingRef/loading here —
      // the Razorpay modal is now open, and the guard should stay active
      // until the user completes, fails, or dismisses it (handled above).
      
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
      disabled={loading}
      className="payment-btn"
      style={{
        width: '100%',
        padding: '14px',
        background: loading ? '#aaa' : '#8B5E3C',
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        fontSize: '16px',
        fontWeight: '600',
        cursor: loading ? 'not-allowed' : 'pointer',
        transition: '0.3s',
      }}
    >
      {loading ? '⏳ Processing...' : buttonText}
    </button>
  );
};

export default PaymentButton;