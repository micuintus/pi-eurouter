# pi-eurouter

EUrouter provider extension for [pi](https://pi.dev).

## Install

### From npm (recommended)
```bash
pi install npm:pi-eurouter
```

### From GitHub
```bash
pi install git:github.com/micuintus/pi-eurouter
```

## Login

Run `/login` in pi:
1. Choose **"Use an API key"**
2. Select **"EUrouter"**
3. Paste your `eur_...` API key

## Use

Run `/model` in pi and select any model under the **eurouter** provider.

## Details

- **127 models** fetched live from `api.eurouter.ai/api/v1/models`
- **Fallback models**: `deepseek-v3`, `claude-sonnet-4-5` (if API unreachable)
- **Transport**: `openai-compat` (uses pi's built-in provider)
- **Zero imports**: Self-contained `src/index.ts` for jiti compatibility
- **No console spam**: Silent operation (debug logging removed)

## Development

```bash
git clone https://github.com/micuintus/pi-eurouter
cd pi-eurouter
npm install
npm run typecheck
```

## License

MIT