import { detectIntent } from "../utils/chatbotIntents";
import * as faqService from "./faqService";
import * as productService from "./productService";
import * as orderService from "./orderService";
import { supabase } from "../supabaseClient";

function getCurrentUserEmail() {
  try {
    const raw = localStorage.getItem("currentUser");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.email) return parsed.email;
    if (typeof parsed === "string" && parsed.includes("@")) return parsed;
    return null;
  } catch {
    const alt = localStorage.getItem("currentUserEmail") || localStorage.getItem("email");
    return alt || null;
  }
}

function formatProductsSummary(products, lang = "en") {
  if (!products || products.length === 0) return lang === "hi" ? "Koi products nahi mile." : "No products found.";
  const lines = products.slice(0, 6).map((p) => {
    const price = p.price || p.mrp || p.price_inr || p.price_value || p.priceValue || p.selling_price;
    return `• ${p.name || p.title}${price ? ` — ₹${price}` : ""}`;
  });
  return (lang === "hi" ? "Maine yeh products paye:\n" : "I found these products:\n") + lines.join("\n");
}

function formatOrdersSummary(orders, lang = "en") {
  if (!orders || orders.length === 0) return lang === "hi" ? "Aapke koi orders nahi mile." : "No orders found.";
  const lines = orders.slice(0, 5).map((o) => {
    const id = o.id || o.order_id || o.orderId;
    const status = o.status || o.order_status || "unknown";
    const payment = o.payment_method || o.payment || (o.paid ? "Paid" : "Pending");
    const date = o.order_date || o.created_at || o.orderDate || "";
    const total = o.total || o.total_amount || o.amount || o.grand_total || o.order_total;
    const products = Array.isArray(o.products)
      ? o.products.map((p) => p.name || p.title).filter(Boolean).slice(0, 3).join(", ")
      : (typeof o.products === "string" ? o.products : "");
    return `${id ? `Order #${id}` : "Order"} — ${status} — ${payment}${total ? ` — ₹${total}` : ""}${date ? ` — ${date}` : ""}${products ? `\n  Items: ${products}` : ""}`;
  });
  return (lang === "hi" ? "Yeh aapke recent orders hain:\n" : "Here are your recent orders:\n") + lines.join("\n\n");
}

async function logConversation(userQuery, botReply, meta = {}) {
  try {
    // Insert into chatbot_conversations using canonical columns: user_id, role, message
    // For legacy compatibility we store the user's query as role 'user' and bot reply as 'assistant' when logging both together.
    await supabase.from("chatbot_conversations").insert([
      {
        user_id: null,
        role: "system",
        message: `User: ${userQuery} | Bot: ${botReply} | meta: ${JSON.stringify(meta)}`,
      },
    ]);
  } catch (err) {
    // Non-fatal
    console.debug("chatbotService.logConversation error:", err);
  }
}

export async function getReply(text) {
  const { intent, query } = detectIntent(text || "");
  const lang = /[\u0900-\u097F]/.test(text || "") ? "hi" : "en";

  try {
    switch (intent) {
      case "orders": {
        const email = getCurrentUserEmail();
        if (!email) {
          const message = lang === "hi" ? "Order details dekhne ke liye login karna hoga." : "To view your orders, please sign in.";
          await logConversation(query, message, { intent });
          return { text: message, action: { type: "navigate", to: "/login" } };
        }
        const orders = await orderService.fetchOrdersByEmail(email);
        const textRes = formatOrdersSummary(orders, lang);
        await logConversation(query, textRes, { intent, count: orders.length });
        return { text: textRes, action: orders && orders.length ? { type: "navigate", to: "/my-orders" } : undefined };
      }

      case "products": {
        const products = await productService.searchProducts(query);
        if (!products || products.length === 0) {
          const msg = lang === "hi" ? "Koi matching products nahi mile." : "No matching products found.";
          await logConversation(query, msg, { intent, count: 0 });
          return { text: msg, action: { type: "navigate", to: "/products" } };
        }

        // If single product and has id -> navigate directly to product detail
        if (products.length === 1 && (products[0].id || products[0].slug)) {
          const idOrSlug = products[0].id || products[0].slug;
          const msg = (lang === "hi" ? "Maine ek product paya — " : "I found one product — ") + `${products[0].name || products[0].title}${products[0].price ? ` — ₹${products[0].price}` : ""}`;
          await logConversation(query, msg, { intent, productCount: 1 });
          return { text: msg, action: { type: "navigate", to: `/product/${idOrSlug}` } };
        }

        const summary = formatProductsSummary(products, lang);
        await logConversation(query, summary, { intent, productCount: products.length });
        return { text: summary, action: { type: "navigate", to: `/products?search=${encodeURIComponent(query)}` } };
      }

      case "pricing": {
        const products = await productService.searchProducts(query || "");
        if (products && products.length > 0) {
          const lines = products.slice(0, 6).map((p) => {
            const price = p.price || p.mrp || p.price_inr || p.price_value || p.priceValue || p.selling_price;
            return `• ${p.name || p.title}${price ? ` — ₹${price}` : ""}`;
          });
          const msg = (lang === "hi" ? "Yeh current prices hain:\n" : "Here are current prices:\n") + lines.join("\n");
          await logConversation(query, msg, { intent, productCount: products.length });
          return { text: msg, action: { type: "navigate", to: "/products" } };
        }
        const msg = lang === "hi" ? "Main aapko products page par le ja raha hoon taaki aap current prices dekh saken." : "Opening the products page so you can view current prices.";
        await logConversation(query, msg, { intent });
        return { text: msg, action: { type: "navigate", to: "/products" } };
      }

      case "faq": {
        const match = await faqService.getBestFaqMatch(query);
        if (match && match.answer) {
          await logConversation(query, match.answer, { intent, faqId: match.id });
          return { text: match.answer };
        }
        // fallback: try product search
        const products = await productService.searchProducts(query);
        if (products && products.length > 0) {
          const summary = formatProductsSummary(products, lang);
          await logConversation(query, summary, { intent, productCount: products.length });
          return { text: summary, action: { type: "navigate", to: `/products?search=${encodeURIComponent(query)}` } };
        }
        const msg = lang === "hi" ? "Mujhe is sawal ka exact jawab database mein nahi mila. Kya aap thoda aur detail de sakte hain?" : "I couldn't find a direct answer in our FAQs. Can you provide more details?";
        await logConversation(query, msg, { intent });
        return { text: msg };
      }

      case "cart":
        await logConversation(query, "navigate:/cart", { intent });
        return { text: lang === "hi" ? "Main aapke cart page par le ja raha hoon." : "I’m opening your cart for you now.", action: { type: "navigate", to: "/cart" } };

      case "wishlist": {
        const email = getCurrentUserEmail();
        if (!email) {
          const msg = lang === "hi" ? "Wishlist dekhne ke liye login karna hoga." : "To view your wishlist, please sign in.";
          await logConversation(query, msg, { intent });
          return { text: msg, action: { type: "navigate", to: "/login" } };
        }
        await logConversation(query, "navigate:/profile#wishlist", { intent });
        return { text: lang === "hi" ? "Main aapki wishlist khol raha hoon." : "Opening your wishlist now.", action: { type: "navigate", to: "/profile" } };
      }

      case "profile": {
        const email = getCurrentUserEmail();
        if (!email) {
          const msg = lang === "hi" ? "Profile dekhne ke liye login karna hoga." : "To view your profile, please sign in.";
          await logConversation(query, msg, { intent });
          return { text: msg, action: { type: "navigate", to: "/login" } };
        }
        await logConversation(query, "navigate:/profile", { intent });
        return { text: lang === "hi" ? "Main aapki profile khol raha hoon." : "Opening your profile now.", action: { type: "navigate", to: "/profile" } };
      }

      case "contact":
        await logConversation(query, "navigate:/contact", { intent });
        return { text: lang === "hi" ? "Main contact page khol raha hoon." : "Opening the contact page.", action: { type: "navigate", to: "/contact" } };

      case "navigation": {
        // generic navigation requests like "open products"
        const l = query.toLowerCase();
        if (l.includes("products") || l.includes("product")) return { text: "Opening products.", action: { type: "navigate", to: "/products" } };
        if (l.includes("cart")) return { text: "Opening cart.", action: { type: "navigate", to: "/cart" } };
        if (l.includes("contact")) return { text: "Opening contact.", action: { type: "navigate", to: "/contact" } };
        if (l.includes("profile")) return { text: "Opening profile.", action: { type: "navigate", to: "/profile" } };
        if (l.includes("orders")) return { text: "Opening orders.", action: { type: "navigate", to: "/my-orders" } };
        return { text: lang === "hi" ? "Kahan le jaun?" : "Where would you like to go?" };
      }

      case "greeting":
        return { text: lang === "hi" ? "Namaste! Main ELVRE ka shopping assistant hoon." : "Hello! I’m ELVRE’s shopping assistant." };

      default: {
        // try FAQ first, then products
        const match = await faqService.getBestFaqMatch(query);
        if (match && match.answer) {
          await logConversation(query, match.answer, { intent: "faq_fallback", faqId: match.id });
          return { text: match.answer };
        }
        const products = await productService.searchProducts(query);
        if (products && products.length > 0) {
          const summary = formatProductsSummary(products, lang);
          await logConversation(query, summary, { intent: "product_fallback", productCount: products.length });
          return { text: summary, action: { type: "navigate", to: `/products?search=${encodeURIComponent(query)}` } };
        }
        const fallback = lang === "hi" ? "Kuch samajh nahi aaya — kya aap thoda aur detail de sakte hain?" : "I didn't understand that. Could you provide more details?";
        await logConversation(query, fallback, { intent: "unknown" });
        return { text: fallback };
      }
    }
  } catch (err) {
    console.error("chatbotService.getReply error:", err);
    const fallback = lang === "hi" ? "Kuch galat ho gaya. Thodi der baad dobara kijiye." : "Something went wrong. Please try again later.";
    await logConversation(text, fallback, { intent: "error", error: String(err) });
    return { text: fallback };
  }
}

export default { getReply };
