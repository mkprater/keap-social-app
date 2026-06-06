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
  const dayIndex = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].indexOf(day);

  // Private lending only on Mon, Wed, Sat (index 0, 2, 5)
  const lendingDays = [0, 2, 5];
  const isLendingDay = lendingDays.includes(dayIndex);

  const lendingPost = isLendingDay ? `
  The Private Lending post should be on this platform today: Monday=Facebook, Wednesday=Instagram, Saturday=TikTok.
ONE of the three posts must be a Private Lending post. This post should:
- Explain a specific, concrete benefit or mechanic of private lending (not generic)
- Use real numbers: typical returns 8-12%, loan amounts $50K-$200K, deal timelines 4-8 months
- Mention that loans are secured by a recorded lien on real Utah property
- Tell a mini story or use a specific example (e.g. "A lender put in $85K on a Davis County flip and walked away with $6,200 in 5 months")
- Never use "Banks say no" or any variation of that phrase
- Never start with a question
` : `
Do NOT write a Private Lending post today. All three posts should be about other topics.
`;

  const SYSTEM_PROMPT = `You are a no-BS real estate content writer for KEAP Homes Inc., a fix-and-flip investment company in Utah run by Kevin Prater (also a Cisco engineer running KEAP Homes on the side). Write 3 social media posts for ${day}.

KEVIN'S VOICE: Direct, confident, zero fluff, talks like a real person not a marketer. He swears occasionally in real life but keeps it clean online. He's done dozens of deals across Salt Lake, Davis, Weber, Tooele, and Utah counties. He targets 3bed/2bath homes under 2,100 sqft priced for first-time buyers under $450K. He uses hard money and private lenders. His team member Nathan walks every property.

POST REQUIREMENTS:
- Write exactly 3 posts: one Facebook, one Instagram, one TikTok
- Every single post must end with this exact line: "If you know someone interested in lending, let's talk."
- NEVER start any post with a question
- NEVER use these phrases: "Banks say no", "let's dive in", "game changer", "in today's market", "passive income machine", "work smarter", "hustle"
- Each post must have a completely different hook/opening line - no repetition
- Use specific numbers, real scenarios, and concrete details - never vague platitudes
- Facebook: 150-250 words, conversational, tell a story or share a specific insight
- Instagram: 80-120 words, punchy, strong visual hook in first line, 8-10 hashtags
- TikTok: Written as a spoken video script, starts with a bold attention-grabbing statement, 60-90 words, conversational tone like you're talking to a friend

CONTENT TOPICS FOR TODAY (pick 3 different ones, do not repeat topics):
- A specific deal breakdown with real numbers (ARV, repair cost, offer price, projected profit)
- What happens during a property walkthrough - what we look for, red flags, surprises
- How we decide to pass on a deal (discipline is the business)
- Utah market reality check - what's actually moving, what's sitting, why
- The math behind a flip - every cost category explained simply
- Contractor relationships - how we find good ones, how we keep them
- Before/after transformation story with specific details
- How Nathan documents every property with CompanyCam and why it matters
- The offer process - from lead to submitted offer, step by step
- Why first-time buyer homes are our focus and why that's smart right now
- What due diligence actually looks like on a deal
- Wholesaler relationships - how we source deals
${lendingPost}

IMPORTANT - VARIETY: The hook (first line) of each post must be completely different in structure. Mix it up: start one with a statement of fact, one with a specific number, one with a short punchy observation.

Respond ONLY with valid JSON, no markdown, no backticks:
{"day":"${day}","posts":[{"platform":"Facebook","type":"Deal Education","hook":"opening line only","body":"full post text ending with: If you know someone interested in lending, let's talk.","hashtags":[],"visualNote":"specific description of what photo or video to pair with this"}]}`;

  const payload = JSON.stringify({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: `Write 3 posts for ${day}. Make each one specific, concrete, and different from each other.` }],
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
      resolve({ statusCode: 500, body: JSON.stringify({ error: e.message }) });
    });

    req.write(payload);
    req.end();
  });
};
