import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

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
      return new Response(
        JSON.stringify({ error: "Image generation service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { title, description } = await req.json();

    if (!title) {
      return new Response(
        JSON.stringify({ error: "Title is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ideaText = description ? `${title}. ${description.slice(0, 150)}` : title;

    const imagePrompt =
      `A stunning professional smartphone app mockup for "${title}". ` +
      `A sleek modern iPhone held in hand against a clean minimal background. ` +
      `The phone screen shows a beautiful mobile app UI with colorful cards, smooth gradients, icons and navigation. ` +
      `No text, no words, no letters on screen — only clean visual UI elements. ` +
      `The app concept: ${ideaText}. ` +
      `Dark elegant theme, vibrant accent colors, glassmorphism cards, glowing UI elements. ` +
      `Professional product photography, studio lighting, sharp focus, 4K quality, photorealistic.`;

    const cfUrl = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/stabilityai/stable-diffusion-xl-base-1.0`;

    const response = await fetch(cfUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt: imagePrompt }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Cloudflare AI image error:", response.status, errText);
      return new Response(
        JSON.stringify({ error: "Image generation failed, please try again" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const imageBuffer = await response.arrayBuffer();
    const base64Image = encode(new Uint8Array(imageBuffer));
    const imageUrl = `data:image/png;base64,${base64Image}`;

    return new Response(
      JSON.stringify({ imageUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Error:", e);
    return new Response(
      JSON.stringify({ error: "Image generation failed, please try again" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
