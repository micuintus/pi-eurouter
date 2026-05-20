/**
 * pi-eurouter — EUrouter provider extension for pi
 *
 * Zero-dependency, self-contained. Reuses pi's built-in openai-completions
 * transport. Discovers models at startup from EUrouter's public endpoint.
 */

const PROVIDER_NAME = "eurouter";
const PROVIDER_DISPLAY_NAME = "EUrouter";
const BASE_URL = "https://api.eurouter.ai/api/v1";
const MODELS_ENDPOINT = `${BASE_URL}/models`;
const DEFAULT_CONTEXT_WINDOW = 131072;
const DEFAULT_MAX_TOKENS = 16384;

function parseCost(raw) {
	const n = parseFloat(raw || "0");
	return isNaN(n) ? 0 : n * 1_000_000; // $/token → $/million tokens
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
		compat: {
			maxTokensField: "max_tokens",
		},
	};
}

async function fetchEurouterModels() {
	const res = await fetch(MODELS_ENDPOINT);
	if (!res.ok) {
		throw new Error(`${res.status}: ${res.statusText}`);
	}
	const data = await res.json();
	const rawModels = data.data ?? [];
	return rawModels
		.filter((m) => m.supported_api_endpoints?.includes("/chat/completions"))
		.map(toPiModel);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function (pi: any) {
	console.log(`[${PROVIDER_NAME}] Extension loading...`);

	let models;
	try {
		models = await fetchEurouterModels();
	} catch (error) {
		console.error(`[${PROVIDER_NAME}] FAILED to fetch models:`, error);
		return;
	}

	if (models.length === 0) {
		console.warn(`[${PROVIDER_NAME}] No OpenAI-compatible models found.`);
		return;
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
