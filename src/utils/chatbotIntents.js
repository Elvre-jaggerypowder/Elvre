export function detectIntent(text) {
  if (!text || !text.trim()) return { intent: "unknown", query: "" };
  const lower = text.toLowerCase();

  // order-related
  if (/(my order|track order|track my order|where is my order|where is my package|delivery status|order status|show my orders|previous orders|mera order)/i.test(lower)) {
    return { intent: "orders", query: text };
  }

  // cart
  if (/(show my cart|my cart|cart)/i.test(lower)) return { intent: "cart", query: text };

  // wishlist
  if (/(wishlist|open wishlist|my wishlist)/i.test(lower)) return { intent: "wishlist", query: text };

  // profile
  if (/(open profile|profile|my profile)/i.test(lower)) return { intent: "profile", query: text };

  // contact
  if (/(open contact|contact|support|help|contact support)/i.test(lower)) return { intent: "contact", query: text };

  // checkout
  if (/(checkout|go to checkout)/i.test(lower)) return { intent: "checkout", query: text };

  // reviews
  if (/(review|reviews|rate product)/i.test(lower)) return { intent: "reviews", query: text };

  // navigation to pages
  if (/(open|go to|show me).*(products|product|home|orders|cart|contact|profile)/i.test(lower)) return { intent: "navigation", query: text };

  // price queries
  if (/(price|prices|cost|rate|₹|rupee|rupees|discount|offer|sale)/i.test(lower)) return { intent: "pricing", query: text };

  // product search
  if (/(show|search|browse|find|buy).*(product|products|jaggery|powder|block)|\b(products|product list|jaggery powder|jaggery block|1kg|500g|250g)\b/i.test(lower)) {
    return { intent: "products", query: text };
  }

  // FAQ-like
  if (/(what is|tell me about|benefits|health|nutrition|ingredients|storage|shelf|recipe|use|how is|kya|kaise)/i.test(lower)) {
    return { intent: "faq", query: text };
  }

  // fallback to smalltalk
  if (/(hello|hi|hey|good morning|good evening)/i.test(lower)) return { intent: "greeting", query: text };

  return { intent: "unknown", query: text };
}
