const PROVIDER_NAME = "eurouter";
const PROVIDER_DISPLAY_NAME = "EUrouter";
const BASE_URL = "https://api.eurouter.ai/api/v1";
const MODELS_ENDPOINT = `${BASE_URL}/models`;
const DEFAULT_CONTEXT_WINDOW = 131072;
const DEFAULT_MAX_TOKENS = 16384;

type EurouterModel = {
	id: string;
	name?: string;
	context_length?: number;
	top_provider?: { max_completion_tokens?: number };
	architecture?: { input_modalities?: string[] };
	supported_parameters?: string[];
	supported_api_endpoints?: string[];
	pricing?: Record<string, string | number | undefined>;
};

type PiModel = {
	id: string;
	name: string;
	reasoning: boolean;
	input: Array<"text" | "image">;
	cost: { input: number; output: number; cacheRead: number; cacheWrite: number };
	contextWindow: number;
	maxTokens: number;
	thinkingLevelMap?: Partial<Record<string, string | null>>;
	compat?: { maxTokensField?: "max_completion_tokens" | "max_tokens" };
};

type Pi = {
	registerProvider(
		name: string,
		config: {
			name: string;
			baseUrl: string;
			api: string;
			apiKey: string;
			authHeader: boolean;
			models: PiModel[];
		},
	): void;
};

const FALLBACK_MODELS: PiModel[] = [
	{
		id: "kimi-2.6",
		name: "Kimi 2.6",
		reasoning: true,
		thinkingLevelMap: { minimal: "low", xhigh: "high" },
		input: ["text"],
		cost: { input: 0.5, output: 2, cacheRead: 0, cacheWrite: 0 },
		contextWindow: 256000,
		maxTokens: 32768,
		compat: { maxTokensField: "max_tokens" },
	},
	{
		id: "mistral-large",
		name: "Mistral Large",
		reasoning: false,
		input: ["text", "image"],
		cost: { input: 2, output: 6, cacheRead: 0, cacheWrite: 0 },
		contextWindow: 128000,
		maxTokens: 32768,
		compat: { maxTokensField: "max_tokens" },
	},
];

function parseCost(raw: string | number | undefined): number {
	const n = parseFloat(String(raw || "0"));
	return isNaN(n) ? 0 : n * 1_000_000;
}

function toPiModel(raw: EurouterModel): PiModel {
	const ctx = raw.context_length ?? DEFAULT_CONTEXT_WINDOW;
	const maxOut = raw.top_provider?.max_completion_tokens ?? DEFAULT_MAX_TOKENS;
	const input: Array<"text" | "image"> = ["text"];
	if (
		raw.architecture?.input_modalities?.includes("image") ||
		raw.supported_parameters?.includes("image_input")
	) {
		input.push("image");
	}
	const params = raw.supported_parameters ?? [];
	const reasoning = params.includes("reasoning") || params.includes("reasoning_effort");
	return {
		id: raw.id,
		name: raw.name || raw.id,
		reasoning,
		thinkingLevelMap: reasoning ? { minimal: "low", xhigh: "high" } : undefined,
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

async function fetchEurouterModels(): Promise<PiModel[]> {
	const res = await fetch(MODELS_ENDPOINT, { signal: AbortSignal.timeout(5000) });
	if (!res.ok) {
		throw new Error(`${res.status}: ${res.statusText}`);
	}
	const payload = (await res.json()) as { data?: EurouterModel[] } | null;
	const rawModels = payload?.data ?? [];
	return rawModels
		.filter((m) =>
			m.supported_api_endpoints?.some(
				(e) => e === "chat.completions" || e === "messages" || e === "responses",
			),
		)
		.map(toPiModel);
}

export default async function (pi: Pi) {
	let models: PiModel[];
	try {
		models = await fetchEurouterModels();
	} catch {
		console.warn("EUrouter: API unreachable, using fallback models");
		models = FALLBACK_MODELS;
	}

	if (models.length === 0) {
		models = FALLBACK_MODELS;
	}

	pi.registerProvider(PROVIDER_NAME, {
		name: PROVIDER_DISPLAY_NAME,
		baseUrl: BASE_URL,
		api: "openai-completions",
		apiKey: "EUROUTER_API_KEY",
		authHeader: true,
		models,
	});
}
