import React from "react";
import { Link } from "react-router-dom";
import "./PrivacyPolicy.css";

// Each section has an id (used for the on-page nav + anchor links),
// a title, and body content (array of paragraphs and/or bullet lists).
const SECTIONS = [
  {
    id: "introduction",
    title: "Introduction",
    body: [
      "ELVRE Enterprises (OPC) Private Limited (\u201cELVRE\u201d, \u201cwe\u201d, \u201cus\u201d, or \u201cour\u201d) operates the website elvre.in and sells jaggery powder and related products. This Privacy Policy explains what information we collect, how we use it, and the choices you have.",
      "By using our website or purchasing our products, you agree to the practices described in this policy. If you do not agree, please do not use our website."
    ]
  },
  {
    id: "information-we-collect",
    title: "Information We Collect",
    body: [
      "We collect the following categories of information:",
      {
        list: [
          "Account & contact details: name, email address, phone number, delivery address, and password (stored in encrypted form).",
          "Order & payment information: items purchased, order value, and transaction status. Card, UPI, and net-banking details are processed directly by our payment gateway partners \u2014 we do not store your full card or bank details on our servers.",
          "Communications: messages you send us via email, WhatsApp, or contact forms, including for support or grievance redressal.",
          "Usage data: pages visited, device type, browser, approximate location (city-level), and IP address, collected automatically to keep the site secure and working correctly.",
          "Cookies & similar technologies: see the dedicated section below."
        ]
      }
    ]
  },
  {
    id: "how-we-use",
    title: "How We Use Your Information",
    body: [
      {
        list: [
          "To process and deliver your orders, and to communicate updates about them.",
          "To respond to questions, complaints, and support requests.",
          "To send order confirmations, shipping updates, and (only with your consent) offers or newsletters.",
          "To detect and prevent fraud, abuse, or security incidents.",
          "To improve our website, products, and customer experience.",
          "To comply with applicable Indian laws, including tax and consumer-protection requirements."
        ]
      }
    ]
  },
  {
    id: "sharing",
    title: "How We Share Your Information",
    body: [
      "We do not sell your personal information. We share it only with:",
      {
        list: [
          "Payment gateway providers, to securely process your payment.",
          "Logistics and courier partners, to deliver your order to you.",
          "Service providers who help us run the website (e.g. hosting, database, and analytics providers), under confidentiality obligations.",
          "Government or law-enforcement authorities, where required by law or a valid legal request."
        ]
      }
    ]
  },
  {
    id: "cookies",
    title: "Cookies & Tracking Technologies",
    body: [
      "We use cookies and similar technologies to keep you logged in, remember items in your cart, and understand how visitors use our site. You can disable cookies in your browser settings, but some features of the website (such as checkout) may not work correctly if you do."
    ]
  },
  {
    id: "security",
    title: "Data Security",
    body: [
      "We use reasonable technical and organisational measures \u2014 including encrypted storage of passwords and restricted internal access \u2014 to protect your personal information. However, no method of transmission or storage over the internet is 100% secure, and we cannot guarantee absolute security."
    ]
  },
  {
    id: "retention",
    title: "Data Retention",
    body: [
      "We retain your personal information for as long as your account is active or as needed to fulfil orders, resolve disputes, and comply with our legal obligations (for example, tax records). You may request deletion of your account data at any time, subject to these legal requirements."
    ]
  },
  {
    id: "your-rights",
    title: "Your Rights & Choices",
    body: [
      {
        list: [
          "Access the personal information we hold about you.",
          "Correct inaccurate or incomplete information.",
          "Request deletion of your account and associated data.",
          "Withdraw consent for marketing communications at any time (via the unsubscribe link or by contacting us)."
        ]
      },
      "To exercise any of these rights, email us at elvreofficals@gmail.com."
    ]
  },
  {
    id: "children",
    title: "Children's Privacy",
    body: [
      "Our website and products are intended for users who are 18 years of age or older. We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us and we will remove it."
    ]
  },
  {
    id: "grievance",
    title: "Grievance Redressal",
    body: [
      "In accordance with the Information Technology Act, 2000 and the Consumer Protection (E-Commerce) Rules, 2020, the details of our Grievance Officer are provided below:",
      {
        list: [
          "Name: Grievance Officer, ELVRE Enterprises (OPC) Private Limited",
          "Email: elvreofficals@gmail.com",
          "Response time: complaints are acknowledged within 48 hours and resolved within 30 days, wherever possible."
        ]
      }
    ]
  },
  {
    id: "changes",
    title: "Changes to This Policy",
    body: [
      "We may update this Privacy Policy from time to time to reflect changes in our practices or applicable law. The \u201cLast updated\u201d date at the top of this page indicates when it was last revised. Continued use of our website after changes are posted means you accept the updated policy."
    ]
  },
  {
    id: "contact",
    title: "Contact Us",
    body: [
      "For any privacy questions or concerns, write to us at elvreofficals@gmail.com. We're happy to help."
    ]
  }
];

const LAST_UPDATED = "24 July 2026";

const PrivacyPolicy = () => {
  return (
    <div className="privacy-page">
      <div className="privacy-hero">
        <p className="privacy-eyebrow">ELVRE Enterprises (OPC) Private Limited</p>
        <h1>Privacy Policy</h1>
        <p className="privacy-updated">Last updated: {LAST_UPDATED}</p>
      </div>

      <div className="privacy-layout">
        {/* On-page navigation */}
        <nav className="privacy-toc" aria-label="Table of contents">
          <h3>On this page</h3>
          <ul>
            {SECTIONS.map((section, i) => (
              <li key={section.id}>
                <a href={`#${section.id}`}>
                  <span className="toc-number">{String(i + 1).padStart(2, "0")}</span>
                  {section.title}
                </a>
              </li>
            ))}
          </ul>
          <Link to="/" className="back-to-home">&larr; Back to Home</Link>
        </nav>

        {/* Content */}
        <main className="privacy-content">
          <p className="privacy-intro-note">
            This policy explains how ELVRE collects, uses, and protects your personal
            information when you visit elvre.in or purchase our jaggery products.
          </p>

          {SECTIONS.map((section, i) => (
            <section key={section.id} id={section.id} className="privacy-section">
              <h2>
                <span className="section-number">{String(i + 1).padStart(2, "0")}</span>
                {section.title}
              </h2>
              {section.body.map((block, j) =>
                typeof block === "string" ? (
                  <p key={j}>{block}</p>
                ) : (
                  <ul key={j}>
                    {block.list.map((item, k) => (
                      <li key={k}>{item}</li>
                    ))}
                  </ul>
                )
              )}
            </section>
          ))}

          <Link to="/" className="back-to-home back-to-home-bottom">&larr; Back to Home</Link>
        </main>
      </div>
    </div>
  );
};

export default PrivacyPolicy;