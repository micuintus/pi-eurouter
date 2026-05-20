/**
 * pi-eurouter — EUrouter provider extension for pi
 *
 * Zero-dependency, self-contained. Discovers models at startup from
 * EUrouter's public /api/v1/models endpoint. Falls back to a hardcoded
 * model list if the API is unreachable.
 */

const PROVIDER_NAME = "eurouter";
const PROVIDER_DISPLAY_NAME = "EUrouter";
const BASE_URL = "https://api.eurouter.ai/api/v1";
const MODELS_ENDPOINT = `${BASE_URL}/models`;
const DEFAULT_CONTEXT_WINDOW = 131072;
const DEFAULT_MAX_TOKENS = 16384;

const FALLBACK_MODELS = [
	{
		id: "deepseek-v3",
		name: "DeepSeek V3",
		api: "openai-completions",
		provider: PROVIDER_NAME,
		baseUrl: BASE_URL,
		reasoning: false,
		input: ["text"],
		cost: { input: 0.5, output: 1.5, cacheRead: 0, cacheWrite: 0 },
		contextWindow: 128000,
		maxTokens: 16384,
		compat: { maxTokensField: "max_tokens" },
	},
	{
		id: "claude-sonnet-4-5",
		name: "Claude Sonnet 4.5",
		api: "openai-completions",
		provider: PROVIDER_NAME,
		baseUrl: BASE_URL,
		reasoning: true,
		input: ["text", "image"],
		cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 },
		contextWindow: 200000,
		maxTokens: 64000,
		compat: { maxTokensField: "max_tokens" },
	},
];

function parseCost(raw) {
	const n = parseFloat(raw || "0");
	return isNaN(n) ? 0 : n * 1_000_000;
}

function toPiModel(raw) {
	const ctx = raw.context_length ?? DEFAULT_CONTEXT_WINDOW;
	const maxOut = raw.top_provider?.max_completion_tokens ?? DEFAULT_MAX_TOKENS;
	const input = ["text"];
	if (
		raw.architecture?.input_modalities?.includes("image") ||
		raw.supported_parameters?.includes("image_input")
	) {
		input.push("image");
	}
	return {
		id: raw.id,
		name: raw.name || raw.id,
		api: "openai-completions",
		provider: PROVIDER_NAME,
		baseUrl: BASE_URL,
		reasoning: raw.supported_parameters?.includes("reasoning") ?? false,
		input,
		cost: {
			input: parseCost(raw.pricing?.prompt),
			output: parseCost(raw.pricing?.completion),
			cacheRead: parseCost(raw.pricing?.input_cache_read),
			cacheWrite: parseCost(raw.pricing?.input_cache_write),
		},
		contextWindow: ctx,
		maxTokens: maxOut,
		compat: { maxTokensField: "max_tokens" },
	};
}

async function fetchEurouterModels() {
	const res = await fetch(MODELS_ENDPOINT, { signal: AbortSignal.timeout(5000) });
	if (!res.ok) {
		throw new Error(`${res.status}: ${res.statusText}`);
	}
	const data = await res.json();
	const rawModels = data.data ?? [];
	return rawModels
		.filter((m) => m.supported_api_endpoints?.some((e) => e === "chat.completions" || e === "messages" || e === "responses"))
		.map(toPiModel);
}

export default async function (pi) {
	console.log(`[${PROVIDER_NAME}] Extension loading...`);

	let models;
	try {
		models = await fetchEurouterModels();
		console.log(`[${PROVIDER_NAME}] Fetched ${models.length} models from API.`);
	} catch (error) {
		console.warn(`[${PROVIDER_NAME}] API fetch failed (${error.message}), using fallback.`);
		models = FALLBACK_MODELS;
	}

	if (models.length === 0) {
		console.warn(`[${PROVIDER_NAME}] No models available, using fallback.`);
		models = FALLBACK_MODELS;
	}

	console.log(`[${PROVIDER_NAME}] Registering ${models.length} models.`);

	pi.registerProvider(PROVIDER_NAME, {
		name: PROVIDER_DISPLAY_NAME,
		baseUrl: BASE_URL,
		api: "openai-completions",
		apiKey: "EUROUTER_API_KEY",
		authHeader: true,
		models,
	});

	console.log(`[${PROVIDER_NAME}] Provider registered.`);
}
