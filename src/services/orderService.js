import { supabase } from "../supabaseClient";

/**
 * Fetch recent orders by customer's email.
 * Returns array of orders or empty array.
 */
export async function fetchOrdersByEmail(email, limit = 20) {
  if (!email) return [];
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("email", email)
      .order("order_date", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("orderService.fetchOrdersByEmail error:", error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error("orderService.fetchOrdersByEmail exception:", err);
    return [];
  }
}
