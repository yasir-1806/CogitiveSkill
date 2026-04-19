# ✅ OpenAI Setup & API Configuration Guide

## Current Status
- ❌ **AI is NOT working** - OPENAI_API_KEY not configured
- 🟡 **Fallback mode active** - Using mock data instead of real AI
- 📝 **Prompts NOT being followed** - Because AI API is not real

## Why AI Isn't Following Prompts

Without a valid OpenAI API key, the system uses **fallback synthetic data** instead of calling OpenAI. This means:
- ❌ User prompts are ignored
- ❌ Questions don't match topic context properly
- ❌ Performance insights are generic templates

## Step 1: Get OpenAI API Key

### Option A: Personal Account (Quick Start)
1. Go to [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Sign in with your OpenAI account (create one if needed)
3. Click **"Create new secret key"**
4. Copy the key (starts with `sk-`)
5. **⚠️ Save it immediately** - you won't see it again!

### Option B: Organization Account
- Contact your organization admin for API key
- Verify you have API access enabled
- Check your account has credit/billing set up

## Step 2: Verify Your Key Works

Before adding to `.env`, test the key:

```bash
cd C:\Project\MiniProject\server
node test-openai.js
```

Expected output if key is valid:
```
✅ OpenAI connection successful!
Response: TEST_SUCCESS
```

If you see an error, your key is invalid or wrong.

## Step 3: Add to Environment

Edit `server/.env`:

```bash
# Replace this placeholder:
OPENAI_API_KEY=sk-YOUR_OPENAI_API_KEY_HERE

# With your actual key:
OPENAI_API_KEY=sk-proj-abc123def456xyz789...
```

**Save the file and restart the server:**
```bash
npm start
```

## Step 4: Test Question Generation

Once configured, test that prompts are followed:

1. Start server: `npm start` (port 5001)
2. Start client: `npm run dev` (port 5173)
3. Login to admin panel
4. Go to "Manage Questions"
5. Click "Generate with AI"
6. Enter a **specific prompt** like:
   - "Generate questions about photosynthesis for Biology"
   - "Create grammar questions about present perfect tense"
   - "Generate aptitude questions about time and distance"
7. Check if questions match your prompt ✅

## Troubleshooting

### Issue: "API key is not configured"
```
Run: node test-openai.js
Fix: Add real key to server/.env
```

### Issue: "Invalid API key"
```
Problem: Key is fake or expired
Fix: Get a new key from https://platform.openai.com/api-keys
```

### Issue: "Model not found"
```
Problem: Using wrong model name
Fix: Verify OPENAI_MODEL=gpt-4-turbo in .env
```

### Issue: "Rate limit exceeded"
```
Problem: Too many API requests
Fix: Wait a moment and try again
```

### Issue: "Insufficient quota"
```
Problem: No credits left on account
Fix: Add payment method at https://platform.openai.com/account/billing/overview
```

## Model Options

Update `OPENAI_MODEL` in `.env` to change:

| Model | Speed | Cost | Quality | Best For |
|-------|-------|------|---------|----------|
| gpt-4-turbo | Medium | $$ | Excellent | Precise questions, complex topics |
| gpt-4o | Fast | $ | Very Good | General use, good balance |
| gpt-3.5-turbo | Fast | ¢ | Good | Basic questions, budget |

**Recommended:** `gpt-4-turbo` (best quality for learning)

## Cost Estimates

For 100 students each taking 20 questions:
- **gpt-4-turbo**: ~$2-5
- **gpt-4o**: ~$1-3
- **gpt-3.5-turbo**: ~$0.20-0.50

## Verification Checklist

- [ ] OpenAI API key obtained (starts with `sk-`)
- [ ] Test passed: `node test-openai.js`
- [ ] Key added to `server/.env`
- [ ] Server restarted: `npm start`
- [ ] Client restarted: `npm run dev`
- [ ] Test question generation with prompt
- [ ] Questions match your prompt ✅

## Environment File Reference

```env
# OpenAI Configuration
OPENAI_API_KEY=sk-proj-...your-key-here...
OPENAI_MODEL=gpt-4-turbo

# Fallback (no changes needed)
GEMINI_API_KEY=...
NODE_ENV=development
```

## Support

If questions still aren't following prompts after setup:
1. Check server logs for error messages
2. Verify API key is active (not revoked)
3. Test: `node test-openai.js`
4. Check OpenAI dashboard for issues
5. Try a different model if available

---

**After Setup:** Questions will be:
- ✅ Dynamically generated from prompts
- ✅ Contextually relevant to topics
- ✅ Unique and personalized
- ✅ AI-powered with explanations
