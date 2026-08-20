import React, { useEffect, useState } from "react";
import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import AOS from "aos";
import "aos/dist/aos.css";
import { supabase } from "./supabaseClient"; // ✅ Import added

// Public Components
import Home from "./Home";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import BottomNav from "./components/BottomNav";
import ProductsPage from "./components/ProductsPage";
import ProductDetails from "./components/ProductDetails";
import Cart from "./components/Cart";
import OurStory from "./components/OurStory";
import Blog from "./components/Blog";
import Contact from "./components/Contact";
import TermsAndConditions from "./components/TermsAndConditions";
import PrivacyPolicy from "./components/PrivacyPolicy";
import OrdersPage from "./components/OrdersPage";
import UserProfile from "./components/UserProfile";
import Wishlist from "./components/Wishlist";
import AuthCallback from "./components/AuthCallback";

// Auth Components
import UserLogin from "./components/UserLogin";
import UserSignup from "./components/UserSignup";

// Checkout & Orders
import Checkout from "./components/Checkout";
import OrderTracking from "./components/OrderTracking";

// Admin Component
import AdminDashboard from "./components/AdminDashboard";

// Context & Utils
import { CartProvider } from "./context/CartContext";
import { ContentProvider } from "./context/ContentContext";
import { WishlistProvider } from "./context/WishlistContext";
import BackToTop from "./components/BackToTop";
import WhatsApp from "./components/WhatsApp";
import Chatbot from "./components/Chatbot";

// ============================================
// Protected Route
// ============================================
const ProtectedRoute = ({ children }) => {
  const isLoggedIn = localStorage.getItem("currentUser");
  if (!isLoggedIn) {
    localStorage.setItem("redirectAfterLogin", window.location.pathname);
    return <Navigate to="/login" replace />;
  }
  return children;
};

// ============================================
// Layout
// ============================================
const Layout = ({ children, isChatbotOpen, setIsChatbotOpen }) => (
  <>
    <Navbar onOpenHelp={() => setIsChatbotOpen(true)} />
    {children}
    <Chatbot isOpen={isChatbotOpen} setIsOpen={setIsChatbotOpen} />
    <Footer />
    <BottomNav />
    <WhatsApp />
    <BackToTop />
  </>
);

// ============================================
// Root Handler – detects a Google/OAuth redirect landing on "/"
// ============================================
const RootHandler = ({ isChatbotOpen, setIsChatbotOpen }) => {
  const [isAuthCallback, setIsAuthCallback] = useState(() => {
    const realQuery = new URLSearchParams(window.location.search);
    return Boolean(realQuery.get("code"));
  });

  if (isAuthCallback) {
    return <AuthCallback />;
  }

  return (
    <Layout isChatbotOpen={isChatbotOpen} setIsChatbotOpen={setIsChatbotOpen}>
      <Home />
    </Layout>
  );
};

// ============================================
// Main App
// ============================================
function App() {
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  // ─── AOS INIT ───
  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
      offset: 100,
      disable: false,
    });
  }, []);

  // ─── ✅ RESTORE USER SESSION ON PAGE LOAD (PERSISTENT LOGIN) ───
  useEffect(() => {
    const restoreUser = async () => {
      // 1. Check if there's a Supabase session
      const { data, error } = await supabase.auth.getSession();
      if (error || !data?.session) {
        // No session – clear any stale user data
        localStorage.removeItem("currentUser");
        localStorage.removeItem("adminLoggedIn");
        return;
      }

      // 2. Session exists – check if we have user data in localStorage
      const currentUser = localStorage.getItem("currentUser");
      const user = data.session.user;

      if (!currentUser) {
        // Fetch user from 'users' table
        const { data: userData, error: fetchError } = await supabase
          .from("users")
          .select("id, name, email, phone")
          .eq("email", user.email)
          .maybeSingle();

        if (fetchError) {
          console.error("Failed to fetch user on restore:", fetchError);
          return;
        }

        if (userData) {
          const userInfo = {
            id: userData.id,
            name: userData.name || user.user_metadata?.full_name || "User",
            email: user.email,
            phone: userData.phone || "",
          };
          localStorage.setItem("currentUser", JSON.stringify(userInfo));
        } else {
          // User not found – clear session
          await supabase.auth.signOut();
          localStorage.removeItem("currentUser");
          localStorage.removeItem("adminLoggedIn");
        }
      } else {
        // 3. Verify stored user matches session user
        const stored = JSON.parse(currentUser);
        if (stored.email !== user.email) {
          // Different user – update
          const { data: userData } = await supabase
            .from("users")
            .select("id, name, email, phone")
            .eq("email", user.email)
            .maybeSingle();
          if (userData) {
            localStorage.setItem("currentUser", JSON.stringify({
              id: userData.id,
              name: userData.name || user.user_metadata?.full_name || "User",
              email: user.email,
              phone: userData.phone || "",
            }));
          }
        }
        // If same user, nothing to do – already logged in.
      }
    };

    restoreUser();
  }, []);

  return (
    <CartProvider>
      <WishlistProvider>
        <ContentProvider>
          <Router>
            <Routes>
              <Route path="/admin-dashboard" element={<AdminDashboard />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/admin" element={<Navigate to="/login" replace />} />

              {/* Root route – handles both Home and the Google OAuth redirect */}
              <Route
                path="/"
                element={<RootHandler isChatbotOpen={isChatbotOpen} setIsChatbotOpen={setIsChatbotOpen} />}
              />

              <Route
                path="/products"
                element={
                  <Layout isChatbotOpen={isChatbotOpen} setIsChatbotOpen={setIsChatbotOpen}>
                    <ProductsPage />
                  </Layout>
                }
              />
              <Route
                path="/product/:id"
                element={
                  <Layout isChatbotOpen={isChatbotOpen} setIsChatbotOpen={setIsChatbotOpen}>
                    <ProductDetails />
                  </Layout>
                }
              />
              <Route
                path="/cart"
                element={
                  <Layout isChatbotOpen={isChatbotOpen} setIsChatbotOpen={setIsChatbotOpen}>
                    <Cart />
                  </Layout>
                }
              />
              <Route
                path="/wishlist"
                element={
                  <Layout isChatbotOpen={isChatbotOpen} setIsChatbotOpen={setIsChatbotOpen}>
                    <Wishlist />
                  </Layout>
                }
              />
              <Route
                path="/our-story"
                element={
                  <Layout isChatbotOpen={isChatbotOpen} setIsChatbotOpen={setIsChatbotOpen}>
                    <OurStory />
                  </Layout>
                }
              />
              <Route
                path="/blog"
                element={
                  <Layout isChatbotOpen={isChatbotOpen} setIsChatbotOpen={setIsChatbotOpen}>
                    <Blog />
                  </Layout>
                }
              />
              <Route
                path="/contact"
                element={
                  <Layout isChatbotOpen={isChatbotOpen} setIsChatbotOpen={setIsChatbotOpen}>
                    <Contact />
                  </Layout>
                }
              />
              <Route
                path="/terms"
                element={
                  <Layout isChatbotOpen={isChatbotOpen} setIsChatbotOpen={setIsChatbotOpen}>
                    <TermsAndConditions />
                  </Layout>
                }
              />
              <Route
                path="/privacy"
                element={
                  <Layout isChatbotOpen={isChatbotOpen} setIsChatbotOpen={setIsChatbotOpen}>
                    <PrivacyPolicy />
                  </Layout>
                }
              />

              <Route
                path="/login"
                element={
                  <Layout isChatbotOpen={isChatbotOpen} setIsChatbotOpen={setIsChatbotOpen}>
                    <UserLogin />
                  </Layout>
                }
              />
              <Route
                path="/signup"
                element={
                  <Layout isChatbotOpen={isChatbotOpen} setIsChatbotOpen={setIsChatbotOpen}>
                    <UserSignup />
                  </Layout>
                }
              />

              <Route
                path="/my-orders"
                element={
                  <ProtectedRoute>
                    <Layout isChatbotOpen={isChatbotOpen} setIsChatbotOpen={setIsChatbotOpen}>
                      <OrdersPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Layout isChatbotOpen={isChatbotOpen} setIsChatbotOpen={setIsChatbotOpen}>
                      <UserProfile />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/checkout"
                element={
                  <ProtectedRoute>
                    <Layout isChatbotOpen={isChatbotOpen} setIsChatbotOpen={setIsChatbotOpen}>
                      <Checkout />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/order-tracking/:orderId"
                element={
                  <ProtectedRoute>
                    <Layout isChatbotOpen={isChatbotOpen} setIsChatbotOpen={setIsChatbotOpen}>
                      <OrderTracking />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </ContentProvider>
      </WishlistProvider>
    </CartProvider>
  );
}

export default App;