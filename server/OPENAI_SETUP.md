# OpenAI API Setup Guide

## Migration from Gemini to OpenAI

Your AI API has been successfully migrated from Google Gemini to OpenAI GPT models.

## Setup Steps

### 1. Get Your OpenAI API Key

1. Go to [OpenAI API Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to **API keys** section
4. Click **"Create new secret key"**
5. Copy the generated API key (keep it safe!)

### 2. Add Environment Variables

Update your `.env` file in the `server/` directory with:

```env
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_MODEL=gpt-4-turbo
```

### 3. Available Models

You can use any of these models:

- **`gpt-4-turbo`** (Recommended) - Best quality, good speed
- **`gpt-4`** - Highest quality, slower
- **`gpt-3.5-turbo`** - Fast, lower cost

### 4. Cost Information

- **GPT-4 Turbo**: ~$0.01 per 1K input tokens, ~$0.03 per 1K output tokens
- **GPT-3.5 Turbo**: ~$0.0005 per 1K input tokens, ~$0.0015 per 1K output tokens

For question generation (estimated per 5 questions):
- GPT-4 Turbo: ~$0.02-0.05
- GPT-3.5 Turbo: ~$0.002-0.005

### 5. Test the Connection

Once configured, the server will:
1. Validate the API key when generating questions
2. Fall back to mock data if the key is invalid or unavailable
3. Provide fallback responses if the API is temporarily unavailable

### 6. Troubleshooting

**Issue: "No valid OpenAI API key configured"**
- Solution: Check your `.env` file has `OPENAI_API_KEY` set correctly
- Ensure the key starts with `sk-`

**Issue: Rate limit errors**
- Solution: Implement exponential backoff (already handled in code)
- Upgrade your OpenAI plan if needed

**Issue: Invalid model name**
- Solution: Verify the model name in `OPENAI_MODEL` environment variable
- Use `gpt-4-turbo` for best compatibility

### 7. Features

✅ Question Generation - Creates multiple choice questions based on topics/difficulties
✅ Performance Insights - Provides AI-generated coaching feedback on test results
✅ Fallback Mode - Works with mock data if API is unavailable
✅ Command-Aware Generation - Respects user prompts and constraints

### 8. Monitoring

Check server logs to see:
- Number of generation attempts
- Whether fallback mode was activated
- API response quality

Example log output:
```
AI generation attempt 1/10: requesting 5 question(s) using gpt-4-turbo
Generated 5/5. All questions created successfully.
```

## Differences from Gemini

| Feature | Gemini | OpenAI |
|---------|--------|--------|
| API Library | @google/generative-ai | openai |
| Model Selection | gemini-flash-latest | gpt-4-turbo |
| Prompt Format | Extended config objects | Chat messages |
| Response Parsing | response.text() | message.content |
| Error Handling | Similar | Similar |

## Questions?

If questions aren't generating properly:
1. Check API key validity
2. Review server logs for specific errors
3. Try with `gpt-3.5-turbo` for faster (less precise) results
4. Ensure prompt has enough context
