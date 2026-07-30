import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "./Navbar";
import { generateOrderInvoice } from '../services/invoiceService';
import "./OrdersPage.css";

const OrdersPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelOrderId, setCancelOrderId] = useState(null);
  const [message, setMessage] = useState("");
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    checkUserAndLoadOrders();
  }, []);

  const checkUserAndLoadOrders = () => {
    const user = localStorage.getItem("currentUser");
    if (!user) {
      navigate("/login");
      return;
    }
    loadOrders();
  };

  const loadOrders = () => {
    const allOrders = JSON.parse(localStorage.getItem("elvreOrders") || "[]");
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    const userOrders = allOrders.filter(order => order.email === currentUser?.email);
    userOrders.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    setOrders(userOrders);
    setLoading(false);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "pending": return "status-pending";
      case "processing": return "status-processing";
      case "shipped": return "status-shipped";
      case "delivered": return "status-delivered";
      case "cancelled": return "status-cancelled";
      default: return "status-pending";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "pending": return "⏳ Pending";
      case "processing": return "⚙️ Processing";
      case "shipped": return "🚚 Shipped";
      case "delivered": return "✅ Delivered";
      case "cancelled": return "❌ Cancelled";
      default: return "Pending";
    }
  };

  const openCancelModal = (orderId) => {
    setCancelOrderId(orderId);
    setShowCancelModal(true);
  };

  const confirmCancelOrder = () => {
    if (cancelOrderId) {
      const allOrders = JSON.parse(localStorage.getItem("elvreOrders") || "[]");
      const cancelledOrder = allOrders.find(order => order.id === cancelOrderId);
      
      if (cancelledOrder && cancelledOrder.products && cancelledOrder.status !== "cancelled") {
        const allProducts = JSON.parse(localStorage.getItem("elvreProducts") || "[]");
        const updatedProducts = allProducts.map(product => {
          const cancelledItem = cancelledOrder.products.find(item => item.id === product.id);
          if (cancelledItem) {
            const newStock = product.stock + (cancelledItem.quantity || 1);
            return { ...product, stock: newStock };
          }
          return product;
        });
        localStorage.setItem("elvreProducts", JSON.stringify(updatedProducts));
        window.dispatchEvent(new Event("productsUpdated"));
      }
      
      const updatedOrders = allOrders.map(order =>
        order.id === cancelOrderId ? { ...order, status: "cancelled", canCancel: false } : order
      );
      localStorage.setItem("elvreOrders", JSON.stringify(updatedOrders));
      loadOrders();
      setMessage("Order cancelled successfully! Stock has been updated.");
      setShowCancelModal(false);
      setCancelOrderId(null);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const viewOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  const trackOrder = (orderId) => {
    navigate(`/order-tracking/${orderId}`);
  };

  // ✅ Invoice download handler
  const handleDownloadInvoice = async (order) => {
    setDownloadingId(order.id);
    const result = await generateOrderInvoice(order);
    if (!result.success) {
      alert('Failed to generate invoice. Please try again.');
    }
    setDownloadingId(null);
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="orders-loading">Loading your orders...</div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="orders-page">
        <div className="orders-container">
          <div className="orders-header">
            <h1>My Orders</h1>
            <p>View and track all your orders</p>
          </div>

          {message && <div className="order-message">{message}</div>}

          {orders.length === 0 ? (
            <div className="no-orders">
              <div className="no-orders-icon">📦</div>
              <h2>No Orders Yet</h2>
              <p>You haven't placed any orders yet.</p>
              <Link to="/products" className="shop-now-btn">Start Shopping</Link>
            </div>
          ) : (
            <div className="orders-list">
              {orders.map((order) => (
                <div key={order.id} className="order-card">
                  <div className="order-header">
                    <div className="order-info">
                      <span className="order-id">Order #{order.id}</span>
                      <span className="order-date">Placed on: {order.fullDateTime || `${order.orderDate} at ${order.orderTime || "N/A"}`}</span>
                    </div>
                    <div className="order-status">
                      <span className={`status-badge ${getStatusBadgeClass(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </div>
                  </div>

                  <div className="order-products">
                    {order.products && order.products.slice(0, 2).map((product, idx) => (
                      <div key={idx} className="order-product-item">
                        <img src={product.image || "/assets/jaggery.png"} alt={product.name} />
                        <div className="order-product-info">
                          <h4>{product.name}</h4>
                          <p>Qty: {product.quantity} × ₹{product.price}</p>
                        </div>
                        <div className="order-product-price">
                          ₹{product.price * product.quantity}
                        </div>
                      </div>
                    ))}
                    {order.products && order.products.length > 2 && (
                      <div className="more-products">
                        +{order.products.length - 2} more products
                      </div>
                    )}
                  </div>

                  <div className="order-footer">
                    <div className="order-total">
                      <span>Total Amount:</span>
                      <strong>₹{order.total}</strong>
                    </div>
                    <div className="order-buttons">
                      {order.status === "pending" && (
                        <button className="cancel-order-btn" onClick={() => openCancelModal(order.id)}>
                          ❌ Cancel Order
                        </button>
                      )}
                      <button className="track-order-btn" onClick={() => trackOrder(order.id)}>
                        🚚 Track Order
                      </button>
                      <button className="view-details-btn" onClick={() => viewOrderDetails(order)}>
                        View Details
                      </button>
                      {/* ✅ INVOICE DOWNLOAD BUTTON */}
                      <button 
                        className="download-invoice-btn" 
                        onClick={() => handleDownloadInvoice(order)}
                        disabled={downloadingId === order.id}
                      >
                        {downloadingId === order.id ? 'Generating...' : '📄 Download Invoice'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Order Details Modal */}
      {showModal && selectedOrder && (
        <div className="order-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="order-modal" onClick={(e) => e.stopPropagation()}>
            <div className="order-modal-header">
              <h3>Order Details - {selectedOrder.id}</h3>
              <button className="close-modal" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="order-modal-body">
              <div className="order-info-section">
                <h4>Order Timeline</h4>
                <p><strong>Order Date & Time:</strong> {selectedOrder.fullDateTime || `${selectedOrder.orderDate} at ${selectedOrder.orderTime || "N/A"}`}</p>
              </div>
              <div className="order-info-section">
                <h4>Customer Information</h4>
                <p><strong>Name:</strong> {selectedOrder.customer}</p>
                <p><strong>Email:</strong> {selectedOrder.email}</p>
                <p><strong>Phone:</strong> {selectedOrder.phone || "Not provided"}</p>
                <p><strong>Address:</strong> {selectedOrder.address}</p>
              </div>

              <div className="order-info-section">
                <h4>Order Information</h4>
                <p><strong>Order Date:</strong> {selectedOrder.orderDate}</p>
                <p><strong>Order Time:</strong> {selectedOrder.orderTime || "N/A"}</p>
                <p><strong>Payment Method:</strong> {selectedOrder.paymentMethod}</p>
                <p><strong>Status:</strong> <span className={`status-badge ${getStatusBadgeClass(selectedOrder.status)}`}>{getStatusText(selectedOrder.status)}</span></p>
              </div>

              <div className="order-info-section">
                <h4>Products Ordered</h4>
                <table className="order-products-table">
                  <thead>
                    <tr><th>Product</th><th>Quantity</th><th>Price</th><th>Total</th></tr>
                  </thead>
                  <tbody>
                    {selectedOrder.products.map((product, idx) => (
                      <tr key={idx}>
                        <td>{product.name}{product.variant ? ` (${product.variant})` : ''}</td>
                        <td>{product.quantity}</td>
                        <td>₹{product.price}</td>
                        <td>₹{product.price * product.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="subtotal-row"><td colSpan="3">Subtotal</td><td>₹{selectedOrder.subtotal}</td></tr>
                    <tr className="shipping-row"><td colSpan="3">Shipping</td><td>₹{selectedOrder.shipping}</td></tr>
                    {selectedOrder.discount > 0 && <tr className="discount-row"><td colSpan="3">Discount</td><td>-₹{selectedOrder.discount}</td></tr>}
                    <tr className="total-row"><td colSpan="3"><strong>Total</strong></td><td><strong>₹{selectedOrder.total}</strong></td></tr>
                  </tfoot>
                </table>
              </div>

              <div className="order-actions">
                {selectedOrder.status === "pending" && (
                  <button className="cancel-order-modal-btn" onClick={() => {
                    setShowModal(false);
                    openCancelModal(selectedOrder.id);
                  }}>
                    ❌ Cancel Order
                  </button>
                )}
                <button className="track-order-modal-btn" onClick={() => {
                  setShowModal(false);
                  navigate(`/order-tracking/${selectedOrder.id}`);
                }}>
                  🚚 Track Order
                </button>
                <button className="reorder-btn" onClick={() => {
                  setShowModal(false);
                  navigate("/products");
                }}>
                  🛍️ Shop Again
                </button>
                {/* ✅ Invoice download in modal also */}
                <button 
                  className="download-invoice-btn" 
                  onClick={() => {
                    setShowModal(false);
                    handleDownloadInvoice(selectedOrder);
                  }}
                >
                  📄 Download Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="cancel-modal-overlay" onClick={() => setShowCancelModal(false)}>
          <div className="cancel-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cancel-modal-header">
              <div className="cancel-icon">❓</div>
              <h3>Cancel Order</h3>
            </div>
            <div className="cancel-modal-body">
              <p>Are you sure you want to cancel this order?</p>
              <p className="cancel-warning">⚠️ This action cannot be undone.</p>
            </div>
            <div className="cancel-modal-footer">
              <button className="cancel-no-btn" onClick={() => setShowCancelModal(false)}>Go Back</button>
              <button className="cancel-yes-btn" onClick={confirmCancelOrder}>Yes, Cancel Order</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OrdersPage;