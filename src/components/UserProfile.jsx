import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import { supabase } from '../supabaseClient';
import "./UserProfile.css";

const emptyAddressForm = {
  fullName: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  pincode: ""
};

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
    phone: ""
  });

  // ✅ Saved addresses now come from the SAME `addresses` table that
  // Checkout reads from — so an address added/edited here shows up as a
  // selectable saved address at checkout, and vice versa. Previously the
  // profile page saved address/city/state/pincode onto the `users` row,
  // which Checkout never looked at — the two were completely disconnected.
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [showAddAddressForm, setShowAddAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState(emptyAddressForm);
  const [savingAddress, setSavingAddress] = useState(false);

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
    loadSavedAddresses();
  };

  const loadUserProfile = async () => {
    try {
      const currentUser = JSON.parse(localStorage.getItem("currentUser"));

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
          phone: currentUser.phone || ""
        });
      } else if (data) {
        setUser(data);
        setFormData({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || ""
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
        setUserOrders(data.slice(0, 5));
      } else {
        const allOrders = JSON.parse(localStorage.getItem("elvreOrders") || "[]");
        const myOrders = allOrders.filter(o => o.email === currentUser.email);
        setUserOrders(myOrders.slice(0, 5));
      }
    } catch (err) {
      console.error('Error loading orders:', err);
    }
  };

  // ✅ NEW: loads from the shared `addresses` table (same one Checkout uses)
  const loadSavedAddresses = async () => {
    try {
      const currentUser = JSON.parse(localStorage.getItem("currentUser"));
      if (!currentUser?.email) return;

      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_email', currentUser.email)
        .order('saved_at', { ascending: false });

      if (!error && data) {
        setSavedAddresses(data);
      } else {
        const cached = JSON.parse(localStorage.getItem(`addresses_${currentUser.email}`) || "[]");
        setSavedAddresses(cached);
      }
    } catch (err) {
      console.error('Error loading saved addresses:', err);
    }
  };

  const toNumber = (val) => {
    if (typeof val === "number" && !isNaN(val)) return val;
    if (typeof val === "string") {
      const n = parseFloat(val.replace(/[^0-9.-]/g, ""));
      return isNaN(n) ? 0 : n;
    }
    return 0;
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSaveProfile = async () => {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: formData.name,
          phone: formData.phone
        })
        .eq('email', formData.email);

      if (error) {
        console.error('Supabase error:', error);
      }

      const updatedUser = {
        ...user,
        name: formData.name,
        phone: formData.phone
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

  // ─── ADDRESS MANAGEMENT (writes to the same table Checkout reads) ───
  const handleAddressFormChange = (e) => {
    setAddressForm({ ...addressForm, [e.target.name]: e.target.value });
  };

  const handleSaveAddress = async () => {
    const { fullName, phone, address, city, state, pincode } = addressForm;
    if (!fullName || !phone || !address || !city || !state || !pincode) {
      setMessage("Please fill all address fields");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    setSavingAddress(true);
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));

    const newAddress = {
      id: Date.now(),
      user_email: currentUser.email,
      full_name: fullName,
      email: currentUser.email,
      phone,
      address,
      city,
      state,
      pincode,
      saved_at: new Date().toISOString()
    };

    try {
      const { error } = await supabase.from('addresses').insert([newAddress]);
      if (error) console.error('Supabase error:', error);
    } catch (err) {
      console.error('Error saving to Supabase:', err);
    }

    const updated = [newAddress, ...savedAddresses];
    setSavedAddresses(updated);
    localStorage.setItem(`addresses_${currentUser.email}`, JSON.stringify(updated));

    setAddressForm(emptyAddressForm);
    setShowAddAddressForm(false);
    setSavingAddress(false);
    setMessage("Address saved! It'll be available at checkout.");
    setTimeout(() => setMessage(""), 3000);
  };

  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm("Remove this saved address?")) return;

    const currentUser = JSON.parse(localStorage.getItem("currentUser"));

    try {
      const { error } = await supabase.from('addresses').delete().eq('id', addressId);
      if (error) console.error('Supabase error:', error);
    } catch (err) {
      console.error('Error deleting address:', err);
    }

    const updated = savedAddresses.filter(a => a.id !== addressId);
    setSavedAddresses(updated);
    localStorage.setItem(`addresses_${currentUser.email}`, JSON.stringify(updated));
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
        <div className="profile-loading">
          <div className="profile-loading-ring" />
          <p>Loading profile...</p>
        </div>
      </>
    );
  }

  const totalSpent = userOrders.reduce((sum, o) => sum + toNumber(o.total), 0);
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : null;

  return (
    <>
      <Navbar />
      <div className="profile-page">
        <div className="profile-container">
          <div className="profile-header">
            <h1>My Profile</h1>
            <p>Manage your account, addresses, and orders</p>
          </div>

          {message && <div className="profile-message success">{message}</div>}

          <div className="profile-grid">
            {/* Left Side - Profile Info */}
            <div className="profile-info-card">
              <div className="profile-avatar">
                <div className="avatar-circle">
                  {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <h3>{user?.name || "ELVRE Customer"}</h3>
                <p className="profile-email">{user?.email}</p>
                {memberSince && <p className="member-since">Member since {memberSince}</p>}
              </div>

              <div className="profile-stats">
                <div className="stat-item">
                  <span className="stat-number">{userOrders.length}</span>
                  <span className="stat-label">Total Orders</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">₹{totalSpent.toFixed(0)}</span>
                  <span className="stat-label">Total Spent</span>
                </div>
              </div>

              <button className="wishlist-link-btn" onClick={() => navigate("/wishlist")}>
                🤍 View Wishlist
              </button>
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
              </div>
            </div>
          </div>

          {/* ─── SAVED ADDRESSES (writes to the same table Checkout reads) ─── */}
          <div className="saved-addresses-section">
            <div className="section-header-row">
              <h2>My Addresses</h2>
              {!showAddAddressForm && (
                <button className="add-address-btn" onClick={() => setShowAddAddressForm(true)}>
                  + Add New Address
                </button>
              )}
            </div>
            <p className="section-subtext">
              Addresses saved here appear automatically at checkout — no need to retype them.
            </p>

            {showAddAddressForm && (
              <div className="address-form-card">
                <div className="form-row">
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input type="text" name="fullName" value={addressForm.fullName} onChange={handleAddressFormChange} />
                  </div>
                  <div className="form-group">
                    <label>Phone *</label>
                    <input type="tel" name="phone" value={addressForm.phone} onChange={handleAddressFormChange} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Address *</label>
                  <textarea name="address" rows="2" value={addressForm.address} onChange={handleAddressFormChange} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>City *</label>
                    <input type="text" name="city" value={addressForm.city} onChange={handleAddressFormChange} />
                  </div>
                  <div className="form-group">
                    <label>State *</label>
                    <input type="text" name="state" value={addressForm.state} onChange={handleAddressFormChange} />
                  </div>
                  <div className="form-group">
                    <label>Pincode *</label>
                    <input type="text" name="pincode" value={addressForm.pincode} onChange={handleAddressFormChange} />
                  </div>
                </div>
                <div className="address-form-actions">
                  <button className="save-btn" onClick={handleSaveAddress} disabled={savingAddress}>
                    {savingAddress ? "Saving..." : "Save Address"}
                  </button>
                  <button className="cancel-btn" onClick={() => { setShowAddAddressForm(false); setAddressForm(emptyAddressForm); }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {savedAddresses.length === 0 && !showAddAddressForm ? (
              <div className="no-addresses">
                <p>No saved addresses yet — add one so checkout is faster next time.</p>
              </div>
            ) : (
              <div className="addresses-grid">
                {savedAddresses.map((addr) => (
                  <div key={addr.id} className="address-card">
                    <div className="address-card-body">
                      <p className="address-name">{addr.full_name}</p>
                      <p className="address-line">{addr.address}, {addr.city}, {addr.state} - {addr.pincode}</p>
                      <p className="address-phone">📞 {addr.phone}</p>
                    </div>
                    <button className="delete-address-btn" onClick={() => handleDeleteAddress(addr.id)} title="Remove address">
                      🗑
                    </button>
                  </div>
                ))}
              </div>
            )}
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
                        <td>₹{toNumber(order.total).toFixed(0)}</td>
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