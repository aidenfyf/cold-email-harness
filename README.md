# cold-email-harness
Generate 10 new cold email variants using the podcast method

# Structure
cold-email-harness/
  ├── api/
  │     ├── generate-variants.js   ← serverless function (Claude API + Instantly push)
  │     └── system-prompt.js       ← entire system prompt as exportable module
  ├── index.html                   ← frontend (4 fields, generate, copy, Instantly push)
  ├── vercel.json                  ← routing + CORS config
  ├── package.json                 ← ESM, zero dependencies
  ├── .env.example                 ← API key template
  ├── .gitignore                   ← keeps .env and node_modules out
  └── README.md                    ← setup + deploy + usage docs
