# Cold Email Harness - Podcast Method

Generates 10 data-backed cold email variants for podcast guest outreach across any niche. Built on Keeble base frameworks + Campaign DNA constraints extracted from a 4.63% PRR campaign.

## Stack

- Frontend: Pure HTML / CSS / JS
- Backend: Vercel serverless functions (Node.js ESM)
- AI Layer: Anthropic Claude Sonnet 4 API (with web search tool)
- Integration: Instantly API (optional - push variants directly to campaigns)

## Setup

1. Clone this repo
2. Copy `.env.example` to `.env` and add your API keys
3. Install Vercel CLI if you haven't: `npm i -g vercel`
4. Run locally: `vercel dev`
5. Deploy: `vercel --prod`

## Environment Variables

```
ANTHROPIC_API_KEY=your_anthropic_api_key
INSTANTLY_API_KEY=your_instantly_api_key (optional - only needed for direct push)
```

Set these in Vercel dashboard under Settings > Environment Variables for production.

## Usage

### Via Frontend

Open the deployed URL. Fill in the four fields (niche, country, client name, company name). Hit generate. Review the 10 variants. Optionally push to Instantly.

### Via API

```bash
curl -X POST https://your-domain.vercel.app/api/generate-variants \
  -H "Content-Type: application/json" \
  -d '{
    "niche": "HVAC contractors",
    "country": "US",
    "clientName": "James Keeble",
    "companyName": "Acquisity"
  }'
```

Returns JSON with research summary + 10 formatted variants.

### Instantly Push (optional)

If `INSTANTLY_API_KEY` is set and a `campaignId` is included in the request body, variants are automatically pushed to the specified Instantly campaign.

## File Structure

```
cold-email-harness/
  ├── api/
  │     ├── generate-variants.js   ← serverless function
  │     └── system-prompt.js       ← system prompt module
  ├── index.html                   ← frontend
  ├── vercel.json                  ← routing config
  ├── package.json
  ├── .env.example
  └── README.md
```

## Architecture

Built on the same pattern as advisory_engine.ai. User inputs four fields, the serverless function calls Claude with the system prompt + web search tool, Claude researches the niche in real-time, generates 10 variants against Campaign DNA constraints, and returns structured output.

The system prompt lives in `api/system-prompt.js` as an exported string. Edit it there to modify frameworks, constraints, or generation logic.

---

*System version: Cold Email Harness v1.0*
*Architecture: Keeble frameworks + Campaign DNA constraint layer*
*Built by: 8INMEDIA*
