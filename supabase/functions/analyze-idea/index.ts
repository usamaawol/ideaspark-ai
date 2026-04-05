import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function extractJson(text: string): Record<string, unknown> | null {
  try {
    const cleaned = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
  } catch { /* fallback */ }
  return null;
}

async function callCF(accountId: string, token: string, messages: {role: string, content: string}[]): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);
  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/meta/llama-3.1-8b-instruct`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages, max_tokens: 1500 }),
        signal: controller.signal,
      }
    );
    if (!res.ok) {
      const err = await res.text();
      console.error("CF AI error:", res.status, err);
      throw new Error("AI service temporarily unavailable. Please try again.");
    }
    const data = await res.json();
    return data?.result?.response || "";
  } finally {
    clearTimeout(timeout);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const CLOUDFLARE_API_TOKEN = Deno.env.get("CLOUDFLARE_API_TOKEN");
    const CLOUDFLARE_ACCOUNT_ID = Deno.env.get("CLOUDFLARE_ACCOUNT_ID");

    if (!CLOUDFLARE_API_TOKEN || !CLOUDFLARE_ACCOUNT_ID) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { title, description, language = "en", mode = "analyze", targetLanguage } = await req.json();

    const langNames: Record<string, string> = {
      en: "English", am: "Amharic", om: "Afan Oromo", ar: "Arabic",
    };

    if (mode === "expand") {
      const messages = [
        { role: "system", content: `You are a senior product strategist and startup advisor. Respond in ${langNames[language] || "English"}.` },
        { role: "user", content: `Deeply expand this idea into a full product vision:\nTitle: ${title}\nDescription: ${description || "No description"}\n\nInclude: detailed feature breakdown, technical architecture, go-to-market strategy, monetization model, competitive advantages, potential challenges, and a 6-month roadmap.` }
      ];
      const content = await callCF(CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN, messages);
      return new Response(JSON.stringify({ expanded: content }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else if (mode === "translate") {
      const target = langNames[targetLanguage] || "English";
      const lowResource = ["om"].includes(targetLanguage || "");

      // Afan Oromo is not supported by the AI model — return honest message
      if (lowResource) {
        return new Response(JSON.stringify({
          translated: `⚠️ Afan Oromo translation is not yet fully supported by the AI model. The system is still under development and will add this language soon.\n\n[Original]\nTitle: ${title}\nDescription: ${description || ""}`,
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const messages = [
        {
          role: "system",
          content: `You are a professional translator. Translate the following text to ${target}. Return ONLY the translated text. Do not add explanations, notes, or repeat the original.`
        },
        {
          role: "user",
          content: `Translate to ${target}:\nTitle: ${title}\nDescription: ${description || ""}`
        }
      ];
      const content = await callCF(CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN, messages);
      return new Response(JSON.stringify({ translated: content }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else {
      const respondLang = langNames[language] || "English";
      const messages = [
        { role: "system", content: `You are an expert startup analyst and venture advisor. Respond in ${respondLang}. Return ONLY valid JSON, no markdown, no extra text.` },
        { role: "user", content: `Perform a deep analysis of this idea and return a JSON object with these exact keys:\n{"summary":"detailed summary","suggestions":"5 specific improvement suggestions each on new line","features":"8 key features each on new line","evaluation":"thorough evaluation of potential, risks, and opportunities","marketCheck":"detailed market analysis including target demographics, competition, and market size","feasibilityScore":<1-10>,"innovationScore":<1-10>}\n\nTitle: ${title}\nDescription: ${description || "No description"}` }
      ];
      const content = await callCF(CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN, messages);
      const parsed = extractJson(content);
      if (parsed) {
        return new Response(JSON.stringify(parsed), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({
        summary: content.slice(0, 500), suggestions: content,
        features: "", evaluation: "", marketCheck: "",
        feasibilityScore: 5, innovationScore: 5,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  } catch (e: any) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e?.message || "AI service temporarily unavailable." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
