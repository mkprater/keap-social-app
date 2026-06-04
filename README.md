# KEAP Homes Social Content Engine
## Deployment Guide — Netlify

---

### What this is
A private web app that generates a full week of KEAP Homes social media content
(Facebook, Instagram, TikTok) using the Claude API. Your API key stays on the
server — never visible to whoever uses the tool.

---

### Files
```
keap-social-app/
├── netlify.toml                  ← Netlify build config
├── public/
│   └── index.html                ← The entire front-end app
└── netlify/
    └── functions/
        └── generate.js           ← Serverless function (API proxy)
```

---

### One-time deployment steps

#### Step 1 — Push to GitHub
1. Create a new repo at github.com (name it something like `keap-social-app`)
2. Upload all files maintaining the folder structure above
   - OR run these terminal commands from the keap-social-app folder:
     ```
     git init
     git add .
     git commit -m "initial"
     git remote add origin https://github.com/YOUR_USERNAME/keap-social-app.git
     git push -u origin main
     ```

#### Step 2 — Connect to Netlify
1. Log into netlify.com
2. Click "Add new site" → "Import an existing project"
3. Choose GitHub → select your repo
4. Build settings (should auto-detect from netlify.toml):
   - Build command: (leave blank)
   - Publish directory: public
5. Click "Deploy site"

#### Step 3 — Add your API key (CRITICAL)
1. In Netlify dashboard → Site settings → Environment variables
2. Click "Add a variable"
3. Key:   ANTHROPIC_API_KEY
   Value: (paste your Anthropic API key from ~/keap-ops/config.env)
4. Save

#### Step 4 — Trigger a redeploy
1. Netlify dashboard → Deploys → "Trigger deploy" → Deploy site
2. Wait ~60 seconds

#### Step 5 — Get your URL
Netlify gives you a URL like: https://random-name-12345.netlify.app
You can customize this under Site settings → Domain management → Site name
Example: https://keap-content.netlify.app

---

### Giving access to your delegate
Just send them the URL. No login, no password, no Claude account needed.
They open it, click "Generate This Week's Content", copy posts.

---

### Updating the brand voice / post rules
Edit the SYSTEM_PROMPT constant in netlify/functions/generate.js
Commit and push — Netlify auto-redeploys in ~60 seconds.

---

### Cost
- Netlify hosting: Free (well within free tier limits)
- Anthropic API: ~$0.05–0.15 per week generation
  At 1 generation/day that's under $4/month

---

### Troubleshooting
- "Generation failed" → Check that ANTHROPIC_API_KEY is set in Netlify env vars
- Blank page → Check browser console for errors; ensure files are in correct folders
- 404 on /api/generate → Confirm netlify.toml is in the root of the repo

---
KEAP Homes Inc. | Internal tool
