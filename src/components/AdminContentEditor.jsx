import React, { useState } from "react";
import { useContent } from "../context/ContentContext";
import "./AdminContentEditor.css";

const AdminContentEditor = () => {
  const { websiteContent, updateContent, updateTermsContent, updatePrivacyContent } = useContent();
  const [activeSection, setActiveSection] = useState("general");
  const [editMode, setEditMode] = useState(false);
  const [tempContent, setTempContent] = useState(websiteContent);
  const [tempTerms, setTempTerms] = useState(websiteContent.termsContent);
  const [tempPrivacy, setTempPrivacy] = useState(websiteContent.privacyContent);

  const handleSave = () => {
    Object.keys(tempContent).forEach(key => {
      if (key !== "termsContent" && key !== "privacyContent") {
        updateContent(key, tempContent[key]);
      }
    });
    updateTermsContent(tempTerms);
    updatePrivacyContent(tempPrivacy);
    setEditMode(false);
    alert("Content saved successfully!");
  };

  const sections = [
    { id: "general", name: "📝 General Content", icon: "📝" },
    { id: "hero", name: "🎨 Hero Section", icon: "🎨" },
    { id: "products", name: "🛍️ Products Section", icon: "🛍️" },
    { id: "footer", name: "📞 Footer & Contact", icon: "📞" },
    { id: "social", name: "📱 Social Links", icon: "📱" },
    { id: "seo", name: "🔍 SEO Settings", icon: "🔍" },
    { id: "terms", name: "⚖️ Terms & Conditions", icon: "⚖️" },
    { id: "privacy", name: "🔒 Privacy Policy", icon: "🔒" }
  ];

  return (
    <div className="admin-content-editor">
      <div className="editor-header">
        <h2>📄 Website Content Manager</h2>
        <div className="editor-actions">
          {!editMode ? (
            <button className="edit-mode-btn" onClick={() => setEditMode(true)}>
              ✏️ Edit Content
            </button>
          ) : (
            <>
              <button className="save-btn" onClick={handleSave}>💾 Save Changes</button>
              <button className="cancel-btn" onClick={() => setEditMode(false)}>❌ Cancel</button>
            </>
          )}
        </div>
      </div>

      <div className="editor-layout">
        <div className="editor-sidebar">
          {sections.map(section => (
            <button
              key={section.id}
              className={`section-btn ${activeSection === section.id ? "active" : ""}`}
              onClick={() => setActiveSection(section.id)}
            >
              {section.icon} {section.name}
            </button>
          ))}
        </div>

        <div className="editor-main">
          {/* General Section */}
          {activeSection === "general" && (
            <div className="editor-section">
              <h3>General Settings</h3>
              <div className="form-group">
                <label>Website Meta Title</label>
                <input
                  type="text"
                  value={tempContent.metaTitle}
                  onChange={(e) => setTempContent({...tempContent, metaTitle: e.target.value})}
                  disabled={!editMode}
                />
              </div>
              <div className="form-group">
                <label>Meta Description</label>
                <textarea
                  rows="3"
                  value={tempContent.metaDescription}
                  onChange={(e) => setTempContent({...tempContent, metaDescription: e.target.value})}
                  disabled={!editMode}
                />
              </div>
              <div className="form-group">
                <label>Meta Keywords</label>
                <input
                  type="text"
                  value={tempContent.metaKeywords}
                  onChange={(e) => setTempContent({...tempContent, metaKeywords: e.target.value})}
                  disabled={!editMode}
                />
              </div>
              <div className="form-group">
                <label>Free Shipping Threshold (₹)</label>
                <input
                  type="number"
                  value={tempContent.freeShippingThreshold}
                  onChange={(e) => setTempContent({...tempContent, freeShippingThreshold: parseInt(e.target.value)})}
                  disabled={!editMode}
                />
              </div>
              <div className="form-group">
                <label>Shipping Charge (₹)</label>
                <input
                  type="number"
                  value={tempContent.shippingCharge}
                  onChange={(e) => setTempContent({...tempContent, shippingCharge: parseInt(e.target.value)})}
                  disabled={!editMode}
                />
              </div>
              <div className="form-group">
                <label>Return Policy</label>
                <input
                  type="text"
                  value={tempContent.returnPolicy}
                  onChange={(e) => setTempContent({...tempContent, returnPolicy: e.target.value})}
                  disabled={!editMode}
                />
              </div>
            </div>
          )}

          {/* Hero Section */}
          {activeSection === "hero" && (
            <div className="editor-section">
              <h3>Hero Section</h3>
              <div className="form-group">
                <label>Hero Title</label>
                <input
                  type="text"
                  value={tempContent.heroTitle}
                  onChange={(e) => setTempContent({...tempContent, heroTitle: e.target.value})}
                  disabled={!editMode}
                />
              </div>
              <div className="form-group">
                <label>Hero Subtitle</label>
                <input
                  type="text"
                  value={tempContent.heroSubtitle}
                  onChange={(e) => setTempContent({...tempContent, heroSubtitle: e.target.value})}
                  disabled={!editMode}
                />
              </div>
              <div className="form-group">
                <label>Button Text</label>
                <input
                  type="text"
                  value={tempContent.heroButtonText}
                  onChange={(e) => setTempContent({...tempContent, heroButtonText: e.target.value})}
                  disabled={!editMode}
                />
              </div>
            </div>
          )}

          {/* Products Section */}
          {activeSection === "products" && (
            <div className="editor-section">
              <h3>Products Section</h3>
              <div className="form-group">
                <label>Section Title</label>
                <input
                  type="text"
                  value={tempContent.productsTitle}
                  onChange={(e) => setTempContent({...tempContent, productsTitle: e.target.value})}
                  disabled={!editMode}
                />
              </div>
              <div className="form-group">
                <label>Section Subtitle</label>
                <input
                  type="text"
                  value={tempContent.productsSubtitle}
                  onChange={(e) => setTempContent({...tempContent, productsSubtitle: e.target.value})}
                  disabled={!editMode}
                />
              </div>
            </div>
          )}

          {/* Footer & Contact Section */}
          {activeSection === "footer" && (
            <div className="editor-section">
              <h3>Footer & Contact Information</h3>
              <div className="form-group">
                <label>Copyright Text</label>
                <input
                  type="text"
                  value={tempContent.footerCopyright}
                  onChange={(e) => setTempContent({...tempContent, footerCopyright: e.target.value})}
                  disabled={!editMode}
                />
              </div>
              <div className="form-group">
                <label>Contact Email</label>
                <input
                  type="email"
                  value={tempContent.contactEmail}
                  onChange={(e) => setTempContent({...tempContent, contactEmail: e.target.value})}
                  disabled={!editMode}
                />
              </div>
              <div className="form-group">
                <label>Contact Phone</label>
                <input
                  type="text"
                  value={tempContent.contactPhone}
                  onChange={(e) => setTempContent({...tempContent, contactPhone: e.target.value})}
                  disabled={!editMode}
                />
              </div>
              <div className="form-group">
                <label>Contact Address</label>
                <input
                  type="text"
                  value={tempContent.contactAddress}
                  onChange={(e) => setTempContent({...tempContent, contactAddress: e.target.value})}
                  disabled={!editMode}
                />
              </div>
            </div>
          )}

          {/* Social Links Section */}
          {activeSection === "social" && (
            <div className="editor-section">
              <h3>Social Media Links</h3>
              <div className="form-group">
                <label>Facebook URL</label>
                <input
                  type="url"
                  value={tempContent.socialFacebook}
                  onChange={(e) => setTempContent({...tempContent, socialFacebook: e.target.value})}
                  disabled={!editMode}
                />
              </div>
              <div className="form-group">
                <label>Instagram URL</label>
                <input
                  type="url"
                  value={tempContent.socialInstagram}
                  onChange={(e) => setTempContent({...tempContent, socialInstagram: e.target.value})}
                  disabled={!editMode}
                />
              </div>
              <div className="form-group">
                <label>WhatsApp URL</label>
                <input
                  type="url"
                  value={tempContent.socialWhatsapp}
                  onChange={(e) => setTempContent({...tempContent, socialWhatsapp: e.target.value})}
                  disabled={!editMode}
                />
              </div>
              <div className="form-group">
                <label>LinkedIn URL</label>
                <input
                  type="url"
                  value={tempContent.socialLinkedin}
                  onChange={(e) => setTempContent({...tempContent, socialLinkedin: e.target.value})}
                  disabled={!editMode}
                />
              </div>
            </div>
          )}

          {/* SEO Section */}
          {activeSection === "seo" && (
            <div className="editor-section">
              <h3>SEO Settings</h3>
              <div className="form-group">
                <label>Meta Title</label>
                <input
                  type="text"
                  value={tempContent.metaTitle}
                  onChange={(e) => setTempContent({...tempContent, metaTitle: e.target.value})}
                  disabled={!editMode}
                />
              </div>
              <div className="form-group">
                <label>Meta Description</label>
                <textarea
                  rows="3"
                  value={tempContent.metaDescription}
                  onChange={(e) => setTempContent({...tempContent, metaDescription: e.target.value})}
                  disabled={!editMode}
                />
              </div>
              <div className="form-group">
                <label>Meta Keywords</label>
                <input
                  type="text"
                  value={tempContent.metaKeywords}
                  onChange={(e) => setTempContent({...tempContent, metaKeywords: e.target.value})}
                  disabled={!editMode}
                />
              </div>
            </div>
          )}

          {/* Terms & Conditions Editor */}
          {activeSection === "terms" && (
            <div className="editor-section">
              <h3>Terms & Conditions</h3>
              <div className="form-group">
                <label>Edit Terms & Conditions (Markdown supported)</label>
                <textarea
                  rows="20"
                  value={tempTerms}
                  onChange={(e) => setTempTerms(e.target.value)}
                  disabled={!editMode}
                  className="markdown-editor"
                />
              </div>
              <div className="preview-box">
                <h4>Preview:</h4>
                <div className="markdown-preview">
                  {tempTerms.split('\n').map((line, i) => {
                    if (line.startsWith('# ')) return <h1 key={i}>{line.substring(2)}</h1>;
                    if (line.startsWith('## ')) return <h2 key={i}>{line.substring(3)}</h2>;
                    if (line.startsWith('- ')) return <li key={i}>{line.substring(2)}</li>;
                    return <p key={i}>{line}</p>;
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Privacy Policy Editor */}
          {activeSection === "privacy" && (
            <div className="editor-section">
              <h3>Privacy Policy</h3>
              <div className="form-group">
                <label>Edit Privacy Policy (Markdown supported)</label>
                <textarea
                  rows="15"
                  value={tempPrivacy}
                  onChange={(e) => setTempPrivacy(e.target.value)}
                  disabled={!editMode}
                  className="markdown-editor"
                />
              </div>
              <div className="preview-box">
                <h4>Preview:</h4>
                <div className="markdown-preview">
                  {tempPrivacy.split('\n').map((line, i) => {
                    if (line.startsWith('# ')) return <h1 key={i}>{line.substring(2)}</h1>;
                    if (line.startsWith('## ')) return <h2 key={i}>{line.substring(3)}</h2>;
                    if (line.startsWith('- ')) return <li key={i}>{line.substring(2)}</li>;
                    return <p key={i}>{line}</p>;
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminContentEditor;