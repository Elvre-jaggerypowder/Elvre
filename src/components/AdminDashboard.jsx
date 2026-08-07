import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from '../supabaseClient';
import AdminAnalytics from "./AdminAnalytics";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [allReviews, setAllReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  
  // ─── IMAGE UPLOAD STATES ───
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [uploading, setUploading] = useState(false);
  
  // ─── CONTACT INFO ───
  const [contactInfo, setContactInfo] = useState({
    phone1: "+91 7060998050",
    phone2: "+91 7906396629",
    email: "elvreofficals@gmail.com",
    address: "1st Floor, Sangam Tent House, Jawalapur, Haridwar, Uttrakhand, 249407"
  });
  const [editContactMode, setEditContactMode] = useState(false);
  const [contactFormData, setContactFormData] = useState({
    phone1: "",
    phone2: "",
    email: "",
    address: ""
  });
  
  // ─── COUPON STATE ───
  const [newCoupon, setNewCoupon] = useState({
    code: "",
    discount: "",
    type: "percentage",
    expiryDate: "",
    minOrder: 0,
    maxDiscount: 0,
    usageLimit: 0
  });
  
  // ─── PRODUCT FORM STATE ───
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    priceValue: "",
    stock: "",
    image: "",
    category: "jaggery",
    variants: []
  });

  // ─── AUTH CHECK (FIXED) ───
  useEffect(() => {
    const isAdmin = localStorage.getItem("adminLoggedIn");
    if (!isAdmin) {
      navigate("/login");
    }
  }, [navigate]);

  // ─── LOAD ALL DATA ───
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadProducts(),
        loadOrders(),
        loadUsers(),
        loadFeedbacks(),
        loadCoupons(),
        loadAllReviews(),
        loadContactInfo()
      ]);
    } catch (err) {
      console.error("Error loading data:", err);
      showMessage("Error loading data. Please refresh.", "error");
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (text, type = "success") => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => {
      setMessage("");
      setMessageType("success");
    }, 5000);
  };

  // ─── IMAGE UPLOAD ───
  const uploadImage = async (file) => {
    if (!file) return null;
    setUploading(true);
    try {
      const cleanName = file.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
      const fileName = `${Date.now()}_${cleanName}`;
      const { data, error } = await supabase.storage
        .from('products')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });
      if (error) throw error;
      const { data: urlData } = supabase.storage
        .from('products')
        .getPublicUrl(fileName);
      return urlData.publicUrl;
    } catch (err) {
      console.error('Upload error:', err);
      showMessage("Image upload failed: " + err.message, "error");
      return null;
    } finally {
      setUploading(false);
    }
  };

  // ─── LOAD PRODUCTS ───
  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('id', { ascending: true });
      if (error) throw error;
      if (data && data.length > 0) {
        const formatted = data.map(p => ({
          id: p.id,
          name: p.name,
          description: p.description,
          price: `₹${p.price}`,
          priceValue: p.price,
          stock: p.stock,
          image: p.image,
          category: p.category,
          badge: p.badge,
          soldCount: p.sold_count || 0,
          variants: p.variants || []
        }));
        setProducts(formatted);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error('❌ Error loading products:', err);
      showMessage("Failed to load products: " + err.message, "error");
    }
  };

  // ─── LOAD ORDERS ───
  const loadOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (data && data.length > 0) {
        const formatted = data.map(order => ({
          id: order.id,
          customer: order.customer,
          email: order.email,
          phone: order.phone,
          address: order.address,
          products: order.products,
          subtotal: order.subtotal,
          shipping: order.shipping,
          discount: order.discount || 0,
          total: order.total,
          status: order.status,
          paymentMethod: order.payment_method,
          paymentStatus: order.payment_status || 'pending',
          orderDate: order.order_date,
          orderTime: order.order_time
        }));
        setOrders(formatted);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error('Error loading orders:', err);
      showMessage("Failed to load orders: " + err.message, "error");
    }
  };

  // ─── LOAD USERS (CUSTOMERS) ───
  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, phone, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (data && data.length > 0) {
        const formatted = data.map(user => ({
          id: user.id,
          name: user.name || 'User',
          email: user.email,
          phone: user.phone || 'Not provided',
          createdAt: user.created_at,
          orders: orders.filter(o => o.email === user.email).length
        }));
        setUsers(formatted);
      } else {
        setUsers([]);
      }
    } catch (err) {
      console.error('❌ Error loading users:', err);
      setUsers([]);
    }
  };

  // ─── LOAD FEEDBACKS ───
  const loadFeedbacks = async () => {
    try {
      const { data, error } = await supabase
        .from('Feedbacks')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (data && data.length > 0) {
        setFeedbacks(data);
      } else {
        setFeedbacks([]);
      }
    } catch (err) {
      console.error('Error loading feedbacks:', err);
      showMessage("Failed to load feedbacks: " + err.message, "error");
    }
  };

  // ─── LOAD COUPONS ───
  const loadCoupons = async () => {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (data && data.length > 0) {
        setCoupons(data);
      } else {
        setCoupons([]);
      }
    } catch (err) {
      console.error('Error loading coupons:', err);
      showMessage("Failed to load coupons: " + err.message, "error");
    }
  };

  // ─── LOAD REVIEWS ───
  const loadAllReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (data && data.length > 0) {
        const formatted = data.map(review => ({
          ...review,
          productId: review.product_id,
          productName: review.product_name
        }));
        setAllReviews(formatted);
      } else {
        setAllReviews([]);
      }
    } catch (err) {
      console.error('Error loading reviews:', err);
      showMessage("Failed to load reviews: " + err.message, "error");
    }
  };

  // ─── CONTACT INFO ───
  const loadContactInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('contact_info')
        .select('*')
        .limit(1);
      if (error && error.code !== 'PGRST116') throw error;
      if (data && data.length > 0) {
        const info = data[0];
        setContactInfo({
          phone1: info.phone1 || "+91 7060998050",
          phone2: info.phone2 || "+91 7906396629",
          email: info.email || "elvreofficals@gmail.com",
          address: info.address || "1st Floor, Sangam Tent House, Jawalapur, Haridwar, Uttrakhand, 249407"
        });
        setContactFormData({
          phone1: info.phone1 || "",
          phone2: info.phone2 || "",
          email: info.email || "",
          address: info.address || ""
        });
      }
    } catch (err) {
      console.error('Error loading contact info:', err);
    }
  };

  // ─── SAVE CONTACT INFO (UPSERT) ───
  const saveContactInfo = async () => {
    if (!contactFormData.phone1 || !contactFormData.email || !contactFormData.address) {
      showMessage("Please fill all required fields", "error");
      return;
    }
    try {
      const { data, error: fetchError } = await supabase
        .from('contact_info')
        .select('id')
        .limit(1);
      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

      const payload = {
        phone1: contactFormData.phone1,
        phone2: contactFormData.phone2,
        email: contactFormData.email,
        address: contactFormData.address,
        updated_at: new Date().toISOString()
      };

      let error;
      if (data && data.length > 0) {
        const { error: updateError } = await supabase
          .from('contact_info')
          .update(payload)
          .eq('id', data[0].id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('contact_info')
          .insert([{ ...payload, id: 1 }]);
        error = insertError;
      }
      if (error) throw error;

      setContactInfo(contactFormData);
      setEditContactMode(false);
      showMessage("Contact information updated successfully!", "success");
    } catch (err) {
      console.error('Error updating contact info:', err);
      showMessage("Failed to update contact info: " + err.message, "error");
    }
  };

  // ─── ORDER STATUS ───
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);
      if (error) throw error;
      const updatedOrders = orders.map(order =>
        order.id === orderId ? { ...order, status: newStatus } : order
      );
      setOrders(updatedOrders);
      showMessage(`Order ${orderId} status updated to ${newStatus}`, "success");
    } catch (err) {
      console.error('Error updating order:', err);
      showMessage("Failed to update order: " + err.message, "error");
    }
  };

  // ─── PAYMENT STATUS ───
  const updatePaymentStatus = async (orderId, newPaymentStatus) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ payment_status: newPaymentStatus })
        .eq('id', orderId);
      if (error) throw error;
      const updatedOrders = orders.map(order =>
        order.id === orderId ? { ...order, paymentStatus: newPaymentStatus } : order
      );
      setOrders(updatedOrders);
      showMessage(`Order ${orderId} payment status updated to ${newPaymentStatus}`, "success");
    } catch (err) {
      console.error('Error updating payment:', err);
      showMessage("Failed to update payment: " + err.message, "error");
    }
  };

  // ─── PRODUCT CRUD ───
  const resetForm = () => {
    setFormData({ name: "", description: "", priceValue: "", stock: "", image: "", category: "jaggery", variants: [] });
    setImageFile(null);
    setImagePreview("");
    setEditingProduct(null);
    setShowAddForm(false);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      priceValue: product.priceValue,
      stock: product.stock,
      image: product.image,
      category: product.category || "jaggery",
      variants: product.variants ? [...product.variants] : []
    });
    setImagePreview(product.image || "");
    setImageFile(null);
    setShowAddForm(true);
  };

  const handleAddProduct = async () => {
    if (!formData.name || !formData.priceValue || !formData.stock) {
      showMessage("Please fill all required fields", "error");
      return;
    }
    let imageUrl = "/assets/jaggery.png";
    if (imageFile) {
      const uploaded = await uploadImage(imageFile);
      if (uploaded) imageUrl = uploaded;
      else return;
    }
    const newProduct = {
      id: Date.now(),
      name: formData.name,
      description: formData.description || "Pure & Natural",
      price: parseFloat(formData.priceValue),
      stock: parseInt(formData.stock),
      image: imageUrl,
      category: formData.category,
      badge: "New",
      sold_count: 0,
      variants: formData.variants.filter(v => v.label && v.price),
      created_at: new Date().toISOString()
    };
    try {
      const { error } = await supabase.from('products').insert([newProduct]);
      if (error) throw error;
      const formattedProduct = { ...newProduct, price: `₹${newProduct.price}` };
      setProducts([...products, formattedProduct]);
      resetForm();
      showMessage("Product added successfully!", "success");
    } catch (err) {
      console.error('❌ Error adding product:', err);
      showMessage("Failed to add product: " + err.message, "error");
    }
  };

  const handleUpdateProduct = async () => {
    if (!formData.name || !formData.priceValue || !formData.stock) {
      showMessage("Please fill all required fields", "error");
      return;
    }
    let imageUrl = editingProduct.image || "/assets/jaggery.png";
    if (imageFile) {
      const uploaded = await uploadImage(imageFile);
      if (uploaded) imageUrl = uploaded;
      else return;
    }
    const updatedProduct = {
      ...editingProduct,
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.priceValue),
      stock: parseInt(formData.stock),
      image: imageUrl,
      category: formData.category,
      variants: formData.variants.filter(v => v.label && v.price),
      badge: editingProduct.badge || "New"
    };
    try {
      const { error } = await supabase
        .from('products')
        .update({
          name: updatedProduct.name,
          description: updatedProduct.description,
          price: updatedProduct.price,
          stock: updatedProduct.stock,
          image: updatedProduct.image,
          category: updatedProduct.category,
          badge: updatedProduct.badge,
          variants: updatedProduct.variants
        })
        .eq('id', editingProduct.id);
      if (error) throw error;
      const updatedProducts = products.map(p =>
        p.id === editingProduct.id ? { ...updatedProduct, price: `₹${updatedProduct.price}` } : p
      );
      setProducts(updatedProducts);
      resetForm();
      showMessage("Product updated successfully!", "success");
    } catch (err) {
      console.error('❌ Error updating product:', err);
      showMessage("Failed to update product: " + err.message, "error");
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      const updatedProducts = products.filter(p => p.id !== id);
      setProducts(updatedProducts);
      showMessage("Product deleted successfully!", "success");
    } catch (err) {
      console.error('❌ Error deleting product:', err);
      showMessage("Failed to delete product: " + err.message, "error");
    }
  };

  // ─── VARIANT HELPERS ───
  const addVariantRow = () => {
    setFormData({
      ...formData,
      variants: [...formData.variants, { label: "", price: "", stock: "" }]
    });
  };
  const removeVariantRow = (index) => {
    const newVariants = formData.variants.filter((_, i) => i !== index);
    setFormData({ ...formData, variants: newVariants });
  };
  const handleVariantChange = (index, field, value) => {
    const newVariants = [...formData.variants];
    newVariants[index][field] = value;
    setFormData({ ...formData, variants: newVariants });
  };

  // ─── COUPON CRUD ───
  const handleCreateCoupon = async () => {
    if (!newCoupon.code || !newCoupon.discount || !newCoupon.expiryDate) {
      showMessage("Please fill all required fields", "error");
      return;
    }
    if (coupons.find(c => c.code === newCoupon.code.toUpperCase())) {
      showMessage("Coupon code already exists!", "error");
      return;
    }
    const coupon = {
      id: Date.now(),
      code: newCoupon.code.toUpperCase(),
      discount: parseFloat(newCoupon.discount),
      type: newCoupon.type,
      expiry_date: newCoupon.expiryDate,
      min_order: parseFloat(newCoupon.minOrder) || 0,
      max_discount: parseFloat(newCoupon.maxDiscount) || 0,
      usage_limit: parseInt(newCoupon.usageLimit) || 0,
      used_count: 0,
      active: true,
      created_at: new Date().toISOString()
    };
    try {
      const { error } = await supabase.from('coupons').insert([coupon]);
      if (error) throw error;
      setCoupons([...coupons, coupon]);
      setNewCoupon({ code: "", discount: "", type: "percentage", expiryDate: "", minOrder: 0, maxDiscount: 0, usageLimit: 0 });
      showMessage("Coupon created successfully!", "success");
    } catch (err) {
      console.error('Error creating coupon:', err);
      showMessage("Failed to create coupon: " + err.message, "error");
    }
  };

  const toggleCouponStatus = async (couponId) => {
    const coupon = coupons.find(c => c.id === couponId);
    const newStatus = !coupon.active;
    try {
      const { error } = await supabase
        .from('coupons')
        .update({ active: newStatus })
        .eq('id', couponId);
      if (error) throw error;
      const updatedCoupons = coupons.map(c =>
        c.id === couponId ? { ...c, active: newStatus } : c
      );
      setCoupons(updatedCoupons);
      showMessage("Coupon status updated!", "success");
    } catch (err) {
      console.error('Error updating coupon:', err);
      showMessage("Failed to update coupon: " + err.message, "error");
    }
  };

  const deleteCoupon = async (couponId) => {
    if (!window.confirm("Delete this coupon?")) return;
    try {
      const { error } = await supabase.from('coupons').delete().eq('id', couponId);
      if (error) throw error;
      const updatedCoupons = coupons.filter(c => c.id !== couponId);
      setCoupons(updatedCoupons);
      showMessage("Coupon deleted!", "success");
    } catch (err) {
      console.error('Error deleting coupon:', err);
      showMessage("Failed to delete coupon: " + err.message, "error");
    }
  };

  // ─── REVIEW MANAGEMENT ───
  const approveReview = async (reviewId) => {
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ approved: true, spam: false })
        .eq('id', reviewId);
      if (error) throw error;
      const updatedReviews = allReviews.map(r =>
        r.id === reviewId ? { ...r, approved: true, spam: false } : r
      );
      setAllReviews(updatedReviews);
      showMessage("Review approved!", "success");
    } catch (err) {
      console.error('Error approving review:', err);
      showMessage("Failed to approve review: " + err.message, "error");
    }
  };

  const deleteReview = async (reviewId) => {
    if (!window.confirm("Delete this review permanently?")) return;
    try {
      const { error } = await supabase.from('reviews').delete().eq('id', reviewId);
      if (error) throw error;
      const updatedReviews = allReviews.filter(r => r.id !== reviewId);
      setAllReviews(updatedReviews);
      showMessage("Review deleted!", "success");
    } catch (err) {
      console.error('Error deleting review:', err);
      showMessage("Failed to delete review: " + err.message, "error");
    }
  };

  const markAsSpam = async (reviewId) => {
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ spam: true, approved: false })
        .eq('id', reviewId);
      if (error) throw error;
      const updatedReviews = allReviews.map(r =>
        r.id === reviewId ? { ...r, spam: true, approved: false } : r
      );
      setAllReviews(updatedReviews);
      showMessage("Review marked as spam!", "success");
    } catch (err) {
      console.error('Error marking review as spam:', err);
      showMessage("Failed to mark review as spam: " + err.message, "error");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminLoggedIn");
    localStorage.removeItem("adminEmail");
    window.location.href = "/";
  };

  const isExpired = (expiryDate) => new Date(expiryDate) < new Date();

  // ─── STATS ───
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === "pending" || o.status === "processing").length;
  const totalProducts = products.length;
  const lowStockProducts = products.filter(p => p.stock < 20).length;
  const totalUsers = users.length;
  const totalFeedbacks = feedbacks.length;
  const pendingPayments = orders.filter(o => o.paymentStatus === "pending").length;
  const pendingRefunds = orders.filter(o => o.status === "cancelled" && o.paymentStatus !== "refunded").length;
  const recentOrders = orders.slice(0, 5);
  const topProducts = [...products].sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0)).slice(0, 5);

  if (loading) {
    return <div className="admin-loading">Loading Dashboard...</div>;
  }

  // ─── RENDER ───
  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <div className="admin-header-content">
          <img src={`${process.env.PUBLIC_URL}/assets/ELVRElogo1.png`} alt="Logo" className="admin-logo" />
          <div className="admin-title">
            <h1>ELVRE Admin Dashboard</h1>
            <p>Manage your store efficiently</p>
          </div>
          <button onClick={handleLogout} className="admin-logout-btn">Logout</button>
        </div>
      </div>

      <div className="admin-stats-grid">
        <div className="stat-card"><div className="stat-icon">💰</div><div className="stat-info"><h3>₹{totalRevenue.toLocaleString()}</h3><p>Total Revenue</p></div></div>
        <div className="stat-card"><div className="stat-icon">📦</div><div className="stat-info"><h3>{totalOrders}</h3><p>Total Orders</p></div></div>
        <div className="stat-card"><div className="stat-icon">⏳</div><div className="stat-info"><h3>{pendingOrders}</h3><p>Pending Orders</p></div></div>
        <div className="stat-card"><div className="stat-icon">🛍️</div><div className="stat-info"><h3>{totalProducts}</h3><p>Total Products</p></div></div>
        <div className="stat-card"><div className="stat-icon">⚠️</div><div className="stat-info"><h3>{lowStockProducts}</h3><p>Low Stock Items</p></div></div>
        <div className="stat-card"><div className="stat-icon">👥</div><div className="stat-info"><h3>{totalUsers}</h3><p>Total Customers</p></div></div>
        <div className="stat-card"><div className="stat-icon">💬</div><div className="stat-info"><h3>{totalFeedbacks}</h3><p>Total Feedbacks</p></div></div>
        <div className="stat-card"><div className="stat-icon">💳</div><div className="stat-info"><h3>{pendingPayments}</h3><p>Pending Payments</p></div></div>
        <div className="stat-card"><div className="stat-icon">🔄</div><div className="stat-info"><h3>{pendingRefunds}</h3><p>Refund Requests</p></div></div>
      </div>

      <div className="admin-tabs">
        <button className={activeTab === "dashboard" ? "tab-active" : "tab"} onClick={() => setActiveTab("dashboard")}>📊 Dashboard</button>
        <button className={activeTab === "products" ? "tab-active" : "tab"} onClick={() => setActiveTab("products")}>🛍️ Products</button>
        <button className={activeTab === "orders" ? "tab-active" : "tab"} onClick={() => setActiveTab("orders")}>📋 Orders</button>
        <button className={activeTab === "payments" ? "tab-active" : "tab"} onClick={() => setActiveTab("payments")}>💳 Payments</button>
        <button className={activeTab === "coupons" ? "tab-active" : "tab"} onClick={() => setActiveTab("coupons")}>🎫 Coupons</button>
        <button className={activeTab === "reviews" ? "tab-active" : "tab"} onClick={() => setActiveTab("reviews")}>⭐ Reviews</button>
        <button className={activeTab === "customers" ? "tab-active" : "tab"} onClick={() => setActiveTab("customers")}>👥 Customers</button>
        <button className={activeTab === "feedbacks" ? "tab-active" : "tab"} onClick={() => setActiveTab("feedbacks")}>💬 Feedbacks</button>
        <button className={activeTab === "contact" ? "tab-active" : "tab"} onClick={() => setActiveTab("contact")}>📞 Contact Settings</button>
        <button className={activeTab === "analytics" ? "tab-active" : "tab"} onClick={() => setActiveTab("analytics")}>📊 Analytics</button>
      </div>

      <div className="admin-container">
        {message && (
          <div className={`admin-message ${messageType === "error" ? "admin-message-error" : "admin-message-success"}`}>
            {message}
          </div>
        )}

        {activeTab === "dashboard" && (
          <>
            <div className="dashboard-section">
              <h3>Recent Orders</h3>
              <div className="table-responsive">
                <table className="admin-table">
                  <thead><tr><th>Order ID</th><th>Customer</th><th>Amount</th><th>Status</th><th>Payment</th><th>Date</th><th>Action</th></tr></thead>
                  <tbody>
                    {recentOrders.length === 0 ? (
                      <tr><td colSpan="7" className="no-data">No orders yet</td></tr>
                    ) : (
                      recentOrders.map(order => (
                        <tr key={order.id}>
                          <td>{order.id}</td>
                          <td>{order.customer}</td>
                          <td>₹{order.total}</td>
                          <td><span className={`status-badge status-${order.status}`}>{order.status}</span></td>
                          <td><span className={`payment-badge ${order.paymentStatus === "paid" ? "paid" : "pending"}`}>{order.paymentStatus || "pending"}</span></td>
                          <td>{order.orderDate}</td>
                          <td><button className="view-btn" onClick={() => { setSelectedOrder(order); setShowOrderModal(true); }}>View</button></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="dashboard-section">
              <h3>Top Selling Products</h3>
              <div className="top-products-grid">
                {topProducts.length === 0 ? <p>No products yet</p> : topProducts.map(product => (
                  <div key={product.id} className="top-product-card">
                    <img src={product.image} alt={product.name} />
                    <div className="top-product-info">
                      <h4>{product.name}</h4>
                      <p>Sold: {product.soldCount || 0} units</p>
                      <p>Revenue: ₹{((product.priceValue || 0) * (product.soldCount || 0)).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="quick-actions">
              <h3>Quick Actions</h3>
              <div className="action-buttons">
                <button onClick={() => setActiveTab("products")} className="quick-btn">➕ Add Product</button>
                <button onClick={() => setActiveTab("orders")} className="quick-btn">📋 View Orders</button>
                <button onClick={() => setActiveTab("coupons")} className="quick-btn">🎫 Create Coupon</button>
                <button onClick={() => window.open("/products", "_blank")} className="quick-btn">🛍️ Visit Store</button>
              </div>
            </div>
          </>
        )}

        {activeTab === "products" && (
          <>
            <div className="admin-actions">
              <button onClick={() => { resetForm(); setShowAddForm(true); }} className="admin-add-btn">+ Add New Product</button>
            </div>
            {showAddForm && (
              <div className="admin-product-form">
                <h3>{editingProduct ? "Edit Product" : "Add New Product"}</h3>
                <div className="admin-form-grid">
                  <div className="admin-field"><label>Product Name *</label><input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Product name" /></div>
                  <div className="admin-field"><label>Description</label><textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Product description" rows="2" /></div>
                  <div className="admin-field"><label>Price (₹) *</label><input type="number" value={formData.priceValue} onChange={(e) => setFormData({...formData, priceValue: e.target.value})} placeholder="Price" /></div>
                  <div className="admin-field"><label>Stock *</label><input type="number" value={formData.stock} onChange={(e) => setFormData({...formData, stock: e.target.value})} placeholder="Stock" /></div>
                  <div className="admin-field"><label>Category</label><select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}><option value="jaggery">Jaggery</option><option value="organic">Organic</option><option value="special">Special</option></select></div>
                  <div className="admin-field">
                    <label>Product Image</label>
                    <input type="file" accept="image/*" onChange={(e) => { const file = e.target.files[0]; if (file) { setImageFile(file); setImagePreview(URL.createObjectURL(file)); } }} />
                    {imagePreview && <div style={{ marginTop: '8px' }}><img src={imagePreview} alt="Preview" style={{ maxWidth: '100px', borderRadius: '8px' }} /><p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>Preview</p></div>}
                    {editingProduct && !imageFile && editingProduct.image && <div style={{ marginTop: '8px' }}><img src={editingProduct.image} alt="Current" style={{ maxWidth: '80px', borderRadius: '8px' }} /><p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>Current image</p></div>}
                    {uploading && <p style={{ color: '#8B5E3C', marginTop: '4px' }}>⏳ Uploading...</p>}
                  </div>
                  <div className="admin-field full-width">
                    <label>Product Variants (Weight/Size)</label>
                    {formData.variants && formData.variants.map((variant, index) => (
                      <div key={index} className="variant-row" style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                        <input type="text" placeholder="Label (e.g. 500g)" value={variant.label} onChange={(e) => handleVariantChange(index, 'label', e.target.value)} style={{ flex: 2, padding: '6px 10px', borderRadius: '4px', border: '1px solid #ddd' }} />
                        <input type="number" placeholder="Price (₹)" value={variant.price} onChange={(e) => handleVariantChange(index, 'price', e.target.value)} style={{ flex: 1, padding: '6px 10px', borderRadius: '4px', border: '1px solid #ddd' }} />
                        <input type="number" placeholder="Stock" value={variant.stock} onChange={(e) => handleVariantChange(index, 'stock', e.target.value)} style={{ flex: 1, padding: '6px 10px', borderRadius: '4px', border: '1px solid #ddd' }} />
                        <button type="button" onClick={() => removeVariantRow(index)} style={{ background: 'transparent', border: 'none', color: 'red', cursor: 'pointer', fontSize: '18px' }}>✕</button>
                      </div>
                    ))}
                    <button type="button" onClick={addVariantRow} className="add-variant-btn" style={{ marginTop: '8px', padding: '4px 12px', background: '#f1a40f', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>+ Add Variant</button>
                  </div>
                </div>
                <div className="admin-form-buttons">
                  <button onClick={editingProduct ? handleUpdateProduct : handleAddProduct} className="admin-save-btn" disabled={uploading}>
                    {uploading ? "Uploading..." : (editingProduct ? "Update" : "Save")}
                  </button>
                  <button onClick={resetForm} className="admin-cancel-btn">Cancel</button>
                </div>
              </div>
            )}
            <div className="admin-products-table">
              <h3>Product Inventory ({products.length} items)</h3>
              <div className="table-responsive">
                <table className="admin-table">
                  <thead><tr><th>Image</th><th>Product</th><th>Price</th><th>Stock</th><th>Sold</th><th>Revenue</th><th>Variants</th><th>Actions</th></tr></thead>
                  <tbody>
                    {products.map(product => (
                      <tr key={product.id}>
                        <td><img src={product.image} alt={product.name} className="admin-product-img" /></td>
                        <td><strong>{product.name}</strong><br /><small>{product.description}</small></td>
                        <td>{product.price}</td>
                        <td><span className={product.stock > 0 ? "stock-badge in-stock" : "stock-badge out-of-stock"}>{product.stock} units</span></td>
                        <td>{product.soldCount || 0}</td>
                        <td>₹{((product.priceValue || 0) * (product.soldCount || 0)).toLocaleString()}</td>
                        <td>{product.variants && product.variants.length > 0 ? product.variants.map(v => v.label).join(', ') : 'None'}</td>
                        <td><button onClick={() => handleEditProduct(product)} className="admin-edit-btn">Edit</button><button onClick={() => handleDeleteProduct(product.id)} className="admin-delete-btn">Delete</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === "orders" && (
          <div className="admin-orders-section">
            <h3>All Orders ({orders.length})</h3>
            <div className="table-responsive">
              <table className="admin-table orders-table">
                <thead><tr><th>Order ID</th><th>Customer</th><th>Amount</th><th>Status</th><th>Payment</th><th>Date</th><th>Action</th></tr></thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order.id}>
                      <td>{order.id}</td>
                      <td>{order.customer}</td>
                      <td>₹{order.total}</td>
                      <td><select value={order.status} onChange={(e) => updateOrderStatus(order.id, e.target.value)} className={`status-select status-${order.status}`}><option value="pending">Pending</option><option value="processing">Processing</option><option value="shipped">Shipped</option><option value="delivered">Delivered</option><option value="cancelled">Cancelled</option></select></td>
                      <td><select value={order.paymentStatus || "pending"} onChange={(e) => updatePaymentStatus(order.id, e.target.value)} className="payment-select"><option value="pending">Pending</option><option value="paid">Paid</option><option value="failed">Failed</option><option value="refunded">Refunded</option></select></td>
                      <td>{order.orderDate}</td>
                      <td><button className="view-btn" onClick={() => { setSelectedOrder(order); setShowOrderModal(true); }}>View</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "payments" && (
          <div className="admin-payments-section">
            <h3>Payment Management</h3>
            <div className="payment-stats">
              <div className="payment-stat-card"><div className="payment-stat-icon">💰</div><div><h4>Total Collected</h4><p>₹{orders.filter(o => o.paymentStatus === "paid").reduce((s, o) => s + (o.total || 0), 0).toLocaleString()}</p></div></div>
              <div className="payment-stat-card"><div className="payment-stat-icon">⏳</div><div><h4>Pending Payments</h4><p>{orders.filter(o => o.paymentStatus === "pending").length} orders</p></div></div>
              <div className="payment-stat-card"><div className="payment-stat-icon">🔄</div><div><h4>Refund Requests</h4><p>{orders.filter(o => o.status === "cancelled" && o.paymentStatus !== "refunded").length} requests</p></div></div>
            </div>
            <div className="table-responsive">
              <table className="admin-table">
                <thead><tr><th>Order ID</th><th>Customer</th><th>Amount</th><th>Payment Method</th><th>Payment Status</th><th>Action</th></tr></thead>
                <tbody>
                  {orders.filter(o => o.paymentStatus !== "paid").map(order => (
                    <tr key={order.id}>
                      <td>{order.id}</td>
                      <td>{order.customer}</td>
                      <td>₹{order.total}</td>
                      <td>{order.paymentMethod}</td>
                      <td><span className={`payment-badge ${order.paymentStatus === "paid" ? "paid" : "pending"}`}>{order.paymentStatus || "pending"}</span></td>
                      <td><button className="mark-paid-btn" onClick={() => updatePaymentStatus(order.id, "paid")}>Mark as Paid</button><button className="refund-btn" onClick={() => updatePaymentStatus(order.id, "refunded")}>Refund</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "coupons" && (
          <div className="admin-coupons-section">
            <h3>Coupon & Discount Management</h3>
            <div className="create-coupon-form">
              <h4>Create New Coupon</h4>
              <div className="form-grid">
                <input type="text" placeholder="Coupon Code" value={newCoupon.code} onChange={(e) => setNewCoupon({...newCoupon, code: e.target.value.toUpperCase()})} />
                <input type="number" placeholder="Discount" value={newCoupon.discount} onChange={(e) => setNewCoupon({...newCoupon, discount: e.target.value})} />
                <select value={newCoupon.type} onChange={(e) => setNewCoupon({...newCoupon, type: e.target.value})}><option value="percentage">Percentage (%)</option><option value="fixed">Fixed Amount (₹)</option></select>
                <input type="date" value={newCoupon.expiryDate} onChange={(e) => setNewCoupon({...newCoupon, expiryDate: e.target.value})} />
                <input type="number" placeholder="Min Order (₹)" value={newCoupon.minOrder} onChange={(e) => setNewCoupon({...newCoupon, minOrder: e.target.value})} />
                <input type="number" placeholder="Max Discount (₹)" value={newCoupon.maxDiscount} onChange={(e) => setNewCoupon({...newCoupon, maxDiscount: e.target.value})} />
                <input type="number" placeholder="Usage Limit" value={newCoupon.usageLimit} onChange={(e) => setNewCoupon({...newCoupon, usageLimit: e.target.value})} />
              </div>
              <button className="create-coupon-btn" onClick={handleCreateCoupon}>+ Create Coupon</button>
            </div>
            <div className="coupons-list">
              <h4>Active Coupons</h4>
              <div className="table-responsive">
                <table className="admin-table">
                  <thead><tr><th>Code</th><th>Discount</th><th>Min Order</th><th>Expiry Date</th><th>Used</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody>
                    {coupons.map(coupon => (
                      <tr key={coupon.id} className={!coupon.active ? "inactive-coupon" : ""}>
                        <td><strong>{coupon.code}</strong></td>
                        <td>{coupon.discount}{coupon.type === "percentage" ? "%" : "₹"}</td>
                        <td>₹{coupon.min_order || 0}</td>
                        <td className={isExpired(coupon.expiry_date) ? "expired" : ""}>{coupon.expiry_date}{isExpired(coupon.expiry_date) && " (Expired)"}</td>
                        <td>{coupon.used_count} / {coupon.usage_limit || "∞"}</td>
                        <td><span className={`coupon-status ${coupon.active ? "active" : "inactive"}`}>{coupon.active ? "Active" : "Inactive"}</span></td>
                        <td><button className="toggle-status-btn" onClick={() => toggleCouponStatus(coupon.id)}>{coupon.active ? "Deactivate" : "Activate"}</button>
                        <button className="delete-coupon-btn" onClick={() => deleteCoupon(coupon.id)}>Delete</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "reviews" && (
          <div className="admin-reviews-section">
            <h3>Review Management</h3>
            <div className="reviews-stats">
              <div className="stat-box"><span className="stat-number">{allReviews.length}</span><span className="stat-label">Total Reviews</span></div>
              <div className="stat-box"><span className="stat-number">{allReviews.filter(r => r.rating >= 4).length}</span><span className="stat-label">Positive (4-5⭐)</span></div>
              <div className="stat-box"><span className="stat-number">{allReviews.filter(r => r.rating <= 2).length}</span><span className="stat-label">Negative (1-2⭐)</span></div>
            </div>
            <div className="reviews-list">
              {allReviews.map((review, idx) => (
                <div key={idx} className="review-item">
                  <div className="review-product-info"><img src={review.productImage || "/assets/jaggery.png"} alt={review.productName} /><div><h4>{review.productName}</h4><p>Product ID: {review.productId}</p></div></div>
                  <div className="review-content"><div className="reviewer-info"><strong>{review.name}</strong><div className="review-stars">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</div><span className="review-date">{review.date}</span>{review.verified && <span className="verified-badge">✓ Verified</span>}{review.spam && <span className="spam-badge">⚠️ Spam</span>}</div><p className="review-comment">{review.comment}</p></div>
                  <div className="review-actions">{!review.approved && !review.spam && <button className="approve-btn" onClick={() => approveReview(review.id)}>✓ Approve</button>}<button className="spam-btn" onClick={() => markAsSpam(review.id)}>🚫 Mark Spam</button><button className="delete-btn" onClick={() => deleteReview(review.id)}>🗑️ Delete</button></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "customers" && (
          <div className="admin-customers-section">
            <h3>Registered Customers ({users.length})</h3>
            <div className="table-responsive">
              <table className="admin-table">
                <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Registered Date</th><th>Orders</th></tr></thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>{user.phone || 'Not provided'}</td>
                      <td>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</td>
                      <td>{orders.filter(o => o.email === user.email).length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "feedbacks" && (
          <div className="admin-feedbacks-section">
            <h3>Customer Feedbacks ({feedbacks.length})</h3>
            <div className="table-responsive">
              <table className="admin-table">
                <thead><tr><th>#</th><th>Name</th><th>Email</th><th>Message</th><th>Date</th></tr></thead>
                <tbody>
                  {feedbacks.map((fb, idx) => (
                    <tr key={fb.id || idx}>
                      <td>{idx + 1}</td>
                      <td>{fb.name}</td>
                      <td>{fb.email}</td>
                      <td>{fb.message}</td>
                      <td>{fb.date || (fb.created_at ? new Date(fb.created_at).toLocaleDateString() : 'N/A')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "contact" && (
          <div className="admin-contact-section">
            <h3>📞 Contact Information Management</h3>
            <p className="section-subtitle">Update contact details that appear on the website</p>
            {!editContactMode ? (
              <div className="contact-info-display">
                <div className="contact-info-card">
                  <div className="contact-info-item"><span className="contact-label">📞 Phone 1</span><span className="contact-value">{contactInfo.phone1}</span></div>
                  <div className="contact-info-item"><span className="contact-label">📞 Phone 2</span><span className="contact-value">{contactInfo.phone2}</span></div>
                  <div className="contact-info-item"><span className="contact-label">✉️ Email</span><span className="contact-value">{contactInfo.email}</span></div>
                  <div className="contact-info-item"><span className="contact-label">📍 Address</span><span className="contact-value">{contactInfo.address}</span></div>
                </div>
                <button className="edit-contact-btn" onClick={() => { setEditContactMode(true); setContactFormData(contactInfo); }}>✏️ Edit Contact Info</button>
              </div>
            ) : (
              <div className="contact-edit-form">
                <h4>Edit Contact Information</h4>
                <div className="admin-form-grid">
                  <div className="admin-field"><label>Phone Number 1 *</label><input type="text" value={contactFormData.phone1} onChange={(e) => setContactFormData({...contactFormData, phone1: e.target.value})} placeholder="+91 7060998050" /></div>
                  <div className="admin-field"><label>Phone Number 2</label><input type="text" value={contactFormData.phone2} onChange={(e) => setContactFormData({...contactFormData, phone2: e.target.value})} placeholder="+91 7906396629" /></div>
                  <div className="admin-field"><label>Email Address *</label><input type="email" value={contactFormData.email} onChange={(e) => setContactFormData({...contactFormData, email: e.target.value})} placeholder="contact@email.com" /></div>
                  <div className="admin-field full-width"><label>Address *</label><textarea value={contactFormData.address} onChange={(e) => setContactFormData({...contactFormData, address: e.target.value})} rows="3" placeholder="Full address" /></div>
                </div>
                <div className="admin-form-buttons">
                  <button className="admin-save-btn" onClick={saveContactInfo}>💾 Save Changes</button>
                  <button className="admin-cancel-btn" onClick={() => { setEditContactMode(false); setContactFormData(contactInfo); }}>Cancel</button>
                </div>
              </div>
            )}
            <div className="contact-info-note"><p>💡 Changes will reflect immediately on the website's contact section.</p></div>
          </div>
        )}

        {activeTab === "analytics" && <AdminAnalytics />}
      </div>

      {showOrderModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowOrderModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h3>Order Details - {selectedOrder.id}</h3><button className="modal-close" onClick={() => setShowOrderModal(false)}>×</button></div>
            <div className="modal-body">
              <div className="order-info-section"><h4>Customer Information</h4><div className="order-info-row"><strong>Name:</strong> {selectedOrder.customer}</div><div className="order-info-row"><strong>Email:</strong> {selectedOrder.email}</div><div className="order-info-row"><strong>Phone:</strong> {selectedOrder.phone || "Not provided"}</div><div className="order-info-row"><strong>Address:</strong> {selectedOrder.address}</div></div>
              <div className="order-info-section"><h4>Order Information</h4><div className="order-info-row"><strong>Order Date:</strong> {selectedOrder.orderDate}</div><div className="order-info-row"><strong>Payment Method:</strong> {selectedOrder.paymentMethod}</div><div className="order-info-row"><strong>Payment Status:</strong> <span className={`payment-badge ${selectedOrder.paymentStatus === "paid" ? "paid" : "pending"}`}>{selectedOrder.paymentStatus || "pending"}</span></div><div className="order-info-row"><strong>Order Status:</strong> <span className={`status-badge status-${selectedOrder.status}`}>{selectedOrder.status}</span></div></div>
              <div className="order-info-section"><h4>Products Ordered</h4><div className="order-products-table"><div className="order-products-header"><span>Product</span><span>Quantity</span><span>Price</span><span>Total</span></div>{selectedOrder.products && selectedOrder.products.map((p, idx) => (<div key={idx} className="order-products-row"><span className="product-name-cell">{p.name}</span><span className="product-qty-cell">x{p.quantity}</span><span className="product-price-cell">₹{p.price}</span><span className="product-total-cell">₹{p.price * p.quantity}</span></div>))}</div></div>
              <div className="order-total-section"><div className="total-row"><span>Subtotal:</span><span>₹{selectedOrder.subtotal}</span></div><div className="total-row"><span>Shipping:</span><span>₹{selectedOrder.shipping}</span></div>{selectedOrder.discount > 0 && <div className="total-row discount"><span>Discount:</span><span>-₹{selectedOrder.discount}</span></div>}<div className="total-row grand-total"><span>Grand Total:</span><span>₹{selectedOrder.total}</span></div></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;