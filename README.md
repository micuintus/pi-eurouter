# pi-eurouter

EUrouter provider extension for [pi coding agent](https://pi.dev).

EUrouter is a European AI gateway with OpenAI-compatible API and EU data residency.

Based on the FOSS baseline [pi-opencode-provider](https://github.com/mdsitton/pi-opencode-provider) by [Matthew Sitton](https://github.com/mdsitton) (MIT licensed).

## Features

- **Runtime model discovery** — fetches the live model catalog (146+ models) at startup, no waiting for pi releases
- **`/login` support** — store your EUrouter API key via pi's built-in login flow
- **OpenAI-compatible transport** — reuses pi's built-in `openai-completions` provider, zero custom streaming code

## Install

### 1. Get an API key

Sign up at [eurouter.ai](https://www.eurouter.ai) and create an API key.

### 2. Install the extension

**From GitHub:**

```bash
pi install git:github.com/micuintus/pi-eurouter
```

**From npm (after publishing):**

```bash
pi install npm:pi-eurouter
```

For local development:

```bash
cd pi-eurouter
pi install .
```

### 3. /login

In pi, run:

```
/login
```

- Choose **"Use a subscription"**
- Select **"EUrouter"**
- Paste your `eur_...` API key

### 4. Pick a model

```
/model
```

EUrouter models appear under the `eurouter` provider.

## How it works

The extension discovers models from EUrouter's public `/api/v1/models` endpoint (no auth required). It filters for models that support the `/chat/completions` endpoint and registers them with pi using the built-in `openai-completions` transport.

The `api` field is not set per-model because all EUrouter models use the same OpenAI-compatible transport; pi infers it from the provider-level `api: "openai-completions"` config.

## Development

```bash
npm install
npm run typecheck
```

## License

MIT
