import { supabase } from '../supabaseClient';
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import { sendOrderEmails } from '../services/emailService';
import { 
  sendOTP, 
  generateOTP, 
  storeOTP, 
  verifyOTP, 
  getOTPExpiryTime 
} from '../services/smsService';
import "./Checkout.css";

const Checkout = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const [shipping, setShipping] = useState(40);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [step, setStep] = useState(1);
  const [emailSent, setEmailSent] = useState(false);
  
  // OTP States
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpTimer, setOtpTimer] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    paymentMethod: "cod"
  });

  useEffect(() => {
    checkUserAndLoadCart();
  }, []);

  // Timer effect for OTP countdown
  useEffect(() => {
    if (otpTimer > 0) {
      const interval = setInterval(() => {
        setOtpTimer(prev => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [otpTimer]);

  // When phone changes, reset OTP verification
  useEffect(() => {
    if (formData.phone) {
      const remaining = getOTPExpiryTime(formData.phone);
      if (remaining > 0) {
        setOtpSent(true);
        setOtpTimer(remaining);
        setCanResend(false);
      } else {
        setOtpSent(false);
        setPhoneVerified(false);
        setOtpTimer(0);
        setCanResend(true);
      }
    }
  }, [formData.phone]);

  const checkUserAndLoadCart = () => {
    const user = localStorage.getItem("currentUser");
    if (!user) {
      localStorage.setItem("redirectAfterLogin", "/checkout");
      navigate("/login");
      return;
    }
    loadCart();
    loadSavedAddresses();
  };

  const loadCart = () => {
    const savedCart = JSON.parse(localStorage.getItem("cart") || "[]");
    if (savedCart.length === 0) {
      alert("Your cart is empty!");
      navigate("/products");
      return;
    }
    setCart(savedCart);
    
    const subtotalAmount = savedCart.reduce((sum, item) => {
      const price = item.priceValue || parseFloat(item.price?.replace('₹', '')) || 0;
      return sum + (price * (item.quantity || 1));
    }, 0);
    
    setSubtotal(subtotalAmount);
    const shippingCharge = subtotalAmount > 499 ? 0 : 40;
    setShipping(shippingCharge);
    setTotal(subtotalAmount + shippingCharge);
  };

  const loadSavedAddresses = async () => {
    try {
      const currentUser = JSON.parse(localStorage.getItem("currentUser"));
      if (currentUser && currentUser.email) {
        const { data: supabaseAddresses, error } = await supabase
          .from('addresses')
          .select('*')
          .eq('user_email', currentUser.email)
          .order('saved_at', { ascending: false });
        
        if (error) {
          console.error('Supabase error:', error);
          const addresses = JSON.parse(localStorage.getItem(`addresses_${currentUser.email}`) || "[]");
          setSavedAddresses(addresses);
          if (addresses.length > 0) {
            const lastAddress = addresses[addresses.length - 1];
            setSelectedAddressId(lastAddress.id);
            setFormData(prev => ({
              ...prev,
              fullName: lastAddress.full_name,
              email: lastAddress.email,
              phone: lastAddress.phone,
              address: lastAddress.address,
              city: lastAddress.city,
              state: lastAddress.state,
              pincode: lastAddress.pincode
            }));
            setShowNewAddressForm(false);
          } else {
            setShowNewAddressForm(true);
          }
        } else if (supabaseAddresses && supabaseAddresses.length > 0) {
          const uniqueAddresses = supabaseAddresses.filter((addr, index, self) =>
            index === self.findIndex((a) => 
              a.full_name === addr.full_name &&
              a.phone === addr.phone &&
              a.address === addr.address &&
              a.city === addr.city &&
              a.state === addr.state &&
              a.pincode === addr.pincode
            )
          );
          setSavedAddresses(uniqueAddresses);
          localStorage.setItem(`addresses_${currentUser.email}`, JSON.stringify(uniqueAddresses));
          
          if (uniqueAddresses.length > 0) {
            const lastAddress = uniqueAddresses[uniqueAddresses.length - 1];
            setSelectedAddressId(lastAddress.id);
            setFormData(prev => ({
              ...prev,
              fullName: lastAddress.full_name,
              email: lastAddress.email,
              phone: lastAddress.phone,
              address: lastAddress.address,
              city: lastAddress.city,
              state: lastAddress.state,
              pincode: lastAddress.pincode
            }));
            setShowNewAddressForm(false);
          } else {
            setShowNewAddressForm(true);
          }
        } else {
          setShowNewAddressForm(true);
        }
      } else {
        setShowNewAddressForm(true);
      }
    } catch (error) {
      console.error("Error loading addresses:", error);
      setShowNewAddressForm(true);
    }
    setLoading(false);
  };

  const saveAddress = async (addressData) => {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    if (currentUser && currentUser.email) {
      let addresses = JSON.parse(localStorage.getItem(`addresses_${currentUser.email}`) || "[]");
      
      const isDuplicate = addresses.some(addr => 
        addr.full_name === addressData.fullName &&
        addr.phone === addressData.phone &&
        addr.address === addressData.address &&
        addr.city === addressData.city &&
        addr.state === addressData.state &&
        addr.pincode === addressData.pincode
      );
      
      if (!isDuplicate) {
        const newAddress = {
          id: Date.now(),
          user_email: currentUser.email,
          full_name: addressData.fullName,
          email: addressData.email,
          phone: addressData.phone,
          address: addressData.address,
          city: addressData.city,
          state: addressData.state,
          pincode: addressData.pincode,
          saved_at: new Date().toISOString()
        };
        
        try {
          const { error } = await supabase
            .from('addresses')
            .insert([newAddress]);
          if (error) console.error('Supabase error:', error);
        } catch (err) {
          console.error('Error saving to Supabase:', err);
        }
        
        addresses.push(newAddress);
        localStorage.setItem(`addresses_${currentUser.email}`, JSON.stringify(addresses));
        setSavedAddresses(addresses);
        setSelectedAddressId(newAddress.id);
      } else {
        const existingAddress = addresses.find(addr => 
          addr.full_name === addressData.fullName &&
          addr.phone === addressData.phone &&
          addr.address === addressData.address &&
          addr.city === addressData.city &&
          addr.state === addressData.state &&
          addr.pincode === addressData.pincode
        );
        if (existingAddress) {
          setSelectedAddressId(existingAddress.id);
        }
      }
    }
  };

  // ======================= OTP FUNCTIONS =======================
  const handleSendOTP = async () => {
    const phone = formData.phone;
    if (!phone || phone.length < 10) {
      alert("⚠️ Please enter a valid 10-digit phone number.");
      return;
    }

    setIsSendingOtp(true);
    const otp = generateOTP();
    
    storeOTP(phone, otp);
    const result = await sendOTP(phone, otp);
    
    if (result.success) {
      setOtpSent(true);
      setOtpTimer(300);
      setCanResend(false);
      alert(`✅ OTP sent to ${phone}. Please check your SMS. (Demo: ${otp})`); 
    } else {
      alert(`❌ Failed to send OTP: ${result.error}. Please try again.`);
    }
    setIsSendingOtp(false);
  };

  const handleVerifyOTP = () => {
    const phone = formData.phone;
    if (!otpCode || otpCode.length < 6) {
      alert("⚠️ Please enter the 6-digit OTP.");
      return;
    }

    const result = verifyOTP(phone, otpCode);
    
    if (result.success) {
      setPhoneVerified(true);
      setOtpSent(false);
      setOtpTimer(0);
      setOtpCode("");
      alert("✅ Phone number verified successfully!");
    } else {
      alert(`❌ ${result.message}`);
    }
  };

  const handleResendOTP = () => {
    if (canResend) {
      handleSendOTP();
    }
  };
  // ============================================================

  const handleSelectAddress = (addressId) => {
    const address = savedAddresses.find(a => a.id === parseInt(addressId));
    if (address) {
      setSelectedAddressId(addressId);
      setFormData({
        fullName: address.full_name,
        email: address.email,
        phone: address.phone,
        address: address.address,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        paymentMethod: formData.paymentMethod
      });
      setShowNewAddressForm(false);
      setPhoneVerified(false);
      setOtpSent(false);
      setOtpTimer(0);
      setOtpCode("");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (name === "phone") {
      setPhoneVerified(false);
      setOtpSent(false);
      setOtpTimer(0);
      setOtpCode("");
    }
  };

  const handleUseNewAddress = () => {
    setShowNewAddressForm(true);
    setSelectedAddressId("");
    setFormData({
      fullName: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
      paymentMethod: formData.paymentMethod
    });
    setPhoneVerified(false);
    setOtpSent(false);
    setOtpTimer(0);
    setOtpCode("");
  };

  const handleContinueToPayment = () => {
    if (selectedAddressId) {
      setStep(2);
      return;
    }
    
    if (showNewAddressForm) {
      if (!phoneVerified) {
        alert("Please verify your phone number first");
        return;
      }
      if (formData.fullName && formData.address && formData.city && formData.state && formData.pincode && formData.phone) {
        saveAddress(formData);
        setStep(2);
        return;
      } else {
        alert("Please fill all address fields");
        return;
      }
    }
    
    if (!showNewAddressForm && savedAddresses.length === 0) {
      setShowNewAddressForm(true);
      return;
    }
    
    alert("Please select or add a shipping address");
  };

  const handleBackToAddress = () => {
    setStep(1);
    setShowNewAddressForm(false);
  };

  // ============================================================
  // FIXED placeOrder – includes variant in products
  // ============================================================
  const placeOrder = async (e) => {
    e.preventDefault();
    
    if (showNewAddressForm && !selectedAddressId) {
      if (!phoneVerified) {
        alert("Please verify your phone number first");
        return;
      }
      saveAddress(formData);
    }
    
    if (!formData.fullName || !formData.email || !formData.phone || !formData.address) {
      alert("Please fill all required fields");
      return;
    }
    
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    const now = new Date();
    const orderDate = now.toLocaleDateString();
    const orderTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Update product stock in Supabase
    for (const item of cart) {
      const orderedQty = item.quantity || 1;
      const currentStock = item.stock;
      const newStock = currentStock - orderedQty;
      
      if (newStock < 0) {
        alert(`Insufficient stock for ${item.name}. Only ${currentStock} left.`);
        return;
      }
      
      const { error: stockError } = await supabase
        .from('products')
        .update({ stock: newStock })
        .eq('id', item.id);
      
      if (stockError) {
        console.error('Stock update error:', stockError);
        // Continue anyway – we'll still create the order
      }
    }
    
    // Update localStorage products
    const allProducts = JSON.parse(localStorage.getItem("elvreProducts") || "[]");
    const updatedProducts = allProducts.map(product => {
      const orderedItem = cart.find(item => item.id === product.id);
      if (orderedItem) {
        const newStock = product.stock - (orderedItem.quantity || 1);
        return { ...product, stock: Math.max(0, newStock) };
      }
      return product;
    });
    localStorage.setItem("elvreProducts", JSON.stringify(updatedProducts));
    window.dispatchEvent(new Event("productsUpdated"));
    
    // Build the order object – include variant
    const newOrder = {
      id: "ORD" + Date.now(),
      customer: formData.fullName,
      email: currentUser?.email || formData.email,
      phone: formData.phone,
      address: `${formData.address}, ${formData.city}, ${formData.state} - ${formData.pincode}`,
      products: cart.map(item => ({
        id: item.id,
        name: item.name,
        variant: item.variant || null, // ✅ store variant
        price: item.priceValue || parseFloat(item.price?.replace('₹', '')) || 0,
        quantity: item.quantity || 1,
        image: item.image
      })),
      subtotal: subtotal,
      shipping: shipping,
      discount: 0,
      total: total,
      payment_method: formData.paymentMethod === "cod" ? "Cash on Delivery" : "Online Payment",
      payment_status: "pending",
      status: "pending",
      order_date: orderDate,
      order_time: orderTime,
      created_at: now.toISOString()
    };

    // ------------------------------------------------------------
    // 🔥 SAVE ORDER TO SUPABASE
    // ------------------------------------------------------------
    console.log('💾 Attempting to save order to Supabase:', newOrder);
    let supabaseSuccess = false;

    try {
      const { data, error } = await supabase
        .from('orders')
        .insert([newOrder]);

      if (error) {
        console.error('❌ Supabase order insert error:', error);
        alert('Order placed, but could not save to cloud. We\'ll keep your order locally.');
      } else {
        console.log('✅ Order saved to Supabase successfully!', data);
        supabaseSuccess = true;
      }
    } catch (err) {
      console.error('❌ Exception while saving to Supabase:', err);
      alert('Order placed, but could not save to cloud. We\'ll keep your order locally.');
    }

    // Always save to localStorage as backup
    const existingOrders = JSON.parse(localStorage.getItem("elvreOrders") || "[]");
    existingOrders.unshift(newOrder);
    localStorage.setItem("elvreOrders", JSON.stringify(existingOrders));

    // Clear cart
    localStorage.removeItem("cart");
    setCart([]);
    window.dispatchEvent(new Event("storage"));

    // Send order confirmation emails
    if (!emailSent) {
      try {
        console.log('📧 Sending order emails for order:', newOrder.id);
        const emailResult = await sendOrderEmails(newOrder);
        if (emailResult.success) {
          console.log('✅ Order emails sent successfully!');
        } else {
          console.warn('⚠️ Order emails failed to send');
        }
        setEmailSent(true);
      } catch (emailErr) {
        console.error('❌ Email sending error:', emailErr);
      }
    }

    setOrderId(newOrder.id);
    setOrderPlaced(true);

    setTimeout(() => {
      navigate(`/order-tracking/${newOrder.id}`);
    }, 3000);
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="checkout-loading">Loading checkout...</div>
      </>
    );
  }

  if (orderPlaced) {
    return (
      <>
        <Navbar />
        <div className="order-success-container">
          <div className="order-success-card">
            <div className="success-checkmark">✓</div>
            <h1>Order Placed Successfully!</h1>
            <p>Your order ID is: <strong>{orderId}</strong></p>
            <p>Order confirmation email has been sent to your email address.</p>
            <div className="order-success-buttons">
              <button onClick={() => navigate(`/order-tracking/${orderId}`)} className="track-order-btn">Track Your Order</button>
              <button onClick={() => navigate("/products")} className="continue-shop-btn">Continue Shopping</button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="checkout-page">
        <div className="checkout-container">
          <div className="checkout-progress">
            <div className={`progress-step ${step >= 1 ? "active" : ""}`}>
              <div className="step-number">1</div>
              <div className="step-label">Shipping Address</div>
            </div>
            <div className="progress-line"></div>
            <div className={`progress-step ${step >= 2 ? "active" : ""}`}>
              <div className="step-number">2</div>
              <div className="step-label">Payment</div>
            </div>
          </div>

          <h1>Checkout</h1>
          
          <div className="checkout-grid">
            <div className="checkout-form">
              {step === 1 ? (
                <>
                  <h2>Shipping Information</h2>
                  {savedAddresses.length > 0 && !showNewAddressForm && (
                    <div className="saved-addresses-section">
                      <h3>Select Saved Address</h3>
                      <div className="addresses-list">
                        {savedAddresses.map((addr) => (
                          <div key={addr.id} className={`address-card ${selectedAddressId === addr.id ? "selected" : ""}`} onClick={() => handleSelectAddress(addr.id)}>
                            <div className="address-radio">
                              <input type="radio" name="savedAddress" checked={selectedAddressId === addr.id} onChange={() => handleSelectAddress(addr.id)} />
                            </div>
                            <div className="address-details">
                              <p><strong>{addr.full_name}</strong></p>
                              <p>{addr.address}, {addr.city}, {addr.state} - {addr.pincode}</p>
                              <p>📞 {addr.phone} | ✉️ {addr.email}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <button className="use-new-address-btn" onClick={handleUseNewAddress}>+ Use New Address</button>
                    </div>
                  )}
                  
                  {(showNewAddressForm || savedAddresses.length === 0) && (
                    <div className="new-address-form">
                      <h3>Add New Address</h3>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Full Name *</label>
                          <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} required />
                        </div>
                        <div className="form-group">
                          <label>Email *</label>
                          <input type="email" name="email" value={formData.email} onChange={handleInputChange} required />
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Phone Number *</label>
                        <div className="phone-verification-group">
                          <input 
                            type="tel" 
                            name="phone" 
                            value={formData.phone} 
                            onChange={handleInputChange} 
                            placeholder="10-digit mobile number" 
                            required 
                            disabled={phoneVerified}
                          />
                          {!phoneVerified && formData.phone && formData.phone.length >= 10 && !otpSent && (
                            <button 
                              type="button" 
                              className="send-otp-btn" 
                              onClick={handleSendOTP} 
                              disabled={isSendingOtp}
                            >
                              {isSendingOtp ? "Sending..." : "📱 Send OTP"}
                            </button>
                          )}
                        </div>
                        {otpSent && !phoneVerified && (
                          <div className="otp-verification-group">
                            <input 
                              type="text" 
                              placeholder="Enter 6-digit OTP" 
                              value={otpCode} 
                              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))} 
                              maxLength="6"
                              className="otp-input"
                              autoFocus
                            />
                            <button type="button" className="verify-otp-btn" onClick={handleVerifyOTP}>
                              ✅ Verify
                            </button>
                            <div className="otp-status">
                              {otpTimer > 0 ? (
                                <span className="otp-timer">
                                  ⏳ OTP expires in {Math.floor(otpTimer / 60)}:{(otpTimer % 60).toString().padStart(2, '0')}
                                </span>
                              ) : (
                                canResend && (
                                  <button 
                                    type="button" 
                                    className="resend-otp-btn" 
                                    onClick={handleResendOTP} 
                                    disabled={isSendingOtp}
                                  >
                                    {isSendingOtp ? "Sending..." : "🔄 Resend OTP"}
                                  </button>
                                )
                              )}
                            </div>
                          </div>
                        )}
                        {phoneVerified && (
                          <div className="verified-badge" style={{color: 'green', fontWeight: 'bold'}}>
                            ✅ Phone Verified
                          </div>
                        )}
                      </div>
                      <div className="form-group">
                        <label>Address *</label>
                        <textarea name="address" value={formData.address} onChange={handleInputChange} rows="3" required />
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>City *</label>
                          <input type="text" name="city" value={formData.city} onChange={handleInputChange} required />
                        </div>
                        <div className="form-group">
                          <label>State *</label>
                          <input type="text" name="state" value={formData.state} onChange={handleInputChange} required />
                        </div>
                        <div className="form-group">
                          <label>Pincode *</label>
                          <input type="text" name="pincode" value={formData.pincode} onChange={handleInputChange} required />
                        </div>
                      </div>
                      {savedAddresses.length > 0 && <button type="button" className="back-to-addresses-btn" onClick={() => setShowNewAddressForm(false)}>← Back to Saved Addresses</button>}
                    </div>
                  )}
                  
                  <button className="continue-btn" onClick={handleContinueToPayment}>
                    Continue to Payment →
                  </button>
                </>
              ) : (
                <>
                  <h2>Payment Method</h2>
                  <div className="payment-methods-list">
                    <div className="payment-method-card selected">
                      <input type="radio" checked readOnly />
                      <div className="payment-method-info">
                        <strong>💵 Cash on Delivery (COD)</strong>
                        <p>Pay when you receive your order</p>
                      </div>
                    </div>
                    <div className="payment-method-card disabled">
                      <input type="radio" disabled />
                      <div className="payment-method-info">
                        <strong>💳 Credit/Debit Card</strong>
                        <p>Coming soon</p>
                      </div>
                    </div>
                    <div className="payment-method-card disabled">
                      <input type="radio" disabled />
                      <div className="payment-method-info">
                        <strong>📱 UPI / Wallet</strong>
                        <p>Coming soon</p>
                      </div>
                    </div>
                  </div>
                  <div className="payment-actions">
                    <button type="button" className="back-btn" onClick={handleBackToAddress}>← Back to Address</button>
                    <button className="place-order-btn" onClick={placeOrder}>Place Order</button>
                  </div>
                </>
              )}
            </div>
            
            <div className="checkout-summary">
              <h2>Order Summary</h2>
              <div className="summary-products">
                {cart.map((item, idx) => {
                  const price = item.priceValue || parseFloat(item.price?.replace('₹', '')) || 0;
                  const qty = item.quantity || 1;
                  // ✅ Display variant if present
                  const displayName = item.variant ? `${item.name} (${item.variant})` : item.name;
                  return (
                    <div key={idx} className="summary-product">
                      <img src={item.image || "/assets/jaggery.png"} alt={item.name} />
                      <div className="summary-product-info">
                        <h4>{displayName}</h4>
                        <p>Qty: {qty}</p>
                      </div>
                      <div className="summary-product-price">₹{price * qty}</div>
                    </div>
                  );
                })}
              </div>
              <div className="summary-totals">
                <div className="summary-row">
                  <span>Subtotal ({cart.reduce((s, i) => s + (i.quantity || 1), 0)} items)</span>
                  <span>₹{subtotal}</span>
                </div>
                <div className="summary-row">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? "Free" : `₹${shipping}`}</span>
                </div>
                {subtotal < 499 && (
                  <div className="shipping-notice">
                    Add ₹{(499 - subtotal).toFixed(2)} more for free shipping
                  </div>
                )}
                <div className="summary-row total">
                  <span>Total</span>
                  <span>₹{total}</span>
                </div>
              </div>
              <div className="secure-info">
                <p>🔒 Secure Checkout</p>
                <p>✅ 100% Safe & Secure Payment</p>
                <p>🚚 Free Shipping on orders above ₹499</p>
                <p>🔄 7-Day Easy Returns</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Checkout;