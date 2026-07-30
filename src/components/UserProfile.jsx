import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import { supabase } from '../supabaseClient';
import "./UserProfile.css";

const UserProfile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [message, setMessage] = useState("");
  const [userOrders, setUserOrders] = useState([]);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: ""
  });

  useEffect(() => {
    checkUserAndLoadProfile();
  }, []);

  const checkUserAndLoadProfile = () => {
    const currentUser = localStorage.getItem("currentUser");
    if (!currentUser) {
      navigate("/login");
      return;
    }
    loadUserProfile();
    loadUserOrders();
  };

  const loadUserProfile = async () => {
    try {
      const currentUser = JSON.parse(localStorage.getItem("currentUser"));
      
      // Get latest data from Supabase
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', currentUser.email)
        .single();
      
      if (error) {
        console.error('Supabase error:', error);
        setUser(currentUser);
        setFormData({
          name: currentUser.name || "",
          email: currentUser.email || "",
          phone: currentUser.phone || "",
          address: currentUser.address || "",
          city: currentUser.city || "",
          state: currentUser.state || "",
          pincode: currentUser.pincode || ""
        });
      } else if (data) {
        setUser(data);
        setFormData({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          address: data.address || "",
          city: data.city || "",
          state: data.state || "",
          pincode: data.pincode || ""
        });
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      const currentUser = JSON.parse(localStorage.getItem("currentUser"));
      setUser(currentUser);
    }
    setLoading(false);
  };

  const loadUserOrders = async () => {
    try {
      const currentUser = JSON.parse(localStorage.getItem("currentUser"));
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('email', currentUser.email)
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setUserOrders(data.slice(0, 5)); // Last 5 orders
      } else {
        // Fallback to localStorage
        const allOrders = JSON.parse(localStorage.getItem("elvreOrders") || "[]");
        const myOrders = allOrders.filter(o => o.email === currentUser.email);
        setUserOrders(myOrders.slice(0, 5));
      }
    } catch (err) {
      console.error('Error loading orders:', err);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSaveProfile = async () => {
    try {
      // Update in Supabase
      const { error } = await supabase
        .from('users')
        .update({
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode
        })
        .eq('email', formData.email);
      
      if (error) {
        console.error('Supabase error:', error);
      } else {
        console.log('Profile updated in Supabase');
      }
      
      // Update localStorage
      const updatedUser = {
        ...user,
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode
      };
      localStorage.setItem("currentUser", JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      setEditMode(false);
      setMessage("Profile updated successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error('Error saving profile:', err);
      setMessage("Failed to update profile");
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("adminLoggedIn");
    navigate("/login");
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="profile-loading">Loading profile...</div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="profile-page">
        <div className="profile-container">
          <div className="profile-header">
            <h1>My Profile</h1>
            <p>Manage your account information</p>
          </div>

          {message && <div className="profile-message success">{message}</div>}

          <div className="profile-grid">
            {/* Left Side - Profile Info */}
            <div className="profile-info-card">
              <div className="profile-avatar">
                <div className="avatar-circle">
                  {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <h3>{user?.name}</h3>
                <p className="profile-email">{user?.email}</p>
              </div>
              
              <div className="profile-stats">
                <div className="stat-item">
                  <span className="stat-number">{userOrders.length}</span>
                  <span className="stat-label">Total Orders</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">
                    {userOrders.reduce((sum, o) => sum + (o.total || 0), 0)}
                  </span>
                  <span className="stat-label">Total Spent (₹)</span>
                </div>
              </div>
              
              <button className="logout-btn" onClick={handleLogout}>
                Logout
              </button>
            </div>

            {/* Right Side - Edit Form */}
            <div className="profile-form-card">
              <div className="form-header">
                <h2>Personal Information</h2>
                {!editMode ? (
                  <button className="edit-btn" onClick={() => setEditMode(true)}>
                    ✏️ Edit Profile
                  </button>
                ) : (
                  <div className="edit-actions">
                    <button className="save-btn" onClick={handleSaveProfile}>Save Changes</button>
                    <button className="cancel-btn" onClick={() => setEditMode(false)}>Cancel</button>
                  </div>
                )}
              </div>

              <div className="profile-form">
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    disabled={!editMode}
                  />
                </div>

                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    disabled={true}
                    className="disabled-field"
                  />
                  <small>Email cannot be changed</small>
                </div>

                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    disabled={!editMode}
                    placeholder="Add your phone number"
                  />
                </div>

                <div className="form-group">
                  <label>Address</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    disabled={!editMode}
                    rows="2"
                    placeholder="Your address"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>City</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      disabled={!editMode}
                    />
                  </div>
                  <div className="form-group">
                    <label>State</label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      disabled={!editMode}
                    />
                  </div>
                  <div className="form-group">
                    <label>Pincode</label>
                    <input
                      type="text"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleInputChange}
                      disabled={!editMode}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Orders Section */}
          <div className="recent-orders-section">
            <h2>Recent Orders</h2>
            {userOrders.length === 0 ? (
              <div className="no-orders">
                <p>No orders yet.</p>
                <button onClick={() => navigate("/products")} className="shop-now-btn">
                  Start Shopping
                </button>
              </div>
            ) : (
              <div className="orders-table-responsive">
                <table className="orders-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Date</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userOrders.map((order) => (
                      <tr key={order.id}>
                        <td>{order.id}</td>
                        <td>{order.order_date || order.orderDate}</td>
                        <td>₹{order.total}</td>
                        <td>
                          <span className={`order-status ${order.status}`}>
                            {order.status}
                          </span>
                        </td>
                        <td>
                          <button 
                            className="view-order-btn"
                            onClick={() => navigate(`/order-tracking/${order.id}`)}
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {userOrders.length > 0 && (
              <button 
                className="view-all-orders-btn"
                onClick={() => navigate("/my-orders")}
              >
                View All Orders →
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default UserProfile;