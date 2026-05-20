pi-eurouter: EUrouter provider for pi

Install:
  # From npm (recommended)
  pi install npm:pi-eurouter

  # From GitHub
  pi install git:github.com/micuintus/pi-eurouter

Login:
  /login
  Use an API key
  Select EUrouter
  Paste eur_... key

Use:
  /model
  Select model under eurouter provider

Details:
  - 127 models from api.eurouter.ai/api/v1/models (live)
  - Fallback: deepseek-v3, claude-sonnet-4-5 (if API unreachable)
  - Transport: openai-compat (built-in)
  - Zero imports, self-contained src/index.ts

Dev:
  git clone https://github.com/micuintus/pi-eurouter
  cd pi-eurouter
  npm install
  npm run typecheck

License: MIT