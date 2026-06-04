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
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid request body" }) };
  }

  const SYSTEM_PROMPT = `You are a real estate marketing expert creating social media content for KEAP Homes Inc., a fix-and-flip real estate investment company in the Salt Lake City / Utah area run by Kevin Prater. Brand voice: Direct, confident, authentic, entrepreneurial. No fluff. Every post MUST end with exactly: "If you know someone interested in lending, let's talk." At least ONE post per day must be Private Lending type. Platforms: Facebook, Instagram, TikTok. No generic agent content. Be real. Utah-specific when relevant. Respond ONLY with a valid JSON object (no markdown, no backticks): {"week":[{"day":"Monday","posts":[{"platform":"Facebook","type":"Private Lending","hook":"First line","body":"Full post text ending with the CTA","hashtags":["tag1"],"visualNote":"What to film or photograph"}]}]}. Generate exactly 7 days, 2-3 posts each day, rotate platforms evenly, at least one Private Lending post per day.`;

  const payload = JSON.stringify({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: "Generate a full week of social media content for KEAP Homes." }],
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
          resolve({ statusCode: 500, body: JSON.stringify({ error: "Parse failed: " + e.message }) });
        }
      });
    });

    req.on("error", (e) => {
      resolve({ statusCode: 500, body: JSON.stringify({ error: "Request failed: " + e.message }) });
    });

    req.write(payload);
    req.end();
  });
};
