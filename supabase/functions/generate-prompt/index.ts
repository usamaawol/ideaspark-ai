import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    const { title, description, language = "en" } = await req.json();
    const langNames: Record<string, string> = {
      en: "English", am: "Amharic", om: "Afan Oromo", ar: "Arabic",
    };
    const respondLang = langNames[language] || "English";

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000);

    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/meta/llama-3.1-8b-instruct`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            { role: "system", content: `You are an expert AI prompt engineer and product architect. Respond in ${respondLang}.` },
            { role: "user", content: `Generate a comprehensive, production-ready AI builder prompt for the following idea:\n\nTitle: ${title}\nDescription: ${description || "No description"}\n\nThe prompt must include:\n1. Project Overview & Vision\n2. Core Features (detailed)\n3. Advanced Features\n4. UI/UX Design Guidelines\n5. Technical Stack Recommendations\n6. Database Schema suggestions\n7. API integrations needed\n8. Target Users & Market\n9. Monetization Strategy\n10. Success Metrics\n\nMake it detailed, structured, and immediately usable in AI builders like Lovable, Cursor, or ChatGPT.` }
          ],
          max_tokens: 1500,
        }),
        signal: controller.signal,
      }
    );
    clearTimeout(timeout);

    if (!res.ok) {
      const errText = await res.text();
      console.error("CF AI error:", res.status, errText);
      return new Response(JSON.stringify({ error: "AI service temporarily unavailable." }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    const content = data?.result?.response || "";
    return new Response(JSON.stringify({ prompt: content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: "AI service temporarily unavailable." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
