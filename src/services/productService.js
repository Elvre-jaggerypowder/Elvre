import { supabase } from "../supabaseClient";

/**
 * Search products table by name, description, category, or keywords.
 * Returns an array of product records (may be empty).
 */
export async function searchProducts(query, limit = 20) {
  if (!query || !query.trim()) return [];
  const q = query.trim();
  try {
    // Search only on columns that exist in the products table used by the app
    // (name, description, category, badge). Do not query 'keywords' which may not exist.
    const orExpr = `name.ilike.%${q}%,description.ilike.%${q}%,category.ilike.%${q}%,badge.ilike.%${q}%`;
    const { data, error } = await supabase.from("products").select("*").or(orExpr).limit(limit);

    if (error) {
      console.error("productService.searchProducts error:", error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("productService.searchProducts exception:", err);
    return [];
  }
}

export async function getProductById(id) {
  if (!id) return null;
  try {
    const { data, error } = await supabase.from("products").select("*").eq("id", id).single();
    if (error) {
      console.error("productService.getProductById error:", error);
      return null;
    }
    return data || null;
  } catch (err) {
    console.error("productService.getProductById exception:", err);
    return null;
  }
}
