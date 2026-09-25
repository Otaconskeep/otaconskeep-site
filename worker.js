/**
 * Otaconskeep site Worker.
 * Serves the static site as before (ASSETS binding, unchanged) and adds
 * POST /api/chat — a free "Ask about Otaconskeep" assistant backed by
 * Cloudflare Workers AI (free tier, no external API key to manage).
 * Grounded via system prompt so it answers from real product facts
 * instead of guessing; told explicitly to say "I don't know" and point
 * to the right page rather than invent pricing/specs.
 */

const ALLOWED_ORIGINS = new Set([
  "https://otaconskeep.github.io",
  "https://otaconskeep-site.otaconskeep.workers.dev",
]);

const SYSTEM_PROMPT = `You are the site assistant for Otaconskeep (otaconskeep.github.io), answering visitor questions right on the page. Be concise (2-4 sentences unless asked for detail), friendly, and precise.

Facts about Otaconskeep, created by Antonio G. Garcia:
- Otaconskeep is a local-first AI ecosystem: agents, tools, and services that run on hardware the user controls, not a cloud subscription.
- Products (use these EXACT URLs, never invent a different path):
  - Otacon Lite (free) — /otacon/ — the foundation: build persistent local AI agents with memory, voice, and tools.
  - KeepRoute (free) — /keeproute/ — model-agnostic orchestration; keeps an AI mission/job alive across model or provider changes instead of restarting from scratch.
  - Keep Desk (supporter/paid) — /keepdesk/ — computer-using AI teammates with names and personalities, running on hardware you own.
  - Expansion (supporter/paid) — /expansion/ — a five-agent hierarchy, "Culture Learning," a standing REX business cycle, and command-center surfaces on top of Otacon Core.
  - AI9 (free) — /ai9/ — a hardware-aware local GPU manga colorizer, Firefox extension, Windows installer.
  - Classroom (free) — /classroom/ — "Homelab Academy," a 45-class curriculum covering ARR stack, Home Assistant, voice, n8n automation, networking, and Linux foundations for people who want to run their own lab.
- Other real pages: /engineering/ (328+ public verification cases: requirements, architecture, traceability, risk, V&V evidence — "prove it" is a real requirement here, not just a demo), /install/ (get everything), /faq/, /news/ (News in AI: homelab + self-hosted + AI, not just project updates), /about/ (the creator's story). There is no "/products/" page — the homepage itself (/) is the product overview.
- Community: Discord (linked in the site footer). Source: GitHub under the Otaconskeep org (linked in the footer too).
- The site includes a "Reference Keep" tour on the homepage: real screenshots from Antonio's own running system, explicitly labeled as not every feature shipping in Otacon Lite today.

Rules:
- Only ever link to the exact paths listed above. Never invent a URL. If unsure which page covers something, link to / (the homepage) instead of guessing a path.
- If you don't know something specific (exact pricing, system requirements, a changelog detail), say so plainly and point to the relevant page rather than guessing.
- Don't invent features, prices, or specs not listed above.
- You are not the live running Otacon system — you're a static-site assistant answering questions about the project. Don't claim to control anything on the visitor's machine.`;

const MAX_MESSAGE_LEN = 800;
const MAX_HISTORY_TURNS = 6;

function corsHeaders(origin) {
  const allow = ALLOWED_ORIGINS.has(origin) ? origin : "https://otaconskeep.github.io";
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
  };
}

async function handleChat(request, env) {
  const origin = request.headers.get("Origin") || "";
  const headers = { "Content-Type": "application/json", ...corsHeaders(origin) };

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), { status: 400, headers });
  }

  const message = String(body?.message || "").slice(0, MAX_MESSAGE_LEN).trim();
  if (!message) {
    return new Response(JSON.stringify({ error: "empty_message" }), { status: 400, headers });
  }

  const historyIn = Array.isArray(body?.history) ? body.history.slice(-MAX_HISTORY_TURNS) : [];
  const history = historyIn
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_LEN) }));

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history,
    { role: "user", content: message },
  ];

  try {
    const result = await env.AI.run("@cf/meta/llama-3.1-8b-instruct-fp8", {
      messages,
      max_tokens: 400,
    });
    const reply = result?.response || "Sorry, I didn't get a response — try again in a moment.";
    return new Response(JSON.stringify({ reply }), { status: 200, headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: "ai_error", detail: String(err) }), { status: 502, headers });
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/api/chat") {
      if (request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: corsHeaders(request.headers.get("Origin") || "") });
      }
      if (request.method === "POST") {
        return handleChat(request, env);
      }
      return new Response("Method not allowed", { status: 405 });
    }

    return env.ASSETS.fetch(request);
  },
};
