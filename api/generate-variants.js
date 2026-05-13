import { SYSTEM_PROMPT } from './system-prompt.js';

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { niche, country, clientName, companyName, campaignId } = req.body;

  // Validate required fields
  if (!niche || !country || !clientName || !companyName) {
    return res.status(400).json({
      error: 'Missing required fields',
      required: ['niche', 'country', 'clientName', 'companyName'],
      optional: ['campaignId']
    });
  }

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });
  }

  try {
    // Call Claude API with system prompt + web search tool
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 16000,
        tools: [
          {
            type: 'web_search_20250305',
            name: 'web_search'
          }
        ],
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `Generate 10 cold email variants for podcast guest outreach.

NICHE: ${niche}
COUNTRY: ${country}
CLIENT NAME: ${clientName}
COMPANY NAME: ${companyName}

Follow every step in order. Research the niche first using web search, then pre-write checkpoint, then apply Campaign DNA constraints, then generate all 10 variants. Output the research summary first, then the 10 variants as a JSON array inside <variants> tags.`
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Claude API error:', errorData);
      return res.status(502).json({
        error: 'Claude API request failed',
        status: response.status,
        detail: errorData
      });
    }

    const data = await response.json();

    // Extract text content from response (may have multiple content blocks due to web search)
    const textContent = data.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('\n');

    // Parse variants JSON from <variants> tags
    let variants = null;
    const variantsMatch = textContent.match(/<variants>\s*([\s\S]*?)\s*<\/variants>/);
    if (variantsMatch) {
      try {
        variants = JSON.parse(variantsMatch[1]);
      } catch (parseError) {
        console.error('Failed to parse variants JSON:', parseError);
      }
    }

    // Extract research summary (everything before <variants>)
    let researchSummary = textContent;
    if (variantsMatch) {
      researchSummary = textContent.substring(0, variantsMatch.index).trim();
    }

    // Optionally push to Instantly
    let instantlyResult = null;
    if (campaignId && variants && process.env.INSTANTLY_API_KEY) {
      instantlyResult = await pushToInstantly(variants, campaignId);
    }

    return res.status(200).json({
      success: true,
      niche,
      country,
      clientName,
      companyName,
      researchSummary,
      variants,
      instantlyResult,
      rawResponse: textContent
    });

  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}

// Push variants to Instantly campaign
async function pushToInstantly(variants, campaignId) {
  const INSTANTLY_API_KEY = process.env.INSTANTLY_API_KEY;
  const results = [];

  for (const variant of variants) {
    try {
      const response = await fetch('https://api.instantly.ai/api/v2/campaigns/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${INSTANTLY_API_KEY}`
        },
        body: JSON.stringify({
          campaign_id: campaignId,
          subject: variant.subject_line,
          body: variant.full_email,
          variant_label: `Framework ${variant.framework_number}`
        })
      });

      const data = await response.json();
      results.push({
        framework: variant.framework_number,
        success: response.ok,
        data
      });
    } catch (error) {
      results.push({
        framework: variant.framework_number,
        success: false,
        error: error.message
      });
    }
  }

  return {
    pushed: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    details: results
  };
}
