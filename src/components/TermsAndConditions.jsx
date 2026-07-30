import React from "react";
import { Link } from "react-router-dom";
import "./TermsAndConditions.css";

// Each section: id (anchor), title, body (array of paragraphs and/or bullet lists)
const SECTIONS = [
  {
    id: "introduction",
    title: "Introduction",
    body: [
      "Welcome to ELVRE. These Terms & Conditions govern your use of the website elvre.in, operated by ELVRE Enterprises (OPC) Private Limited (\u201cELVRE\u201d, \u201cwe\u201d, \u201cus\u201d, or \u201cour\u201d).",
      "By accessing our website, creating an account, or placing an order, you agree to be bound by these Terms. If you do not agree, please do not use our website or services."
    ]
  },
  {
    id: "eligibility",
    title: "Eligibility & Your Account",
    body: [
      "You must be at least 18 years old to create an account or place an order on our website. By using our website, you confirm that you meet this requirement.",
      "You are responsible for maintaining the confidentiality of your account login details and for all activity that happens under your account. Please notify us immediately at elvreofficals@gmail.com if you suspect unauthorized use of your account."
    ]
  },
  {
    id: "products-pricing",
    title: "Products & Pricing",
    body: [
      "All products are subject to availability. We reserve the right to discontinue any product, or to modify prices, descriptions, and packaging at any time without prior notice.",
      "Prices displayed on the website are in Indian Rupees (INR) and are inclusive of applicable GST unless stated otherwise. We make reasonable efforts to display accurate pricing, but in the rare event of a pricing error, we reserve the right to cancel the affected order and issue a full refund."
    ]
  },
  {
    id: "orders-payment",
    title: "Orders & Payment",
    body: [
      "Placing an order is an offer to buy a product, which we may accept or decline at our discretion (for example, in cases of suspected fraud, stock unavailability, or address/serviceability issues).",
      "We accept payment via Cash on Delivery (COD), UPI, credit/debit cards, and net banking (processed securely through Razorpay). For online payments, your order is confirmed only after successful payment verification.",
      "An order confirmation email/SMS does not guarantee acceptance of your order — final confirmation is subject to stock availability and successful payment verification."
    ]
  },
  {
    id: "shipping",
    title: "Shipping & Delivery",
    body: [
      "We currently ship across India. Estimated delivery time is 3\u20137 business days depending on your location, though this can vary due to courier delays, weather, or circumstances beyond our control.",
      "Shipping charges (if any) are displayed at checkout before you complete your order. Free shipping thresholds, where offered, are shown on the product or cart page.",
      "Please ensure your shipping address and phone number are accurate — we are not responsible for delayed or failed delivery caused by incorrect address details provided at checkout."
    ]
  },
  {
    id: "returns-refunds",
    title: "Returns, Refunds & Cancellations",
    body: [
      "Because our products are consumable food items, we can only accept returns in specific cases, for hygiene and food-safety reasons:",
      {
        list: [
          "The product delivered is damaged, defective, or spoiled on arrival.",
          "You received the wrong product or incorrect quantity.",
          "The package was tampered with or opened before delivery.",
        ]
      },
      "To raise a return/replacement request, contact us at elvreofficals@gmail.com within 7 days of delivery, along with your order ID and photos of the issue. We do not accept returns for opened or used products due to a simple change of mind.",
      "Approved refunds are processed to the original payment method within 5\u201310 business days. For Cash on Delivery orders, refunds are issued via bank transfer or UPI after verification.",
      "You may cancel an order before it is shipped by contacting us; once an order has been dispatched, it cannot be cancelled but may be eligible for return under the conditions above."
    ]
  },
  {
    id: "intellectual-property",
    title: "Intellectual Property",
    body: [
      "All content on this website — including the ELVRE name, logo, product photography, descriptions, and design — is the property of ELVRE Enterprises (OPC) Private Limited and is protected by applicable intellectual property laws. You may not reproduce, copy, or use this content commercially without our written permission."
    ]
  },
  {
    id: "user-conduct",
    title: "Acceptable Use",
    body: [
      "When using our website, you agree not to:",
      {
        list: [
          "Use the website for any unlawful purpose or in violation of these Terms.",
          "Attempt to gain unauthorized access to our systems, accounts, or data.",
          "Post or transmit any harmful code, or interfere with the website's normal operation.",
          "Submit false, misleading, or fraudulent order or payment information."
        ]
      }
    ]
  },
  {
    id: "liability",
    title: "Limitation of Liability",
    body: [
      "To the extent permitted by law, ELVRE shall not be liable for any indirect, incidental, or consequential damages arising from your use of the website or products, beyond the value of the order in question. Nothing in these Terms limits your statutory rights as a consumer under Indian law."
    ]
  },
  {
    id: "grievance",
    title: "Grievance Redressal",
    body: [
      "In accordance with the Consumer Protection (E-Commerce) Rules, 2020, any complaints or concerns regarding orders, products, or these Terms may be directed to our Grievance Officer:",
      {
        list: [
          "Email: elvreofficals@gmail.com",
          "Phone: +91-7060998050",
          "We aim to acknowledge complaints within 48 hours and resolve them within 30 days."
        ]
      }
    ]
  },
  {
    id: "governing-law",
    title: "Governing Law & Jurisdiction",
    body: [
      "These Terms are governed by the laws of India. Any disputes arising from your use of the website or purchases shall be subject to the exclusive jurisdiction of the courts located in Haryana, India."
    ]
  },
  {
    id: "changes",
    title: "Changes to These Terms",
    body: [
      "We may update these Terms & Conditions from time to time to reflect changes in our practices or applicable law. The \u201cLast updated\u201d date at the top of this page shows when it was last revised. Continued use of our website after changes are posted means you accept the updated Terms."
    ]
  },
  {
    id: "contact",
    title: "Contact Us",
    body: [
      "For any questions about these Terms, write to us at elvreofficals@gmail.com or call +91-7060998050."
    ]
  }
];

const LAST_UPDATED = "31 July 2026";

const TermsAndConditions = () => {
  return (
    <div className="terms-page">
      <div className="terms-hero">
        <p className="terms-eyebrow">ELVRE Enterprises (OPC) Private Limited</p>
        <h1>Terms &amp; Conditions</h1>
        <p className="terms-updated">Last updated: {LAST_UPDATED}</p>
      </div>

      <div className="terms-layout">
        <nav className="terms-toc" aria-label="Table of contents">
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

        <main className="terms-content">
          <p className="terms-intro-note">
            Please read these Terms &amp; Conditions carefully before using elvre.in
            or placing an order. They explain your rights and responsibilities,
            and ours, as a buyer and seller of ELVRE jaggery products.
          </p>

          {SECTIONS.map((section, i) => (
            <section key={section.id} id={section.id} className="terms-section">
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

export default TermsAndConditions;