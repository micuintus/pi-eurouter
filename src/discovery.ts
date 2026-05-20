/**
 * EUrouter model discovery — fetches the live model catalog from EUrouter's
 * /api/v1/models endpoint (no auth required) and normalizes it to pi's
 * Model<Api> shape.
 */

import type { Api, Model } from "@earendil-works/pi-ai";
import { BASE_URL, DEFAULT_CONTEXT_WINDOW, DEFAULT_MAX_TOKENS, MODELS_ENDPOINT } from "./constants.js";

/** Raw model shape from EUrouter /api/v1/models */
export interface EurouterModel {
	id: string;
	name: string;
	created: number;
	description: string;
	context_length: number;
	architecture: {
		modality: string;
		tokenizer: string;
		input_modalities?: string[];
		output_modalities?: string[];
	};
	pricing: {
		prompt: string;
		completion: string;
		image: string;
		image_token: string;
		image_output: string;
		input_cache_read: string;
		input_cache_write: string;
	};
	supported_parameters: string[];
	supported_api_endpoints: string[];
	tags?: string[];
	top_provider?: {
		context_length?: number;
		max_completion_tokens?: number;
	};
}

function parseCost(raw: string): number {
	const n = parseFloat(raw || "0");
	return isNaN(n) ? 0 : n * 1_000_000; // convert $/token → $/million tokens
}

function supportsTools(model: EurouterModel): boolean {
	return model.supported_parameters?.includes("tools") ?? false;
}

function supportsImageInput(model: EurouterModel): boolean {
	return (
		model.supported_parameters?.includes("image_input") ??
		model.architecture?.input_modalities?.includes("image") ??
		false
	);
}

function isReasoningModel(model: EurouterModel): boolean {
	return model.supported_parameters?.includes("reasoning") ?? false;
}

export function toPiModel(model: EurouterModel): Model<Api> {
	const ctx = model.context_length ?? DEFAULT_CONTEXT_WINDOW;
	const maxOut = model.top_provider?.max_completion_tokens ?? DEFAULT_MAX_TOKENS;

	return {
		id: model.id,
		name: model.name || model.id,
		api: "openai-completions",
		provider: "eurouter",
		baseUrl: BASE_URL,
		reasoning: isReasoningModel(model),
		input: supportsImageInput(model) ? (["text", "image"] as const) : (["text"] as const),
		cost: {
			input: parseCost(model.pricing?.prompt),
			output: parseCost(model.pricing?.completion),
			cacheRead: parseCost(model.pricing?.input_cache_read),
			cacheWrite: parseCost(model.pricing?.input_cache_write),
		},
		contextWindow: ctx,
		maxTokens: maxOut,
		// EUrouter is OpenAI-compatible but uses `max_tokens` field, not
		// `max_completion_tokens`.
		compat: {
			maxTokensField: "max_tokens",
		},
	} as Model<Api>;
}

export async function fetchEurouterModels(): Promise<Model<Api>[]> {
	const res = await fetch(MODELS_ENDPOINT);
	if (!res.ok) {
		throw new Error(`EUrouter /models returned ${res.status}: ${res.statusText}`);
	}

	const data = (await res.json()) as { data?: EurouterModel[] };
	const rawModels = data.data ?? [];

	// Only include models that support the OpenAI Chat Completions endpoint
	const results: Model<Api>[] = [];
	for (const raw of rawModels) {
		if (!raw.supported_api_endpoints?.includes("/chat/completions")) {
			continue;
		}
		results.push(toPiModel(raw));
	}

	return results;
}
