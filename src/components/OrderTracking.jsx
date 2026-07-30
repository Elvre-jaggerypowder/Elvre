import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import { supabase } from '../supabaseClient';
import { generateOrderInvoice } from '../services/invoiceService';
import "./OrderTracking.css";

const OrderTracking = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  // ─── Load order and set up real‑time subscription ───
  useEffect(() => {
    loadOrder();

    const subscription = supabase
      .channel(`order-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`
        },
        (payload) => {
          console.log('🔄 Order status updated:', payload.new);
          setOrder(prev => ({ ...prev, ...payload.new }));
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [orderId]);

  // ─── LOAD ORDER ───
  const loadOrder = async () => {
    setLoading(true);
    console.log('🔍 Searching for order ID:', orderId);

    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (!error && data) {
        console.log('✅ Order found in Supabase:', data);
        const formattedOrder = {
          id: data.id,
          customer: data.customer,
          email: data.email,
          phone: data.phone,
          address: data.address,
          products: data.products || [],
          subtotal: data.subtotal || 0,
          shipping: data.shipping || 0,
          discount: data.discount || 0,
          total: data.total || 0,
          status: data.status || 'pending',
          paymentMethod: data.payment_method || 'Cash on Delivery',
          orderDate: data.order_date,
          orderTime: data.order_time,
          fullDateTime: `${data.order_date} at ${data.order_time || 'N/A'}`
        };
        setOrder(formattedOrder);
        setLoading(false);
        return;
      }
    } catch (err) {
      console.error('⚠️ Supabase fetch error:', err);
    }

    // Fallback to localStorage
    const localOrders = JSON.parse(localStorage.getItem("elvreOrders") || "[]");
    const foundOrder = localOrders.find(o => o.id === orderId);

    if (foundOrder) {
      console.log('✅ Order found in localStorage:', foundOrder);
      setOrder(foundOrder);
    } else {
      console.log('❌ Order not found:', orderId);
      setOrder(null);
    }
    setLoading(false);
  };

  // ─── HANDLE INVOICE DOWNLOAD ───
  const handleDownloadInvoice = async () => {
    if (downloading) return;
    setDownloading(true);
    const result = await generateOrderInvoice(order);
    if (!result.success) {
      alert('Failed to generate invoice. Please try again.');
    }
    setDownloading(false);
  };

  // ─── STATUS STEPS ───
  const getStatusStep = (currentStatus) => {
    const steps = [
      { key: "pending", label: "Order Placed", icon: "📦", description: "Your order has been received" },
      { key: "processing", label: "Processing", icon: "⚙️", description: "We're preparing your order" },
      { key: "shipped", label: "Shipped", icon: "🚚", description: "Your order is on the way" },
      { key: "delivered", label: "Delivered", icon: "✅", description: "Your order has been delivered" }
    ];
    
    let currentIndex = steps.findIndex(s => s.key === currentStatus);
    if (currentIndex === -1) currentIndex = 0;
    
    return steps.map((step, index) => ({
      ...step,
      completed: index <= currentIndex,
      active: index === currentIndex
    }));
  };

  // ─── LOADING STATE ───
  if (loading) {
    return (
      <>
        <Navbar />
        <div className="tracking-loading">
          <div className="loader"></div>
          <p>Loading order details...</p>
        </div>
      </>
    );
  }

  // ─── NOT FOUND ───
  if (!order) {
    return (
      <>
        <Navbar />
        <div className="order-not-found">
          <div className="not-found-icon">🔍</div>
          <h2>Order Not Found</h2>
          <p>We couldn't find an order with ID: <strong>{orderId}</strong></p>
          <p>Please check your order ID and try again.</p>
          <button onClick={() => navigate("/")} className="back-home-btn">
            Back to Home
          </button>
        </div>
      </>
    );
  }

  const statusSteps = getStatusStep(order.status);

  // ─── MAIN RENDER ───
  return (
    <>
      <Navbar />
      <div className="tracking-container">
        <div className="tracking-wrapper">
          <h1>Track Your Order</h1>
          
          <div className="order-info-card">
            <div className="order-header">
              <div>
                <h3>Order #{order.id}</h3>
                <p className="order-date">
                  Placed on: {order.fullDateTime || `${order.orderDate} at ${order.orderTime || 'N/A'}`}
                </p>
              </div>
              <div className={`order-status-badge status-${order.status}`}>
                {order.status === "pending" && "⏳ Pending"}
                {order.status === "processing" && "⚙️ Processing"}
                {order.status === "shipped" && "🚚 Shipped"}
                {order.status === "delivered" && "✅ Delivered"}
                {order.status === "cancelled" && "❌ Cancelled"}
              </div>
            </div>
            
            <div className="tracking-timeline">
              {statusSteps.map((step, index) => (
                <div key={index} className={`timeline-step ${step.completed ? "completed" : ""} ${step.active ? "active" : ""}`}>
                  <div className="step-icon">{step.icon}</div>
                  <div className="step-content">
                    <h4>{step.label}</h4>
                    <p>{step.description}</p>
                  </div>
                  {index < statusSteps.length - 1 && <div className="step-line"></div>}
                </div>
              ))}
            </div>
          </div>
          
          <div className="order-details-card">
            <h3>Order Details</h3>
            <div className="products-list">
              {order.products && order.products.length > 0 ? (
                order.products.map((product, idx) => {
                  const productPrice = product.price || product.priceValue || 0;
                  const productQty = product.quantity || 1;
                  const productTotal = productPrice * productQty;
                  
                  const displayName = product.variant ? `${product.name} (${product.variant})` : product.name;
                  
                  return (
                    <div key={idx} className="order-product">
                      <img src={product.image || "/assets/jaggery.png"} alt={product.name} className="product-image" />
                      <div className="product-info">
                        <h4>{displayName}</h4>
                        <div className="product-meta">
                          <span className="product-price">₹{productPrice}</span>
                          <span className="product-quantity">Quantity: {productQty}</span>
                        </div>
                      </div>
                      <div className="product-total">₹{productTotal}</div>
                    </div>
                  );
                })
              ) : (
                <p className="no-products-msg">No product details available.</p>
              )}
            </div>
            
            <div className="price-summary">
              <div className="summary-row">
                <span>Subtotal ({order.products?.reduce((sum, p) => sum + (p.quantity || 1), 0) || 0} items):</span>
                <span>₹{order.subtotal || 0}</span>
              </div>
              {order.discount > 0 && (
                <div className="summary-row discount">
                  <span>Discount:</span>
                  <span>-₹{order.discount}</span>
                </div>
              )}
              <div className="summary-row">
                <span>Shipping:</span>
                <span>{order.shipping === 0 ? "Free" : `₹${order.shipping || 0}`}</span>
              </div>
              <div className="summary-row total">
                <span>Total Amount:</span>
                <span>₹{order.total || 0}</span>
              </div>
            </div>

            {/* ✅ DOWNLOAD INVOICE BUTTON */}
            <button 
              className="download-invoice-btn" 
              onClick={handleDownloadInvoice}
              disabled={downloading}
            >
              {downloading ? 'Generating...' : '📄 Download Invoice'}
            </button>
          </div>
          
          <div className="shipping-details-card">
            <div className="details-grid">
              <div className="detail-section">
                <h4>📦 Shipping Address</h4>
                <p>{order.address || "Address not provided"}</p>
                {order.phone && <p className="phone">📞 {order.phone}</p>}
                {order.email && <p className="email">✉️ {order.email}</p>}
              </div>
              <div className="detail-section">
                <h4>💳 Payment Information</h4>
                <p><strong>Method:</strong> {order.paymentMethod || "Cash on Delivery"}</p>
                <p><strong>Status:</strong> {order.paymentMethod === "Cash on Delivery" ? "Pending (Pay on delivery)" : "Paid"}</p>
                <p><strong>Order Date:</strong> {order.orderDate}</p>
              </div>
            </div>
          </div>
          
          <div className="help-section">
            <h3>Need Help With Your Order?</h3>
            <p>If you have any questions about your order, please contact our support team.</p>
            <div className="help-buttons">
              <button onClick={() => navigate("/products")} className="shop-more-btn">
                Continue Shopping
              </button>
              <button onClick={() => window.location.href = "mailto:elvreofficals@gmail.com"} className="contact-btn">
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OrderTracking;