import { NextRequest } from "next/server";
import Groq from "groq-sdk";
import { prisma } from "@/lib/db";

type Message = { role: "user" | "assistant"; content: string };

// ---------------------------------------------------------------------------
// Fetch a recipe page and extract its ingredients.
// Tries JSON-LD schema first (works on most modern recipe sites),
// then falls back to plain text around the word "ingredients".
// ---------------------------------------------------------------------------
async function fetchRecipeIngredients(url: string): Promise<{
  name: string;
  ingredients: string[];
  raw: string;
} | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36",
        Accept: "text/html",
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const html = await res.text();

    // ── 1. Try JSON-LD Recipe schema ──────────────────────────────────────
    const jsonLdBlocks = [...html.matchAll(
      /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
    )];
    for (const block of jsonLdBlocks) {
      try {
        const data = JSON.parse(block[1]);
        const nodes: unknown[] = Array.isArray(data)
          ? data
          : data["@graph"] ?? [data];
        for (const node of nodes) {
          if (typeof node !== "object" || node === null) continue;
          const n = node as Record<string, unknown>;
          const type = n["@type"];
          const isRecipe =
            type === "Recipe" ||
            (Array.isArray(type) && type.includes("Recipe"));
          if (isRecipe && Array.isArray(n["recipeIngredient"])) {
            return {
              name: typeof n["name"] === "string" ? n["name"] : "Recipe",
              ingredients: n["recipeIngredient"] as string[],
              raw: "",
            };
          }
        }
      } catch {
        /* ignore malformed JSON-LD */
      }
    }

    // ── 2. Fallback: plain text around "ingredient" ───────────────────────
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const idx = text.toLowerCase().indexOf("ingredient");
    const excerpt =
      idx !== -1
        ? text.slice(Math.max(0, idx - 200), idx + 4000)
        : text.slice(0, 4000);

    return { name: "Recipe", ingredients: [], raw: excerpt };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "GROQ_API_KEY not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  let messages: Message[];
  try {
    const body = await req.json();
    messages = body.messages;
    if (!Array.isArray(messages) || messages.length === 0) throw new Error();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid request body" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  let rawItems;
  try {
    rawItems = await prisma.item.findMany({
      where: { consumedAt: null },
      orderBy: [{ expiryDate: "asc" }, { name: "asc" }],
    });
  } catch {
    return new Response(
      JSON.stringify({ error: "Database unavailable" }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  const pantryItems = rawItems.map((item) => {
    const entry: Record<string, unknown> = {
      name: item.name,
      quantity: item.quantity,
      expiryDate: item.expiryDate
        ? item.expiryDate.toISOString().split("T")[0]
        : null,
    };
    if (item.brand)    entry.brand    = item.brand;
    if (item.category) entry.category = item.category;
    if (item.packSize) entry.packSize = item.packSize;
    if (item.location && item.location !== "pantry") entry.location = item.location;
    return entry;
  });

  const today = new Date().toISOString().split("T")[0];
  const pantryJson = JSON.stringify(pantryItems, null, 2);

  // ── Detect a URL in the last user message ────────────────────────────────
  const lastMessage = messages.at(-1)!.content;
  const urlMatch = lastMessage.match(/https?:\/\/[^\s]+/);
  let recipeContext = "";
  let isRecipeMode = false;

  if (urlMatch) {
    isRecipeMode = true;
    const recipe = await fetchRecipeIngredients(urlMatch[0]);
    if (recipe) {
      if (recipe.ingredients.length > 0) {
        recipeContext = `Recipe: "${recipe.name}"\nIngredients from the page:\n${recipe.ingredients.map((i) => `- ${i}`).join("\n")}`;
      } else if (recipe.raw) {
        recipeContext = `Recipe page text (extract):\n${recipe.raw}`;
      }
    }
    if (!recipeContext) {
      recipeContext = "Could not fetch the recipe page (site may block requests).";
    }
  }

  // ── System prompt ────────────────────────────────────────────────────────
  const basePrompt = `You are a concise pantry assistant. Today is ${today}.

Pantry (sorted by expiry, soonest first):
<pantry>
${pantryJson}
</pantry>`;

  const recipePrompt = `${basePrompt}

The user shared a recipe. Your job:
1. Read each ingredient carefully.
2. Check the pantry for a genuine match — same ingredient or clear synonym (e.g. "chickpeas" = "Kichererbsen"). Do NOT match loosely: coconut milk ≠ soy drink, black pepper ≠ gochugaru, yogurt ≠ camembert.
3. If multiple pantry items match, use the one expiring soonest.
4. Count how many ingredients you matched (N).
5. Reply ONLY in this exact format — no intro, no notes, no extra lines:

You have [N] ingredient(s) in the pantry for [Recipe name]:

[list every ingredient — ✅ items first, then ❌ items]

Rules for the list:
- ✅ line: PANTRY ITEM NAME — recipe measurement (exp. date), e.g.: ✅ Buttermilch — 1 cup (exp. 2026-06-19). If no expiry date, omit the (exp.) part.
- ❌ line: recipe measurement + ingredient name, e.g.: ❌ 2 cloves of garlic. If no measurement given in the recipe, just the ingredient name.
- One flat list — no sections, no headers, no bullet points, no dashes
- No "Note:", no "close match" comments, no extra explanation after the list`;

  const generalPrompt = `${basePrompt}

Guidelines:
- Prioritise items expiring soonest. Null expiry = no rush.
- When asked what to cook: suggest 2–3 ideas using items closest to expiry.
- Be concise. Bullet points, no essays.
- Respond in the same language the user writes in.`;

  const systemPrompt = isRecipeMode ? recipePrompt : generalPrompt;

  // If recipe mode, inject the fetched ingredients as context before the user message
  const enrichedMessages: Message[] = isRecipeMode && recipeContext
    ? [
        ...messages.slice(0, -1),
        {
          role: "user",
          content: `${lastMessage}\n\n[Fetched from URL]\n${recipeContext}`,
        },
      ]
    : messages;

  // ── Stream from Groq ─────────────────────────────────────────────────────
  const client = new Groq({ apiKey });

  const readable = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        const stream = await client.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          max_tokens: 1024,
          stream: true,
          messages: [
            { role: "system", content: systemPrompt },
            ...enrichedMessages,
          ],
        });

        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content ?? "";
          if (text) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
            );
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Stream error";
        console.error("[chat] Groq error:", msg);
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`)
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
