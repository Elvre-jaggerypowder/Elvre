import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { Link as ScrollLink } from "react-scroll";
import {
  FaShoppingCart, FaBars, FaTimes, FaHome, FaUser,
  FaSignOutAlt, FaListAlt, FaStore, FaInfoCircle, FaPhone, FaBlog,
  FaEllipsisV, FaQuoteLeft, FaFileAlt, FaShieldAlt, FaQuestionCircle,
  FaWhatsapp, FaHeart
} from "react-icons/fa";
import SearchBar from "./SearchBar";
import CartDrawer from "./CartDrawer";
import "./Navbar.css";

const Navbar = ({ onOpenHelp }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const dropdownRef = useRef(null);
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  useEffect(() => {
    loadCartCount();
    checkLoginStatus();
    window.addEventListener("storage", loadCartCount);
    window.addEventListener("storage", checkLoginStatus);
    return () => {
      window.removeEventListener("storage", loadCartCount);
      window.removeEventListener("storage", checkLoginStatus);
      document.body.classList.remove('mobile-menu-open');
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadCartCount = () => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const count = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    setCartCount(count);
  };

  const checkLoginStatus = () => {
    const user = localStorage.getItem("currentUser");
    if (user) {
      try {
        const parsed = JSON.parse(user);
        setIsLoggedIn(true);
        setUserName(parsed.name || parsed.email || "User");
      } catch {
        setIsLoggedIn(true);
        setUserName("User");
      }
    } else {
      setIsLoggedIn(false);
      setUserName("");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("adminLoggedIn");
    setIsLoggedIn(false);
    window.dispatchEvent(new Event("storage"));
    window.location.href = "/";
  };

  const toggleMenu = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    setIsDropdownOpen(false);
    if (newState) {
      document.body.classList.add('mobile-menu-open');
    } else {
      document.body.classList.remove('mobile-menu-open');
    }
  };

  const closeMenu = () => {
    setIsOpen(false);
    setIsDropdownOpen(false);
    document.body.classList.remove('mobile-menu-open');
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const openHelp = () => {
    if (onOpenHelp) {
      onOpenHelp();
    }
    window.dispatchEvent(new CustomEvent("open-elvre-chatbot"));
  };

  const openCartDrawer = () => setIsCartOpen(true);
  const closeCartDrawer = () => setIsCartOpen(false);

  return (
    <>
      <nav className="navbar">
        <div className="nav-container">
          {/* LOGO */}
          <Link to="/" className="nav-logo" onClick={closeMenu}>
            <img
              src={`${process.env.PUBLIC_URL}/assets/ELVRElogo1.png`}
              alt="ELVRE Logo"
              className="logo-img"
            />
          </Link>

          {/* SEARCH BAR - CENTER */}
          <div className="nav-search">
            <SearchBar />
          </div>

          {/* DESKTOP MENU */}
          <div className="desktop-menu">
            {isHomePage ? (
              <ScrollLink to="hero" smooth={true} duration={500} spy={true} offset={-70} className="nav-link active">
                <FaHome className="nav-icon" /> Home
              </ScrollLink>
            ) : (
              <Link to="/" className="nav-link">
                <FaHome className="nav-icon" /> Home
              </Link>
            )}

            <Link to="/products" className="nav-link">
              <FaStore className="nav-icon" /> Products
            </Link>

            <Link to="/wishlist" className="nav-link wishlist-link">
              <FaHeart className="nav-icon" /> Wishlist
            </Link>

            {/* Cart button – opens drawer */}
            <button className="cart-link" onClick={openCartDrawer}>
              <FaShoppingCart />
              {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
            </button>

            <div className="dropdown" ref={dropdownRef}>
              <button className="dropdown-btn" onClick={toggleDropdown}>
                <FaEllipsisV className="more-icon" />
              </button>
              {isDropdownOpen && (
                <div className="dropdown-content">
                  <div className="dropdown-header">More pages</div>
                  <button className="dropdown-help-btn" onClick={() => { openHelp(); closeMenu(); }}>
                    <FaQuestionCircle /> Help
                  </button>
                  {/* ✅ Our Story is now here */}
                  <Link to="/our-story" onClick={closeMenu}><FaInfoCircle /> Our Story</Link>
                  {isHomePage ? (
                    <>
                      <ScrollLink to="about" smooth={true} duration={500} onClick={closeMenu}>
                        <FaInfoCircle /> About
                      </ScrollLink>
                      <ScrollLink to="testimonial" smooth={true} duration={500} onClick={closeMenu}>
                        <FaQuoteLeft /> Testimonials
                      </ScrollLink>
                      <ScrollLink to="contact" smooth={true} duration={500} onClick={closeMenu}>
                        <FaPhone /> Contact
                      </ScrollLink>
                    </>
                  ) : (
                    <>
                      <Link to="/blog" onClick={closeMenu}><FaBlog /> Blog</Link>
                    </>
                  )}
                  <Link to="/terms" onClick={closeMenu}><FaFileAlt /> Terms &amp; Conditions</Link>
                  <Link to="/privacy" onClick={closeMenu}><FaShieldAlt /> Privacy Policy</Link>
                  {isLoggedIn && (
                    <Link to="/my-orders" onClick={closeMenu}>
                      <FaListAlt /> My Orders
                    </Link>
                  )}
                  {isLoggedIn && (
                    <button onClick={handleLogout} className="dropdown-logout">
                      <FaSignOutAlt /> Logout
                    </button>
                  )}
                </div>
              )}
            </div>

            {isLoggedIn && (
              <Link to="/profile" className="profile-link"><FaUser /></Link>
            )}
            {!isLoggedIn && (
              <Link to="/login" className="login-btn-nav">Login</Link>
            )}
          </div>

          {/* MOBILE ICONS */}
          <div className="mobile-icons">
            <div className="mobile-search-compact">
              <SearchBar />
            </div>
            <button className="mobile-cart" onClick={openCartDrawer}>
              <FaShoppingCart />
              {cartCount > 0 && <span className="cart-count-mobile">{cartCount}</span>}
            </button>
            <div className="mobile-icon" onClick={toggleMenu}>
              {isOpen ? <FaTimes /> : <FaBars />}
            </div>
          </div>

          {/* MOBILE MENU – keep Our Story here, it's fine */}
          <div className={`mobile-menu ${isOpen ? "open" : ""}`}>
            <div className="mobile-menu-inner">
              <div className="mob-user-row">
                <div className="mob-avatar">
                  {isLoggedIn ? userName.charAt(0).toUpperCase() : "?"}
                </div>
                <div>
                  <div className="mob-user-name">{isLoggedIn ? userName : "Guest"}</div>
                  <div className="mob-user-role">{isLoggedIn ? "Member" : "Please login"}</div>
                </div>
              </div>

              <Link to="/" onClick={toggleMenu} className="mob-link">
                <FaHome /> Home
              </Link>
              <Link to="/products" onClick={toggleMenu} className="mob-link">
                <FaStore /> Products
              </Link>
              <Link to="/wishlist" onClick={toggleMenu} className="mob-link">
                <FaHeart /> Wishlist
              </Link>

              <button className="mob-link mob-help-btn" onClick={() => { openHelp(); toggleMenu(); }}>
                <FaQuestionCircle /> Help
              </button>

              <a
                href="https://wa.me/917906396629"
                target="_blank"
                rel="noopener noreferrer"
                className="mob-link"
                onClick={toggleMenu}
              >
                <FaWhatsapp /> WhatsApp
              </a>

              {/* ✅ Our Story is also in mobile menu (kept for mobile users) */}
              <Link to="/our-story" onClick={toggleMenu} className="mob-link">
                <FaInfoCircle /> Our Story
              </Link>

              {isHomePage ? (
                <>
                  <ScrollLink to="about" smooth={true} duration={500} onClick={toggleMenu} className="mob-link">
                    <FaInfoCircle /> About Us
                  </ScrollLink>
                  <ScrollLink to="testimonial" smooth={true} duration={500} onClick={toggleMenu} className="mob-link">
                    <FaQuoteLeft /> Testimonials
                  </ScrollLink>
                  <ScrollLink to="contact" smooth={true} duration={500} onClick={toggleMenu} className="mob-link">
                    <FaPhone /> Contact Us
                  </ScrollLink>
                </>
              ) : (
                <>
                  <Link to="/blog" onClick={toggleMenu} className="mob-link">
                    <FaBlog /> Blog
                  </Link>
                </>
              )}

              <hr className="mob-divider" />

              <Link to="/terms" onClick={toggleMenu} className="mob-link">
                <FaFileAlt /> Terms &amp; Conditions
              </Link>
              <Link to="/privacy" onClick={toggleMenu} className="mob-link">
                <FaShieldAlt /> Privacy Policy
              </Link>

              <hr className="mob-divider" />

              {isLoggedIn && (
                <Link to="/my-orders" onClick={toggleMenu} className="mob-link">
                  <FaListAlt /> My Orders
                </Link>
              )}
              {isLoggedIn && (
                <Link to="/profile" onClick={toggleMenu} className="mob-link">
                  <FaUser /> My Profile
                </Link>
              )}

              {!isLoggedIn ? (
                <Link to="/login" onClick={toggleMenu} className="mob-link mob-login-btn">
                  <FaUser /> Login / Signup
                </Link>
              ) : (
                <button onClick={handleLogout} className="mob-link mob-logout-btn">
                  <FaSignOutAlt /> Logout
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Cart Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={closeCartDrawer} />
    </>
  );
};

export default Navbar;