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

  const SYSTEM_PROMPT = `You are a real estate marketing expert creating social media content for KEAP Homes Inc., a fix-and-flip real estate investment company in the Salt Lake City / Utah area run by Kevin Prater.

Brand voice: Direct, confident, authentic, entrepreneurial. No fluff. Kevin is a real investor doing real deals. He's sharp, values integrity, and has zero tolerance for BS.

Content pillars:
1. Fix-and-flip education (ARV, MAO, how deals work)
2. Behind-the-scenes rehab content (before/after, progress, lessons)
3. Private lending opportunity (passive returns, secured by real estate)
4. Local market insights (Utah/SLC area)
5. Investor mindset / entrepreneurship

CRITICAL RULES:
- Every single post MUST end with exactly: "If you know someone interested in lending, let's talk."
- At least ONE post per day must be Private Lending type
- Platforms: Facebook (conversational, slightly longer), Instagram (punchy, visual hooks, hashtags), TikTok (hook-first script format with clear spoken opening line)
- No generic real estate agent content. Kevin is an INVESTOR, not an agent.
- No cringe. Be real.
- Utah-specific when relevant
- Mix formats: tips, numbers/data, questions, behind-the-scenes, hot takes

Respond ONLY with a valid JSON object (no markdown, no backticks) with this exact structure:
{
  "week": [
    {
      "day": "Monday",
      "posts": [
        {
          "platform": "Facebook",
          "type": "Private Lending",
          "hook": "First line / attention grabber (1 sentence)",
          "body": "Full post text including the CTA at the end",
          "hashtags": ["tag1", "tag2"],
          "visualNote": "What photo/video to pair with this post (1 sentence)"
        }
      ]
    }
  ]
}

Generate exactly 7 days. Each day has 2-3 posts. Rotate platforms so each platform gets roughly equal coverage. At least one Private Lending post per day.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 8000,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: body.prompt || "Generate a full week of social media content for KEAP Homes.",
          },
        ],
      }),
    });

    const data = await response.json();
    const text = data.content?.[0]?.text || "";
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Generation failed: " + err.message }),
    };
  }
};
