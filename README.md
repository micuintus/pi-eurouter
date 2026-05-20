# pi-eurouter

EUrouter provider for [pi](https://pi.dev).

**Install:**

```bash
pi install npm:pi-eurouter
```

**Login:**

```
/login
Use an API key -> EUrouter
```

Paste your `eur_...` key.

**Use:**

```
/model
```

Pick any EUrouter model.

## How it works

127 models from `api.eurouter.ai/api/v1/models`. Fallback to 2 hardcoded models if the API is down.

Uses pi's built-in `openai-completions` transport. No custom streaming code.

## Dev

```bash
git clone https://github.com/micuintus/pi-eurouter
cd pi-eurouter
npm install
npm run typecheck
```

## License

MIT
