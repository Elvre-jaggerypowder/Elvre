import { supabase } from "../supabaseClient";

/**
 * Search the chatbot_faqs table for relevant FAQs.
 * Returns an array of matching FAQ objects or empty array.
 */
export async function searchFaqs(query) {
  if (!query || !query.trim()) return [];
  const q = query.trim();
  try {
    // Search only question and answer fields to avoid referencing non-existing columns.
    const orExpr = `question.ilike.%${q}%,answer.ilike.%${q}%`;
    const { data, error } = await supabase.from("chatbot_faqs").select("id,question,answer").or(orExpr).limit(10);

    if (error) {
      console.error("faqService.searchFaqs error:", error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("faqService.searchFaqs exception:", err);
    return [];
  }
}

export async function getBestFaqMatch(query) {
  const matches = await searchFaqs(query);
  if (!matches || matches.length === 0) return null;
  // Prefer exact question match, else first
  const exact = matches.find((m) => m.question && m.question.toLowerCase().trim() === query.toLowerCase().trim());
  return exact || matches[0] || null;
}
