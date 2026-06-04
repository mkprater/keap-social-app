const https = require("https");

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: "API key not configured" }) };
  }
  let body;
  try { body = JSON.parse(event.body); } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid request" }) };
  }

  const day = body.day || "Monday";
  const SYSTEM_PROMPT = `You are a real estate marketing expert for KEAP Homes Inc., a fix-and-flip company in Salt Lake City Utah run by Kevin Prater. Create 3 social media posts for ${day}. Brand voice: direct, confident, no fluff, real investor. Every post MUST end with: "If you know someone interested in lending, let's talk." At least one post must be Private Lending type. Use platforms: Facebook, Instagram, TikTok (one each). Respond ONLY with valid JSON, no markdown: {"day":"${day}","posts":[{"platform":"Facebook","type":"Private Lending","hook":"opening line","body":"full post text","hashtags":["tag1","tag2"],"visualNote":"what to film or photo"}]}`;

  const payload = JSON.stringify({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: `Write 3 posts for ${day}.` }],
  });

  return new Promise((resolve) => {
    const options = {
      hostname: "api.anthropic.com",
      path: "/v1/messages",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Length": Buffer.byteLength(payload),
      },
    };
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          const text = parsed.content?.[0]?.text || "";
          const clean = text.replace(/```json|```/g, "").trim();
          const result = JSON.parse(clean);
          resolve({ statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify(result) });
        } catch (e) {
          resolve({ statusCode: 500, body: JSON.stringify({ error: "Parse failed: " + e.message, raw: data.substring(0, 500) }) });
        }
      });
    });
    req.on("error", (e) => {
      resolve({ statusCode: 500, body: JSON.stringify({ error: e.message }) });
    });
    req.write(payload);
    req.end();
  });
};
