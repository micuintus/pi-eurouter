/**
 * pi-eurouter — EUrouter provider extension for pi
 *
 * Adds EUrouter (api.eurouter.ai) as a pi provider with:
 * - Runtime model discovery from /api/v1/models (no auth required)
 * - Native API key /login support (no pseudo-OAuth needed)
 * - OpenAI-compatible chat completions transport (reuses pi built-in)
 *
 * Usage:
 *   pi -e ./pi-eurouter/src/index.ts
 *   # Then /login → "Use a subscription" → "EUrouter"
 *   # Then /model to select an EUrouter model
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { PROVIDER_NAME, PROVIDER_DISPLAY_NAME } from "./constants.js";
import { fetchEurouterModels } from "./discovery.js";

export default async function (pi: ExtensionAPI) {
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
		baseUrl: "https://api.eurouter.ai/api/v1",
		api: "openai-completions",
		apiKey: "EUROUTER_API_KEY",
		authHeader: true,
		models,
	});

	console.log(`[${PROVIDER_NAME}] Provider registered. Models should now be available.`);
}
